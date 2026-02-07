import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface SendEmailRequest {
  recipientId: string;
  testEmail?: string;
}

interface EmailAttachment {
  filename: string;
  content: string;
  type: string;
}

/**
 * Validates the request is from an admin user.
 * Returns the user id if authorized, or a Response with error if not.
 */
async function validateAdminAuth(req: Request): Promise<{ userId: string } | Response> {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return new Response(
      JSON.stringify({ success: false, error: "No autorizado: token requerido" }),
      { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

  const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: authHeader } },
  });

  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) {
    return new Response(
      JSON.stringify({ success: false, error: "No autorizado: token inválido" }),
      { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);
  const { data: adminUser, error: adminError } = await supabaseAdmin
    .from("admin_users")
    .select("role")
    .eq("user_id", user.id)
    .eq("is_active", true)
    .single();

  if (adminError || !adminUser || !["admin", "super_admin"].includes(adminUser.role)) {
    return new Response(
      JSON.stringify({ success: false, error: "Permisos insuficientes: se requiere rol admin" }),
      { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  return { userId: user.id };
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // Auth validation
  const authResult = await validateAdminAuth(req);
  if (authResult instanceof Response) return authResult;

  try {
    const { recipientId, testEmail } = await req.json() as SendEmailRequest;

    if (!recipientId) {
      throw new Error("recipientId is required");
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const resendApiKey = Deno.env.get("RESEND_API_KEY");

    if (!resendApiKey) {
      throw new Error("RESEND_API_KEY not configured");
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    // Fetch recipient with campaign and template data
    const { data: recipient, error: recipientError } = await supabaseAdmin
      .from("teaser_recipients")
      .select(`
        *,
        campaign:teaser_campaigns(
          *,
          mandato:mandatos(id, nombre),
          teaser_document:documentos(id, file_name, storage_path, file_type)
        )
      `)
      .eq("id", recipientId)
      .single();

    if (recipientError || !recipient) {
      throw new Error(`Recipient not found: ${recipientError?.message}`);
    }

    const campaign = recipient.campaign;
    if (!campaign) {
      throw new Error("Campaign not found for recipient");
    }

    if (!testEmail && recipient.status !== "pending" && recipient.status !== "queued") {
      return new Response(
        JSON.stringify({ success: false, error: "Email already sent", status: recipient.status }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get email template
    let htmlContent = "";
    let subject = campaign.subject;

    if (campaign.template_id) {
      const { data: template } = await supabaseAdmin
        .from("email_templates")
        .select("*")
        .eq("id", campaign.template_id)
        .single();

      if (template) {
        htmlContent = template.html_content;
        subject = template.subject_template;
      }
    } else {
      const { data: defaultTemplate } = await supabaseAdmin
        .from("email_templates")
        .select("*")
        .eq("idioma", campaign.idioma)
        .eq("tipo", "teaser")
        .eq("is_default", true)
        .single();

      if (defaultTemplate) {
        htmlContent = defaultTemplate.html_content;
        if (!subject) {
          subject = defaultTemplate.subject_template;
        }
      }
    }

    if (!htmlContent) {
      throw new Error("No email template found");
    }

    // Replace variables in template
    const variables: Record<string, string> = {
      contact_name: recipient.nombre || "Estimado/a inversor/a",
      company: recipient.empresa_nombre || "",
      mandato_nombre: campaign.mandato?.nombre || "",
      custom_message: campaign.custom_message || "",
    };

    for (const [key, value] of Object.entries(variables)) {
      htmlContent = htmlContent.replace(new RegExp(`{{${key}}}`, "g"), value);
      subject = subject.replace(new RegExp(`{{${key}}}`, "g"), value);
    }

    // Generate tracking URLs
    const trackingBaseUrl = `${supabaseUrl}/functions/v1`;
    const trackingPixelUrl = `${trackingBaseUrl}/track-email-open?tid=${recipient.tracking_id}`;
    const clickTrackingBaseUrl = `${trackingBaseUrl}/track-email-click?tid=${recipient.tracking_id}&url=`;

    const trackingPixel = `<img src="${trackingPixelUrl}" width="1" height="1" alt="" style="display:none;" />`;
    htmlContent = htmlContent.replace("</body>", `${trackingPixel}</body>`);

    htmlContent = htmlContent.replace(
      /href="(https?:\/\/(?!capittal\.es)[^"]+)"/g,
      (match, url) => {
        const encodedUrl = encodeURIComponent(url);
        return `href="${clickTrackingBaseUrl}${encodedUrl}"`;
      }
    );

    // Prepare attachments
    const attachments: EmailAttachment[] = [];

    if (campaign.teaser_document) {
      try {
        const doc = campaign.teaser_document;
        let storagePath = doc.storage_path;
        let fileName = doc.file_name;

        if (campaign.enable_watermark && doc.mime_type?.includes("pdf")) {
          if (recipient.watermarked_path) {
            storagePath = recipient.watermarked_path;
          } else {
            const { data: watermarkResult, error: watermarkError } = await supabaseAdmin.functions.invoke(
              "generate-watermarked-pdf",
              { body: { recipientId } }
            );

            if (watermarkError) {
              console.error("Failed to generate watermark, using original:", watermarkError);
            } else if (watermarkResult?.success && watermarkResult?.watermarkedPath) {
              storagePath = watermarkResult.watermarkedPath;
            }
          }
        }

        const { data: fileData, error: downloadError } = await supabaseAdmin.storage
          .from("mandato-documentos")
          .download(storagePath);

        if (!downloadError && fileData) {
          const arrayBuffer = await fileData.arrayBuffer();
          const base64 = btoa(
            new Uint8Array(arrayBuffer).reduce(
              (data, byte) => data + String.fromCharCode(byte),
              ""
            )
          );

          attachments.push({
            filename: fileName,
            content: base64,
            type: doc.file_type || "application/pdf",
          });
        } else {
          console.error("Failed to download attachment:", downloadError);
        }
      } catch (attachError) {
        console.error("Error preparing attachment:", attachError);
      }
    }

    const toEmail = testEmail || recipient.email;

    // Send email via Resend
    const resendPayload: Record<string, unknown> = {
      from: `${campaign.from_name} <${campaign.from_email}>`,
      to: [toEmail],
      subject: subject,
      html: htmlContent,
    };

    if (attachments.length > 0) {
      resendPayload.attachments = attachments;
    }

    const resendResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${resendApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(resendPayload),
    });

    const resendResult = await resendResponse.json();

    if (!resendResponse.ok) {
      if (!testEmail) {
        await supabaseAdmin
          .from("teaser_recipients")
          .update({
            status: "failed",
            failed_at: new Date().toISOString(),
            error_message: resendResult.message || "Unknown error",
          })
          .eq("id", recipientId);
      }

      throw new Error(`Resend error: ${resendResult.message || "Unknown error"}`);
    }

    if (!testEmail) {
      await supabaseAdmin
        .from("teaser_recipients")
        .update({
          status: "sent",
          sent_at: new Date().toISOString(),
          provider_message_id: resendResult.id,
          provider_status: "sent",
        })
        .eq("id", recipientId);

      await supabaseAdmin
        .from("teaser_tracking_events")
        .insert({
          recipient_id: recipientId,
          campaign_id: campaign.id,
          event_type: "sent",
          provider_event_id: resendResult.id,
        });
    }

    return new Response(
      JSON.stringify({
        success: true,
        messageId: resendResult.id,
        isTest: !!testEmail,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    const error = err as Error;
    console.error("Error sending email:", error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
