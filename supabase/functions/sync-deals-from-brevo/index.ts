import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface BrevoDeal {
  id: string;
  attributes: {
    deal_name?: string;
    deal_stage?: string;
    amount?: number;
    close_date?: string;
    deal_owner?: string;
    pipeline?: string;
  };
  linkedCompaniesIds?: string[];
  linkedContactsIds?: number[];
}

interface SyncResult {
  totalDeals: number;
  mandatosCreated: number;
  mandatosUpdated: number;
  empresasCreated: number;
  empresasLinked: number;
  errors: string[];
}

// Map Brevo stages to pipeline stages
function mapBrevoStage(brevoStage: string): { pipeline_stage: string; tipo: string; estado: string } {
  const stageLower = brevoStage?.toLowerCase() || '';
  
  if (stageLower.includes('lead venta') || stageLower.includes('gestión venta')) {
    return { pipeline_stage: 'prospeccion', tipo: 'venta', estado: 'activo' };
  }
  if (stageLower.includes('lead compra')) {
    return { pipeline_stage: 'prospeccion', tipo: 'compra', estado: 'activo' };
  }
  if (stageLower.includes('negociación') || stageLower.includes('negociacion')) {
    return { pipeline_stage: 'negociacion', tipo: 'venta', estado: 'activo' };
  }
  if (stageLower.includes('propuesta')) {
    return { pipeline_stage: 'propuesta', tipo: 'venta', estado: 'activo' };
  }
  if (stageLower.includes('cerrado ganado') || stageLower.includes('won')) {
    return { pipeline_stage: 'cierre', tipo: 'venta', estado: 'cerrado_exito' };
  }
  if (stageLower.includes('cerrado perdido') || stageLower.includes('lost')) {
    return { pipeline_stage: 'cierre', tipo: 'venta', estado: 'cerrado_fracaso' };
  }
  if (stageLower.includes('compra')) {
    return { pipeline_stage: 'prospeccion', tipo: 'compra', estado: 'activo' };
  }
  if (stageLower.includes('venta')) {
    return { pipeline_stage: 'prospeccion', tipo: 'venta', estado: 'activo' };
  }
  
  // Default
  return { pipeline_stage: 'prospeccion', tipo: 'venta', estado: 'activo' };
}

// Extract company name from deal name
function extractCompanyName(dealName: string): string {
  if (!dealName) return 'Sin nombre';
  
  let name = dealName;
  
  // Remove numeric prefix like "65 - "
  name = name.replace(/^\d+\s*-\s*/, '');
  
  // Remove suffix " - Proceso de Venta/Compra"
  name = name.replace(/\s*-\s*Proceso de (Venta|Compra)$/i, '');
  
  // Remove common suffixes
  name = name.replace(/\s*(SL|SA|SLU|S\.L\.|S\.A\.)?\s*$/i, '').trim();
  
  // If there's "<>", take first part
  if (name.includes('<>')) {
    name = name.split('<>')[0].trim();
  }
  
  // If there's " - " remaining, take the first meaningful part
  if (name.includes(' - ')) {
    const parts = name.split(' - ');
    name = parts[0].trim();
  }
  
  return name || dealName;
}

