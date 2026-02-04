import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface TimeEntry {
  user_name: string;
  total_minutes: number;
  billable_minutes: number;
  work_types: string[];
}

interface UserHours {
  userName: string;
  totalHours: number;
  billableHours: number;
  workTypes: string[];
}

function formatHours(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (mins === 0) return `${hours}h`;
  return `${hours}h ${mins}m`;
}

function generateEmailHtml(
  entries: UserHours[],
  reportDate: string,
  totalTeamHours: number,
  billableTeamHours: number,
  activeUsers: number
): string {
  const billablePercentage = totalTeamHours > 0 
    ? Math.round((billableTeamHours / totalTeamHours) * 100) 
    : 0;

  const userRows = entries.map(entry => `
    <tr style="border-bottom: 1px solid #e5e7eb;">
      <td style="padding: 12px 16px; font-weight: 500; color: #374151;">${entry.userName}</td>
      <td style="padding: 12px 16px; text-align: center; color: #1f2937;">${formatHours(entry.totalHours * 60)}</td>
      <td style="padding: 12px 16px; text-align: center; color: #059669;">${formatHours(entry.billableHours * 60)}</td>
      <td style="padding: 12px 16px; color: #6b7280; font-size: 13px;">${entry.workTypes.slice(0, 3).join(', ')}</td>
    </tr>
  `).join('');

  const noDataMessage = entries.length === 0 
    ? `<tr><td colspan="4" style="padding: 24px; text-align: center; color: #6b7280;">No se registraron horas el ${reportDate}</td></tr>`
    : '';

  return `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f3f4f6;">
  <div style="max-width: 640px; margin: 0 auto; padding: 24px;">
    <!-- Header -->
    <div style="background: linear-gradient(135deg, #1e3a5f 0%, #2d5a8f 100%); padding: 24px; border-radius: 12px 12px 0 0; text-align: center;">
      <h1 style="margin: 0; color: #ffffff; font-size: 20px; font-weight: 600;">📊 Reporte Diario de Horas</h1>
      <p style="margin: 8px 0 0; color: #bfdbfe; font-size: 14px;">${reportDate}</p>
    </div>

    <!-- Main content -->
    <div style="background-color: #ffffff; padding: 24px; border-radius: 0 0 12px 12px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
      
      <!-- Summary cards -->
      <div style="display: flex; gap: 12px; margin-bottom: 24px;">
        <div style="flex: 1; background-color: #f0f9ff; padding: 16px; border-radius: 8px; text-align: center;">
          <p style="margin: 0; font-size: 24px; font-weight: 700; color: #1e3a5f;">${formatHours(totalTeamHours * 60)}</p>
          <p style="margin: 4px 0 0; font-size: 12px; color: #64748b;">Total Registrado</p>
        </div>
        <div style="flex: 1; background-color: #ecfdf5; padding: 16px; border-radius: 8px; text-align: center;">
          <p style="margin: 0; font-size: 24px; font-weight: 700; color: #059669;">${formatHours(billableTeamHours * 60)}</p>
          <p style="margin: 4px 0 0; font-size: 12px; color: #64748b;">Facturable (${billablePercentage}%)</p>
        </div>
        <div style="flex: 1; background-color: #fef3c7; padding: 16px; border-radius: 8px; text-align: center;">
          <p style="margin: 0; font-size: 24px; font-weight: 700; color: #d97706;">${activeUsers}</p>
          <p style="margin: 4px 0 0; font-size: 12px; color: #64748b;">Usuarios Activos</p>
        </div>
      </div>

      <!-- Table -->
      <table style="width: 100%; border-collapse: collapse; border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden;">
        <thead>
          <tr style="background-color: #f9fafb;">
            <th style="padding: 12px 16px; text-align: left; font-size: 12px; font-weight: 600; color: #6b7280; text-transform: uppercase; letter-spacing: 0.5px;">Usuario</th>
            <th style="padding: 12px 16px; text-align: center; font-size: 12px; font-weight: 600; color: #6b7280; text-transform: uppercase; letter-spacing: 0.5px;">Total</th>
            <th style="padding: 12px 16px; text-align: center; font-size: 12px; font-weight: 600; color: #6b7280; text-transform: uppercase; letter-spacing: 0.5px;">Facturable</th>
            <th style="padding: 12px 16px; text-align: left; font-size: 12px; font-weight: 600; color: #6b7280; text-transform: uppercase; letter-spacing: 0.5px;">Trabajo Principal</th>
          </tr>
        </thead>
        <tbody>
          ${userRows || noDataMessage}
        </tbody>
      </table>

      <!-- CTA -->
      <div style="text-align: center; margin-top: 24px;">
        <a href="https://crm-capittal.lovable.app/horas-equipo" style="display: inline-block; background-color: #1e3a5f; color: #ffffff; text-decoration: none; padding: 12px 24px; border-radius: 8px; font-weight: 500; font-size: 14px;">Ver detalle en CRM</a>
      </div>
    </div>

    <!-- Footer -->
    <div style="text-align: center; margin-top: 24px; color: #9ca3af; font-size: 12px;">
      <p style="margin: 0;">Este es un reporte automático generado por Capittal CRM.</p>
      <p style="margin: 4px 0 0;">Para gestionar destinatarios: <a href="https://crm-capittal.lovable.app/admin/reportes-email" style="color: #3b82f6; text-decoration: none;">Configurar reportes</a></p>
    </div>
  </div>
</body>
</html>
  `;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Parse request body for test mode
    let isTestMode = false;
    let targetDate: Date | null = null;
    
    try {
      const body = await req.json();
      isTestMode = body.test === true;
      if (body.date) {
        targetDate = new Date(body.date);
      }
    } catch {
      // No body or invalid JSON, continue with defaults
    }

    // Calculate date range (yesterday in Madrid timezone)
    const now = new Date();
    const madridOffset = 1; // CET (adjust for CEST if needed)
    
    let startDate: Date;
    let endDate: Date;
    
    if (targetDate) {
      startDate = new Date(targetDate);
      startDate.setHours(0, 0, 0, 0);
      endDate = new Date(targetDate);
      endDate.setHours(23, 59, 59, 999);
    } else {
      // Yesterday
      startDate = new Date(now);
      startDate.setDate(startDate.getDate() - 1);
      startDate.setHours(0, 0, 0, 0);
      
      endDate = new Date(startDate);
      endDate.setHours(23, 59, 59, 999);
    }

    const reportDateStr = startDate.toLocaleDateString('es-ES', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });

    console.log(`[daily-hours-report] Generating report for: ${reportDateStr}`);
    console.log(`[daily-hours-report] Date range: ${startDate.toISOString()} - ${endDate.toISOString()}`);

    // Query time entries for the target date
    const { data: timeEntries, error: entriesError } = await supabase
      .from('mandato_time_entries')
      .select(`
        duration_minutes,
        is_billable,
        work_type,
        user_id
      `)
      .gte('start_time', startDate.toISOString())
      .lt('start_time', endDate.toISOString())
      .eq('is_deleted', false);

    if (entriesError) {
      console.error('[daily-hours-report] Error fetching time entries:', entriesError);
      throw entriesError;
    }

    console.log(`[daily-hours-report] Found ${timeEntries?.length || 0} time entries`);

    // Get unique user IDs and fetch their names
    const userIds = [...new Set((timeEntries || []).map(e => e.user_id).filter(Boolean))];
    
    let userNames: Record<string, string> = {};
    if (userIds.length > 0) {
      const { data: users } = await supabase
        .from('admin_users')
        .select('user_id, full_name')
        .in('user_id', userIds);
      
      userNames = (users || []).reduce((acc, u) => {
        acc[u.user_id] = u.full_name || 'Usuario';
        return acc;
      }, {} as Record<string, string>);
    }

    // Aggregate by user
    const userMap = new Map<string, UserHours>();
    
    for (const entry of timeEntries || []) {
      const userName = userNames[entry.user_id] || 'Usuario Desconocido';
      const existing = userMap.get(userName) || {
        userName,
        totalHours: 0,
        billableHours: 0,
        workTypes: [] as string[],
      };
      
      const minutes = entry.duration_minutes || 0;
      existing.totalHours += minutes / 60;
      if (entry.is_billable) {
        existing.billableHours += minutes / 60;
      }
      const workType = entry.work_type as string | null;
      if (workType && !existing.workTypes.includes(workType)) {
        existing.workTypes.push(workType);
      }
      
      userMap.set(userName, existing);
    }

    const userHours = Array.from(userMap.values())
      .sort((a, b) => b.totalHours - a.totalHours);

    // Calculate totals
    const totalTeamHours = userHours.reduce((sum, u) => sum + u.totalHours, 0);
    const billableTeamHours = userHours.reduce((sum, u) => sum + u.billableHours, 0);
    const activeUsers = userHours.length;

    // Get recipients
    const { data: recipients, error: recipientsError } = await supabase
      .from('report_email_recipients')
      .select('email, name')
      .eq('report_type', 'hours_daily')
      .eq('is_active', true);

    if (recipientsError) {
      console.error('[daily-hours-report] Error fetching recipients:', recipientsError);
      throw recipientsError;
    }

    if (!recipients || recipients.length === 0) {
      console.log('[daily-hours-report] No active recipients found');
      return new Response(
        JSON.stringify({ success: true, message: 'No recipients configured', sent: 0 }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`[daily-hours-report] Sending to ${recipients.length} recipients`);

    // Generate email HTML
    const emailHtml = generateEmailHtml(
      userHours,
      reportDateStr,
      totalTeamHours,
      billableTeamHours,
      activeUsers
    );

    // Send emails
    const emailAddresses = recipients.map(r => r.email);
    const subject = `📊 Reporte Horas ${startDate.toLocaleDateString('es-ES', { day: '2-digit', month: 'short' })} | ${formatHours(totalTeamHours * 60)} registradas`;

    // Call send-email function
    const sendResponse = await fetch(`${supabaseUrl}/functions/v1/send-email`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${supabaseServiceKey}`,
      },
      body: JSON.stringify({
        to: emailAddresses,
        subject,
        html: emailHtml,
        fromName: 'Capittal CRM',
        updateQueue: false,
      }),
    });

    const sendResult = await sendResponse.json();

    if (!sendResult.success) {
      console.error('[daily-hours-report] Failed to send email:', sendResult.error);
      throw new Error(sendResult.error);
    }

    console.log('[daily-hours-report] Email sent successfully:', sendResult.messageId);

    return new Response(
      JSON.stringify({
        success: true,
        reportDate: reportDateStr,
        recipients: emailAddresses,
        summary: {
          totalHours: totalTeamHours,
          billableHours: billableTeamHours,
          activeUsers,
          entriesCount: timeEntries?.length || 0,
        },
        messageId: sendResult.messageId,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    const err = error as Error;
    console.error('[daily-hours-report] Error:', err);
    return new Response(
      JSON.stringify({ success: false, error: err.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
