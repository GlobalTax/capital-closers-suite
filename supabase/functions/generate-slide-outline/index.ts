import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Template configurations with allowed slide types and expected counts
const TEMPLATE_CONFIGS: Record<string, { allowedTypes: string[]; slideCount: number; fixedSequence?: { type: string; name: string }[] }> = {
  teaser_sell: {
    allowedTypes: ["title", "overview", "bullets", "financials", "stats", "market", "closing"],
    slideCount: 8,
  },
  teaser_ma_sell: {
    allowedTypes: ["disclaimer", "bullets", "overview", "market", "financials", "closing"],
    slideCount: 8,
    fixedSequence: [
      { type: "disclaimer", name: "Confidentiality & Disclaimer" },
      { type: "bullets", name: "Investment Highlights" },
      { type: "overview", name: "Company Overview" },
      { type: "bullets", name: "Business Model" },
      { type: "market", name: "Market & Positioning" },
      { type: "financials", name: "Financial Snapshot" },
      { type: "bullets", name: "Growth & Value Creation" },
      { type: "closing", name: "Transaction & Next Steps" }
    ],
  },
  firm_deck: {
    allowedTypes: ["title", "overview", "bullets", "stats", "team", "closing"],
    slideCount: 6,
  },
  client_deck: {
    allowedTypes: ["title", "overview", "bullets", "timeline", "team", "closing"],
    slideCount: 6,
  },
  mandate_deck: {
    allowedTypes: ["title", "overview", "bullets", "comparison", "stats", "market", "closing"],
    slideCount: 7,
  },
  one_pager: {
    allowedTypes: ["title", "overview", "closing"],
    slideCount: 3,
  },
  custom: {
    allowedTypes: ["title", "hero", "overview", "bullets", "stats", "financials", "timeline", "team", "comparison", "market", "closing", "disclaimer"],
    slideCount: 10,
  },
};

