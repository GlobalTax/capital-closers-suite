import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-cron-secret, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const CLAUDE_MODEL = "claude-sonnet-4-20250514";

// ── Anthropic API helper with fallback ──
async function callAIWithToolCalling(
  systemPrompt: string,
  userPrompt: string,
  toolName: string,
  toolDescription: string,
  toolSchema: any
): Promise<{ result: any; usage: { input_tokens: number; output_tokens: number }; model: string }> {
  const ANTHROPIC_API_KEY = Deno.env.get("ANTHROPIC_API_KEY");

  if (ANTHROPIC_API_KEY) {
    try {
      const resp = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "x-api-key": ANTHROPIC_API_KEY,
          "anthropic-version": "2023-06-01",
          "content-type": "application/json",
        },
        body: JSON.stringify({
          model: CLAUDE_MODEL,
          max_tokens: 4096,
          system: systemPrompt,
          messages: [{ role: "user", content: userPrompt }],
          tools: [{
            name: toolName,
            description: toolDescription,
            input_schema: toolSchema,
          }],
          tool_choice: { type: "tool", name: toolName },
        }),
      });

      if (resp.ok) {
        const data = await resp.json();
        const toolUse = data.content?.find((b: any) => b.type === "tool_use");
        if (toolUse) {
          return {
            result: toolUse.input,
            usage: { input_tokens: data.usage?.input_tokens ?? 0, output_tokens: data.usage?.output_tokens ?? 0 },
            model: CLAUDE_MODEL,
          };
        }
      } else {
        console.error("Anthropic error:", resp.status, await resp.text());
      }
    } catch (e) {
      console.error("Anthropic call failed, falling back:", e);
    }
  }

  // Fallback to Lovable AI Gateway
  const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
  if (!LOVABLE_API_KEY) throw new Error("No AI API key configured");

  const resp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "google/gemini-3-flash-preview",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      tools: [{
        type: "function",
        function: { name: toolName, description: toolDescription, parameters: toolSchema },
      }],
      tool_choice: { type: "function", function: { name: toolName } },
    }),
  });

  if (!resp.ok) {
    const status = resp.status;
    if (status === 429) throw new Error("RATE_LIMIT");
    if (status === 402) throw new Error("CREDITS_EXHAUSTED");
    throw new Error(`AI gateway error: ${status}`);
  }

  const data = await resp.json();
  const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
  if (!toolCall) throw new Error("No tool call in fallback response");

  return {
    result: JSON.parse(toolCall.function.arguments),
    usage: { input_tokens: data.usage?.prompt_tokens ?? 0, output_tokens: data.usage?.completion_tokens ?? 0 },
    model: "google/gemini-3-flash-preview",
  };
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const startTime = Date.now();
  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const cronSecret = Deno.env.get("CRON_SECRET");

  try {
    // --- Auth: user token OR cron-secret ---
    let userId: string | null = null;
    const authHeader = req.headers.get("Authorization") || "";
    const incomingCronSecret = req.headers.get("x-cron-secret");
    const isCron = cronSecret && incomingCronSecret === cronSecret;

    if (!isCron) {
      const supabaseAuth = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!, {
        global: { headers: { Authorization: authHeader } },
      });
      const token = authHeader.replace("Bearer ", "");
      const { data: { user }, error: userError } = await supabaseAuth.auth.getUser(token);
      if (userError || !user) {
        return new Response(JSON.stringify({ error: "Unauthorized" }), {
          status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      userId = user.id;
      // check admin role
      const admin = createClient(supabaseUrl, supabaseServiceKey);
      const { data: adminUser } = await admin
        .from("admin_users")
        .select("role, is_active")
        .eq("user_id", userId)
        .single();
      if (!adminUser?.is_active || !["admin", "super_admin"].includes(adminUser.role)) {
        return new Response(JSON.stringify({ error: "Forbidden" }), {
          status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // --- Period: last 7 days ---
    const now = new Date();
    const periodEnd = new Date(now);
    periodEnd.setHours(23, 59, 59, 999);
    const periodStart = new Date(now);
    periodStart.setDate(periodStart.getDate() - 7);
    periodStart.setHours(0, 0, 0, 0);

    const periodStartISO = periodStart.toISOString();
    const periodEndISO = periodEnd.toISOString();

    // --- Parallel data fetching ---
    const [
      mandatosRes,
      timeEntriesRes,
      tareasRes,
      meetingsRes,
      recipientsRes,
    ] = await Promise.all([
      supabase
        .from("mandatos")
        .select("id, nombre, tipo, status, pipeline_stage, probability, deal_value, estimated_close_date, updated_at, created_at")
        .in("status", ["activo", "en_proceso"]),
      supabase
        .from("time_entries")
        .select("id, user_id, mandato_id, hours, task_type, description, entry_date, billable")
        .gte("entry_date", periodStartISO.split("T")[0])
        .lte("entry_date", periodEndISO.split("T")[0]),
      supabase
        .from("tareas")
        .select("id, titulo, status, prioridad, mandato_id, created_at, updated_at")
        .or(`updated_at.gte.${periodStartISO},created_at.gte.${periodStartISO}`),
      supabase
        .from("company_meetings")
        .select("id, title, meeting_date, meeting_type, empresa_id, mandato_id")
        .gte("meeting_date", periodStartISO)
        .lte("meeting_date", periodEndISO),
      supabase
        .from("executive_report_recipients")
        .select("email, name")
        .eq("active", true),
    ]);

    const mandatos = mandatosRes.data || [];
    const timeEntries = timeEntriesRes.data || [];
    const tareas = tareasRes.data || [];
    const meetings = meetingsRes.data || [];
    const recipients = recipientsRes.data || [];

    if (recipients.length === 0) {
      return new Response(
        JSON.stringify({ error: "No hay destinatarios activos configurados" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // --- Compute metrics ---
    const totalHoursWeek = timeEntries.reduce((s, e) => s + (e.hours || 0), 0);
    const tareasCompletadas = tareas.filter((t) => t.status === "completada").length;
    const tareasPendientes = tareas.filter((t) => t.status !== "completada" && t.status !== "cancelada").length;

    // Mandatos at risk: no update in >14 days
    const fourteenDaysAgo = new Date(now);
    fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);
    const mandatosAtRisk = mandatos.filter(
      (m) => new Date(m.updated_at) < fourteenDaysAgo
    );

    // Upcoming closes
    const thirtyDaysFromNow = new Date(now);
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
    const upcomingCloses = mandatos.filter(
      (m) => m.estimated_close_date && new Date(m.estimated_close_date) <= thirtyDaysFromNow
    );

    // --- Build AI prompt ---
    const dataContext = `
DATOS FACTUALES DE LA SEMANA (${periodStart.toLocaleDateString("es-ES")} - ${periodEnd.toLocaleDateString("es-ES")}):

MANDATOS ACTIVOS (${mandatos.length}):
${mandatos.map((m) => `- ${m.nombre} | Tipo: ${m.tipo} | Etapa: ${m.pipeline_stage || "N/A"} | Prob: ${m.probability || 0}% | Valor: €${((m.deal_value || 0) / 1000000).toFixed(1)}M`).join("\n")}

HORAS REGISTRADAS: ${Math.round(totalHoursWeek)}h total
${timeEntries.length > 0 ? "Por mandato:\n" + summarizeHoursByMandato(timeEntries, mandatos) : "Sin entradas de tiempo esta semana."}

REUNIONES (${meetings.length}):
${meetings.map((m) => `- ${m.title} (${m.meeting_type || "general"}) - ${new Date(m.meeting_date).toLocaleDateString("es-ES")}`).join("\n") || "Sin reuniones esta semana."}

TAREAS: ${tareasCompletadas} completadas, ${tareasPendientes} pendientes

MANDATOS EN RIESGO (sin actividad >14 días): ${mandatosAtRisk.length}
${mandatosAtRisk.map((m) => `- ${m.nombre} (última actividad: ${new Date(m.updated_at).toLocaleDateString("es-ES")})`).join("\n") || "Ninguno."}

CIERRES PRÓXIMOS (30 días):
${upcomingCloses.map((m) => `- ${m.nombre} - cierre estimado: ${new Date(m.estimated_close_date).toLocaleDateString("es-ES")}`).join("\n") || "Sin cierres inminentes."}
`;

    const systemPrompt = "Eres el director de M&A de Capittal Partners redactando el reporte ejecutivo semanal para el comité de socios. Sé conciso, profesional, en español. Enfócate en: deals que avanzaron, deals en riesgo, uso del tiempo del equipo, y acciones concretas para la próxima semana. No inventes datos, usa solo los datos proporcionados.";

    const toolSchema = {
      type: "object",
      properties: {
        executive_summary: { type: "string", description: "Resumen narrativo de 2-3 párrafos sobre la actividad de la semana" },
        highlights: { type: "array", items: { type: "string" }, description: "3-5 logros o avances principales de la semana" },
        risks: {
          type: "array",
          items: {
            type: "object",
            properties: {
              mandato: { type: "string" },
              reason: { type: "string" },
              suggested_action: { type: "string" },
            },
            required: ["mandato", "reason", "suggested_action"],
          },
          description: "Mandatos en riesgo con razón y acción sugerida",
        },
        recommendations: {
          type: "array",
          items: {
            type: "object",
            properties: {
              mandato: { type: "string" },
              action: { type: "string" },
              priority: { type: "string", enum: ["alta", "media", "baja"] },
            },
            required: ["mandato", "action", "priority"],
          },
          description: "Próximos pasos recomendados por mandato prioritario",
        },
      },
      required: ["executive_summary", "highlights", "risks", "recommendations"],
    };

    let aiResult: { result: any; usage: any; model: string };
    try {
      aiResult = await callAIWithToolCalling(
        systemPrompt, dataContext,
        "generate_executive_report",
        "Genera el reporte ejecutivo semanal estructurado",
        toolSchema
      );
    } catch (e: any) {
      if (e.message === "RATE_LIMIT") {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Intenta más tarde." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (e.message === "CREDITS_EXHAUSTED") {
        return new Response(JSON.stringify({ error: "Créditos de IA agotados." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      throw e;
    }

    const { executive_summary, highlights, risks, recommendations } = aiResult.result;

    // --- Build email HTML ---
    const reportDateStr = now.toLocaleDateString("es-ES", { day: "numeric", month: "long", year: "numeric" });
    const emailHtml = buildEmailHtml({
      reportDate: reportDateStr,
      periodStart: periodStart.toLocaleDateString("es-ES", { day: "numeric", month: "short" }),
      periodEnd: periodEnd.toLocaleDateString("es-ES", { day: "numeric", month: "short" }),
      executiveSummary: executive_summary,
      highlights,
      risks,
      recommendations,
      mandatos,
      totalHours: Math.round(totalHoursWeek),
      meetingsCount: meetings.length,
      tareasCompletadas,
      tareasPendientes,
      upcomingCloses,
    });

    // --- Send email ---
    const emailAddresses = recipients.map((r) => r.email);
    const subject = `📊 Reporte Ejecutivo Semanal | Capittal Partners | ${reportDateStr}`;

    const sendResponse = await fetch(`${supabaseUrl}/functions/v1/send-email`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${supabaseServiceKey}`,
      },
      body: JSON.stringify({
        to: emailAddresses,
        subject,
        html: emailHtml,
        fromName: "Capittal CRM",
        updateQueue: false,
      }),
    });

    const sendResult = await sendResponse.json();
    const emailSent = sendResult.success === true;

    // --- Save report ---
    const metricsSnapshot = {
      mandatos_activos: mandatos.length,
      horas_semana: Math.round(totalHoursWeek),
      reuniones: meetings.length,
      tareas_completadas: tareasCompletadas,
      tareas_pendientes: tareasPendientes,
      mandatos_en_riesgo: mandatosAtRisk.length,
      cierres_proximos: upcomingCloses.length,
    };

    const { data: report, error: insertErr } = await supabase
      .from("executive_reports")
      .insert({
        report_date: now.toISOString().split("T")[0],
        period_start: periodStartISO.split("T")[0],
        period_end: periodEndISO.split("T")[0],
        summary_text: executive_summary,
        metrics_snapshot: metricsSnapshot,
        mandatos_snapshot: mandatos.map((m) => ({
          id: m.id,
          nombre: m.nombre,
          tipo: m.tipo,
          pipeline_stage: m.pipeline_stage,
          probability: m.probability,
          deal_value: m.deal_value,
        })),
        recommendations: { highlights, risks, recommendations },
        recipients: emailAddresses,
        email_sent: emailSent,
        email_sent_at: emailSent ? new Date().toISOString() : null,
        generated_by: userId,
      })
      .select("id")
      .single();

    if (insertErr) console.error("Error saving report:", insertErr);

    // --- Log AI activity ---
    const durationMs = Date.now() - startTime;
    await supabase.from("ai_activity_log").insert({
      module: "executive-report",
      entity_type: "executive_report",
      entity_id: report?.id || null,
      model: aiResult.model,
      input_tokens: aiResult.usage.input_tokens || null,
      output_tokens: aiResult.usage.output_tokens || null,
      duration_ms: durationMs,
      success: true,
      user_id: userId,
    });

    return new Response(
      JSON.stringify({
        success: true,
        report_id: report?.id,
        email_sent: emailSent,
        recipients: emailAddresses.length,
        metrics: metricsSnapshot,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    const error = err as Error;
    console.error("generate-executive-report error:", error);

    // Log failure
    try {
      const supabase = createClient(supabaseUrl, supabaseServiceKey);
      await supabase.from("ai_activity_log").insert({
        module: "executive-report",
        model: CLAUDE_MODEL,
        duration_ms: Date.now() - startTime,
        success: false,
        error_message: error.message,
        user_id: null,
      });
    } catch (_) { /* ignore log error */ }

    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

// --- Helpers ---

function summarizeHoursByMandato(
  entries: any[],
  mandatos: any[]
): string {
  const byMandato: Record<string, number> = {};
  for (const e of entries) {
    const key = e.mandato_id || "sin_mandato";
    byMandato[key] = (byMandato[key] || 0) + (e.hours || 0);
  }
  const mandatoMap = Object.fromEntries(mandatos.map((m) => [m.id, m.nombre]));
  return Object.entries(byMandato)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 10)
    .map(([id, h]) => `  - ${mandatoMap[id] || "General"}: ${Math.round(h)}h`)
    .join("\n");
}

interface EmailData {
  reportDate: string;
  periodStart: string;
  periodEnd: string;
  executiveSummary: string;
  highlights: string[];
  risks: { mandato: string; reason: string; suggested_action: string }[];
  recommendations: { mandato: string; action: string; priority: string }[];
  mandatos: any[];
  totalHours: number;
  meetingsCount: number;
  tareasCompletadas: number;
  tareasPendientes: number;
  upcomingCloses: any[];
}

function buildEmailHtml(data: EmailData): string {
  const priorityColor: Record<string, string> = {
    alta: "#ef4444",
    media: "#f59e0b",
    baja: "#22c55e",
  };

  return `<!DOCTYPE html>
<html lang="es">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>Reporte Ejecutivo Semanal</title></head>
<body style="margin:0;padding:0;background:#f3f4f6;font-family:Arial,Helvetica,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f3f4f6;padding:24px 0;">
<tr><td align="center">
<table width="640" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:8px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">

<!-- Header -->
<tr><td style="background:#1a365d;padding:28px 32px;">
  <h1 style="color:#ffffff;margin:0;font-size:22px;">📊 Reporte Ejecutivo Semanal</h1>
  <p style="color:#a0aec0;margin:6px 0 0;font-size:14px;">Capittal Partners | ${data.reportDate}</p>
  <p style="color:#a0aec0;margin:2px 0 0;font-size:13px;">Periodo: ${data.periodStart} – ${data.periodEnd}</p>
</td></tr>

<!-- Métricas rápidas -->
<tr><td style="padding:24px 32px 0;">
  <table width="100%" cellpadding="0" cellspacing="0">
  <tr>
    <td width="25%" style="text-align:center;padding:12px;background:#edf2f7;border-radius:6px;">
      <div style="font-size:24px;font-weight:bold;color:#1a365d;">${data.mandatos.length}</div>
      <div style="font-size:11px;color:#718096;">Mandatos Activos</div>
    </td>
    <td width="4"></td>
    <td width="25%" style="text-align:center;padding:12px;background:#edf2f7;border-radius:6px;">
      <div style="font-size:24px;font-weight:bold;color:#1a365d;">${data.totalHours}h</div>
      <div style="font-size:11px;color:#718096;">Horas Registradas</div>
    </td>
    <td width="4"></td>
    <td width="25%" style="text-align:center;padding:12px;background:#edf2f7;border-radius:6px;">
      <div style="font-size:24px;font-weight:bold;color:#1a365d;">${data.meetingsCount}</div>
      <div style="font-size:11px;color:#718096;">Reuniones</div>
    </td>
    <td width="4"></td>
    <td width="25%" style="text-align:center;padding:12px;background:#edf2f7;border-radius:6px;">
      <div style="font-size:24px;font-weight:bold;color:#1a365d;">${data.tareasCompletadas}/${data.tareasCompletadas + data.tareasPendientes}</div>
      <div style="font-size:11px;color:#718096;">Tareas Completadas</div>
    </td>
  </tr>
  </table>
</td></tr>

<!-- Resumen ejecutivo -->
<tr><td style="padding:24px 32px;">
  <h2 style="color:#1a365d;font-size:16px;margin:0 0 10px;border-bottom:2px solid #e2e8f0;padding-bottom:6px;">Resumen Ejecutivo</h2>
  <p style="color:#2d3748;font-size:14px;line-height:1.6;margin:0;">${data.executiveSummary.replace(/\n/g, "<br>")}</p>
</td></tr>

<!-- Highlights -->
<tr><td style="padding:0 32px 24px;">
  <h2 style="color:#1a365d;font-size:16px;margin:0 0 10px;border-bottom:2px solid #e2e8f0;padding-bottom:6px;">✅ Logros de la Semana</h2>
  ${data.highlights.map((h) => `<p style="color:#2d3748;font-size:14px;margin:4px 0;padding-left:16px;">• ${h}</p>`).join("")}
</td></tr>

<!-- Pipeline -->
<tr><td style="padding:0 32px 24px;">
  <h2 style="color:#1a365d;font-size:16px;margin:0 0 10px;border-bottom:2px solid #e2e8f0;padding-bottom:6px;">📈 Pipeline Activo</h2>
  <table width="100%" cellpadding="6" cellspacing="0" style="font-size:12px;border-collapse:collapse;">
    <tr style="background:#edf2f7;">
      <th style="text-align:left;padding:8px;color:#4a5568;">Mandato</th>
      <th style="text-align:left;padding:8px;color:#4a5568;">Tipo</th>
      <th style="text-align:center;padding:8px;color:#4a5568;">Prob.</th>
      <th style="text-align:right;padding:8px;color:#4a5568;">Valor</th>
    </tr>
    ${data.mandatos.slice(0, 15).map((m, i) => `
    <tr style="background:${i % 2 === 0 ? "#fff" : "#f7fafc"};border-bottom:1px solid #e2e8f0;">
      <td style="padding:8px;color:#2d3748;">${m.nombre}</td>
      <td style="padding:8px;color:#718096;text-transform:capitalize;">${m.tipo}</td>
      <td style="padding:8px;text-align:center;color:#2d3748;">${m.probability || 0}%</td>
      <td style="padding:8px;text-align:right;color:#2d3748;">€${((m.deal_value || 0) / 1000000).toFixed(1)}M</td>
    </tr>`).join("")}
  </table>
</td></tr>

<!-- Risks -->
${data.risks.length > 0 ? `
<tr><td style="padding:0 32px 24px;">
  <h2 style="color:#ef4444;font-size:16px;margin:0 0 10px;border-bottom:2px solid #fed7d7;padding-bottom:6px;">⚠️ Mandatos en Riesgo</h2>
  ${data.risks.map((r) => `
  <div style="background:#fff5f5;border-left:3px solid #ef4444;padding:10px 14px;margin-bottom:8px;border-radius:0 4px 4px 0;">
    <strong style="color:#c53030;font-size:13px;">${r.mandato}</strong>
    <p style="color:#742a2a;font-size:12px;margin:4px 0;">Razón: ${r.reason}</p>
    <p style="color:#2d3748;font-size:12px;margin:2px 0;">→ ${r.suggested_action}</p>
  </div>`).join("")}
</td></tr>` : ""}

<!-- Recommendations -->
<tr><td style="padding:0 32px 24px;">
  <h2 style="color:#1a365d;font-size:16px;margin:0 0 10px;border-bottom:2px solid #e2e8f0;padding-bottom:6px;">🎯 Próximos Pasos</h2>
  ${data.recommendations.map((r) => `
  <div style="display:flex;align-items:flex-start;margin-bottom:8px;">
    <span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:${priorityColor[r.priority] || "#718096"};margin-top:5px;margin-right:8px;flex-shrink:0;"></span>
    <div>
      <strong style="color:#2d3748;font-size:13px;">${r.mandato}</strong>
      <span style="color:#718096;font-size:11px;margin-left:8px;">[${r.priority}]</span>
      <p style="color:#4a5568;font-size:12px;margin:2px 0 0;">${r.action}</p>
    </div>
  </div>`).join("")}
</td></tr>

<!-- Upcoming closes -->
${data.upcomingCloses.length > 0 ? `
<tr><td style="padding:0 32px 24px;">
  <h2 style="color:#1a365d;font-size:16px;margin:0 0 10px;border-bottom:2px solid #e2e8f0;padding-bottom:6px;">🗓️ Cierres Próximos (30 días)</h2>
  ${data.upcomingCloses.map((m) => `
  <p style="color:#2d3748;font-size:13px;margin:4px 0;">• <strong>${m.nombre}</strong> — ${new Date(m.estimated_close_date).toLocaleDateString("es-ES")} | €${((m.deal_value || 0) / 1000000).toFixed(1)}M</p>`).join("")}
</td></tr>` : ""}

<!-- Footer -->
<tr><td style="background:#1a365d;padding:16px 32px;text-align:center;">
  <p style="color:#a0aec0;font-size:11px;margin:0;">Generado por IA — Capittal Partners CRM</p>
  <p style="color:#718096;font-size:10px;margin:4px 0 0;">Este reporte fue generado automáticamente. Los datos reflejan el estado al momento de la generación.</p>
</td></tr>

</table>
</td></tr>
</table>
</body>
</html>`;
}
