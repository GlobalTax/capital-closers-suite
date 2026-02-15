import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getCorsHeaders, requireAuth } from '../_shared/auth.ts';

interface MandatoHours {
  name: string;
  minutes: number;
  taskTypes: string[];
}

interface UserDetailedHours {
  userName: string;
  totalMinutes: number;
  billableMinutes: number;
  entryCount: number;
  mandatos: MandatoHours[];
  taskTypes: string[];
}

// Formatear minutos a "Xh Ym" sin decimales
function formatHours(minutes: number): string {
  const totalMins = Math.round(minutes);
  const hours = Math.floor(totalMins / 60);
  const mins = totalMins % 60;
  if (hours === 0) return `${mins}m`;
  if (mins === 0) return `${hours}h`;
  return `${hours}h ${mins}m`;
}

function generateEmailHtml(
  entries: UserDetailedHours[],
  reportDate: string,
  totalTeamMinutes: number,
  billableTeamMinutes: number,
  activeUsers: number,
  usersWithoutEntries: string[],
  topMandatos: { name: string; minutes: number }[]
): string {
  const billablePercentage = totalTeamMinutes > 0 
    ? Math.round((billableTeamMinutes / totalTeamMinutes) * 100) 
    : 0;

  // Tabla resumen
  const userRows = entries.map(entry => {
    // Mostrar hasta 3 mandatos en la tabla resumen
    const mandatosSummary = entry.mandatos
      .slice(0, 3)
      .map(m => `${m.name.substring(0, 25)}${m.name.length > 25 ? '...' : ''} (${formatHours(m.minutes)})`)
      .join(', ');
    
    return `
    <tr style="border-bottom: 1px solid #e5e7eb;">
      <td style="padding: 12px 16px; font-weight: 500; color: #374151;">${entry.userName}</td>
      <td style="padding: 12px 16px; text-align: center; color: #1f2937; font-weight: 600;">${formatHours(entry.totalMinutes)}</td>
      <td style="padding: 12px 16px; text-align: center; color: #059669; font-weight: 600;">${formatHours(entry.billableMinutes)}</td>
      <td style="padding: 12px 16px; color: #6b7280; font-size: 13px;">${mandatosSummary || 'Sin proyectos'}</td>
    </tr>
  `;
  }).join('');

  // Detalle por usuario
  const userDetails = entries.map(entry => {
    const mandatosList = entry.mandatos
      .map(m => {
        const taskTypesStr = m.taskTypes.length > 0 ? ` (${m.taskTypes.join(', ')})` : '';
        return `<li style="margin: 4px 0; color: #374151;">
          <strong>${m.name}</strong>: ${formatHours(m.minutes)}${taskTypesStr}
        </li>`;
      })
      .join('');

    const taskTypesUnique = entry.taskTypes.length > 0 
      ? entry.taskTypes.join(', ') 
      : 'No especificado';

    return `
    <div style="background-color: #f9fafb; border-radius: 8px; padding: 16px; margin-bottom: 16px; border-left: 4px solid #1e3a5f;">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
        <h3 style="margin: 0; font-size: 16px; color: #1e3a5f;">${entry.userName}</h3>
        <div style="text-align: right;">
          <span style="font-size: 18px; font-weight: 700; color: #1f2937;">${formatHours(entry.totalMinutes)}</span>
          <span style="font-size: 13px; color: #059669; margin-left: 8px;">(${formatHours(entry.billableMinutes)} fact.)</span>
        </div>
      </div>
      
      <div style="margin-bottom: 12px;">
        <p style="margin: 0 0 8px; font-size: 13px; font-weight: 600; color: #6b7280; text-transform: uppercase;">Proyectos trabajados:</p>
        <ul style="margin: 0; padding-left: 20px; font-size: 14px;">
          ${mandatosList || '<li style="color: #9ca3af;">Sin proyectos registrados</li>'}
        </ul>
      </div>
      
      <div style="display: flex; gap: 24px; font-size: 12px; color: #6b7280; border-top: 1px solid #e5e7eb; padding-top: 12px;">
        <span><strong>Tipos de tarea:</strong> ${taskTypesUnique}</span>
        <span><strong>Entradas:</strong> ${entry.entryCount}</span>
      </div>
    </div>
    `;
  }).join('');

  // Usuarios sin registrar
  const noEntriesSection = usersWithoutEntries.length > 0 
    ? `
    <div style="background-color: #fef2f2; border-radius: 8px; padding: 16px; margin-top: 24px; border-left: 4px solid #ef4444;">
      <h4 style="margin: 0 0 8px; font-size: 14px; color: #dc2626;">⚠️ Usuarios sin registrar horas (${usersWithoutEntries.length})</h4>
      <p style="margin: 0; font-size: 14px; color: #7f1d1d;">${usersWithoutEntries.join(', ')}</p>
    </div>
    `
    : '';

  // Top proyectos
  const topMandatosSection = topMandatos.length > 0
    ? `
    <div style="background-color: #f0f9ff; border-radius: 8px; padding: 16px; margin-top: 16px;">
      <h4 style="margin: 0 0 8px; font-size: 14px; color: #1e40af;">📈 Top Proyectos del Día</h4>
      <div style="display: flex; gap: 16px; flex-wrap: wrap;">
        ${topMandatos.slice(0, 5).map((m, i) => `
          <div style="background: white; padding: 8px 12px; border-radius: 6px; font-size: 13px;">
            <span style="font-weight: 600; color: #1e3a5f;">${i + 1}. ${m.name}</span>
            <span style="color: #6b7280; margin-left: 8px;">${formatHours(m.minutes)}</span>
          </div>
        `).join('')}
      </div>
    </div>
    `
    : '';

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
  <div style="max-width: 700px; margin: 0 auto; padding: 24px;">
    <!-- Header -->
    <div style="background: linear-gradient(135deg, #1e3a5f 0%, #2d5a8f 100%); padding: 24px; border-radius: 12px 12px 0 0; text-align: center;">
      <h1 style="margin: 0; color: #ffffff; font-size: 22px; font-weight: 600;">📊 Reporte Diario de Horas</h1>
      <p style="margin: 8px 0 0; color: #bfdbfe; font-size: 14px;">${reportDate}</p>
    </div>

    <!-- Main content -->
    <div style="background-color: #ffffff; padding: 24px; border-radius: 0 0 12px 12px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
      
      <!-- Summary cards -->
      <div style="display: flex; gap: 12px; margin-bottom: 24px;">
        <div style="flex: 1; background-color: #f0f9ff; padding: 16px; border-radius: 8px; text-align: center;">
          <p style="margin: 0; font-size: 26px; font-weight: 700; color: #1e3a5f;">${formatHours(totalTeamMinutes)}</p>
          <p style="margin: 4px 0 0; font-size: 12px; color: #64748b;">Total Registrado</p>
        </div>
        <div style="flex: 1; background-color: #ecfdf5; padding: 16px; border-radius: 8px; text-align: center;">
          <p style="margin: 0; font-size: 26px; font-weight: 700; color: #059669;">${formatHours(billableTeamMinutes)}</p>
          <p style="margin: 4px 0 0; font-size: 12px; color: #64748b;">Facturable (${billablePercentage}%)</p>
        </div>
        <div style="flex: 1; background-color: #fef3c7; padding: 16px; border-radius: 8px; text-align: center;">
          <p style="margin: 0; font-size: 26px; font-weight: 700; color: #d97706;">${activeUsers}</p>
          <p style="margin: 4px 0 0; font-size: 12px; color: #64748b;">Usuarios Activos</p>
        </div>
      </div>

      <!-- Summary Table -->
      <h2 style="margin: 0 0 16px; font-size: 16px; color: #374151; font-weight: 600;">Resumen por Usuario</h2>
      <table style="width: 100%; border-collapse: collapse; border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden; margin-bottom: 32px;">
        <thead>
          <tr style="background-color: #f9fafb;">
            <th style="padding: 12px 16px; text-align: left; font-size: 12px; font-weight: 600; color: #6b7280; text-transform: uppercase; letter-spacing: 0.5px;">Usuario</th>
            <th style="padding: 12px 16px; text-align: center; font-size: 12px; font-weight: 600; color: #6b7280; text-transform: uppercase; letter-spacing: 0.5px;">Total</th>
            <th style="padding: 12px 16px; text-align: center; font-size: 12px; font-weight: 600; color: #6b7280; text-transform: uppercase; letter-spacing: 0.5px;">Facturable</th>
            <th style="padding: 12px 16px; text-align: left; font-size: 12px; font-weight: 600; color: #6b7280; text-transform: uppercase; letter-spacing: 0.5px;">Proyectos</th>
          </tr>
        </thead>
        <tbody>
          ${userRows || noDataMessage}
        </tbody>
      </table>

      <!-- Detailed breakdown -->
      ${entries.length > 0 ? `
      <h2 style="margin: 0 0 16px; font-size: 16px; color: #374151; font-weight: 600;">Detalle por Usuario</h2>
      ${userDetails}
      ` : ''}

      ${topMandatosSection}
      ${noEntriesSection}

      <!-- CTA -->
      <div style="text-align: center; margin-top: 24px;">
        <a href="https://crm-capittal.lovable.app/horas-equipo" style="display: inline-block; background-color: #1e3a5f; color: #ffffff; text-decoration: none; padding: 12px 24px; border-radius: 8px; font-weight: 500; font-size: 14px;">Ver detalle completo en CRM</a>
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
  const corsHeaders = getCorsHeaders(req);

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Validar autenticación (cron usa service key, admin usa JWT)
    const { user, error: authError } = await requireAuth(req, corsHeaders);
    if (authError) return authError;

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

    // Query time entries with mandato and task type info
    const { data: timeEntries, error: entriesError } = await supabase
      .from('mandato_time_entries')
      .select(`
        duration_minutes,
        is_billable,
        work_type,
        user_id,
        mandato_id,
        work_task_type_id,
        mandatos:mandato_id (
          id,
          descripcion
        ),
        work_task_types:work_task_type_id (
          id,
          name
        )
      `)
      .gte('start_time', startDate.toISOString())
      .lt('start_time', endDate.toISOString())
      .eq('is_deleted', false);

    if (entriesError) {
      console.error('[daily-hours-report] Error fetching time entries:', entriesError);
      throw entriesError;
    }

    console.log(`[daily-hours-report] Found ${timeEntries?.length || 0} time entries`);

    // Get all active users to detect who didn't log hours
    const { data: allActiveUsers } = await supabase
      .from('admin_users')
      .select('user_id, full_name')
      .eq('is_active', true);

    // Get unique user IDs and fetch their names
    const userIds = [...new Set((timeEntries || []).map(e => e.user_id).filter(Boolean))];
    
    let userNames: Record<string, string> = {};
    if (allActiveUsers) {
      userNames = allActiveUsers.reduce((acc, u) => {
        acc[u.user_id] = u.full_name || 'Usuario';
        return acc;
      }, {} as Record<string, string>);
    }

    // Aggregate by user and mandato - using INTEGER MINUTES to avoid floating point issues
    const userMap = new Map<string, UserDetailedHours>();
    const mandatoTotals = new Map<string, number>(); // For top mandatos
    
    for (const entry of timeEntries || []) {
      const userId = entry.user_id;
      const userName = userNames[userId] || 'Usuario Desconocido';
      
      // Get mandato name - Supabase returns object for single relation
      const mandatoData = entry.mandatos as unknown as { id: string; descripcion: string } | null;
      const mandatoName = mandatoData?.descripcion || 'Sin proyecto';
      
      // Get task type name - Supabase returns object for single relation
      const taskTypeData = entry.work_task_types as unknown as { id: string; name: string } | null;
      const taskTypeName = taskTypeData?.name || null;
      
      // Round minutes to integer immediately
      const minutes = Math.round(entry.duration_minutes || 0);
      
      // Initialize user if not exists
      if (!userMap.has(userName)) {
        userMap.set(userName, {
          userName,
          totalMinutes: 0,
          billableMinutes: 0,
          entryCount: 0,
          mandatos: [],
          taskTypes: [],
        });
      }
      
      const existing = userMap.get(userName)!;
      
      // Accumulate totals in INTEGER minutes
      existing.totalMinutes += minutes;
      existing.entryCount += 1;
      
      if (entry.is_billable) {
        existing.billableMinutes += minutes;
      }
      
      // Track task types at user level
      if (taskTypeName && !existing.taskTypes.includes(taskTypeName)) {
        existing.taskTypes.push(taskTypeName);
      }
      
      // Aggregate by mandato within user
      let mandatoEntry = existing.mandatos.find(m => m.name === mandatoName);
      if (!mandatoEntry) {
        mandatoEntry = { name: mandatoName, minutes: 0, taskTypes: [] };
        existing.mandatos.push(mandatoEntry);
      }
      mandatoEntry.minutes += minutes;
      
      // Track task types at mandato level
      if (taskTypeName && !mandatoEntry.taskTypes.includes(taskTypeName)) {
        mandatoEntry.taskTypes.push(taskTypeName);
      }
      
      // Track global mandato totals for top projects
      mandatoTotals.set(mandatoName, (mandatoTotals.get(mandatoName) || 0) + minutes);
    }

    // Sort mandatos within each user by minutes (descending)
    for (const user of userMap.values()) {
      user.mandatos.sort((a, b) => b.minutes - a.minutes);
    }

    const userHours = Array.from(userMap.values())
      .sort((a, b) => b.totalMinutes - a.totalMinutes);

    // Calculate totals (already in integer minutes)
    const totalTeamMinutes = userHours.reduce((sum, u) => sum + u.totalMinutes, 0);
    const billableTeamMinutes = userHours.reduce((sum, u) => sum + u.billableMinutes, 0);
    const activeUsers = userHours.length;

    // Get top mandatos
    const topMandatos = Array.from(mandatoTotals.entries())
      .map(([name, minutes]) => ({ name, minutes }))
      .sort((a, b) => b.minutes - a.minutes)
      .slice(0, 5);

    // Find users without entries
    const usersWithEntries = new Set(userIds);
    const usersWithoutEntries = (allActiveUsers || [])
      .filter(u => !usersWithEntries.has(u.user_id))
      .map(u => u.full_name || 'Usuario')
      .sort();

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
      totalTeamMinutes,
      billableTeamMinutes,
      activeUsers,
      usersWithoutEntries,
      topMandatos
    );

    // Send emails
    const emailAddresses = recipients.map(r => r.email);
    const subject = `📊 Reporte Horas ${startDate.toLocaleDateString('es-ES', { day: '2-digit', month: 'short' })} | ${formatHours(totalTeamMinutes)} registradas`;

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
          totalMinutes: totalTeamMinutes,
          billableMinutes: billableTeamMinutes,
          activeUsers,
          usersWithoutEntries: usersWithoutEntries.length,
          entriesCount: timeEntries?.length || 0,
          topMandatos: topMandatos.slice(0, 3).map(m => m.name),
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
