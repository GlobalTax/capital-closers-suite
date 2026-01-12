const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { image } = await req.json();

    if (!image) {
      return new Response(
        JSON.stringify({ error: "Se requiere una imagen" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!LOVABLE_API_KEY) {
      return new Response(
        JSON.stringify({ error: "LOVABLE_API_KEY no configurada" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const prompt = `Eres un experto contable analizando estados financieros españoles.
Extrae TODOS los datos disponibles de la Cuenta de Pérdidas y Ganancias (PyG) y/o Balance de Situación de esta imagen.

INSTRUCCIONES:
1. Identifica el año fiscal al que corresponden los datos
2. Todos los valores deben ser numéricos (sin puntos de miles, usar punto para decimales)
3. Los gastos deben ser valores POSITIVOS (el sistema los tratará como negativos)
4. Si hay varios años, extrae el más reciente

Responde SOLO con un JSON válido con esta estructura:
{
  "year": 2024,
  "period_type": "annual",
  "pyg": {
    "revenue": null,
    "other_income": null,
    "cost_of_sales": null,
    "gross_margin": null,
    "personnel_expenses": null,
    "other_operating_expenses": null,
    "ebitda": null,
    "depreciation_amortization": null,
    "ebit": null,
    "financial_result": null,
    "ebt": null,
    "taxes": null,
    "net_income": null
  },
  "balance": {
    "intangible_assets": null,
    "tangible_assets": null,
    "financial_assets": null,
    "inventories": null,
    "trade_receivables": null,
    "cash_equivalents": null,
    "other_current_assets": null,
    "share_capital": null,
    "reserves": null,
    "retained_earnings": null,
    "long_term_debt": null,
    "other_non_current_liabilities": null,
    "short_term_debt": null,
    "trade_payables": null,
    "other_current_liabilities": null
  }
}

Rellena solo los campos que puedas identificar con certeza. Deja null los demás.`;

    // Clean base64 if it has data URL prefix
    const base64Data = image.replace(/^data:image\/\w+;base64,/, "");
    
    // Determine MIME type from base64 prefix or default to jpeg
    const mimeMatch = image.match(/^data:(image\/\w+);base64,/);
    const mimeType = mimeMatch ? mimeMatch[1] : "image/jpeg";

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "openai/gpt-5-nano",
        messages: [
          { role: "system", content: prompt },
          { 
            role: "user", 
            content: [
              { type: "text", text: "Extrae los datos financieros de esta imagen." },
              { 
                type: "image_url", 
                image_url: { 
                  url: `data:${mimeType};base64,${base64Data}` 
                } 
              }
            ]
          }
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Lovable AI API error:", errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Límite de peticiones excedido, intente más tarde" }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Créditos insuficientes en Lovable AI" }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      throw new Error(`Lovable AI API error: ${response.status}`);
    }

    const result = await response.json();
    const textContent = result.choices?.[0]?.message?.content;

    if (!textContent) {
      throw new Error("No se pudo extraer contenido de la respuesta");
    }

    // Parse JSON from response (handle markdown code blocks)
    let extractedData;
    try {
      const jsonMatch = textContent.match(/```json\s*([\s\S]*?)\s*```/) || 
                        textContent.match(/```\s*([\s\S]*?)\s*```/) ||
                        [null, textContent];
      const jsonStr = jsonMatch[1] || textContent;
      extractedData = JSON.parse(jsonStr.trim());
    } catch (parseError) {
      console.error("Error parsing JSON:", textContent);
      throw new Error("Error al parsear la respuesta de IA");
    }

    return new Response(
      JSON.stringify({ success: true, data: extractedData }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: unknown) {
    const errMsg = error instanceof Error ? error.message : "Error interno del servidor";
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ error: errMsg }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
