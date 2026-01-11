const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ApolloContactData {
  nombre: string;
  apellidos?: string;
  cargo?: string;
  email?: string;
  telefono?: string;
  empresa_nombre?: string;
  linkedin?: string;
  apollo_url: string;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { url } = await req.json();

    if (!url) {
      return new Response(
        JSON.stringify({ success: false, error: 'URL is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate Apollo URL
    if (!url.includes('apollo.io')) {
      return new Response(
        JSON.stringify({ success: false, error: 'URL must be an Apollo.io link' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const firecrawlKey = Deno.env.get('FIRECRAWL_API_KEY');
    const lovableKey = Deno.env.get('LOVABLE_API_KEY');

    if (!firecrawlKey) {
      console.error('FIRECRAWL_API_KEY not configured');
      return new Response(
        JSON.stringify({ success: false, error: 'Firecrawl connector not configured. Please enable it in Settings.' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!lovableKey) {
      console.error('LOVABLE_API_KEY not configured');
      return new Response(
        JSON.stringify({ success: false, error: 'Lovable AI not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Format URL
    let formattedUrl = url.trim();
    if (!formattedUrl.startsWith('http://') && !formattedUrl.startsWith('https://')) {
      formattedUrl = `https://${formattedUrl}`;
    }

    console.log('Scraping Apollo URL:', formattedUrl);

    // Step 1: Scrape the Apollo page using Firecrawl
    const scrapeResponse = await fetch('https://api.firecrawl.dev/v1/scrape', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${firecrawlKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url: formattedUrl,
        formats: ['markdown'],
        onlyMainContent: true,
        waitFor: 3000, // Apollo pages may need time to load
      }),
    });

    const scrapeData = await scrapeResponse.json();

    if (!scrapeResponse.ok || !scrapeData.success) {
      console.error('Firecrawl error:', scrapeData);
      return new Response(
        JSON.stringify({ success: false, error: scrapeData.error || 'Failed to scrape Apollo page' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const markdown = scrapeData.data?.markdown || scrapeData.markdown;
    if (!markdown) {
      return new Response(
        JSON.stringify({ success: false, error: 'No content extracted from page' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Page scraped, extracting contact data with AI...');

    // Step 2: Use AI to extract structured contact data
    const aiPrompt = `Extract contact information from this Apollo.io profile page content.

IMPORTANT: Return ONLY a valid JSON object with no additional text or explanation.

Return this exact JSON structure:
{
  "nombre": "First name only",
  "apellidos": "Last name(s)",
  "cargo": "Job title/position",
  "email": "Email address if visible, null if not",
  "telefono": "Phone number if visible, null if not",
  "empresa_nombre": "Company name",
  "linkedin": "LinkedIn profile URL if visible, null if not"
}

If a field is not found, use null for that field.
For "nombre", extract ONLY the first name.
For "apellidos", extract the rest of the name (last names).

Page content:
${markdown.substring(0, 8000)}`;

    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${lovableKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: 'You are a data extraction assistant. Extract contact information from Apollo.io profile pages and return ONLY valid JSON. No explanations or markdown formatting.' },
          { role: 'user', content: aiPrompt }
        ],
        temperature: 0.1,
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error('AI API error:', aiResponse.status, errorText);
      
      if (aiResponse.status === 429) {
        return new Response(
          JSON.stringify({ success: false, error: 'Rate limit exceeded. Please try again later.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      if (aiResponse.status === 402) {
        return new Response(
          JSON.stringify({ success: false, error: 'AI credits exhausted. Please add credits in Settings.' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      return new Response(
        JSON.stringify({ success: false, error: 'AI extraction failed' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const aiData = await aiResponse.json();
    const aiContent = aiData.choices?.[0]?.message?.content;

    if (!aiContent) {
      return new Response(
        JSON.stringify({ success: false, error: 'AI returned empty response' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Parse the AI response - handle possible markdown code blocks
    let extractedData: Partial<ApolloContactData>;
    try {
      let jsonStr = aiContent.trim();
      // Remove markdown code blocks if present
      if (jsonStr.startsWith('```json')) {
        jsonStr = jsonStr.replace(/^```json\n?/, '').replace(/\n?```$/, '');
      } else if (jsonStr.startsWith('```')) {
        jsonStr = jsonStr.replace(/^```\n?/, '').replace(/\n?```$/, '');
      }
      extractedData = JSON.parse(jsonStr);
    } catch (parseError) {
      console.error('Failed to parse AI response:', aiContent);
      return new Response(
        JSON.stringify({ success: false, error: 'Failed to parse extracted data' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate that we got at least a name
    if (!extractedData.nombre) {
      return new Response(
        JSON.stringify({ success: false, error: 'Could not extract contact name from page' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const result: ApolloContactData = {
      nombre: extractedData.nombre,
      apellidos: extractedData.apellidos || undefined,
      cargo: extractedData.cargo || undefined,
      email: extractedData.email || undefined,
      telefono: extractedData.telefono || undefined,
      empresa_nombre: extractedData.empresa_nombre || undefined,
      linkedin: extractedData.linkedin || undefined,
      apollo_url: formattedUrl,
    };

    console.log('Contact extracted successfully:', result.nombre, result.apellidos);

    return new Response(
      JSON.stringify({ success: true, data: result }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error extracting Apollo contact:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to extract contact';
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
