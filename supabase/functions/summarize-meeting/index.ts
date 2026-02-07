import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

async function validateAdminAuth(req: Request) {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return new Response(
      JSON.stringify({ error: "No autorizado: token requerido" }),
      { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

  const supabase = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: authHeader } },
  });
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) {
    return new Response(
      JSON.stringify({ error: "No autorizado: token inválido" }),
      { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  const adminClient = createClient(supabaseUrl, serviceRoleKey);
  const { data: admin } = await adminClient
    .from("admin_users").select("role")
    .eq("user_id", user.id).eq("is_active", true).single();

  if (!admin || !["admin", "super_admin"].includes(admin.role)) {
    return new Response(
      JSON.stringify({ error: "Permisos insuficientes" }),
      { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  return { userId: user.id, role: admin.role };
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const authResult = await validateAdminAuth(req);
  if (authResult instanceof Response) return authResult;

  try {
    const { meeting_id } = await req.json();
    if (!meeting_id) {
      return new Response(JSON.stringify({ error: "meeting_id requerido" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const supabase = createClient(supabaseUrl, serviceRoleKey);

    // Fetch meeting + company name
    const { data: meeting, error: meetingErr } = await supabase
      .from("company_meetings")
      .select("*, empresas:company_id(nombre, sector)")
      .eq("id", meeting_id)
      .single();

    if (meetingErr || !meeting) {
      return new Response(JSON.stringify({ error: "Reunión no encontrada" }), {
        status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!meeting.meeting_notes && !meeting.preparation_notes) {
      return new Response(JSON.stringify({ error: "La reunión no tiene notas para resumir" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const empresaNombre = (meeting as any).empresas?.nombre || "Empresa";
    const sector = (meeting as any).empresas?.sector || "";
    const startTime = Date.now();

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "openai/gpt-5-mini",
        messages: [
          {
            role: "system",
            content: `Eres un analista senior de M&A en Capittal Partners. Analiza las notas de una reunión y extrae información estructurada. Responde siempre en español profesional. Sé conciso y accionable.`,
          },
          {
            role: "user",
            content: `Reunión: ${meeting.title}
Fecha: ${meeting.meeting_date}
Empresa: ${empresaNombre}
Sector: ${sector}

Notas de preparación:
${meeting.preparation_notes || "(Sin notas de preparación)"}

Notas de la reunión:
${meeting.meeting_notes || "(Sin notas de la reunión)"}

Analiza estas notas y extrae la información estructurada.`,
          },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "summarize_meeting",
              description: "Extrae un resumen estructurado de la reunión",
              parameters: {
                type: "object",
                properties: {
                  summary: {
                    type: "string",
                    description: "Resumen ejecutivo de la reunión en 3-5 frases",
                  },
                  key_points: {
                    type: "array",
                    items: { type: "string" },
                    description: "Lista de 3-7 puntos clave discutidos",
                  },
                  action_items: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        title: { type: "string", description: "Descripción de la acción" },
                        responsible: { type: "string", description: "Persona responsable si se menciona" },
                        deadline: { type: "string", description: "Fecha límite si se menciona" },
                      },
                      required: ["title"],
                      additionalProperties: false,
                    },
                    description: "Acciones pendientes identificadas",
                  },
                  key_quotes: {
                    type: "array",
                    items: { type: "string" },
                    description: "Citas o frases destacadas de la reunión (máximo 3)",
                  },
                },
                required: ["summary", "key_points", "action_items", "key_quotes"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "summarize_meeting" } },
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Límite de peticiones excedido. Inténtalo de nuevo en unos minutos." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Créditos de IA agotados. Añade créditos en la configuración del workspace." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errText = await response.text();
      console.error("AI Gateway error:", response.status, errText);
      throw new Error(`AI Gateway error: ${response.status}`);
    }

    const aiResult = await response.json();
    const toolCall = aiResult.choices?.[0]?.message?.tool_calls?.[0];

    if (!toolCall?.function?.arguments) {
      throw new Error("No tool call in AI response");
    }

    const parsed = JSON.parse(toolCall.function.arguments);
    const durationMs = Date.now() - startTime;
    const usage = aiResult.usage;

    // Save to DB
    const { error: updateErr } = await supabase
      .from("company_meetings")
      .update({
        ai_summary: parsed.summary,
        ai_action_items: parsed.action_items,
        ai_key_quotes: parsed.key_quotes,
        ai_processed_at: new Date().toISOString(),
      })
      .eq("id", meeting_id);

    if (updateErr) {
      console.error("Update error:", updateErr);
      throw new Error("Error al guardar resumen");
    }

    // Log AI usage
    await supabase.from("ai_activity_log").insert({
      module: "meeting_summary",
      entity_type: "company_meeting",
      entity_id: meeting_id,
      model: "gpt-5-mini",
      success: true,
      duration_ms: durationMs,
      input_tokens: usage?.prompt_tokens || null,
      output_tokens: usage?.completion_tokens || null,
      estimated_cost_usd: usage ? (usage.prompt_tokens * 0.0004 + usage.completion_tokens * 0.0016) / 1000 : null,
      user_id: authResult.userId,
    });

    return new Response(
      JSON.stringify({
        success: true,
        summary: parsed.summary,
        key_points: parsed.key_points,
        action_items: parsed.action_items,
        key_quotes: parsed.key_quotes,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("summarize-meeting error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Error desconocido" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
