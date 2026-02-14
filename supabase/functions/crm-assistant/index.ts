import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const CLAUDE_MODEL = "claude-sonnet-4-20250514";

const SYSTEM_PROMPT = `Eres el asistente de IA de Capittal Partners CRM. Ayudas a los usuarios a consultar datos del CRM usando lenguaje natural en español. Tienes acceso a herramientas para buscar empresas, contactos, mandatos y tareas. Responde siempre en español, de forma concisa y profesional. Usa tablas markdown cuando presentes múltiples resultados. Cuando no encuentres datos, sugiere al usuario refinar su búsqueda. No inventes datos, solo usa los resultados de las herramientas.`;

// OpenAI-format tools (for fallback)
const openaiTools = [
  {
    type: "function",
    function: {
      name: "search_empresas",
      description: "Buscar empresas en el CRM por nombre, sector, ubicación, facturación o número de empleados.",
      parameters: {
        type: "object",
        properties: {
          nombre: { type: "string", description: "Nombre parcial de la empresa" },
          sector: { type: "string", description: "Sector de la empresa" },
          ubicacion: { type: "string", description: "Ubicación de la empresa" },
          min_facturacion: { type: "number", description: "Facturación mínima en euros" },
          max_facturacion: { type: "number", description: "Facturación máxima en euros" },
          min_empleados: { type: "number", description: "Número mínimo de empleados" },
          es_target: { type: "boolean", description: "Si es empresa target" },
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "search_contactos",
      description: "Buscar contactos en el CRM por nombre, email, cargo o empresa asociada.",
      parameters: {
        type: "object",
        properties: {
          nombre: { type: "string", description: "Nombre o apellidos del contacto" },
          email: { type: "string", description: "Email del contacto" },
          cargo: { type: "string", description: "Cargo del contacto" },
          empresa: { type: "string", description: "Nombre de la empresa del contacto" },
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "search_mandatos",
      description: "Buscar mandatos (operaciones M&A) por estado, tipo, categoría o empresa asociada.",
      parameters: {
        type: "object",
        properties: {
          estado: { type: "string", description: "Estado del mandato (activo, completado, cancelado, en_pausa, propuesta)" },
          tipo: { type: "string", description: "Tipo de mandato (venta, compra, fundraising, valoracion)" },
          categoria: { type: "string", description: "Categoría del mandato" },
          empresa: { type: "string", description: "Nombre de la empresa del mandato" },
          nombre_proyecto: { type: "string", description: "Nombre del proyecto" },
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_tareas_pendientes",
      description: "Obtener tareas pendientes, opcionalmente filtradas por prioridad o fecha de vencimiento.",
      parameters: {
        type: "object",
        properties: {
          prioridad: { type: "string", description: "Filtrar por prioridad (alta, media, baja)" },
          vencidas: { type: "boolean", description: "Solo tareas vencidas (fecha_vencimiento < hoy)" },
          hoy: { type: "boolean", description: "Solo tareas que vencen hoy" },
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_stats_resumen",
      description: "Obtener métricas generales del CRM: total empresas, mandatos activos, tareas pendientes, contactos.",
      parameters: { type: "object", properties: {} },
    },
  },
  {
    type: "function",
    function: {
      name: "get_empresa_detalle",
      description: "Obtener detalle completo de una empresa por nombre exacto o parcial, incluyendo contactos y mandatos asociados.",
      parameters: {
        type: "object",
        properties: {
          nombre: { type: "string", description: "Nombre de la empresa a buscar" },
        },
        required: ["nombre"],
      },
    },
  },
];

// Anthropic-format tools
const anthropicTools = openaiTools.map((t) => ({
  name: t.function.name,
  description: t.function.description,
  input_schema: t.function.parameters,
}));

// ── Tool execution ──
async function executeTool(supabaseAdmin: any, name: string, args: any): Promise<string> {
  try {
    switch (name) {
      case "search_empresas": {
        let q = supabaseAdmin.from("empresas").select("id, nombre, sector, subsector, ubicacion, facturacion, ebitda, empleados, es_target, sitio_web, descripcion").limit(50);
        if (args.nombre) q = q.ilike("nombre", `%${args.nombre}%`);
        if (args.sector) q = q.ilike("sector", `%${args.sector}%`);
        if (args.ubicacion) q = q.ilike("ubicacion", `%${args.ubicacion}%`);
        if (args.min_facturacion) q = q.gte("facturacion", args.min_facturacion);
        if (args.max_facturacion) q = q.lte("facturacion", args.max_facturacion);
        if (args.min_empleados) q = q.gte("empleados", args.min_empleados);
        if (typeof args.es_target === "boolean") q = q.eq("es_target", args.es_target);
        const { data, error } = await q;
        if (error) return JSON.stringify({ error: error.message });
        return JSON.stringify({ count: data.length, empresas: data });
      }
      case "search_contactos": {
        let q = supabaseAdmin.from("contactos").select("id, nombre, apellidos, email, cargo, telefono, empresa_principal_id, empresas:empresa_principal_id(nombre)").limit(50);
        if (args.nombre) q = q.or(`nombre.ilike.%${args.nombre}%,apellidos.ilike.%${args.nombre}%`);
        if (args.email) q = q.ilike("email", `%${args.email}%`);
        if (args.cargo) q = q.ilike("cargo", `%${args.cargo}%`);
        const { data, error } = await q;
        if (error) return JSON.stringify({ error: error.message });
        let results = data || [];
        if (args.empresa && results.length > 0) {
          const term = args.empresa.toLowerCase();
          results = results.filter((c: any) => c.empresas?.nombre?.toLowerCase().includes(term));
        }
        return JSON.stringify({ count: results.length, contactos: results });
      }
      case "search_mandatos": {
        let q = supabaseAdmin.from("mandatos").select("id, nombre_proyecto, tipo, categoria, estado, valor, fecha_inicio, fecha_cierre, prioridad, empresa_principal_id, empresas:empresa_principal_id(nombre)").limit(50);
        if (args.estado) q = q.eq("estado", args.estado);
        if (args.tipo) q = q.eq("tipo", args.tipo);
        if (args.categoria) q = q.ilike("categoria", `%${args.categoria}%`);
        if (args.nombre_proyecto) q = q.ilike("nombre_proyecto", `%${args.nombre_proyecto}%`);
        const { data, error } = await q;
        if (error) return JSON.stringify({ error: error.message });
        let results = data || [];
        if (args.empresa && results.length > 0) {
          const term = args.empresa.toLowerCase();
          results = results.filter((m: any) => m.empresas?.nombre?.toLowerCase().includes(term));
        }
        return JSON.stringify({ count: results.length, mandatos: results });
      }
      case "get_tareas_pendientes": {
        const today = new Date().toISOString().split("T")[0];
        let q = supabaseAdmin.from("tareas").select("id, titulo, descripcion, estado, prioridad, fecha_vencimiento, tipo, asignado_a, mandato_id").in("estado", ["pendiente", "en_progreso"]).order("fecha_vencimiento", { ascending: true, nullsFirst: false }).limit(50);
        if (args.prioridad) q = q.eq("prioridad", args.prioridad);
        if (args.vencidas) q = q.lt("fecha_vencimiento", today);
        if (args.hoy) q = q.eq("fecha_vencimiento", today);
        const { data, error } = await q;
        if (error) return JSON.stringify({ error: error.message });
        return JSON.stringify({ count: data?.length ?? 0, tareas: data });
      }
      case "get_stats_resumen": {
        const [empresas, mandatosActivos, tareasPend, contactos] = await Promise.all([
          supabaseAdmin.from("empresas").select("id", { count: "exact", head: true }),
          supabaseAdmin.from("mandatos").select("id", { count: "exact", head: true }).eq("estado", "activo"),
          supabaseAdmin.from("tareas").select("id", { count: "exact", head: true }).in("estado", ["pendiente", "en_progreso"]),
          supabaseAdmin.from("contactos").select("id", { count: "exact", head: true }),
        ]);
        return JSON.stringify({
          total_empresas: empresas.count ?? 0,
          mandatos_activos: mandatosActivos.count ?? 0,
          tareas_pendientes: tareasPend.count ?? 0,
          total_contactos: contactos.count ?? 0,
        });
      }
      case "get_empresa_detalle": {
        const { data: empresas, error } = await supabaseAdmin.from("empresas").select("id, nombre, sector, subsector, ubicacion, facturacion, ebitda, empleados, es_target, sitio_web, descripcion, cif").ilike("nombre", `%${args.nombre}%`).limit(1);
        if (error) return JSON.stringify({ error: error.message });
        if (!empresas || empresas.length === 0) return JSON.stringify({ error: "Empresa no encontrada" });
        const empresa = empresas[0];
        const [contactosRes, mandatosRes] = await Promise.all([
          supabaseAdmin.from("contactos").select("id, nombre, apellidos, email, cargo, telefono").eq("empresa_principal_id", empresa.id).limit(20),
          supabaseAdmin.from("mandatos").select("id, nombre_proyecto, tipo, estado, valor, fecha_inicio").eq("empresa_principal_id", empresa.id).limit(20),
        ]);
        return JSON.stringify({ empresa, contactos: contactosRes.data ?? [], mandatos: mandatosRes.data ?? [] });
      }
      default:
        return JSON.stringify({ error: `Tool ${name} not found` });
    }
  } catch (e) {
    return JSON.stringify({ error: e instanceof Error ? e.message : "Unknown tool error" });
  }
}

// ── Transform Anthropic SSE stream to OpenAI SSE format ──
function transformAnthropicStreamToOpenAI(anthropicBody: ReadableStream<Uint8Array>): ReadableStream<Uint8Array> {
  const reader = anthropicBody.getReader();
  const decoder = new TextDecoder();
  const encoder = new TextEncoder();
  let buffer = "";

  return new ReadableStream({
    async pull(controller) {
      while (true) {
        const { done, value } = await reader.read();
        if (done) {
          // Flush remaining
          if (buffer.trim()) {
            processLines(buffer, controller, encoder);
          }
          controller.enqueue(encoder.encode("data: [DONE]\n\n"));
          controller.close();
          return;
        }

        buffer += decoder.decode(value, { stream: true });
        let idx: number;
        while ((idx = buffer.indexOf("\n")) !== -1) {
          const line = buffer.slice(0, idx).trim();
          buffer = buffer.slice(idx + 1);
          if (!line || line.startsWith("event:")) continue;
          if (!line.startsWith("data: ")) continue;
          const jsonStr = line.slice(6);
          try {
            const parsed = JSON.parse(jsonStr);
            if (parsed.type === "content_block_delta" && parsed.delta?.type === "text_delta" && parsed.delta.text) {
              const openaiChunk = JSON.stringify({
                choices: [{ delta: { content: parsed.delta.text }, index: 0, finish_reason: null }],
              });
              controller.enqueue(encoder.encode(`data: ${openaiChunk}\n\n`));
            } else if (parsed.type === "message_stop") {
              // Will be handled by [DONE] above
            }
          } catch {
            // ignore partial JSON
          }
        }
      }
    },
    cancel() {
      reader.cancel();
    },
  });
}

function processLines(text: string, controller: ReadableStreamDefaultController, encoder: TextEncoder) {
  for (const raw of text.split("\n")) {
    const line = raw.trim();
    if (!line || line.startsWith("event:") || !line.startsWith("data: ")) continue;
    try {
      const parsed = JSON.parse(line.slice(6));
      if (parsed.type === "content_block_delta" && parsed.delta?.text) {
        const chunk = JSON.stringify({ choices: [{ delta: { content: parsed.delta.text }, index: 0, finish_reason: null }] });
        controller.enqueue(encoder.encode(`data: ${chunk}\n\n`));
      }
    } catch { /* ignore */ }
  }
}

// ── Anthropic non-streaming call ──
async function callAnthropicNonStreaming(messages: any[], supabaseAdmin: any): Promise<{ toolCalls: any[] | null; textContent: string | null; usage: any }> {
  const ANTHROPIC_API_KEY = Deno.env.get("ANTHROPIC_API_KEY")!;
  
  // Convert messages: extract system, convert tool role messages to Anthropic format
  const anthropicMessages: any[] = [];
  for (const msg of messages) {
    if (msg.role === "system") continue; // handled separately
    if (msg.role === "tool") {
      // Anthropic expects tool results as user messages with tool_result content
      anthropicMessages.push({
        role: "user",
        content: [{ type: "tool_result", tool_use_id: msg.tool_call_id, content: msg.content }],
      });
    } else if (msg.role === "assistant" && msg.tool_calls) {
      // Convert OpenAI assistant tool_calls to Anthropic format
      const content: any[] = [];
      if (msg.content) content.push({ type: "text", text: msg.content });
      for (const tc of msg.tool_calls) {
        content.push({
          type: "tool_use",
          id: tc.id,
          name: tc.function.name,
          input: JSON.parse(tc.function.arguments || "{}"),
        });
      }
      anthropicMessages.push({ role: "assistant", content });
    } else {
      anthropicMessages.push({ role: msg.role, content: msg.content });
    }
  }

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
      system: SYSTEM_PROMPT,
      messages: anthropicMessages,
      tools: anthropicTools,
      temperature: 0.3,
    }),
  });

  if (!resp.ok) {
    const text = await resp.text();
    throw new Error(`ANTHROPIC_ERROR:${resp.status}:${text}`);
  }

  const data = await resp.json();
  const toolUses = data.content?.filter((b: any) => b.type === "tool_use") || [];
  const textBlocks = data.content?.filter((b: any) => b.type === "text").map((b: any) => b.text).join("") || null;

  if (toolUses.length > 0) {
    return { toolCalls: toolUses, textContent: textBlocks, usage: data.usage || {} };
  }
  return { toolCalls: null, textContent: textBlocks, usage: data.usage || {} };
}

// ── Anthropic streaming call ──
async function callAnthropicStreaming(messages: any[]): Promise<ReadableStream<Uint8Array>> {
  const ANTHROPIC_API_KEY = Deno.env.get("ANTHROPIC_API_KEY")!;
  
  const anthropicMessages: any[] = [];
  for (const msg of messages) {
    if (msg.role === "system") continue;
    if (msg.role === "tool") {
      anthropicMessages.push({
        role: "user",
        content: [{ type: "tool_result", tool_use_id: msg.tool_call_id, content: msg.content }],
      });
    } else if (msg.role === "assistant" && msg.tool_calls) {
      const content: any[] = [];
      if (msg.content) content.push({ type: "text", text: msg.content });
      for (const tc of msg.tool_calls) {
        content.push({
          type: "tool_use",
          id: tc.id,
          name: tc.function.name,
          input: JSON.parse(tc.function.arguments || "{}"),
        });
      }
      anthropicMessages.push({ role: "assistant", content });
    } else {
      anthropicMessages.push({ role: msg.role, content: msg.content });
    }
  }

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
      system: SYSTEM_PROMPT,
      messages: anthropicMessages,
      temperature: 0.3,
      stream: true,
    }),
  });

  if (!resp.ok) {
    const text = await resp.text();
    throw new Error(`ANTHROPIC_STREAM_ERROR:${resp.status}:${text}`);
  }

  return transformAnthropicStreamToOpenAI(resp.body!);
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const startTime = Date.now();
  let inputTokens = 0;
  let outputTokens = 0;

  try {
    // Auth
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const ANTHROPIC_API_KEY = Deno.env.get("ANTHROPIC_API_KEY");
    const lovableApiKey = Deno.env.get("LOVABLE_API_KEY");

    if (!ANTHROPIC_API_KEY && !lovableApiKey) throw new Error("No AI API key configured");

    const userClient = createClient(supabaseUrl, supabaseAnonKey, { global: { headers: { Authorization: authHeader } } });
    const { data: { user }, error: authError } = await userClient.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const { messages } = await req.json();
    if (!messages || !Array.isArray(messages)) {
      return new Response(JSON.stringify({ error: "messages array required" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
    const allMessages = [{ role: "system", content: SYSTEM_PROMPT }, ...messages];

    // ── Try Anthropic path ──
    if (ANTHROPIC_API_KEY) {
      try {
        // Step 1: Non-streaming to resolve tool calls
        const firstCall = await callAnthropicNonStreaming(allMessages, supabaseAdmin);
        inputTokens += firstCall.usage.input_tokens ?? 0;
        outputTokens += firstCall.usage.output_tokens ?? 0;

        if (!firstCall.toolCalls) {
          // No tools needed — stream final answer
          const stream = await callAnthropicStreaming(allMessages);
          logActivity(supabaseAdmin, user.id, startTime, inputTokens, outputTokens, true, CLAUDE_MODEL);
          return new Response(stream, { headers: { ...corsHeaders, "Content-Type": "text/event-stream" } });
        }

        // Step 2: Execute tool calls
        const assistantContent: any[] = [];
        if (firstCall.textContent) assistantContent.push({ type: "text", text: firstCall.textContent });
        for (const tc of firstCall.toolCalls) {
          assistantContent.push({ type: "tool_use", id: tc.id, name: tc.name, input: tc.input });
        }

        const toolResultMessages: any[] = [
          ...allMessages,
          { role: "assistant", content: assistantContent },
        ];

        // Execute each tool and add results
        for (const tc of firstCall.toolCalls) {
          const result = await executeTool(supabaseAdmin, tc.name, tc.input);
          toolResultMessages.push({
            role: "tool",
            tool_call_id: tc.id,
            content: result,
          });
        }

        // Step 3: Stream final response with tool results
        const stream = await callAnthropicStreaming(toolResultMessages);
        logActivity(supabaseAdmin, user.id, startTime, inputTokens, outputTokens, true, CLAUDE_MODEL);
        return new Response(stream, { headers: { ...corsHeaders, "Content-Type": "text/event-stream" } });

      } catch (e: any) {
        console.error("Anthropic path failed, trying fallback:", e.message);
        // Fall through to Lovable Gateway fallback
      }
    }

    // ── Fallback: Lovable AI Gateway (original logic) ──
    if (!lovableApiKey) throw new Error("No fallback AI key configured");

    const toolResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${lovableApiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({ model: "google/gemini-3-flash-preview", messages: allMessages, tools: openaiTools, temperature: 0.3, stream: false }),
    });

    if (!toolResponse.ok) {
      const status = toolResponse.status;
      if (status === 429) return new Response(JSON.stringify({ error: "Límite de solicitudes excedido." }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      if (status === 402) return new Response(JSON.stringify({ error: "Créditos de IA agotados." }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      return new Response(JSON.stringify({ error: "Error del servicio de IA" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const toolResult = await toolResponse.json();
    const assistantMsg = toolResult.choices?.[0]?.message;
    inputTokens += toolResult.usage?.prompt_tokens ?? 0;
    outputTokens += toolResult.usage?.completion_tokens ?? 0;

    if (!assistantMsg?.tool_calls || assistantMsg.tool_calls.length === 0) {
      const streamResp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: { Authorization: `Bearer ${lovableApiKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({ model: "google/gemini-3-flash-preview", messages: allMessages, temperature: 0.3, stream: true }),
      });
      if (!streamResp.ok) return new Response(JSON.stringify({ error: "Error de streaming" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      logActivity(supabaseAdmin, user.id, startTime, inputTokens, outputTokens, true, "google/gemini-3-flash-preview");
      return new Response(streamResp.body, { headers: { ...corsHeaders, "Content-Type": "text/event-stream" } });
    }

    const toolMessages: any[] = [...allMessages, assistantMsg];
    for (const tc of assistantMsg.tool_calls) {
      const args = JSON.parse(tc.function.arguments || "{}");
      const result = await executeTool(supabaseAdmin, tc.function.name, args);
      toolMessages.push({ role: "tool", tool_call_id: tc.id, content: result });
    }

    const finalResp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${lovableApiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({ model: "google/gemini-3-flash-preview", messages: toolMessages, temperature: 0.3, stream: true }),
    });
    if (!finalResp.ok) return new Response(JSON.stringify({ error: "Error de streaming" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    logActivity(supabaseAdmin, user.id, startTime, inputTokens, outputTokens, true, "google/gemini-3-flash-preview");
    return new Response(finalResp.body, { headers: { ...corsHeaders, "Content-Type": "text/event-stream" } });

  } catch (e) {
    console.error("crm-assistant error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Error interno" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

async function logActivity(supabaseAdmin: any, userId: string, startTime: number, inputTokens: number, outputTokens: number, success: boolean, model: string, errorMsg?: string) {
  try {
    await supabaseAdmin.from("ai_activity_log").insert({
      module: "crm-assistant",
      model,
      user_id: userId,
      input_tokens: inputTokens,
      output_tokens: outputTokens,
      duration_ms: Date.now() - startTime,
      success,
      error_message: errorMsg || null,
      estimated_cost_usd: model.includes("claude") 
        ? ((inputTokens * 0.000003) + (outputTokens * 0.000015))
        : ((inputTokens * 0.00001) + (outputTokens * 0.00004)),
    });
  } catch (e) {
    console.error("Failed to log activity:", e);
  }
}
