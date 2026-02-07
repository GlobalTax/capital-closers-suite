import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const INTERNAL_BCC = [
  "samuel@capittal.es",
  "lluis@capittal.es",
  "oriol@capittal.es"
];

interface LeadConfirmationRequest {
  lead_id: string;
  lead_type: 'contact_leads' | 'general_contact_leads' | 'company_valuations' | 'advisor_valuations' | 'acquisition_leads';
  email: string;
  full_name: string;
}

function generateEmailHtml(fullName: string): string {
  return `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Hemos recibido tu información</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f4f4f5; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
  <table role="presentation" cellpadding="0" cellspacing="0" style="width: 100%; background-color: #f4f4f5;">
    <tr>
      <td style="padding: 40px 20px;">
        <table role="presentation" cellpadding="0" cellspacing="0" style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);">
          
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #1e3a5f 0%, #2d5a87 100%); padding: 32px 40px; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 600; letter-spacing: -0.5px;">Capittal</h1>
              <p style="margin: 8px 0 0 0; color: rgba(255,255,255,0.8); font-size: 14px;">Corporate Finance & M&A Advisory</p>
            </td>
          </tr>
          
          <!-- Body -->
          <tr>
            <td style="padding: 40px;">
              <p style="margin: 0 0 20px 0; color: #18181b; font-size: 16px; line-height: 1.6;">
                Hola <strong>${fullName}</strong>,
              </p>
              
              <p style="margin: 0 0 20px 0; color: #3f3f46; font-size: 16px; line-height: 1.6;">
                Gracias por ponerte en contacto con Capittal.
              </p>
              
              <p style="margin: 0 0 20px 0; color: #3f3f46; font-size: 16px; line-height: 1.6;">
                Hemos recibido correctamente tu información y nuestro equipo la está revisando. En breve nos pondremos en contacto contigo para comentar los siguientes pasos y resolver cualquier duda que puedas tener.
              </p>
              
              <p style="margin: 0 0 20px 0; color: #3f3f46; font-size: 16px; line-height: 1.6;">
                Mientras tanto, si necesitas ampliar información o quieres adelantarnos algún detalle adicional, no dudes en responder a este email.
              </p>
              
              <p style="margin: 32px 0 0 0; color: #18181b; font-size: 16px; line-height: 1.6;">
                Un cordial saludo,<br>
                <strong>El equipo de Capittal</strong>
              </p>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="background-color: #f8fafc; padding: 24px 40px; border-top: 1px solid #e4e4e7;">
              <table role="presentation" cellpadding="0" cellspacing="0" style="width: 100%;">
                <tr>
                  <td style="text-align: center;">
                    <p style="margin: 0 0 8px 0; color: #71717a; font-size: 13px;">
                      © ${new Date().getFullYear()} Capittal. Todos los derechos reservados.
                    </p>
                    <p style="margin: 0; color: #a1a1aa; font-size: 12px;">
                      Este email ha sido enviado automáticamente. Por favor, no respondas directamente a esta dirección.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}

function generateEmailText(fullName: string): string {
  return `
Hola ${fullName},

Gracias por ponerte en contacto con Capittal.

Hemos recibido correctamente tu información y nuestro equipo la está revisando. En breve nos pondremos en contacto contigo para comentar los siguientes pasos y resolver cualquier duda que puedas tener.

Mientras tanto, si necesitas ampliar información o quieres adelantarnos algún detalle adicional, no dudes en responder a este email.

Un cordial saludo,
El equipo de Capittal

---
© ${new Date().getFullYear()} Capittal. Todos los derechos reservados.
  `.trim();
}

/**
 * Validates internal auth: either SERVICE_ROLE_KEY or admin user.
 */
async function validateInternalAuth(req: Request): Promise<Response | null> {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return new Response(
      JSON.stringify({ success: false, error: "No autorizado: token requerido" }),
      { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  const token = authHeader.replace("Bearer ", "");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

  // Allow internal service calls
  if (token === serviceRoleKey) {
    return null;
  }

  // Validate as admin user
  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

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

  const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey!);
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

  return null;
}

const handler = async (req: Request): Promise<Response> => {
  console.log("send-lead-confirmation: Request received");

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // Auth validation
  const authError = await validateInternalAuth(req);
  if (authError) return authError;

  try {
    const { lead_id, lead_type, email, full_name }: LeadConfirmationRequest = await req.json();

    console.log(`send-lead-confirmation: Processing lead_id=${lead_id}, type=${lead_type}, email=${email}`);

    if (!email || !full_name) {
      console.error("send-lead-confirmation: Missing required fields");
      return new Response(
        JSON.stringify({ error: "Missing required fields: email and full_name" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const emailHtml = generateEmailHtml(full_name);
    const emailText = generateEmailText(full_name);

    console.log(`send-lead-confirmation: Sending email to ${email} with BCC to ${INTERNAL_BCC.length} internal recipients`);
    
    const { data: emailData, error: emailError } = await resend.emails.send({
      from: "Capittal <noreply@capittal.es>",
      to: [email],
      bcc: INTERNAL_BCC,
      subject: "Hemos recibido tu información",
      html: emailHtml,
      text: emailText,
    });

    if (emailError) {
      console.error("send-lead-confirmation: Resend error:", emailError);
      return new Response(
        JSON.stringify({ error: emailError.message }),
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    console.log(`send-lead-confirmation: Email sent successfully, message_id=${emailData?.id}`);

    if (lead_id && lead_type) {
      const supabaseUrl = Deno.env.get("SUPABASE_URL");
      const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
      
      if (supabaseUrl && supabaseServiceKey) {
        const supabase = createClient(supabaseUrl, supabaseServiceKey);
        
        const { error: updateError } = await supabase
          .from(lead_type)
          .update({
            email_sent: true,
            email_sent_at: new Date().toISOString(),
            email_message_id: emailData?.id
          })
          .eq("id", lead_id);

        if (updateError) {
          console.warn(`send-lead-confirmation: Failed to update lead record: ${updateError.message}`);
        } else {
          console.log(`send-lead-confirmation: Lead ${lead_id} updated with email tracking`);
        }
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        message_id: emailData?.id,
        recipients: {
          to: email,
          bcc_count: INTERNAL_BCC.length
        }
      }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );

  } catch (error: any) {
    console.error("send-lead-confirmation: Unexpected error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
