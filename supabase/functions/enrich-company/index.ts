import { getCorsHeaders, requireAuth } from '../_shared/auth.ts';

Deno.serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);

  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { user, error: authError } = await requireAuth(req, corsHeaders);
    if (authError) return authError;

    const { input } = await req.json();

    if (!input) {
      return new Response(
        JSON.stringify({ success: false, error: 'Input (name or URL) is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const firecrawlKey = Deno.env.get('FIRECRAWL_API_KEY');
    const lovableKey = Deno.env.get('LOVABLE_API_KEY');

    if (!firecrawlKey) {
      return new Response(
        JSON.stringify({ success: false, error: 'Firecrawl not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    if (!lovableKey) {
      return new Response(
        JSON.stringify({ success: false, error: 'AI not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const isUrl = input.startsWith('http://') || input.startsWith('https://') || input.includes('.');
    let urlToScrape = input;

    // If not a URL, search for the company website first
    if (!isUrl) {
      console.log('Searching for company:', input);
      
      const searchResponse = await fetch('https://api.firecrawl.dev/v1/search', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${firecrawlKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: `${input} company website`,
          limit: 3,
        }),
      });

      const searchData = await searchResponse.json();
      
      if (!searchResponse.ok || !searchData.success || !searchData.data?.length) {
        console.log('Search failed, will try direct scrape');
        // Try constructing a URL from the company name
        urlToScrape = `https://${input.toLowerCase().replace(/\s+/g, '')}.com`;
      } else {
        // Use the first result
        urlToScrape = searchData.data[0].url;
        console.log('Found URL:', urlToScrape);
      }
    }

    // Format URL
    if (!urlToScrape.startsWith('http://') && !urlToScrape.startsWith('https://')) {
      urlToScrape = `https://${urlToScrape}`;
    }

    console.log('Scraping URL:', urlToScrape);

    // Scrape the website
    const scrapeResponse = await fetch('https://api.firecrawl.dev/v1/scrape', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${firecrawlKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url: urlToScrape,
        formats: ['markdown'],
        onlyMainContent: true,
      }),
    });

    const scrapeData = await scrapeResponse.json();

    if (!scrapeResponse.ok || !scrapeData.success) {
      console.error('Scrape failed:', scrapeData);
      return new Response(
        JSON.stringify({ success: false, error: 'Could not scrape website' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const markdown = scrapeData.data?.markdown || '';
    const metadata = scrapeData.data?.metadata || {};

    if (!markdown || markdown.length < 100) {
      return new Response(
        JSON.stringify({ success: false, error: 'No content found on website' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Content scraped, sending to AI for extraction...');

    // Use AI to extract structured data
    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${lovableKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'openai/gpt-5-nano',
        messages: [
          {
            role: 'system',
            content: `You are a business data extraction expert. Extract company and contact information from website content.
Always respond with valid JSON only, no markdown formatting or code blocks.`
          },
          {
            role: 'user',
            content: `Extract company information from this website content. Return a JSON object with these fields:

{
  "nombre": "Company name",
  "descripcion": "Brief company description (1-2 sentences)",
  "sector": "Industry sector (e.g., Technology, Retail, Services, Industrial, Healthcare)",
  "empleados": number or null,
  "sitio_web": "Website URL",
  "ubicacion": "Location/headquarters",
  "linkedin": "LinkedIn company page URL or null",
  "twitter": "Twitter/X URL or null",
  "contactos": [
    {
      "nombre": "Full name",
      "cargo": "Position/title",
      "email": "Email if found",
      "linkedin": "LinkedIn profile URL if found"
    }
  ]
}

Website URL: ${urlToScrape}
Website title: ${metadata.title || 'Unknown'}

Content:
${markdown.slice(0, 8000)}`
          }
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "extract_company_data",
              description: "Extract structured company data from website content",
              parameters: {
                type: "object",
                properties: {
                  nombre: { type: "string", description: "Company name" },
                  descripcion: { type: "string", description: "Brief company description" },
                  sector: { type: "string", description: "Industry sector" },
                  empleados: { type: ["number", "null"], description: "Number of employees" },
                  sitio_web: { type: "string", description: "Website URL" },
                  ubicacion: { type: "string", description: "Location/headquarters" },
                  linkedin: { type: ["string", "null"], description: "LinkedIn company URL" },
                  twitter: { type: ["string", "null"], description: "Twitter URL" },
                  contactos: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        nombre: { type: "string" },
                        cargo: { type: "string" },
                        email: { type: ["string", "null"] },
                        linkedin: { type: ["string", "null"] }
                      },
                      required: ["nombre"]
                    }
                  }
                },
                required: ["nombre", "sitio_web"]
              }
            }
          }
        ],
        tool_choice: { type: "function", function: { name: "extract_company_data" } }
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error('AI API error:', aiResponse.status, errorText);
      
      if (aiResponse.status === 429) {
        return new Response(
          JSON.stringify({ success: false, error: 'Rate limit exceeded, please try again later' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      if (aiResponse.status === 402) {
        return new Response(
          JSON.stringify({ success: false, error: 'AI credits exhausted' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      return new Response(
        JSON.stringify({ success: false, error: 'AI processing failed' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const aiData = await aiResponse.json();
    
    // Extract from tool call
    let extractedData = null;
    
    const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
    if (toolCall?.function?.arguments) {
      try {
        extractedData = JSON.parse(toolCall.function.arguments);
      } catch (e) {
        console.error('Failed to parse tool call arguments:', e);
      }
    }

    // Fallback: try to parse from message content
    if (!extractedData && aiData.choices?.[0]?.message?.content) {
      try {
        const content = aiData.choices[0].message.content;
        // Try to extract JSON from markdown code blocks
        const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/);
        if (jsonMatch) {
          extractedData = JSON.parse(jsonMatch[1].trim());
        } else {
          extractedData = JSON.parse(content);
        }
      } catch (e) {
        console.error('Failed to parse AI response:', e);
      }
    }

    if (!extractedData) {
      return new Response(
        JSON.stringify({ success: false, error: 'Could not extract data from website' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Ensure sitio_web is set
    if (!extractedData.sitio_web) {
      extractedData.sitio_web = urlToScrape;
    }

    console.log('Data extracted successfully:', extractedData.nombre);

    return new Response(
      JSON.stringify({ success: true, data: extractedData }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error enriching company:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
