import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SUPABASE_URL = "https://fwhqtzkkvnjkazhaficj.supabase.co";
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const CLAUDE_MODEL = "claude-sonnet-4-20250514";

function getAdminClient() {
  return createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
}

async function verifyAuth(req: Request) {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader) throw new Error("No authorization header");
  const supabase = createClient(SUPABASE_URL, Deno.env.get("SUPABASE_ANON_KEY")!);
  const { data: { user }, error } = await supabase.auth.getUser(authHeader.replace("Bearer ", ""));
  if (error || !user) throw new Error("Unauthorized");
  
  const adminClient = getAdminClient();
  const { data: adminUser } = await adminClient
    .from("admin_users")
    .select("role, is_active")
    .eq("user_id", user.id)
    .single();
  if (!adminUser?.is_active || !["admin", "super_admin"].includes(adminUser.role)) {
    throw new Error("Forbidden");
  }
  return user;
}

// ── Anthropic API helper with fallback ──
async function callAIWithToolCalling(
  systemPrompt: string,
  userPrompt: string,
  toolName: string,
  toolDescription: string,
  toolSchema: any
): Promise<{ result: any; usage: { input_tokens: number; output_tokens: number }; model: string }> {
  const ANTHROPIC_API_KEY = Deno.env.get("ANTHROPIC_API_KEY");

  // Try Anthropic first
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
          max_tokens: 8192,
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

// ── Section defaults ──

const DEFAULT_TEASER_SECTIONS = [
  { order: 1, title: "Oportunidad de Inversión", instructions: "Descripción anónima de la empresa y el sector." },
  { order: 2, title: "Highlights de Inversión", instructions: "3-5 puntos clave atractivos." },
  { order: 3, title: "Métricas Financieras Clave", instructions: "Revenue, EBITDA, márgenes en rangos." },
  { order: 4, title: "Tipo de Transacción", instructions: "Descripción del tipo de operación buscada." },
  { order: 5, title: "Perfil de Comprador Ideal", instructions: "Características del comprador ideal." },
  { order: 6, title: "Siguiente Paso", instructions: "Proceso de contacto y próximos pasos." },
];

const DEFAULT_CIM_SECTIONS = [
  { order: 1, title: "Resumen Ejecutivo", instructions: "Síntesis de la oportunidad." },
  { order: 2, title: "Descripción del Negocio", instructions: "Modelo operativo, productos, propuesta de valor." },
  { order: 3, title: "Análisis de Mercado", instructions: "Tamaño, tendencias, posición competitiva." },
  { order: 4, title: "Equipo Directivo", instructions: "Estructura organizativa y equipo clave." },
  { order: 5, title: "Desempeño Financiero", instructions: "Análisis financiero histórico." },
  { order: 6, title: "Proyecciones Financieras", instructions: "Estimaciones de crecimiento." },
  { order: 7, title: "Oportunidades de Crecimiento", instructions: "Palancas orgánicas e inorgánicas." },
  { order: 8, title: "Términos de la Transacción", instructions: "Estructura propuesta y valoración." },
  { order: 9, title: "Anexos", instructions: "Información complementaria y disclaimers." },
];

function buildSystemPrompt(documentType: string, language: string): string {
  const lang = language === "en" ? "English" : "Spanish";
  
  if (documentType === "teaser") {
    return `You are a senior investment banker drafting a confidential teaser document in ${lang}.

CRITICAL ANONYMIZATION RULES:
- NEVER mention the company name, brand names, or trademarks
- Use "La Compañía" / "The Company" instead
- Use vague geographic references ("con sede en el norte de España" / "headquartered in Northern Spain")
- Present financial metrics in approximate RANGES only, never exact figures
- Do NOT mention specific clients, partners, or suppliers by name

STYLE:
- Professional, compelling tone designed to generate investor interest
- Concise but informative
- Highlight strengths and growth potential
- Each section should be 1-3 paragraphs in markdown format
- Use bullet points for highlights and metrics`;
  }

  return `You are a senior M&A analyst drafting a Confidential Information Memorandum (CIM) in ${lang}.

RULES:
- Be thorough but concise in each section
- Use ONLY the actual data provided — do NOT invent numbers or facts
- Present financial data professionally with proper formatting
- Highlight strengths, competitive advantages, and growth opportunities
- Include market context based on the sector/subsector
- Each section should be well-structured in markdown format
- Use tables for financial data where appropriate
- Maintain a professional, objective tone throughout`;
}

function buildUserPrompt(documentType: string, empresa: any, mandato: any, dealSheet: any, financials: any[], templateSections: any[]): string {
  const sections = templateSections.map((s: any) => `- Section ${s.order}: "${s.title}" — ${s.instructions}`).join("\n");
  let prompt = `Generate a ${documentType === "teaser" ? "Teaser" : "CIM"} document with the following sections:\n${sections}\n\n`;

  prompt += `=== COMPANY DATA ===\n`;
  if (empresa) {
    prompt += `Sector: ${empresa.sector || "N/A"}\nSubsector: ${empresa.subsector || "N/A"}\n`;
    prompt += `Location: ${empresa.ubicacion || "N/A"}\nEmployees: ${empresa.empleados || "N/A"}\n`;
    prompt += `Founded: ${empresa.ano_fundacion || "N/A"}\n`;
    prompt += `Revenue: ${empresa.revenue ? `€${(empresa.revenue / 1000000).toFixed(1)}M` : "N/A"}\n`;
    prompt += `EBITDA: ${empresa.ebitda ? `€${(empresa.ebitda / 1000000).toFixed(1)}M` : "N/A"}\n`;
    prompt += `EBITDA Margin: ${empresa.margen_ebitda ? `${empresa.margen_ebitda}%` : "N/A"}\n`;
    if (empresa.descripcion) prompt += `Description: ${empresa.descripcion}\n`;
    if (empresa.ai_company_summary) prompt += `AI Summary: ${empresa.ai_company_summary}\n`;
    if (empresa.ai_tags?.length) prompt += `Tags: ${empresa.ai_tags.join(", ")}\n`;
    if (empresa.ai_business_model_tags?.length) prompt += `Business Model: ${empresa.ai_business_model_tags.join(", ")}\n`;
    if (empresa.keywords?.length) prompt += `Keywords: ${empresa.keywords.join(", ")}\n`;
  }

  prompt += `\n=== MANDATE DATA ===\n`;
  if (mandato) {
    prompt += `Type: ${mandato.tipo}\nProject Name: ${mandato.nombre_proyecto || mandato.codigo}\n`;
    if (mandato.valor) prompt += `Value: €${(mandato.valor / 1000000).toFixed(1)}M\n`;
    if (mandato.perfil_empresa_buscada) prompt += `Target Profile: ${mandato.perfil_empresa_buscada}\n`;
    if (mandato.tipo_comprador_buscado) prompt += `Buyer Type: ${mandato.tipo_comprador_buscado}\n`;
  }

  if (dealSheet) {
    prompt += `\n=== DEAL SHEET (edited by the team — respect and expand, do NOT rewrite) ===\n`;
    if (dealSheet.executive_summary) prompt += `Executive Summary: ${dealSheet.executive_summary}\n`;
    if (dealSheet.investment_highlights?.length) prompt += `Highlights: ${dealSheet.investment_highlights.join("; ")}\n`;
    if (dealSheet.sale_rationale) prompt += `Sale Rationale: ${dealSheet.sale_rationale}\n`;
    if (dealSheet.ideal_buyer_profile) prompt += `Ideal Buyer: ${dealSheet.ideal_buyer_profile}\n`;
    if (dealSheet.transaction_type) prompt += `Transaction Type: ${dealSheet.transaction_type}\n`;
  }

  if (financials?.length) {
    prompt += `\n=== HISTORICAL FINANCIALS ===\n`;
    for (const f of financials.slice(0, 5)) {
      prompt += `Year ${f.year}: Revenue €${((f.revenue || 0) / 1000000).toFixed(1)}M, EBITDA €${((f.ebitda || 0) / 1000000).toFixed(1)}M\n`;
    }
  }

  return prompt;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const user = await verifyAuth(req);
    const { mandato_id, document_type, language = "es", template_id } = await req.json();

    if (!mandato_id || !document_type) {
      return new Response(JSON.stringify({ error: "mandato_id and document_type required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (!["teaser", "cim"].includes(document_type)) {
      return new Response(JSON.stringify({ error: "document_type must be 'teaser' or 'cim'" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const adminClient = getAdminClient();
    const startTime = Date.now();

    const { data: mandato, error: mandatoErr } = await adminClient
      .from("mandatos")
      .select("*, empresa_principal:empresas(*)")
      .eq("id", mandato_id)
      .single();

    if (mandatoErr || !mandato) {
      return new Response(JSON.stringify({ error: "Mandato not found" }), {
        status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const [dealSheetRes, financialsRes, templateRes] = await Promise.all([
      adminClient.from("deal_sheets").select("*").eq("mandato_id", mandato_id).maybeSingle(),
      mandato.empresa_principal?.id
        ? adminClient.from("empresa_financial_statements").select("*").eq("empresa_id", mandato.empresa_principal.id).order("year", { ascending: false }).limit(5)
        : Promise.resolve({ data: [] }),
      template_id
        ? adminClient.from("deal_document_templates").select("*").eq("id", template_id).single()
        : adminClient.from("deal_document_templates").select("*").eq("document_type", document_type).eq("language", language).eq("is_default", true).maybeSingle(),
    ]);

    const templateSections = templateRes.data?.sections ||
      (document_type === "teaser" ? DEFAULT_TEASER_SECTIONS : DEFAULT_CIM_SECTIONS);

    const systemPrompt = buildSystemPrompt(document_type, language);
    const userPrompt = buildUserPrompt(document_type, mandato.empresa_principal, mandato, dealSheetRes.data, (financialsRes as any).data || [], templateSections);

    const toolSchema = {
      type: "object",
      properties: {
        title: { type: "string", description: "Document title" },
        sections: {
          type: "array",
          items: {
            type: "object",
            properties: {
              section_title: { type: "string" },
              content: { type: "string", description: "Section content in markdown" },
              order: { type: "number" },
            },
            required: ["section_title", "content", "order"],
          },
        },
        anonymization_notes: { type: "string", description: "Notes on anonymized data (teaser only)" },
        key_metrics_used: {
          type: "array",
          items: { type: "string" },
          description: "List of metrics from the company data that were used",
        },
      },
      required: ["title", "sections"],
    };

    let aiResult: { result: any; usage: any; model: string };
    try {
      aiResult = await callAIWithToolCalling(
        systemPrompt, userPrompt,
        "generate_deal_document",
        "Generate a structured deal document with sections",
        toolSchema
      );
    } catch (e: any) {
      if (e.message === "RATE_LIMIT") {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again later." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (e.message === "CREDITS_EXHAUSTED") {
        return new Response(JSON.stringify({ error: "AI credits exhausted. Please add funds." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      throw e;
    }

    const generated = aiResult.result;
    const durationMs = Date.now() - startTime;

    const { data: doc, error: insertErr } = await adminClient
      .from("generated_deal_documents")
      .insert({
        mandato_id,
        template_id: templateRes.data?.id || null,
        document_type,
        language,
        title: generated.title,
        sections: generated.sections,
        metadata: {
          anonymization_notes: generated.anonymization_notes,
          key_metrics_used: generated.key_metrics_used,
          model: aiResult.model,
          input_tokens: aiResult.usage.input_tokens,
          output_tokens: aiResult.usage.output_tokens,
        },
        generated_by: user.id,
      })
      .select()
      .single();

    if (insertErr) {
      console.error("Insert error:", insertErr);
      throw new Error("Failed to save document");
    }

    await adminClient.from("ai_activity_log").insert({
      module: "document-generation",
      entity_type: document_type,
      entity_id: mandato_id,
      model: aiResult.model,
      input_tokens: aiResult.usage.input_tokens,
      output_tokens: aiResult.usage.output_tokens,
      duration_ms: durationMs,
      success: true,
      user_id: user.id,
    });

    return new Response(JSON.stringify(doc), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("generate-deal-document error:", e);
    const message = e instanceof Error ? e.message : "Unknown error";
    const status = message === "Unauthorized" ? 401 : message === "Forbidden" ? 403 : 500;
    return new Response(JSON.stringify({ error: message }), {
      status,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
