import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const CLAUDE_MODEL = "claude-sonnet-4-20250514";

// ── Anthropic API helper with fallback ──
async function callAIWithToolCalling(
  systemPrompt: string,
  userPrompt: string,
  toolName: string,
  toolDescription: string,
  toolSchema: any
): Promise<any> {
  const ANTHROPIC_API_KEY = Deno.env.get("ANTHROPIC_API_KEY");

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
          max_tokens: 4096,
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
        if (toolUse) return toolUse.input;
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
    if (status === 429) throw new Error("Rate limit exceeded. Please try again in a moment.");
    if (status === 402) throw new Error("AI credits exhausted. Please add funds to continue.");
    throw new Error(`AI Gateway error: ${status}`);
  }

  const data = await resp.json();
  const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
  if (!toolCall || toolCall.function.name !== toolName) throw new Error("Unexpected AI response format");
  return JSON.parse(toolCall.function.arguments);
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { inputs_json, outline_json } = await req.json();

    if (!outline_json || !Array.isArray(outline_json)) {
      throw new Error("outline_json is required and must be an array");
    }

    // Detect template type from structure
    const isMASellTeaser = outline_json.some((slide: any) => 
      slide.slide_type === "disclaimer" && outline_json.length === 8
    );
    const isFirmDeck = outline_json.length === 6 && 
      outline_json[0]?.slide_type === "title" &&
      outline_json[3]?.slide_type === "stats";
    const isClientDeck = outline_json.length === 6 && 
      outline_json[0]?.slide_type === "overview" &&
      outline_json[3]?.slide_type === "timeline";

    const getSystemPrompt = () => {
      if (isMASellTeaser) {
        return `You are refining copy for a CONFIDENTIAL M&A SELL-SIDE TEASER targeting sophisticated investors (PE, VC, strategic buyers).

CRITICAL TONE REQUIREMENTS:
- Very sober, measured, and professional
- Investor-grade precision - every word counts
- NO sales language, marketing speak, or promotional tone
- NO superlatives unless supported by hard data from inputs
- NO exclamation marks or emotional language
- Factual and neutral - let the numbers speak

FORBIDDEN PHRASES:
- "unique opportunity", "exceptional", "best-in-class", "world-class"
- "explosive growth", "revolutionizing", "game-changing", "incredible"
- "must-see", "once-in-a-lifetime", "market-leading" (unless proven)
- Any hyperbolic or promotional language

PREFERRED M&A TERMINOLOGY:
- "Attractive entry point", "Established market position"
- "Demonstrated growth trajectory", "Recurring revenue base"  
- "Strategic optionality", "Identified value creation levers"
- "Proven track record", "Defensible competitive position"

STRICT RULES:
- Use ONLY the information provided in the inputs
- Do NOT invent metrics, clients, or claims - this is legally sensitive
- If data is missing, omit or use "To be discussed" rather than inventing
- Language: Spanish (formal business Spanish)

CONTENT CONSTRAINTS:
- Headline: max 10 words, factual and measured
- Subline: max 15 words, provides context without hype
- Bullets: max 12 words each, specific and verifiable
- Max 5 bullets per slide
- Stats must come ONLY from provided inputs`;
      }
      if (isFirmDeck) {
        return `You are refining copy for a PROFESSIONAL FIRM PRESENTATION for an M&A advisory firm.

CRITICAL TONE REQUIREMENTS:
- Authoritative: Confident, expertise-driven language
- Calm: No urgency, no pressure, measured and composed
- Non-commercial: This is NOT a sales pitch - professional introduction only
- Let credentials and track record speak for themselves
- Understated confidence, not aggressive positioning

STRICTLY FORBIDDEN:
- "We are the best/leading/top" (unless backed by specific ranking/award)
- "Partner with us today!" or any urgency-driven language
- Exclamation marks (!)
- Promotional or marketing language
- Vague claims like "world-class service", "unmatched expertise"
- "Why choose us" framing (too commercial)
- Superlatives without evidence

PREFERRED LANGUAGE:
- "We advise..." (factual, present tense)
- "Our approach centers on..." (methodological)
- "XX transactions completed since YYYY" (specific, verifiable)
- "Clients include..." (evidence-based)
- "Our process involves..." (structured, clear)
- "We focus on..." (scope definition)

STRICT RULES:
- Use ONLY the information provided in the inputs
- Do NOT invent statistics, client names, or transaction counts
- If data is missing, use general language rather than fabricating
- Language: Spanish (formal business Spanish)

CONTENT CONSTRAINTS:
- Headline: max 10 words, confident but measured
- Subline: max 15 words, provides context
- Bullets: max 12 words each, clear and specific
- Max 5 bullets per slide
- Stats must come ONLY from provided inputs`;
      }
      if (isClientDeck) {
        return `You are refining copy for a CLIENT-FACING ADVISORY PROCESS PRESENTATION.

CRITICAL TONE REQUIREMENTS:
- Clear: Simple, jargon-free language accessible to C-suite executives
- Reassuring: Build confidence, reduce anxiety about the process
- Structured: Logical flow, numbered phases, clear progression

This is an EDUCATIONAL document - the client needs to understand the process and feel confident.

STRICTLY FORBIDDEN:
- Technical M&A jargon without explanation
- Uncertainty or hedging ("we might", "hopefully", "if possible")
- Overwhelming detail or complexity
- Sales language or urgency ("act now", "limited time")
- Vague timelines or undefined responsibilities
- Exclamation marks

PREFERRED LANGUAGE:
- "We will..." (confident, future-oriented)
- "This phase ensures..." (benefit-focused)
- "Your team will..." (client-centered)
- "Together we will..." (partnership framing)
- "During weeks X-Y..." (specific timelines)
- Clear role assignments for each party

STRICT RULES:
- Use ONLY the information provided in the inputs
- Include specific timeframes where possible
- Clearly delineate advisor vs client responsibilities
- Language: Spanish (formal business Spanish)

CONTENT CONSTRAINTS:
- Headline: max 10 words, clear and direct
- Subline: max 15 words, sets expectations
- Bullets: max 12 words each, actionable and specific
- Max 5 bullets per slide
- Timeline items should include timeframe references`;
      }
      return `You are generating a professional M&A-grade presentation.

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
- Stats must come from provided inputs only`;
    };

    const systemPrompt = getSystemPrompt();
    const outputRequirements = `
OUTPUT REQUIREMENTS:
- Maintain the exact slide order and types from the outline
- Enhance headlines and sublines with professional M&A language
- Generate concrete bullet points based on provided information
- For stats slides, only include metrics that exist in inputs`;

    const userPrompt = isMASellTeaser 
      ? `Refine this confidential M&A sell-side teaser for sophisticated investors.

INPUTS PROVIDED:
${JSON.stringify(inputs_json, null, 2)}

SLIDES OUTLINE TO REFINE:
${JSON.stringify(outline_json, null, 2)}

${outputRequirements}

Generate sober, investor-grade copy. NO promotional language. Use ONLY provided data.`
      : `Generate final M&A-grade copy for this presentation.

INPUTS PROVIDED:
${JSON.stringify(inputs_json, null, 2)}

SLIDES OUTLINE TO REFINE:
${JSON.stringify(outline_json, null, 2)}

${outputRequirements}

For each slide, generate polished professional copy. Use only the information provided above.`;

    const toolSchema = {
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
              bullets: { type: "array", items: { type: "string" }, description: "Bullet points (max 12 words each, max 5 bullets)" },
              stats: {
                type: "array",
                items: {
                  type: "object",
                  properties: { value: { type: "string" }, label: { type: "string" } },
                  required: ["value", "label"],
                },
                description: "Key statistics (only from provided inputs)",
              },
              team_members: {
                type: "array",
                items: {
                  type: "object",
                  properties: { name: { type: "string" }, role: { type: "string" } },
                  required: ["name", "role"],
                },
                description: "Team members if applicable",
              },
              columns: {
                type: "array",
                items: {
                  type: "object",
                  properties: { title: { type: "string" }, content: { type: "string" } },
                  required: ["title", "content"],
                },
                description: "Columns for comparison slides",
              },
            },
            required: ["slide_index", "slide_type", "layout", "headline"],
          },
        },
      },
      required: ["slides"],
    };

    const result = await callAIWithToolCalling(
      systemPrompt, userPrompt,
      "refine_slides",
      "Return refined slides with M&A-grade professional copy",
      toolSchema
    );

    // Post-process to enforce constraints
    const refinedSlides = result.slides.map((slide: any) => {
      if (slide.headline) {
        const words = slide.headline.split(/\s+/);
        if (words.length > 10) slide.headline = words.slice(0, 10).join(" ");
      }
      if (slide.subline) {
        const words = slide.subline.split(/\s+/);
        if (words.length > 15) slide.subline = words.slice(0, 15).join(" ");
      }
      if (slide.bullets && Array.isArray(slide.bullets)) {
        slide.bullets = slide.bullets.slice(0, 5).map((bullet: string) => {
          const words = bullet.split(/\s+/);
          return words.length > 12 ? words.slice(0, 12).join(" ") : bullet;
        });
      }
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
    const message = error instanceof Error ? error.message : "Unknown error";
    const status = message.includes("Rate limit") ? 429 : message.includes("credits") ? 402 : 500;
    return new Response(
      JSON.stringify({ error: message }),
      { status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
