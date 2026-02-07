import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

  // Auth: SERVICE_ROLE_KEY or admin
  const authHeader = req.headers.get("Authorization");
  const token = authHeader?.replace("Bearer ", "") || "";
  if (token !== serviceRoleKey) {
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader || "" } },
    });
    const { data: { user }, error: userErr } = await userClient.auth.getUser();
    if (userErr || !user) {
      return new Response(JSON.stringify({ error: "No autorizado" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const adminClient = createClient(supabaseUrl, serviceRoleKey);
    const { data: admin } = await adminClient
      .from("admin_users").select("role")
      .eq("user_id", user.id).eq("is_active", true).single();
    if (!admin || !["admin", "super_admin"].includes(admin.role)) {
      return new Response(JSON.stringify({ error: "Permisos insuficientes" }), {
        status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
  }

  try {
    const { alert_id } = await req.json();
    if (!alert_id) {
      return new Response(JSON.stringify({ error: "alert_id requerido" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey);
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    // Fetch alert with context
    const { data: alert, error: alertErr } = await supabase
      .from("mandato_alerts")
      .select("*")
      .eq("id", alert_id)
      .single();

    if (alertErr || !alert) {
      return new Response(JSON.stringify({ error: "Alerta no encontrada" }), {
        status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get mandato context
    const { data: mandato } = await supabase
      .from("mandatos")
      .select("tipo, estado, empresa_id, empresas(nombre, sector)")
      .eq("id", alert.mandato_id)
      .single();

    const empresaNombre = (mandato as any)?.empresas?.nombre || "Empresa desconocida";
    const sector = (mandato as any)?.empresas?.sector || "";

    const startTime = Date.now();

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "openai/gpt-5-nano",
        messages: [
          {
            role: "system",
            content: `Eres un asistente de M&A para Capittal Partners. Genera un mensaje contextual y accionable en español para una alerta del CRM. El mensaje debe ser conciso (2-3 frases máximo), profesional y sugerir una acción concreta.`,
          },
          {
            role: "user",
            content: `Alerta: ${alert.title}
Tipo: ${alert.alert_type}
Severidad: ${alert.severity}
Empresa: ${empresaNombre}
Sector: ${sector}
Mandato tipo: ${mandato?.tipo || "N/A"}
Estado mandato: ${mandato?.estado || "N/A"}
Metadata: ${JSON.stringify(alert.metadata || {})}

Genera un mensaje contextual breve y accionable.`,
          },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "enhance_alert",
              description: "Genera un mensaje contextual para la alerta",
              parameters: {
                type: "object",
                properties: {
                  message: {
                    type: "string",
                    description: "Mensaje contextual en español, 2-3 frases con acción sugerida",
                  },
                },
                required: ["message"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "enhance_alert" } },
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("AI Gateway error:", response.status, errText);
      throw new Error(`AI Gateway error: ${response.status}`);
    }

    const aiResult = await response.json();
    const toolCall = aiResult.choices?.[0]?.message?.tool_calls?.[0];
    let enhancedMessage = alert.title;

    if (toolCall?.function?.arguments) {
      try {
        const args = JSON.parse(toolCall.function.arguments);
        enhancedMessage = args.message || alert.title;
      } catch {
        console.warn("Failed to parse tool call arguments");
      }
    }

    // Update alert description
    const { error: updateErr } = await supabase
      .from("mandato_alerts")
      .update({ description: enhancedMessage })
      .eq("id", alert_id);

    if (updateErr) console.error("Update error:", updateErr);

    const durationMs = Date.now() - startTime;
    const usage = aiResult.usage;

    // Log AI usage
    await supabase.from("ai_activity_log").insert({
      module: "alerts",
      entity_type: "mandato_alert",
      entity_id: alert_id,
      model: "gpt-5-nano",
      success: true,
      duration_ms: durationMs,
      input_tokens: usage?.prompt_tokens || null,
      output_tokens: usage?.completion_tokens || null,
      estimated_cost_usd: usage ? (usage.prompt_tokens * 0.0001 + usage.completion_tokens * 0.0004) / 1000 : null,
    });

    return new Response(
      JSON.stringify({ success: true, message: enhancedMessage }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("enhance-alert-message error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
