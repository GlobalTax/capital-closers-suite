import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getCorsHeaders, requireAuth } from '../_shared/auth.ts';

interface Sector {
  id: string;
  name_es: string;
  slug: string;
}

interface EnrichedCompanyData {
  nombre: string;
  descripcion?: string;
  actividades_destacadas?: string[];
  cnae_codigo?: string;
  cnae_descripcion?: string;
  sector?: string;
  sector_id?: string;
  sector_confianza?: 'alto' | 'medio' | 'bajo';
  empleados?: number;
  sitio_web?: string;
  ubicacion?: string;
  linkedin?: string;
  twitter?: string;
  fuente: string;
  contactos: Array<{
    nombre: string;
    cargo?: string;
    email?: string;
    linkedin?: string;
  }>;
}

// Priority sources for company data
const EMPRESITE_BASE = 'https://empresite.eleconomista.es';

Deno.serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);

  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { user, error: authError } = await requireAuth(req, corsHeaders);
    if (authError) return authError;

    const { input, manualUrl } = await req.json();

    if (!input && !manualUrl) {
      return new Response(
        JSON.stringify({ success: false, error: 'Se requiere nombre de empresa o URL' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const firecrawlKey = Deno.env.get('FIRECRAWL_API_KEY');
    const lovableKey = Deno.env.get('LOVABLE_API_KEY');
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!firecrawlKey || !lovableKey) {
      return new Response(
        JSON.stringify({ success: false, error: 'API keys not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Initialize Supabase client to get sectors
    const supabase = createClient(supabaseUrl!, supabaseKey!);
    
    // Get all active sectors from CR Directory
    const { data: sectorsData, error: sectorsError } = await supabase
      .from('sectors')
      .select('id, name_es, slug')
      .eq('is_active', true)
      .order('name_es');

    if (sectorsError) {
      console.error('Error fetching sectors:', sectorsError);
    }

    const sectors: Sector[] = sectorsData || [];
    const sectorNames = sectors.map(s => s.name_es);

    // Determine URL to scrape
    let urlToScrape: string | null = null;
    let sourceType = '';

    // Priority 1: Manual URL provided
    if (manualUrl) {
      urlToScrape = manualUrl.startsWith('http') ? manualUrl : `https://${manualUrl}`;
      sourceType = 'manual';
      console.log('Using manual URL:', urlToScrape);
    }
    // Priority 2: Input is already a URL
    else if (input.startsWith('http://') || input.startsWith('https://')) {
      urlToScrape = input;
      sourceType = 'direct';
      console.log('Using direct URL:', urlToScrape);
    }
    // Priority 3: Search on Empresite first
    else {
      const companySlug = input.toUpperCase().replace(/\s+/g, '-').replace(/[^A-Z0-9-]/g, '');
      const empresiteUrl = `${EMPRESITE_BASE}/${companySlug}`;
      
      console.log('Trying Empresite:', empresiteUrl);
      
      // Try to scrape Empresite first
      const empresiteResponse = await fetch('https://api.firecrawl.dev/v1/scrape', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${firecrawlKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          url: empresiteUrl,
          formats: ['markdown'],
          onlyMainContent: true,
        }),
      });

      const empresiteData = await empresiteResponse.json();

      if (empresiteResponse.ok && empresiteData.success && empresiteData.data?.markdown?.length > 200) {
        urlToScrape = empresiteUrl;
        sourceType = 'empresite';
        console.log('Found on Empresite');
      } else {
        // Priority 4: Search for company website
        console.log('Not found on Empresite, searching web...');
        
        const searchResponse = await fetch('https://api.firecrawl.dev/v1/search', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${firecrawlKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            query: `${input} empresa España sitio oficial`,
            limit: 3,
          }),
        });

        const searchData = await searchResponse.json();

        if (searchResponse.ok && searchData.success && searchData.data?.length) {
          // Filter out social media and directories, prefer company sites
          const validResults = searchData.data.filter((r: any) => 
            !r.url.includes('linkedin.com') && 
            !r.url.includes('facebook.com') &&
            !r.url.includes('twitter.com')
          );
          
          if (validResults.length > 0) {
            urlToScrape = validResults[0].url;
            sourceType = 'web_search';
            console.log('Found via search:', urlToScrape);
          }
        }
      }
    }

    if (!urlToScrape) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'No se encontró información. Proporciona una URL directa.',
          requireManualUrl: true
        }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Scrape the resolved URL
    console.log('Scraping:', urlToScrape);
    
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
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'No se pudo acceder a la página',
          requireManualUrl: true
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const markdown = scrapeData.data?.markdown || '';
    const metadata = scrapeData.data?.metadata || {};

    if (!markdown || markdown.length < 100) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Contenido insuficiente en la página',
          requireManualUrl: true
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Content scraped, extracting data with AI...');

    // Step 1: Extract company profile with strict instructions
    const extractionResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${lovableKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'openai/gpt-5-mini',
        messages: [
          {
            role: 'system',
            content: `Eres un analista de inteligencia empresarial español especializado en extraer datos verificables de fuentes web.

REGLAS ESTRICTAS:
1. SOLO extrae información que esté EXPLÍCITAMENTE presente en el texto
2. NO inventes descripciones genéricas
3. Si un dato no aparece, devuelve null - NUNCA inventes
4. Las actividades deben ser las REALES encontradas en la fuente
5. El CNAE solo si aparece explícitamente con su código
6. La descripción debe ser un RESUMEN FIEL del texto, no una inferencia

FORMATO DE DESCRIPCIÓN:
- Máximo 2-3 frases
- Basada únicamente en lo que dice el texto
- Sin adjetivos genéricos como "líder", "innovador" si no están en la fuente`
          },
          {
            role: 'user',
            content: `Extrae información de esta empresa.

URL: ${urlToScrape}
Título: ${metadata.title || 'Desconocido'}

Contenido:
${markdown.slice(0, 10000)}`
          }
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "extract_company_profile",
              description: "Extrae perfil estructurado de empresa basado únicamente en el contenido proporcionado",
              parameters: {
                type: "object",
                properties: {
                  nombre: { 
                    type: "string", 
                    description: "Nombre de la empresa" 
                  },
                  descripcion: { 
                    type: ["string", "null"], 
                    description: "Resumen fiel del texto. NULL si no hay información suficiente" 
                  },
                  actividades_destacadas: {
                    type: "array",
                    items: { type: "string" },
                    description: "Lista de actividades/servicios REALES descritos en la fuente (máximo 5)"
                  },
                  cnae_codigo: { 
                    type: ["string", "null"], 
                    description: "Código CNAE si aparece explícitamente. NULL si no" 
                  },
                  cnae_descripcion: {
                    type: ["string", "null"],
                    description: "Descripción del CNAE si aparece"
                  },
                  empleados: { 
                    type: ["number", "null"], 
                    description: "Número de empleados si aparece" 
                  },
                  sitio_web: { 
                    type: ["string", "null"], 
                    description: "URL del sitio web" 
                  },
                  ubicacion: { 
                    type: ["string", "null"], 
                    description: "Ubicación/sede si aparece" 
                  },
                  linkedin: { 
                    type: ["string", "null"], 
                    description: "URL de LinkedIn de la empresa" 
                  },
                  twitter: { 
                    type: ["string", "null"], 
                    description: "URL de Twitter/X" 
                  },
                  contactos: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        nombre: { type: "string" },
                        cargo: { type: ["string", "null"] },
                        email: { type: ["string", "null"] },
                        linkedin: { type: ["string", "null"] }
                      },
                      required: ["nombre"]
                    },
                    description: "Personas de contacto encontradas"
                  }
                },
                required: ["nombre"]
              }
            }
          }
        ],
        tool_choice: { type: "function", function: { name: "extract_company_profile" } }
      }),
    });

    if (!extractionResponse.ok) {
      const errorText = await extractionResponse.text();
      console.error('AI extraction error:', errorText);
      return new Response(
        JSON.stringify({ success: false, error: 'Error en extracción de datos' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const extractionData = await extractionResponse.json();
    const extractionToolCall = extractionData.choices?.[0]?.message?.tool_calls?.[0];
    
    let extractedProfile: any = null;
    if (extractionToolCall?.function?.arguments) {
      try {
        extractedProfile = JSON.parse(extractionToolCall.function.arguments);
      } catch (e) {
        console.error('Failed to parse extraction:', e);
      }
    }

    if (!extractedProfile?.nombre) {
      return new Response(
        JSON.stringify({ success: false, error: 'No se pudo extraer información de la empresa' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Step 2: Classify sector using CR Directory
    let sectorResult = { sector: 'Otros', sector_id: null as string | null, confianza: 'bajo' as const };

    if (sectors.length > 0 && (extractedProfile.descripcion || extractedProfile.actividades_destacadas?.length)) {
      const classificationResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${lovableKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'openai/gpt-5-mini',
          messages: [
            {
              role: 'system',
              content: `Eres un clasificador sectorial estricto para un CRM de M&A.

SECTORES VÁLIDOS (usar EXACTAMENTE estos nombres):
${sectorNames.join('\n')}

REGLAS OBLIGATORIAS:
1. SOLO puedes usar sectores de la lista anterior - NUNCA inventes otros
2. Si no hay match claro, devuelve "Otros" si existe, o el más cercano
3. Basa la clasificación en la actividad REAL, no en el nombre comercial
4. El CNAE es la mejor guía si está disponible`
            },
            {
              role: 'user',
              content: `Clasifica esta empresa:

Descripción: ${extractedProfile.descripcion || 'No disponible'}
Actividades: ${(extractedProfile.actividades_destacadas || []).join(', ') || 'No disponible'}
CNAE: ${extractedProfile.cnae_codigo ? `${extractedProfile.cnae_codigo} - ${extractedProfile.cnae_descripcion || ''}` : 'No especificado'}`
            }
          ],
          tools: [
            {
              type: "function",
              function: {
                name: "classify_sector",
                description: "Clasifica la empresa en uno de los sectores válidos del CR Directory",
                parameters: {
                  type: "object",
                  properties: {
                    sector_principal: {
                      type: "string",
                      enum: sectorNames,
                      description: "Sector principal de la empresa (DEBE ser de la lista)"
                    },
                    confianza: {
                      type: "string",
                      enum: ["alto", "medio", "bajo"],
                      description: "Nivel de confianza en la clasificación"
                    },
                    justificacion: {
                      type: "string",
                      description: "Breve justificación de la clasificación"
                    }
                  },
                  required: ["sector_principal", "confianza"]
                }
              }
            }
          ],
          tool_choice: { type: "function", function: { name: "classify_sector" } }
        }),
      });

      if (classificationResponse.ok) {
        const classificationData = await classificationResponse.json();
        const classToolCall = classificationData.choices?.[0]?.message?.tool_calls?.[0];
        
        if (classToolCall?.function?.arguments) {
          try {
            const classification = JSON.parse(classToolCall.function.arguments);
            const matchedSector = sectors.find(s => s.name_es === classification.sector_principal);
            
            if (matchedSector) {
              sectorResult = {
                sector: matchedSector.name_es,
                sector_id: matchedSector.id,
                confianza: classification.confianza || 'medio'
              };
            }
          } catch (e) {
            console.error('Failed to parse classification:', e);
          }
        }
      }
    }

    // Build final response
    const result: EnrichedCompanyData = {
      nombre: extractedProfile.nombre,
      descripcion: extractedProfile.descripcion || undefined,
      actividades_destacadas: extractedProfile.actividades_destacadas?.length > 0 
        ? extractedProfile.actividades_destacadas.slice(0, 5) 
        : undefined,
      cnae_codigo: extractedProfile.cnae_codigo || undefined,
      cnae_descripcion: extractedProfile.cnae_descripcion || undefined,
      sector: sectorResult.sector,
      sector_id: sectorResult.sector_id || undefined,
      sector_confianza: sectorResult.confianza,
      empleados: extractedProfile.empleados || undefined,
      sitio_web: extractedProfile.sitio_web || urlToScrape,
      ubicacion: extractedProfile.ubicacion || undefined,
      linkedin: extractedProfile.linkedin || undefined,
      twitter: extractedProfile.twitter || undefined,
      fuente: urlToScrape,
      contactos: extractedProfile.contactos || []
    };

    console.log('Enrichment complete:', result.nombre, '- Sector:', result.sector);

    return new Response(
      JSON.stringify({ 
        success: true, 
        data: result,
        sourceType
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in enrich-company-v2:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Error desconocido' 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
