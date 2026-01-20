import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { slides_json } = await req.json();

    if (!slides_json || !Array.isArray(slides_json) || slides_json.length === 0) {
      return new Response(
        JSON.stringify({ error: 'slides_json must be a non-empty array' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    const systemPrompt = `You are a senior investment banking editor.

Rewrite the slide content to:
- Remove marketing language (no superlatives, no exclamation marks, no hype)
- Increase clarity and precision (shorter sentences, active voice)
- Reduce text density (be concise, eliminate redundancy)
- Improve consistency of terminology (maintain glossary within session)
- Maintain calm, confident tone (professional, sober, understated)

IMPORTANT:
- Do NOT add new facts
- Do NOT modify numbers, percentages, or scope
- Preserve all numerical data exactly as provided
- If content is already concise and professional, make minimal changes
- Output must be in the same language as the input (typically Spanish)

Examples of improvements:
- "Somos líderes indiscutibles del mercado con una impresionante cuota del 35%" → "Participación de mercado del 35%"
- "Nuestra increíble trayectoria de crecimiento!" → "Crecimiento sostenido desde 2018"
- "El mejor equipo del sector" → "Equipo directivo con 50+ años de experiencia combinada"`;

    const userPrompt = `Polish the following slides. Return updated slides JSON only.

Slides JSON:
${JSON.stringify(slides_json, null, 2)}`;

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        tools: [
          {
            type: 'function',
            function: {
              name: 'polish_slides',
              description: 'Return polished slide content with improved clarity and professional tone',
              parameters: {
                type: 'object',
                properties: {
                  slides: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        slide_index: { type: 'number', description: 'Zero-based index of the slide' },
                        headline: { type: 'string', description: 'Polished headline (max 10 words)' },
                        subline: { type: 'string', description: 'Polished subline (optional)' },
                        bullets: {
                          type: 'array',
                          items: { type: 'string' },
                          description: 'Polished bullet points (max 12 words each, max 5 bullets)'
                        },
                        stats: {
                          type: 'array',
                          items: {
                            type: 'object',
                            properties: {
                              value: { type: 'string' },
                              label: { type: 'string' },
                              prefix: { type: 'string' },
                              suffix: { type: 'string' }
                            },
                            required: ['value', 'label']
                          },
                          description: 'Statistics with polished labels (preserve values exactly)'
                        },
                        bodyText: { type: 'string', description: 'Polished body text' },
                        teamMembers: {
                          type: 'array',
                          items: {
                            type: 'object',
                            properties: {
                              name: { type: 'string' },
                              role: { type: 'string' }
                            },
                            required: ['name', 'role']
                          }
                        },
                        columns: {
                          type: 'array',
                          items: {
                            type: 'object',
                            properties: {
                              title: { type: 'string' },
                              items: { type: 'array', items: { type: 'string' } }
                            }
                          }
                        }
                      },
                      required: ['slide_index', 'headline']
                    }
                  }
                },
                required: ['slides'],
                additionalProperties: false
              }
            }
          }
        ],
        tool_choice: { type: 'function', function: { name: 'polish_slides' } }
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Rate limit exceeded. Please try again later.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: 'AI credits exhausted. Please add credits to continue.' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      const errorText = await response.text();
      console.error('AI Gateway error:', response.status, errorText);
      throw new Error(`AI Gateway error: ${response.status}`);
    }

    const data = await response.json();
    
    // Extract tool call result
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall || toolCall.function.name !== 'polish_slides') {
      throw new Error('Unexpected AI response format');
    }

    const result = JSON.parse(toolCall.function.arguments);
    
    // Post-process to enforce constraints
    const polishedSlides = result.slides.map((slide: any, idx: number) => {
      // Enforce headline word limit
      if (slide.headline) {
        const words = slide.headline.split(/\s+/);
        if (words.length > 10) {
          slide.headline = words.slice(0, 10).join(' ');
        }
      }

      // Enforce bullet constraints
      if (slide.bullets && Array.isArray(slide.bullets)) {
        slide.bullets = slide.bullets.slice(0, 5).map((bullet: string) => {
          const words = bullet.split(/\s+/);
          return words.length > 12 ? words.slice(0, 12).join(' ') : bullet;
        });
      }

      // Enforce stats limit
      if (slide.stats && Array.isArray(slide.stats)) {
        slide.stats = slide.stats.slice(0, 6);
      }

      return slide;
    });

    return new Response(
      JSON.stringify({ slides: polishedSlides }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('polish-slides error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
