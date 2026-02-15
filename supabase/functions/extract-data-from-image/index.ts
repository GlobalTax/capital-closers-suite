import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { getCorsHeaders, requireAuth } from '../_shared/auth.ts';

interface ExtractedData {
  empresa: {
    nombre: string | null;
    cif: string | null;
    sector: string | null;
    sitio_web: string | null;
    empleados: number | null;
    facturacion: number | null;
    ebitda: number | null;
    direccion: string | null;
    pais: string | null;
  };
  contacto: {
    nombre: string | null;
    apellidos: string | null;
    email: string | null;
    telefono: string | null;
    cargo: string | null;
    linkedin: string | null;
  };
}

serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { user, error: authError } = await requireAuth(req, corsHeaders);
    if (authError) return authError;

    const { imageBase64, imageUrl } = await req.json();
    
    if (!imageBase64 && !imageUrl) {
      return new Response(
        JSON.stringify({ error: "Se requiere imageBase64 o imageUrl" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY no está configurada");
    }

    // Preparar el contenido de la imagen
    const imageContent = imageBase64 
      ? { type: "image_url", image_url: { url: `data:image/png;base64,${imageBase64}` } }
      : { type: "image_url", image_url: { url: imageUrl } };

    const systemPrompt = `Eres un experto extrayendo datos de capturas de pantalla de CRMs y fichas de empresas/contactos.
Analiza la imagen y extrae TODA la información de empresas y contactos que veas.

Campos a extraer:
- EMPRESA: nombre, CIF/NIF, sector/industria, sitio web, número de empleados, facturación anual (en euros), EBITDA, dirección, país
- CONTACTO: nombre, apellidos, email, teléfono, cargo/posición, LinkedIn

Reglas:
- Si un campo no está visible o no puedes determinarlo, devuelve null
- Para números (empleados, facturación, EBITDA), devuelve solo el número sin formato
- Para emails y URLs, devuelve el texto completo
- Si ves múltiples contactos, extrae el primero o el principal
- Busca en todas las áreas de la imagen: cabeceras, sidebars, campos de formulario, etc.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "openai/gpt-5-nano",
        messages: [
          { role: "system", content: systemPrompt },
          { 
            role: "user", 
            content: [
              { type: "text", text: "Extrae los datos de empresa y contacto de esta imagen." },
              imageContent
            ]
          }
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "extract_data",
              description: "Extrae datos estructurados de empresa y contacto desde una imagen",
              parameters: {
                type: "object",
                properties: {
                  empresa: {
                    type: "object",
                    properties: {
                      nombre: { type: "string", description: "Nombre de la empresa" },
                      cif: { type: "string", description: "CIF o NIF de la empresa" },
                      sector: { type: "string", description: "Sector o industria" },
                      sitio_web: { type: "string", description: "URL del sitio web" },
                      empleados: { type: "number", description: "Número de empleados" },
                      facturacion: { type: "number", description: "Facturación anual en euros" },
                      ebitda: { type: "number", description: "EBITDA en euros" },
                      direccion: { type: "string", description: "Dirección física" },
                      pais: { type: "string", description: "País" }
                    }
                  },
                  contacto: {
                    type: "object",
                    properties: {
                      nombre: { type: "string", description: "Nombre del contacto" },
                      apellidos: { type: "string", description: "Apellidos del contacto" },
                      email: { type: "string", description: "Email del contacto" },
                      telefono: { type: "string", description: "Teléfono del contacto" },
                      cargo: { type: "string", description: "Cargo o posición" },
                      linkedin: { type: "string", description: "URL de LinkedIn" }
                    }
                  }
                },
                required: ["empresa", "contacto"]
              }
            }
          }
        ],
        tool_choice: { type: "function", function: { name: "extract_data" } }
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Error de Lovable AI:", response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Límite de peticiones excedido. Inténtalo más tarde." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Créditos agotados. Añade fondos en Lovable." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      throw new Error(`Error de IA: ${response.status}`);
    }

    const aiResponse = await response.json();
    console.log("Respuesta AI:", JSON.stringify(aiResponse, null, 2));

    // Extraer los datos del tool call
    const toolCall = aiResponse.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall || toolCall.function.name !== "extract_data") {
      throw new Error("La IA no devolvió datos estructurados");
    }

    const extractedData: ExtractedData = JSON.parse(toolCall.function.arguments);

    // Limpiar y validar datos
    const cleanedData: ExtractedData = {
      empresa: {
        nombre: extractedData.empresa?.nombre || null,
        cif: extractedData.empresa?.cif || null,
        sector: extractedData.empresa?.sector || null,
        sitio_web: extractedData.empresa?.sitio_web || null,
        empleados: extractedData.empresa?.empleados || null,
        facturacion: extractedData.empresa?.facturacion || null,
        ebitda: extractedData.empresa?.ebitda || null,
        direccion: extractedData.empresa?.direccion || null,
        pais: extractedData.empresa?.pais || null,
      },
      contacto: {
        nombre: extractedData.contacto?.nombre || null,
        apellidos: extractedData.contacto?.apellidos || null,
        email: extractedData.contacto?.email || null,
        telefono: extractedData.contacto?.telefono || null,
        cargo: extractedData.contacto?.cargo || null,
        linkedin: extractedData.contacto?.linkedin || null,
      }
    };

    console.log("Datos extraídos:", JSON.stringify(cleanedData, null, 2));

    return new Response(
      JSON.stringify({ 
        success: true, 
        data: cleanedData,
        message: "Datos extraídos correctamente"
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Error en extract-data-from-image:", error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : "Error desconocido",
        success: false 
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
