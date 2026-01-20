import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { inputs_json, outline_json } = await req.json();

    if (!outline_json || !Array.isArray(outline_json)) {
      throw new Error("outline_json is required and must be an array");
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const systemPrompt = `You are generating a professional M&A-grade presentation.

STRICT RULES:
- Use ONLY the information provided in the inputs
- Do NOT invent metrics, clients, logos, or claims
- If data is missing, use neutral language like "industry leader" or "significant growth"
- Tone must be sober, credible, and professional
- Language: Spanish (formal business Spanish)

CONTENT CONSTRAINTS:
- Headline: max 10 words, impactful but factual
- Subline: max 15 words, provides context
- Bullets: max 12 words each, clear and specific
- Max 5 bullets per slide
- No marketing hype or superlatives without data
- Stats must come from provided inputs only

OUTPUT REQUIREMENTS:
- Maintain the exact slide order and types from the outline
- Enhance headlines and sublines with professional M&A language
- Generate concrete bullet points based on provided information
- For stats slides, only include metrics that exist in inputs`;

    const userPrompt = `Generate final M&A-grade copy for this presentation.

INPUTS PROVIDED:
${JSON.stringify(inputs_json, null, 2)}

SLIDES OUTLINE TO REFINE:
${JSON.stringify(outline_json, null, 2)}

For each slide, generate polished professional copy. Use only the information provided above.`;

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
        tools: [
          {
            type: "function",
            function: {
              name: "refine_slides",
              description: "Return refined slides with M&A-grade professional copy",
              parameters: {
                type: "object",
                properties: {
                  slides: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        slide_index: { type: "number", description: "Original slide index (0-based)" },
                        slide_type: { type: "string", description: "Type of slide" },
                        layout: { type: "string", enum: ["A", "B", "C"], description: "Layout code" },
                        headline: { type: "string", description: "Main headline (max 10 words)" },
                        subline: { type: "string", description: "Optional subline (max 15 words)" },
                        bullets: {
                          type: "array",
                          items: { type: "string" },
                          maxItems: 5,
                          description: "Bullet points (max 12 words each, max 5 bullets)"
                        },
                        stats: {
                          type: "array",
                          items: {
                            type: "object",
                            properties: {
                              value: { type: "string" },
                              label: { type: "string" }
                            },
                            required: ["value", "label"]
                          },
                          maxItems: 4,
                          description: "Key statistics (only from provided inputs)"
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
                          description: "Team members if applicable"
                        },
                        columns: {
                          type: "array",
                          items: {
                            type: "object",
                            properties: {
                              title: { type: "string" },
                              content: { type: "string" }
                            },
                            required: ["title", "content"]
                          },
                          maxItems: 3,
                          description: "Columns for comparison slides"
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
        ],
        tool_choice: { type: "function", function: { name: "refine_slides" } }
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI Gateway error:", response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI credits exhausted. Please add funds to continue." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      throw new Error(`AI Gateway error: ${response.status}`);
    }

    const data = await response.json();
    console.log("AI response:", JSON.stringify(data, null, 2));

    // Extract tool call result
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall || toolCall.function.name !== "refine_slides") {
      throw new Error("Unexpected AI response format");
    }

    const result = JSON.parse(toolCall.function.arguments);
    
    // Post-process to enforce constraints
    const refinedSlides = result.slides.map((slide: any) => {
      // Enforce headline max 10 words
      if (slide.headline) {
        const words = slide.headline.split(/\s+/);
        if (words.length > 10) {
          slide.headline = words.slice(0, 10).join(" ");
        }
      }
      
      // Enforce subline max 15 words
      if (slide.subline) {
        const words = slide.subline.split(/\s+/);
        if (words.length > 15) {
          slide.subline = words.slice(0, 15).join(" ");
        }
      }
      
      // Enforce bullets max 12 words each, max 5 bullets
      if (slide.bullets && Array.isArray(slide.bullets)) {
        slide.bullets = slide.bullets.slice(0, 5).map((bullet: string) => {
          const words = bullet.split(/\s+/);
          return words.length > 12 ? words.slice(0, 12).join(" ") : bullet;
        });
      }
      
      // Enforce max 4 stats
      if (slide.stats && Array.isArray(slide.stats)) {
        slide.stats = slide.stats.slice(0, 4);
      }
      
      return slide;
    });

    return new Response(
      JSON.stringify({ slides: refinedSlides }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in refine-slide-copy:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