async function fetchAllBrevoDeals(apiKey: string): Promise<BrevoDeal[]> {
  const allDeals: BrevoDeal[] = [];
  let offset = 0;
  const limit = 50;
  let hasMore = true;

  console.log('Starting to fetch deals from Brevo...');

  while (hasMore) {
    const response = await fetch(
      `https://api.brevo.com/v3/crm/deals?limit=${limit}&offset=${offset}`,
      {
        headers: {
          'api-key': apiKey,
          'Accept': 'application/json',
        },
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Brevo API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    const deals = data.items || [];
    
    console.log(`Fetched ${deals.length} deals at offset ${offset}`);
    
    allDeals.push(...deals);

    if (deals.length < limit) {
      hasMore = false;
    } else {
      offset += limit;
    }
  }

  console.log(`Total deals fetched: ${allDeals.length}`);
  return allDeals;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const brevoApiKey = Deno.env.get("BREVO_API_KEY");

    if (!brevoApiKey) {
      throw new Error("BREVO_API_KEY not configured");
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Check if sync is enabled
    const { data: syncControl } = await supabase
      .from('sync_control')
      .select('is_enabled')
      .eq('id', 'sync-deals-from-brevo')
      .single();

    if (syncControl && !syncControl.is_enabled) {
      console.log('[sync-deals-from-brevo] Sync is disabled, skipping...');
      return new Response(JSON.stringify({ 
        skipped: true, 
        reason: 'Sync disabled via control panel' 
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    const result: SyncResult = {
      totalDeals: 0,
      mandatosCreated: 0,
      mandatosUpdated: 0,
      empresasCreated: 0,
      empresasLinked: 0,
      errors: [],
    };

    // Fetch all deals from Brevo
    const deals = await fetchAllBrevoDeals(brevoApiKey);
    result.totalDeals = deals.length;

    console.log(`Processing ${deals.length} deals...`);

    for (const deal of deals) {
      try {
        const dealId = deal.id;
        const dealName = deal.attributes?.deal_name || `Deal ${dealId}`;
        const dealStage = deal.attributes?.deal_stage || '';
        const amount = deal.attributes?.amount || null;
        const closeDate = deal.attributes?.close_date || null;
        
        console.log(`Processing deal: ${dealName} (ID: ${dealId})`);

        // Map Brevo stage to our pipeline
        const { pipeline_stage, tipo, estado } = mapBrevoStage(dealStage);

        // Extract company name from deal name
        const companyName = extractCompanyName(dealName);

        // Check if mandato already exists
        const { data: existingMandato } = await supabase
          .from('mandatos')
          .select('id')
          .eq('brevo_deal_id', dealId)
          .maybeSingle();

        let mandatoId: string;

        if (existingMandato) {
          // Update existing mandato
          const { error: updateError } = await supabase
            .from('mandatos')
            .update({
              descripcion: dealName,
              pipeline_stage,
              tipo,
              estado,
              valor: amount,
              expected_close_date: closeDate,
              brevo_synced_at: new Date().toISOString(),
            })
            .eq('id', existingMandato.id);

          if (updateError) {
            throw updateError;
          }

          mandatoId = existingMandato.id;
          result.mandatosUpdated++;
          console.log(`Updated mandato: ${mandatoId}`);
        } else {
          // Create new mandato
          const { data: newMandato, error: insertError } = await supabase
            .from('mandatos')
            .insert({
              descripcion: dealName,
              pipeline_stage,
              tipo,
              estado,
              valor: amount,
              expected_close_date: closeDate,
              brevo_deal_id: dealId,
              brevo_synced_at: new Date().toISOString(),
            })
            .select('id')
            .single();

          if (insertError) {
            throw insertError;
          }

          mandatoId = newMandato.id;
          result.mandatosCreated++;
          console.log(`Created mandato: ${mandatoId}`);
        }

        // Find or create empresa
        if (companyName && companyName !== 'Sin nombre') {
          // Search for existing empresa
          const { data: existingEmpresa } = await supabase
            .from('empresas')
            .select('id')
            .ilike('nombre', companyName)
            .maybeSingle();

          let empresaId: string;

          if (existingEmpresa) {
            empresaId = existingEmpresa.id;
          } else {
            // Create new empresa with source tracking
            const { data: newEmpresa, error: empresaError } = await supabase
              .from('empresas')
              .insert({
                nombre: companyName,
                sector: 'Por clasificar',
                source: 'sync-brevo',
                source_id: dealId
              })
              .select('id')
              .single();

            if (empresaError) {
              console.error(`Error creating empresa ${companyName}:`, empresaError);
              result.errors.push(`Error creando empresa ${companyName}: ${empresaError.message}`);
              continue;
            }

            empresaId = newEmpresa.id;
            result.empresasCreated++;
            console.log(`Created empresa: ${companyName}`);
          }

          // Link empresa to mandato
          const { data: existingLink } = await supabase
            .from('mandato_empresas')
            .select('id')
            .eq('mandato_id', mandatoId)
            .eq('empresa_id', empresaId)
            .maybeSingle();

          if (!existingLink) {
            const { error: linkError } = await supabase
              .from('mandato_empresas')
              .insert({
                mandato_id: mandatoId,
                empresa_id: empresaId,
                rol: tipo === 'venta' ? 'vendedor' : 'comprador',
              });

            if (linkError) {
              console.error(`Error linking empresa to mandato:`, linkError);
            } else {
              result.empresasLinked++;
            }
          }
        }
      } catch (dealError) {
        const errorMessage = dealError instanceof Error ? dealError.message : String(dealError);
        console.error(`Error processing deal ${deal.id}:`, errorMessage);
        result.errors.push(`Deal ${deal.id}: ${errorMessage}`);
      }
    }

    console.log('Sync completed:', result);

    // Update sync_control stats
    await supabase
      .from('sync_control')
      .update({
        last_run: new Date().toISOString(),
        created_empresas_last_run: result.empresasCreated,
        errors_last_run: result.errors.length,
        updated_at: new Date().toISOString()
      })
      .eq('id', 'sync-deals-from-brevo');

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error in sync-deals-from-brevo:", error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : "Unknown error",
        totalDeals: 0,
        mandatosCreated: 0,
        mandatosUpdated: 0,
        empresasCreated: 0,
        empresasLinked: 0,
        errors: [error instanceof Error ? error.message : "Unknown error"]
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );
  }
});
