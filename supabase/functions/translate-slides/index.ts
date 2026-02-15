import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { getCorsHeaders, requireAuth } from '../_shared/auth.ts';

interface SlideForTranslation {
  slide_index: number;
  headline?: string;
  subline?: string;
  bullets?: string[];
  stats?: { value: string; label: string; prefix?: string; suffix?: string }[];
  bodyText?: string;
  teamMembers?: { name: string; role: string }[];
  columns?: { title: string; items: string[] }[];
  footnote?: string;
  confidentialityText?: string;
}

serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { user, error: authError } = await requireAuth(req, corsHeaders);
    if (authError) return authError;

    const { slides_json, target_language } = await req.json();

    if (!Array.isArray(slides_json) || slides_json.length === 0) {
      return new Response(
        JSON.stringify({ error: "slides_json must be a non-empty array" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!target_language || typeof target_language !== "string") {
      return new Response(
        JSON.stringify({ error: "target_language is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // Extract original values that must NOT change
    const originalStats = slides_json.map((slide: SlideForTranslation) => 
      (slide.stats || []).map(s => s.value)
    );
    const originalNames = slides_json.map((slide: SlideForTranslation) => 
      (slide.teamMembers || []).map(m => m.name)
    );

    const systemPrompt = `You are a professional M&A document translator for investment banking presentations.

CRITICAL RULES - FOLLOW EXACTLY:
1. DO NOT change meaning - translate exactly what is written
2. DO NOT modify numbers, percentages, or financial figures (e.g., "€15M", "25%", "3.5x" stay exactly the same)
3. DO NOT modify company names, proper nouns, or brand names
4. DO NOT add, remove, or rephrase claims
5. Maintain professional investment/financial tone
6. Keep copy length similar to original (±20%)
7. Preserve formatting patterns (bullet structure, capitalization style)
8. For stats.value fields: NEVER translate - copy exactly as-is
9. For teamMembers.name fields: NEVER translate - copy exactly as-is

TARGET LANGUAGE: ${target_language}

Use formal business register appropriate for ${target_language}.
Use M&A industry terminology standard in ${target_language}-speaking markets.`;

    const userPrompt = `Translate the following presentation slides to ${target_language}.

REMEMBER:
- stats.value fields must remain EXACTLY as provided (numbers, currency symbols, units)
- teamMembers.name fields must remain EXACTLY as provided
- Only translate: headline, subline, bullets, stats.label, bodyText, teamMembers.role, columns.title, columns.items, footnote, confidentialityText

Slides JSON:
${JSON.stringify(slides_json, null, 2)}`;

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
              name: "translate_slides",
              description: "Return translated slides preserving exact structure and untranslatable fields",
              parameters: {
                type: "object",
                properties: {
                  slides: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        slide_index: { type: "number" },
                        headline: { type: "string" },
                        subline: { type: "string" },
                        bullets: { type: "array", items: { type: "string" } },
                        stats: {
                          type: "array",
                          items: {
                            type: "object",
                            properties: {
                              value: { type: "string" },
                              label: { type: "string" },
                              prefix: { type: "string" },
                              suffix: { type: "string" },
                            },
                          },
                        },
                        bodyText: { type: "string" },
                        teamMembers: {
                          type: "array",
                          items: {
                            type: "object",
                            properties: {
                              name: { type: "string" },
                              role: { type: "string" },
                            },
                          },
                        },
                        columns: {
                          type: "array",
                          items: {
                            type: "object",
                            properties: {
                              title: { type: "string" },
                              items: { type: "array", items: { type: "string" } },
                            },
                          },
                        },
                        footnote: { type: "string" },
                        confidentialityText: { type: "string" },
                      },
                      required: ["slide_index"],
                    },
                  },
                },
                required: ["slides"],
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "translate_slides" } },
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
          JSON.stringify({ error: "AI credits exhausted. Please add funds to continue." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const aiResponse = await response.json();
    const toolCall = aiResponse.choices?.[0]?.message?.tool_calls?.[0];

    if (!toolCall || toolCall.function.name !== "translate_slides") {
      throw new Error("Invalid AI response format");
    }

    const translatedData = JSON.parse(toolCall.function.arguments);
    const translatedSlides: SlideForTranslation[] = translatedData.slides;

    // Validation: Ensure stats.value and teamMembers.name haven't changed
    const warnings: string[] = [];
    
    translatedSlides.forEach((slide, idx) => {
      const origStatValues = originalStats[idx] || [];
      const origMemberNames = originalNames[idx] || [];

      // Restore original stat values if they were modified
      if (slide.stats) {
        slide.stats.forEach((stat, sIdx) => {
          if (origStatValues[sIdx] && stat.value !== origStatValues[sIdx]) {
            warnings.push(`Slide ${idx + 1}: stat value was modified, restoring original`);
            stat.value = origStatValues[sIdx];
          }
        });
      }

      // Restore original team member names if they were modified
      if (slide.teamMembers) {
        slide.teamMembers.forEach((member, mIdx) => {
          if (origMemberNames[mIdx] && member.name !== origMemberNames[mIdx]) {
            warnings.push(`Slide ${idx + 1}: team member name was modified, restoring original`);
            member.name = origMemberNames[mIdx];
          }
        });
      }
    });

    return new Response(
      JSON.stringify({ 
        slides: translatedSlides,
        target_language,
        warnings: warnings.length > 0 ? warnings : undefined
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("translate-slides error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
