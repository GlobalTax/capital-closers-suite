import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { Resend } from "https://esm.sh/resend@2.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface PlanNotification {
  id: string;
  plan_id: string;
  plan_owner_id: string;
  editor_id: string;
  editor_email: string;
  editor_name: string | null;
  planned_for_date: string;
  operation: string;
  item_title: string | null;
  created_at: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    if (!resendApiKey) {
      throw new Error("RESEND_API_KEY not configured");
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!supabaseServiceKey) {
      throw new Error("SUPABASE_SERVICE_ROLE_KEY not configured");
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const resend = new Resend(resendApiKey);

    // Get pending notifications (limit to avoid timeout)
    const { data: notifications, error: fetchError } = await supabase
      .from("daily_plan_notifications")
      .select("*")
      .is("processed_at", null)
      .order("created_at", { ascending: true })
      .limit(20);

    if (fetchError) {
      throw new Error(`Failed to fetch notifications: ${fetchError.message}`);
    }

    if (!notifications || notifications.length === 0) {
      return new Response(
        JSON.stringify({ success: true, message: "No pending notifications", processed: 0 }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    console.log(`Processing ${notifications.length} pending notifications`);

    let processed = 0;
    let errors = 0;

    for (const notification of notifications as PlanNotification[]) {
      try {
        // Get owner email from admin_users
        const { data: ownerData, error: ownerError } = await supabase
          .from("admin_users")
          .select("email, full_name")
          .eq("user_id", notification.plan_owner_id)
          .single();

        if (ownerError || !ownerData?.email) {
          console.error(`Could not find owner email for user ${notification.plan_owner_id}`);
          await markNotificationError(supabase, notification.id, "Owner email not found");
          errors++;
          continue;
        }

        // Format date nicely
        const planDate = new Date(notification.planned_for_date);
        const formattedDate = planDate.toLocaleDateString("es-ES", {
          weekday: "long",
          year: "numeric",
          month: "long",
          day: "numeric",
        });

        // Editor display name
        const editorDisplay = notification.editor_name || notification.editor_email;

        // Build email HTML
        const emailHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
    <h1 style="color: white; margin: 0; font-size: 24px;">📋 Cambio en tu Plan Diario</h1>
  </div>
  
  <div style="background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px;">
    <p style="font-size: 16px; margin-bottom: 20px;">
      Hola <strong>${ownerData.full_name || "Usuario"}</strong>,
    </p>
    
    <p style="font-size: 16px; margin-bottom: 20px;">
      Tu plan diario para el <strong>${formattedDate}</strong> ha sido modificado.
    </p>
    
    <div style="background: white; padding: 20px; border-radius: 8px; border-left: 4px solid #667eea; margin: 20px 0;">
      <p style="margin: 0; font-size: 14px; color: #666;">
        <strong>Modificado por:</strong> ${editorDisplay}
      </p>
      ${notification.item_title ? `
      <p style="margin: 10px 0 0 0; font-size: 14px; color: #666;">
        <strong>Tarea afectada:</strong> ${notification.item_title}
      </p>
      ` : ''}
      <p style="margin: 10px 0 0 0; font-size: 14px; color: #666;">
        <strong>Operación:</strong> ${getOperationLabel(notification.operation)}
      </p>
    </div>
    
    <div style="text-align: center; margin-top: 30px;">
      <a href="https://crm-capittal.lovable.app/plan-diario" 
         style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: 500;">
        Ver mi Plan Diario
      </a>
    </div>
    
    <p style="font-size: 12px; color: #999; margin-top: 30px; text-align: center;">
      Este es un mensaje automático del sistema de gestión de Capittal.
    </p>
  </div>
</body>
</html>`;

        // Send email via Resend
        const emailResponse = await resend.emails.send({
          from: "Capittal CRM <notificaciones@capittal.com>",
          to: [ownerData.email],
          subject: "Aviso: cambio en tu plan diario",
          html: emailHtml,
        });

        console.log(`Email sent to ${ownerData.email}:`, emailResponse);

        // Mark as processed
        await supabase
          .from("daily_plan_notifications")
          .update({ processed_at: new Date().toISOString() })
          .eq("id", notification.id);

        processed++;
      } catch (emailError) {
        console.error(`Error processing notification ${notification.id}:`, emailError);
        await markNotificationError(
          supabase,
          notification.id,
          emailError instanceof Error ? emailError.message : "Unknown error"
        );
        errors++;
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: `Processed ${processed} notifications`,
        processed,
        errors,
      }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error) {
    console.error("Error in send-plan-modification-email:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

function getOperationLabel(operation: string): string {
  switch (operation) {
    case "INSERT":
      return "Nueva tarea añadida";
    case "UPDATE":
      return "Tarea modificada";
    case "DELETE":
      return "Tarea eliminada";
    default:
      return operation;
  }
}

async function markNotificationError(
  supabase: any,
  notificationId: string,
  error: string
): Promise<void> {
  await supabase
    .from("daily_plan_notifications")
    .update({
      error,
      processed_at: new Date().toISOString(),
    })
    .eq("id", notificationId);
}

serve(handler);