// Content types for each slide layout
const SLIDE_CONTENT_SCHEMAS: Record<string, string> = {
  title: "headline (company/project name), subline (tagline or date)",
  overview: "headline, subline, bullets (3-5 key highlights about the company/opportunity)",
  bullets: "headline, bullets (4-6 detailed points with supporting information)",
  stats: "headline, stats (3-4 metrics with value, label, and optional prefix/suffix like € or %)",
  financials: "headline, stats (revenue, EBITDA, margin, growth as numeric metrics)",
  market: "headline, subline, bullets (market size, trends, competitive position)",
  team: "headline, team_members (2-4 people with name and role)",
  timeline: "headline, bullets (4-6 milestones or process steps)",
  comparison: "headline, columns (2 columns with title and items for comparison)",
  closing: "headline (call to action or contact info), subline (next steps)",
  hero: "headline (bold statement), subline (supporting message)",
  disclaimer: "headline, bodyText (legal/confidentiality text)",
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { presentation_type, inputs_json } = await req.json();

    // Validate presentation type
    if (!presentation_type || !TEMPLATE_CONFIGS[presentation_type]) {
      return new Response(
        JSON.stringify({ error: "Invalid presentation_type" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const config = TEMPLATE_CONFIGS[presentation_type];
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // Build slide content requirements
    const slideContentRequirements = config.allowedTypes
      .map(type => `- ${type}: ${SLIDE_CONTENT_SCHEMAS[type] || "headline, subline"}`)
      .join("\n");

    // Check if this is the M&A sell-side teaser (special sober tone)
    const isMASellTeaser = presentation_type === "teaser_ma_sell";
    const fixedSequence = config.fixedSequence;
    
    // Build the AI prompt with content generation
    const baseRules = isMASellTeaser 
      ? `You are an M&A presentation strategist creating a CONFIDENTIAL SELL-SIDE TEASER for sophisticated investors.

CRITICAL TONE REQUIREMENTS:
- Very sober and professional - this is for PE/VC/strategic buyers
- Investor-grade language with M&A terminology
- NO sales language, marketing speak, or promotional tone
- NO superlatives (best, leading, exceptional) unless supported by hard data
- NO exclamation marks or emotional language
- Use factual, neutral, measured descriptions
- Present information objectively and credibly

FORBIDDEN PHRASES:
- "unique opportunity", "exceptional", "best-in-class", "world-class"
- "explosive growth", "revolutionizing", "game-changing"
- "must-see", "once-in-a-lifetime", "incredible"
- Any hyperbolic or promotional language

PREFERRED M&A LANGUAGE:
- "Attractive entry point", "Established market position"
- "Demonstrated growth trajectory", "Recurring revenue base"
- "Strategic optionality", "Identified value creation levers"
- "Proven track record", "Defensible market position"

SLIDE STRUCTURE (FIXED - 8 slides):
1. Confidentiality & Disclaimer - Legal notice, project code name
2. Investment Highlights - 4-5 key reasons to consider this opportunity
3. Company Overview - Business description, founding, geography, employees
4. Business Model - Revenue streams, customer base, value proposition
5. Market & Positioning - Market size, trends, competitive position
6. Financial Snapshot - Key metrics: Revenue, EBITDA, margins, growth
7. Growth & Value Creation - Growth drivers, synergies, upside potential
8. Transaction & Next Steps - Process overview, timeline, advisor contact`
      : `You are an M&A presentation strategist specializing in investment banking and corporate finance materials. Your task is to create a COMPLETE slide deck with real content based on the provided inputs.`;

    const systemPrompt = `${baseRules}

Rules:
- Generate exactly ${config.slideCount} slides${fixedSequence ? ` following the EXACT sequence provided` : ` using ONLY these types: ${config.allowedTypes.join(", ")}`}
- Each slide must have REAL content based on the inputs (not placeholders)
- Layouts represent visual structure:
  - A (Statement): Single headline/statement, minimal text, high impact
  - B (Bullets): Headline with bullet points, detailed information  
  - C (Two-column): Comparative or side-by-side information
- Content must be professional, concise, and relevant for M&A audiences
- Use actual numbers from inputs when available${isMASellTeaser ? " - DO NOT invent metrics" : ", or create realistic estimates"}

Slide content requirements by type:
${slideContentRequirements}

You MUST use the generate_slides tool to return the structured response.`;

    const userPrompt = isMASellTeaser 
      ? `Create a confidential M&A sell-side teaser with exactly 8 slides following this EXACT sequence:
${fixedSequence?.map((s, i) => `${i + 1}. ${s.name} (type: ${s.type})`).join("\n")}

Company/Project Details:
${JSON.stringify(inputs_json, null, 2)}

Generate sober, investor-grade content. Use ONLY the provided data. Do not invent metrics or claims. Maintain a measured, professional tone throughout.`
      : `Create a complete ${presentation_type} presentation with ${config.slideCount} slides.

Company/Project Details:
${JSON.stringify(inputs_json, null, 2)}

Generate professional content for each slide based on these details. Use the provided numbers and highlights. Make content compelling for investors/buyers.`;

    // Define the tool for structured output
    const tools = [
      {
        type: "function",
        function: {
          name: "generate_slides",
          description: "Generate a complete slide deck with content",
          parameters: {
            type: "object",
            properties: {
              slides: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    slide_index: { type: "number", description: "0-based slide index" },
                    slide_type: { type: "string", enum: config.allowedTypes },
                    layout: { type: "string", enum: ["A", "B", "C"] },
                    headline: { type: "string", description: "Main headline for the slide" },
                    subline: { type: "string", description: "Optional subheadline or supporting text" },
                    content: {
                      type: "object",
                      properties: {
                        bullets: {
                          type: "array",
                          items: { type: "string" },
                          description: "Bullet points for the slide"
                        },
                        stats: {
                          type: "array",
                          items: {
                            type: "object",
                            properties: {
                              value: { type: "string" },
                              label: { type: "string" },
                              prefix: { type: "string" },
                              suffix: { type: "string" }
                            },
                            required: ["value", "label"]
                          },
                          description: "Statistics/KPIs for stats or financials slides"
                        },
                        team_members: {
                          type: "array",
                          items: {
                            type: "object",
                            properties: {
                              name: { type: "string" },
                              role: { type: "string" }
                            },
                            required: ["name", "role"]
                          },
                          description: "Team members for team slides"
                        },
                        columns: {
                          type: "array",
                          items: {
                            type: "object",
                            properties: {
                              title: { type: "string" },
                              items: { type: "array", items: { type: "string" } }
                            },
                            required: ["title", "items"]
                          },
                          description: "Columns for comparison slides"
                        },
                        bodyText: { type: "string", description: "Body text for disclaimer or custom slides" }
                      }
                    }
                  },
                  required: ["slide_index", "slide_type", "layout", "headline"]
                }
              }
            },
            required: ["slides"]
          }
        }
      }
    ];

    // Call Lovable AI Gateway with tool calling
    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        tools,
        tool_choice: { type: "function", function: { name: "generate_slides" } },
        temperature: 0.4,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again later." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Payment required. Please add credits to your workspace." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const aiResponse = await response.json();
    
    // Extract tool call response
    const toolCall = aiResponse.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall || toolCall.function.name !== "generate_slides") {
      console.error("No tool call in response:", JSON.stringify(aiResponse));
      throw new Error("AI did not return structured slide data");
    }

    let slidesData;
    try {
      slidesData = JSON.parse(toolCall.function.arguments);
    } catch (parseError) {
      console.error("Failed to parse tool arguments:", toolCall.function.arguments);
      throw new Error("Failed to parse AI response");
    }

    const slides = slidesData.slides;
    if (!Array.isArray(slides)) {
      throw new Error("AI response does not contain slides array");
    }

    // Validate and clean each slide
    const validatedSlides = slides.map((slide: Record<string, unknown>, index: number) => {
      const slideType = config.allowedTypes.includes(slide.slide_type as string) 
        ? slide.slide_type as string
        : config.allowedTypes[Math.min(index, config.allowedTypes.length - 1)];
      
      const layout = ["A", "B", "C"].includes(slide.layout as string) 
        ? slide.layout as string
        : "A";

      return {
        slide_index: index,
        slide_type: slideType,
        layout,
        headline: typeof slide.headline === "string" ? slide.headline.slice(0, 200) : "Slide " + (index + 1),
        subline: typeof slide.subline === "string" ? slide.subline.slice(0, 300) : undefined,
        content: slide.content || {},
      };
    });

    return new Response(
      JSON.stringify(validatedSlides),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("generate-slide-outline error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});