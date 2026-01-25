// ============================================
// SEND NDA EMAIL EDGE FUNCTION
// Envía NDA solo a candidatos con engagement post-teaser
// ============================================

import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface SendNDARequest {
  recipientId: string;
  language: "ES" | "EN";
  ndaDocumentId?: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const resendApiKey = Deno.env.get("RESEND_API_KEY");

    if (!resendApiKey) {
      throw new Error("RESEND_API_KEY not configured");
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get auth user
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("No authorization header");
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace("Bearer ", "")
    );

    if (authError || !user) {
      throw new Error("Unauthorized");
    }

    const { recipientId, language, ndaDocumentId }: SendNDARequest = await req.json();

    if (!recipientId || !language) {
      throw new Error("recipientId and language are required");
    }

    console.log(`[SendNDA] Processing request for recipient ${recipientId}, language: ${language}`);

    // Get recipient with campaign and mandato info
    const { data: recipient, error: recipientError } = await supabase
      .from("teaser_recipients")
      .select(`
        *,
        campaign:teaser_campaigns(
          id,
          mandato_id,
          mandato:mandatos(
            id,
            nombre_proyecto,
            codigo
          )
        )
      `)
      .eq("id", recipientId)
      .single();

    if (recipientError || !recipient) {
      console.error("[SendNDA] Recipient not found:", recipientError);
      throw new Error("Recipient not found");
    }

    // Validate: Teaser must be sent first
    if (!recipient.sent_at) {
      throw new Error("NDA solo se puede enviar después del teaser. Este candidato no ha recibido teaser.");
    }

    // Validate engagement
    const hasEngagement = recipient.opened_at || recipient.clicked_at || recipient.status === "responded";
    if (!hasEngagement) {
      console.warn(`[SendNDA] No engagement detected for recipient ${recipientId}`);
      // Allow manual override but log warning
    }

    // Validate NDA not already sent/signed
    if (recipient.nda_status === "signed") {
      throw new Error("Este candidato ya firmó el NDA");
    }

    if (recipient.nda_status === "sent") {
      console.log("[SendNDA] NDA already sent, resending...");
    }

    // Get NDA document
    let ndaDocument = null;
    const mandatoId = recipient.campaign?.mandato_id;

    if (ndaDocumentId) {
      const { data: doc } = await supabase
        .from("documentos")
        .select("*")
        .eq("id", ndaDocumentId)
        .single();
      ndaDocument = doc;
    } else if (mandatoId) {
      // Find NDA document for this mandato
      const { data: doc } = await supabase
        .from("documentos")
        .select("*")
        .eq("mandato_id", mandatoId)
        .eq("tipo", "NDA")
        .eq("idioma", language)
        .eq("status", "published")
        .order("version", { ascending: false })
        .limit(1)
        .maybeSingle();
      ndaDocument = doc;
    }

    // Prepare email content
    const recipientName = recipient.nombre || recipient.email.split("@")[0];
    const projectName = recipient.campaign?.mandato?.nombre_proyecto || "Oportunidad de inversión";

    const subjectES = `NDA - Acuerdo de Confidencialidad - ${projectName}`;
    const subjectEN = `NDA - Non-Disclosure Agreement - ${projectName}`;

    const htmlES = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #1a365d;">Acuerdo de Confidencialidad</h2>
        <p>Estimado/a ${recipientName},</p>
        <p>Gracias por su interés en <strong>${projectName}</strong>.</p>
        <p>Para continuar con el proceso y acceder a la documentación detallada (CIM/Data Room), 
        es necesario firmar el Acuerdo de Confidencialidad (NDA) adjunto.</p>
        <p>Una vez firmado, por favor responda a este email con el documento firmado.</p>
        <p>Quedamos a su disposición para cualquier consulta.</p>
        <br/>
        <p>Atentamente,</p>
        <p><strong>Equipo M&A</strong></p>
      </div>
    `;

    const htmlEN = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #1a365d;">Non-Disclosure Agreement</h2>
        <p>Dear ${recipientName},</p>
        <p>Thank you for your interest in <strong>${projectName}</strong>.</p>
        <p>To proceed with the process and access detailed documentation (CIM/Data Room), 
        please sign the attached Non-Disclosure Agreement (NDA).</p>
        <p>Once signed, please reply to this email with the signed document.</p>
        <p>We remain at your disposal for any questions.</p>
        <br/>
        <p>Best regards,</p>
        <p><strong>M&A Team</strong></p>
      </div>
    `;

    // Prepare attachments
    const attachments: Array<{ filename: string; content: string }> = [];

    if (ndaDocument?.storage_path) {
      const { data: fileData, error: downloadError } = await supabase.storage
        .from("mandato-documentos")
        .download(ndaDocument.storage_path);

      if (!downloadError && fileData) {
        const arrayBuffer = await fileData.arrayBuffer();
        const base64 = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));
        attachments.push({
          filename: ndaDocument.file_name || `NDA_${projectName}_${language}.pdf`,
          content: base64,
        });
      }
    }

    // Send email via Resend
    const emailPayload: Record<string, unknown> = {
      from: "M&A Team <noreply@capittal.com>",
      to: [recipient.email],
      subject: language === "ES" ? subjectES : subjectEN,
      html: language === "ES" ? htmlES : htmlEN,
    };

    if (attachments.length > 0) {
      emailPayload.attachments = attachments;
    }

    const resendResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${resendApiKey}`,
      },
      body: JSON.stringify(emailPayload),
    });

    const resendResult = await resendResponse.json();

    if (!resendResponse.ok) {
      console.error("[SendNDA] Resend error:", resendResult);
      throw new Error(`Email send failed: ${resendResult.message || "Unknown error"}`);
    }

    console.log("[SendNDA] Email sent successfully:", resendResult.id);

    // Update recipient status
    const { error: updateError } = await supabase
      .from("teaser_recipients")
      .update({
        nda_status: "sent",
        nda_sent_at: new Date().toISOString(),
        nda_language: language,
        nda_document_id: ndaDocument?.id || null,
        nda_sent_by: user.id,
      })
      .eq("id", recipientId);

    if (updateError) {
      console.error("[SendNDA] Failed to update recipient:", updateError);
    }

    // Log tracking event
    await supabase
      .from("nda_tracking_events")
      .insert({
        recipient_id: recipientId,
        event_type: "nda_sent",
        performed_by: user.id,
        metadata: {
          language,
          email_id: resendResult.id,
          has_attachment: attachments.length > 0,
          document_id: ndaDocument?.id,
        },
      });

    return new Response(
      JSON.stringify({
        success: true,
        emailId: resendResult.id,
        message: `NDA enviado a ${recipient.email}`,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    console.error("[SendNDA] Error:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      }
    );
  }
});
