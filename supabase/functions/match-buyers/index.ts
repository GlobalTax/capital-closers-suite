import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = Date.now();

  try {
    // Auth check
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "No autorizado" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const lovableApiKey = Deno.env.get("LOVABLE_API_KEY");

    if (!lovableApiKey) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // Verify user
    const userClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: authError } = await userClient.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "No autorizado" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Verify admin role
    const adminClient = createClient(supabaseUrl, serviceRoleKey);
    const { data: adminUser } = await adminClient
      .from("admin_users")
      .select("role, is_active")
      .eq("user_id", user.id)
      .single();

    if (!adminUser?.is_active || !["admin", "super_admin"].includes(adminUser.role)) {
      return new Response(JSON.stringify({ error: "Acceso denegado" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { mandato_id } = await req.json();
    if (!mandato_id) {
      return new Response(JSON.stringify({ error: "mandato_id requerido" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 1. Load mandato + empresa
    const { data: mandato, error: mandatoError } = await adminClient
      .from("mandatos")
      .select(`
        id, tipo, estado, valor, codigo, nombre_proyecto,
        perfil_empresa_buscada, tipo_comprador_buscado,
        empresa_principal:empresas!mandatos_empresa_principal_id_fkey (
          id, nombre, sector, subsector, ubicacion, revenue, ebitda,
          descripcion, ai_company_summary, ai_tags, ai_business_model_tags,
          keywords, empleados
        )
      `)
      .eq("id", mandato_id)
      .single();

    if (mandatoError || !mandato) {
      return new Response(JSON.stringify({ error: "Mandato no encontrado" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (mandato.tipo !== "venta") {
      return new Response(
        JSON.stringify({ error: "El matching solo está disponible para mandatos de venta" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const empresa = mandato.empresa_principal as any;
    if (!empresa) {
      return new Response(
        JSON.stringify({ error: "El mandato no tiene empresa principal vinculada" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 2. Load all active corporate buyers
    const { data: buyers, error: buyersError } = await adminClient
      .from("corporate_buyers")
      .select("*")
      .eq("is_active", true);

    if (buyersError) throw buyersError;
    if (!buyers || buyers.length === 0) {
      return new Response(
        JSON.stringify({ error: "No hay compradores corporativos activos" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 3. Deterministic pre-filtering
    const targetSector = empresa.sector?.toLowerCase() || "";
    const targetSubsector = empresa.subsector?.toLowerCase() || "";
    const targetUbicacion = empresa.ubicacion?.toLowerCase() || "";
    const targetRevenue = empresa.revenue;
    const targetEbitda = empresa.ebitda;
    const targetTags = (empresa.ai_tags || []).map((t: string) => t.toLowerCase());

    const filtered = buyers.filter((buyer: any) => {
      // Exclude if sector is in exclusions
      if (buyer.sector_exclusions && targetSector) {
        const exclusions = buyer.sector_exclusions.map((s: string) => s.toLowerCase());
        if (exclusions.some((ex: string) => targetSector.includes(ex) || ex.includes(targetSector))) {
          return false;
        }
      }

      // Financial range check
      if (targetRevenue && buyer.revenue_min && targetRevenue < buyer.revenue_min) return false;
      if (targetRevenue && buyer.revenue_max && targetRevenue > buyer.revenue_max) return false;
      if (targetEbitda && buyer.ebitda_min && targetEbitda < buyer.ebitda_min) return false;
      if (targetEbitda && buyer.ebitda_max && targetEbitda > buyer.ebitda_max) return false;

      return true;
    });

    // Take top 30
    const candidates = filtered.slice(0, 30);

    if (candidates.length === 0) {
      // No candidates after filtering - save empty result
      await adminClient.from("buyer_matches").delete().eq("mandato_id", mandato_id);
      await logActivity(adminClient, user.id, mandato_id, startTime, true, 0, 0);
      return new Response(
        JSON.stringify({ matches: [], message: "No se encontraron compradores compatibles tras el pre-filtrado" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 4. Build prompt for AI
    const targetProfile = buildTargetProfile(empresa, mandato);
    const buyerProfiles = candidates.map((b: any, i: number) => buildBuyerProfile(b, i + 1));

    const systemPrompt = `Eres un analista senior de M&A especializado en buyer identification para operaciones de venta de empresas en España y Europa.

Tu tarea es evaluar cada comprador candidato contra el perfil de la empresa target y determinar el grado de compatibilidad.

Criterios de evaluación:
1. **Sector Fit**: ¿El sector del target encaja con los sectores de interés del comprador? Considera no solo el nombre sino la lógica de negocio (ej: una empresa SaaS de HR puede interesar a un comprador de "tecnología" aunque busque "recursos humanos").
2. **Financial Fit**: ¿Los datos financieros del target (revenue, EBITDA) están dentro del rango aceptado por el comprador? ¿El valor del deal es compatible con el deal size del comprador?
3. **Geographic Fit**: ¿La ubicación del target coincide con las geografías objetivo del comprador?
4. **Strategic Fit**: ¿La tesis de inversión del comprador encaja con lo que ofrece el target? ¿Las keywords y tags del target se alinean con los intereses del comprador?

Sé riguroso: un score de 80+ significa alta compatibilidad real, 60-79 es compatible con matices, 40-59 es marginal, <40 es bajo.
Responde siempre en español.`;

    const userPrompt = `## Empresa Target (en venta)
${targetProfile}

## Compradores Candidatos a Evaluar
${buyerProfiles.join("\n\n")}

Evalúa cada comprador contra el target y devuelve los resultados ordenados de mayor a menor score. Solo incluye compradores con score >= 30.`;

    // 5. Call Gemini with tool calling
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
              name: "evaluate_buyer_matches",
              description: "Devuelve la evaluación de compatibilidad de cada comprador candidato con el target.",
              parameters: {
                type: "object",
                properties: {
                  matches: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        buyer_name: { type: "string", description: "Nombre exacto del comprador evaluado" },
                        match_score: { type: "integer", description: "Score general 0-100" },
                        sector_fit: { type: "integer", description: "Fit sectorial 0-100" },
                        financial_fit: { type: "integer", description: "Fit financiero 0-100" },
                        geographic_fit: { type: "integer", description: "Fit geográfico 0-100" },
                        strategic_fit: { type: "integer", description: "Fit estratégico 0-100" },
                        reasoning: { type: "string", description: "2-3 frases explicando el match" },
                        risk_factors: { type: "array", items: { type: "string" }, description: "Posibles incompatibilidades" },
                        recommended_approach: { type: "string", description: "Cómo abordar a este comprador" },
                      },
                      required: ["buyer_name", "match_score", "sector_fit", "financial_fit", "geographic_fit", "strategic_fit", "reasoning", "risk_factors", "recommended_approach"],
                      additionalProperties: false,
                    },
                  },
                },
                required: ["matches"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "evaluate_buyer_matches" } },
      }),
    });

    if (!aiResponse.ok) {
      const status = aiResponse.status;
      if (status === 429) {
        return new Response(JSON.stringify({ error: "Límite de peticiones IA excedido. Inténtalo en unos minutos." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (status === 402) {
        return new Response(JSON.stringify({ error: "Créditos IA agotados. Añade créditos en tu workspace." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errText = await aiResponse.text();
      console.error("AI gateway error:", status, errText);
      throw new Error(`AI gateway error: ${status}`);
    }

    const aiData = await aiResponse.json();
    const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) throw new Error("No tool call response from AI");

    const args = JSON.parse(toolCall.function.arguments);
    const matches = args.matches || [];

    // 6. Save matches (delete old ones first)
    await adminClient.from("buyer_matches").delete().eq("mandato_id", mandato_id);

    // Map buyer names back to IDs
    const buyerNameMap = new Map<string, string>();
    candidates.forEach((b: any) => {
      buyerNameMap.set(b.name?.toLowerCase(), b.id);
      buyerNameMap.set(b.name, b.id);
    });

    const matchesToInsert = matches
      .map((m: any) => {
        // Find buyer ID by name (fuzzy match)
        let buyerId = buyerNameMap.get(m.buyer_name) || buyerNameMap.get(m.buyer_name?.toLowerCase());
        if (!buyerId) {
          // Try partial match
          for (const [name, id] of buyerNameMap.entries()) {
            if (name.includes(m.buyer_name?.toLowerCase()) || m.buyer_name?.toLowerCase()?.includes(name)) {
              buyerId = id;
              break;
            }
          }
        }
        if (!buyerId) return null;

        return {
          mandato_id,
          buyer_id: buyerId,
          match_score: Math.min(100, Math.max(0, m.match_score)),
          match_reasoning: m.reasoning,
          fit_dimensions: {
            sector_fit: m.sector_fit,
            financial_fit: m.financial_fit,
            geographic_fit: m.geographic_fit,
            strategic_fit: m.strategic_fit,
          },
          risk_factors: m.risk_factors || [],
          recommended_approach: m.recommended_approach,
          generated_at: new Date().toISOString(),
          generated_by: user.id,
        };
      })
      .filter(Boolean);

    if (matchesToInsert.length > 0) {
      const { error: insertError } = await adminClient
        .from("buyer_matches")
        .insert(matchesToInsert);
      if (insertError) {
        console.error("Error inserting matches:", insertError);
        throw insertError;
      }
    }

    // 7. Log activity
    const inputTokens = aiData.usage?.prompt_tokens || 0;
    const outputTokens = aiData.usage?.completion_tokens || 0;
    await logActivity(adminClient, user.id, mandato_id, startTime, true, inputTokens, outputTokens);

    return new Response(
      JSON.stringify({
        matches: matchesToInsert.length,
        candidates_evaluated: candidates.length,
        total_buyers: buyers.length,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("match-buyers error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Error desconocido" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

function buildTargetProfile(empresa: any, mandato: any): string {
  const parts = [
    `**Nombre**: ${empresa.nombre}`,
    empresa.sector && `**Sector**: ${empresa.sector}${empresa.subsector ? ` / ${empresa.subsector}` : ""}`,
    empresa.ubicacion && `**Ubicación**: ${empresa.ubicacion}`,
    empresa.revenue && `**Facturación**: ${(empresa.revenue / 1000000).toFixed(1)}M€`,
    empresa.ebitda && `**EBITDA**: ${(empresa.ebitda / 1000000).toFixed(1)}M€`,
    empresa.empleados && `**Empleados**: ${empresa.empleados}`,
    mandato.valor && `**Valor del mandato**: ${(mandato.valor / 1000000).toFixed(1)}M€`,
    empresa.descripcion && `**Descripción**: ${empresa.descripcion}`,
    empresa.ai_company_summary && `**Resumen IA**: ${empresa.ai_company_summary}`,
    empresa.ai_tags?.length && `**Tags**: ${empresa.ai_tags.join(", ")}`,
    empresa.ai_business_model_tags?.length && `**Modelo de negocio**: ${empresa.ai_business_model_tags.join(", ")}`,
    empresa.keywords?.length && `**Keywords**: ${empresa.keywords.join(", ")}`,
    mandato.tipo_comprador_buscado && `**Tipo de comprador buscado**: ${mandato.tipo_comprador_buscado}`,
    mandato.perfil_empresa_buscada && `**Perfil buscado**: ${mandato.perfil_empresa_buscada}`,
  ];
  return parts.filter(Boolean).join("\n");
}

function buildBuyerProfile(buyer: any, index: number): string {
  const parts = [
    `### Comprador ${index}: ${buyer.name}`,
    buyer.buyer_type && `**Tipo**: ${buyer.buyer_type}`,
    buyer.description && `**Descripción**: ${buyer.description}`,
    buyer.investment_thesis && `**Tesis de inversión**: ${buyer.investment_thesis}`,
    buyer.sector_focus?.length && `**Sectores foco**: ${buyer.sector_focus.join(", ")}`,
    buyer.sector_exclusions?.length && `**Sectores excluidos**: ${buyer.sector_exclusions.join(", ")}`,
    buyer.geography_focus?.length && `**Geografías**: ${buyer.geography_focus.join(", ")}`,
    buyer.revenue_min && `**Revenue mín**: ${(buyer.revenue_min / 1000000).toFixed(1)}M€`,
    buyer.revenue_max && `**Revenue máx**: ${(buyer.revenue_max / 1000000).toFixed(1)}M€`,
    buyer.ebitda_min && `**EBITDA mín**: ${(buyer.ebitda_min / 1000000).toFixed(1)}M€`,
    buyer.ebitda_max && `**EBITDA máx**: ${(buyer.ebitda_max / 1000000).toFixed(1)}M€`,
    buyer.deal_size_min && `**Deal size mín**: ${(buyer.deal_size_min / 1000000).toFixed(1)}M€`,
    buyer.deal_size_max && `**Deal size máx**: ${(buyer.deal_size_max / 1000000).toFixed(1)}M€`,
    buyer.search_keywords?.length && `**Keywords**: ${buyer.search_keywords.join(", ")}`,
    buyer.key_highlights?.length && `**Highlights**: ${buyer.key_highlights.join(", ")}`,
  ];
  return parts.filter(Boolean).join("\n");
}

async function logActivity(
  client: any,
  userId: string,
  mandatoId: string,
  startTime: number,
  success: boolean,
  inputTokens: number,
  outputTokens: number
) {
  try {
    await client.from("ai_activity_log").insert({
      module: "buyer-matching",
      entity_type: "mandato",
      entity_id: mandatoId,
      user_id: userId,
      model: "google/gemini-3-flash-preview",
      success,
      duration_ms: Date.now() - startTime,
      input_tokens: inputTokens,
      output_tokens: outputTokens,
      estimated_cost_usd: (inputTokens * 0.00000015 + outputTokens * 0.0000006),
    });
  } catch (e) {
    console.error("Error logging activity:", e);
  }
}
