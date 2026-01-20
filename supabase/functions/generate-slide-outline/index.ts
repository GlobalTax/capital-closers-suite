import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Template configurations with allowed slide types and expected counts
const TEMPLATE_CONFIGS: Record<string, { allowedTypes: string[]; slideCount: number }> = {
  teaser_sell: {
    allowedTypes: ["title", "overview", "bullets", "financials", "stats", "market", "closing"],
    slideCount: 8,
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

interface SlideOutline {
  slide_index: number;
  slide_type: string;
  layout: "A" | "B" | "C";
  purpose: string;
}

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

    // Build the AI prompt
    const systemPrompt = `You are an M&A presentation strategist specializing in investment banking and corporate finance materials. Your task is to create a structured slide outline that follows best practices for the specific presentation type.

Rules:
- Return structure only (no final copy or detailed content)
- Use ONLY these allowed slide types: ${config.allowedTypes.join(", ")}
- Layouts represent visual structure:
  - A (Statement): Single headline/statement, minimal text, high impact
  - B (Bullets): Headline with bullet points, detailed information
  - C (Two-column): Comparative or side-by-side information
- Target exactly ${config.slideCount} slides
- Each slide must have a clear strategic purpose
- Order slides logically for narrative flow

Output a valid JSON array with objects containing:
- slide_index (0-based integer)
- slide_type (from allowed list)
- layout ("A", "B", or "C")
- purpose (1 sentence describing the slide's strategic goal)

Return ONLY the JSON array, no markdown, no explanation.`;

    const userPrompt = `Create a slide outline for a "${presentation_type}" presentation.

Context/Inputs:
${JSON.stringify(inputs_json, null, 2)}

Generate exactly ${config.slideCount} slides using only these types: ${config.allowedTypes.join(", ")}`;

    // Call Lovable AI Gateway
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
        temperature: 0.3,
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
    const content = aiResponse.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error("No content in AI response");
    }

    // Parse JSON from response (handle potential markdown wrapping)
    let outline: SlideOutline[];
    try {
      // Try to extract JSON from potential markdown code blocks
      const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/);
      const jsonString = jsonMatch ? jsonMatch[1].trim() : content.trim();
      outline = JSON.parse(jsonString);
    } catch (parseError) {
      console.error("Failed to parse AI response:", content);
      throw new Error("Failed to parse AI response as JSON");
    }

    // Validate the outline
    if (!Array.isArray(outline)) {
      throw new Error("AI response is not an array");
    }

    // Validate each slide
    const validatedOutline = outline.map((slide, index) => {
      // Ensure slide_index is sequential
      const validSlide: SlideOutline = {
        slide_index: index,
        slide_type: config.allowedTypes.includes(slide.slide_type) 
          ? slide.slide_type 
          : config.allowedTypes[0],
        layout: ["A", "B", "C"].includes(slide.layout) 
          ? slide.layout as "A" | "B" | "C"
          : "A",
        purpose: typeof slide.purpose === "string" 
          ? slide.purpose.slice(0, 200) 
          : "Slide content",
      };
      return validSlide;
    });

    return new Response(
      JSON.stringify(validatedOutline),
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
