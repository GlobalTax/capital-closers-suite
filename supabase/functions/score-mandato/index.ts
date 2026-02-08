import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    // Auth validation
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const lovableApiKey = Deno.env.get("LOVABLE_API_KEY");

    if (!lovableApiKey) {
      return new Response(JSON.stringify({ error: "LOVABLE_API_KEY not configured" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Verify user auth
    const userClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } },
    });
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: userError } = await userClient.auth.getUser(token);
    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    const userId = user.id;

    const { mandato_id } = await req.json();
    if (!mandato_id) {
      return new Response(JSON.stringify({ error: "mandato_id is required" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const db = createClient(supabaseUrl, supabaseServiceKey);
    const startTime = Date.now();

    // 1. Gather all signals in parallel
    const [
      mandatoRes,
      tareasRes,
      docsRes,
      timeRes,
      targetRes,
    ] = await Promise.all([
      db.from("mandatos").select("*, pipeline_stages(name, default_probability), empresa_principal:empresas!mandatos_empresa_principal_id_fkey(id, nombre)").eq("id", mandato_id).single(),
      db.from("tareas").select("id, status, priority").eq("mandato_id", mandato_id),
      db.from("documentos").select("id, tipo, nombre, created_at").eq("mandato_id", mandato_id),
      db.from("time_entries").select("hours, created_at").eq("mandato_id", mandato_id),
      db.from("mandato_empresas").select("id, role, status").eq("mandato_id", mandato_id),
    ]);

    if (mandatoRes.error || !mandatoRes.data) {
      return new Response(JSON.stringify({ error: "Mandato not found" }), { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const mandato = mandatoRes.data;
    const tareas = tareasRes.data || [];
    const docs = docsRes.data || [];
    const timeEntries = timeRes.data || [];
    const targets = targetRes.data || [];

    // Fetch meetings for the main company
    let meetings: any[] = [];
    if (mandato.empresa_principal_id) {
      const meetingsRes = await db.from("company_meetings").select("id, meeting_date, meeting_type").eq("company_id", mandato.empresa_principal_id).order("meeting_date", { ascending: false }).limit(20);
      meetings = meetingsRes.data || [];
    }

    // Calculate signal metrics
    const now = new Date();
    const daysInStage = mandato.pipeline_stage_changed_at
      ? Math.floor((now.getTime() - new Date(mandato.pipeline_stage_changed_at).getTime()) / 86400000)
      : null;
    const daysSinceActivity = mandato.last_activity_at
      ? Math.floor((now.getTime() - new Date(mandato.last_activity_at).getTime()) / 86400000)
      : null;
    const totalHours = timeEntries.reduce((sum: number, e: any) => sum + (e.hours || 0), 0);
    const recentMeetings = meetings.filter((m: any) => {
      const d = new Date(m.meeting_date);
      return (now.getTime() - d.getTime()) < 30 * 86400000;
    });
    const tareasCompleted = tareas.filter((t: any) => t.status === "completada").length;
    const tareasPending = tareas.filter((t: any) => t.status !== "completada" && t.status !== "cancelada").length;
    const targetsActive = targets.filter((t: any) => t.role === "target").length;

    // Build signals snapshot
    const signals = {
      pipeline_stage: mandato.pipeline_stages?.name || "Sin etapa",
      default_probability: mandato.pipeline_stages?.default_probability || 0,
      days_in_stage: daysInStage,
      days_since_activity: daysSinceActivity,
      meetings_last_30_days: recentMeetings.length,
      total_meetings: meetings.length,
      tasks_completed: tareasCompleted,
      tasks_pending: tareasPending,
      total_tasks: tareas.length,
      documents_count: docs.length,
      document_types: [...new Set(docs.map((d: any) => d.tipo).filter(Boolean))],
      total_hours: Math.round(totalHours * 10) / 10,
      valor: mandato.valor,
      tipo: mandato.tipo,
      categoria: mandato.categoria,
      ofertas_recibidas: mandato.numero_ofertas_recibidas || 0,
      targets_count: targetsActive,
      empresa: mandato.empresa_principal?.nombre || "Sin empresa",
      current_probability: mandato.probability,
    };

    // 2. Call AI with tool calling
    const systemPrompt = `Eres un analista senior de M&A con 20 años de experiencia evaluando probabilidades de cierre de operaciones corporativas. Analiza los datos factuales del mandato y evalúa la probabilidad de cierre.

Criterios de evaluación:
- La probabilidad base viene de la etapa del pipeline (default_probability)
- Más de 30 días en la misma etapa sin avance es señal de estancamiento
- Más de 14 días sin actividad es riesgo significativo
- Reuniones recientes indican momentum positivo
- Documentación avanzada (NDA, Due Diligence) indica progreso real
- Muchas horas invertidas reflejan compromiso
- Ofertas recibidas (en venta) son señal muy positiva
- Targets vinculados (en compra) indican progreso en búsqueda

Responde SIEMPRE en español. Sé conciso y específico en el razonamiento.`;

    const userPrompt = `Evalúa la probabilidad de cierre de este mandato:

DATOS DEL MANDATO:
- Empresa: ${signals.empresa}
- Tipo: ${signals.tipo} | Categoría: ${signals.categoria}
- Etapa actual: ${signals.pipeline_stage} (probabilidad base: ${signals.default_probability}%)
- Días en etapa actual: ${signals.days_in_stage ?? "No disponible"}
- Días sin actividad: ${signals.days_since_activity ?? "No disponible"}
- Valor del mandato: ${signals.valor ? `€${signals.valor.toLocaleString()}` : "No definido"}
- Probabilidad actual asignada: ${signals.current_probability ?? "Sin asignar"}%

ACTIVIDAD:
- Reuniones últimos 30 días: ${signals.meetings_last_30_days} (total: ${signals.total_meetings})
- Tareas completadas: ${signals.tasks_completed} | Pendientes: ${signals.tasks_pending}
- Documentos adjuntos: ${signals.documents_count} (tipos: ${signals.document_types.join(", ") || "ninguno"})
- Horas invertidas: ${signals.total_hours}h

SEÑALES DE MERCADO:
- Ofertas recibidas: ${signals.ofertas_recibidas}
- Targets vinculados: ${signals.targets_count}

Evalúa la probabilidad de cierre usando la herramienta evaluate_mandate_probability.`;

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${lovableApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "evaluate_mandate_probability",
              description: "Evalúa la probabilidad de cierre de un mandato M&A basándose en señales de actividad",
              parameters: {
                type: "object",
                properties: {
                  probability: { type: "integer", description: "Probabilidad de cierre 0-100", minimum: 0, maximum: 100 },
                  confidence: { type: "number", description: "Confianza del modelo 0-1", minimum: 0, maximum: 1 },
                  reasoning: { type: "string", description: "Explicación concisa del razonamiento en español" },
                  risk_factors: { type: "array", items: { type: "string" }, description: "Factores de riesgo identificados" },
                  positive_signals: { type: "array", items: { type: "string" }, description: "Señales positivas identificadas" },
                  recommendations: { type: "array", items: { type: "string" }, description: "Acciones recomendadas para mejorar probabilidad" },
                },
                required: ["probability", "confidence", "reasoning", "risk_factors", "positive_signals", "recommendations"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "evaluate_mandate_probability" } },
        temperature: 0.3,
      }),
    });

    if (!aiResponse.ok) {
      const status = aiResponse.status;
      const errText = await aiResponse.text();
      console.error("AI gateway error:", status, errText);
      if (status === 429) {
        return new Response(JSON.stringify({ error: "Límite de peticiones excedido. Intenta de nuevo en unos minutos." }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
      if (status === 402) {
        return new Response(JSON.stringify({ error: "Créditos de IA agotados. Contacta al administrador." }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
      return new Response(JSON.stringify({ error: "Error al contactar servicio de IA" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const aiData = await aiResponse.json();
    const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall?.function?.arguments) {
      console.error("No tool call in AI response:", JSON.stringify(aiData));
      return new Response(JSON.stringify({ error: "La IA no devolvió una evaluación válida" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const scoring = JSON.parse(toolCall.function.arguments);
    const newProbability = Math.max(0, Math.min(100, Math.round(scoring.probability)));
    const previousProbability = mandato.probability;

    // 3. Update mandato probability
    await db.from("mandatos").update({ probability: newProbability }).eq("id", mandato_id);

    // 4. Insert scoring history
    await db.from("mandato_scoring_history").insert({
      mandato_id,
      previous_probability: previousProbability,
      new_probability: newProbability,
      ai_confidence: scoring.confidence,
      reasoning: scoring.reasoning,
      risk_factors: scoring.risk_factors,
      positive_signals: scoring.positive_signals,
      recommendations: scoring.recommendations,
      signals_snapshot: signals,
      scored_by: userId,
    });

    // 5. Log in ai_activity_log
    const durationMs = Date.now() - startTime;
    await db.from("ai_activity_log").insert({
      module: "mandato-scoring",
      entity_type: "mandato",
      entity_id: mandato_id,
      user_id: userId,
      success: true,
      model: "google/gemini-3-flash-preview",
      duration_ms: durationMs,
      input_tokens: aiData.usage?.prompt_tokens || null,
      output_tokens: aiData.usage?.completion_tokens || null,
    });

    return new Response(
      JSON.stringify({
        probability: newProbability,
        previous_probability: previousProbability,
        confidence: scoring.confidence,
        reasoning: scoring.reasoning,
        risk_factors: scoring.risk_factors,
        positive_signals: scoring.positive_signals,
        recommendations: scoring.recommendations,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("score-mandato error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
