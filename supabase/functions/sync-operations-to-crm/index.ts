import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface Operation {
  id: string;
  company_name: string;
  deal_type: 'sale' | 'acquisition';
  sector: string | null;
  geographic_location: string | null;
  revenue_amount: number | null;
  ebitda_amount: number | null;
  valuation_amount: number | null;
  short_description: string | null;
  detailed_description: string | null;
  status: string | null;
  project_status: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface SyncResult {
  operationsProcessed: number;
  mandatosCreated: number;
  mandatosUpdated: number;
  empresasCreated: number;
  errors: Array<{ operationId: string; error: string }>;
}

// Map deal_type from Capittal to GoDeal tipo
function mapDealType(dealType: string): 'compra' | 'venta' {
  return dealType === 'acquisition' ? 'compra' : 'venta';
}

// Map status from Capittal to GoDeal estado
function mapStatus(status: string | null, projectStatus: string | null): string {
  if (status === 'sold') return 'cerrado';
  if (status === 'under_negotiation') return 'en_negociacion';
  if (projectStatus === 'upcoming') return 'prospecto';
  return 'activo';
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = Date.now();
  
  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Parse request body
    let dryRun = false;
    let triggeredBy = 'manual';
    
    try {
      const body = await req.json();
      dryRun = body.dry_run === true;
      triggeredBy = body.triggered_by || 'manual';
    } catch {
      // No body or invalid JSON, use defaults
    }

    console.log(`[sync-operations] Starting sync, dryRun=${dryRun}, triggeredBy=${triggeredBy}`);

    // Create sync log entry
    let logId: string | null = null;
    if (!dryRun) {
      const { data: logData, error: logError } = await supabase
        .from('operation_sync_log')
        .insert({
          triggered_by: triggeredBy,
          status: 'running'
        })
        .select('id')
        .single();
      
      if (logError) {
        console.error('[sync-operations] Error creating log:', logError);
      } else {
        logId = logData.id;
      }
    }

    // Fetch active operations from company_operations
    const { data: operations, error: opsError } = await supabase
      .from('company_operations')
      .select('*')
      .eq('is_active', true)
      .eq('is_deleted', false)
      .order('created_at', { ascending: false });

    if (opsError) {
      throw new Error(`Error fetching operations: ${opsError.message}`);
    }

    console.log(`[sync-operations] Found ${operations?.length || 0} active operations`);

    const result: SyncResult = {
      operationsProcessed: 0,
      mandatosCreated: 0,
      mandatosUpdated: 0,
      empresasCreated: 0,
      errors: []
    };

    if (!operations || operations.length === 0) {
      console.log('[sync-operations] No operations to sync');
      
      if (logId && !dryRun) {
        await supabase
          .from('operation_sync_log')
          .update({
            status: 'completed',
            duration_ms: Date.now() - startTime
          })
          .eq('id', logId);
      }
      
      return new Response(JSON.stringify({
        success: true,
        dryRun,
        result
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Process each operation
    for (const operation of operations as Operation[]) {
      try {
        console.log(`[sync-operations] Processing operation ${operation.id}: ${operation.company_name}`);
        
        // Check if mandato already exists with this external_operation_id
        const { data: existingMandato, error: findError } = await supabase
          .from('mandatos')
          .select('id, empresa_principal_id')
          .eq('external_operation_id', operation.id)
          .maybeSingle();

        if (findError) {
          throw new Error(`Error finding existing mandato: ${findError.message}`);
        }

        let empresaId = existingMandato?.empresa_principal_id;

        // If no existing empresa, find or create one
        if (!empresaId && operation.company_name) {
          // Try to find existing empresa by name
          const { data: existingEmpresa } = await supabase
            .from('empresas')
            .select('id')
            .ilike('nombre', operation.company_name)
            .maybeSingle();

          if (existingEmpresa) {
            empresaId = existingEmpresa.id;
            console.log(`[sync-operations] Found existing empresa: ${empresaId}`);
          } else if (!dryRun) {
            // Create new empresa
            const { data: newEmpresa, error: empresaError } = await supabase
              .from('empresas')
              .insert({
                nombre: operation.company_name,
                sector: operation.sector,
                ubicacion: operation.geographic_location,
                facturacion: operation.revenue_amount,
                ebitda: operation.ebitda_amount,
                es_target: true,
                estado_target: 'activo'
              })
              .select('id')
              .single();

            if (empresaError) {
              throw new Error(`Error creating empresa: ${empresaError.message}`);
            }

            empresaId = newEmpresa.id;
            result.empresasCreated++;
            console.log(`[sync-operations] Created new empresa: ${empresaId}`);
          }
        }

        // Prepare mandato data
        const mandatoData = {
          tipo: mapDealType(operation.deal_type),
          empresa_principal_id: empresaId,
          valor: operation.valuation_amount,
          descripcion: operation.short_description || operation.detailed_description,
          estado: mapStatus(operation.status, operation.project_status),
          external_operation_id: operation.id,
          external_source: 'capittal_marketplace',
          external_synced_at: new Date().toISOString(),
          url_publica: `https://capittal.es/operaciones/${operation.id}`
        };

        if (dryRun) {
          console.log(`[sync-operations] DRY RUN - Would ${existingMandato ? 'update' : 'create'} mandato:`, mandatoData);
          result.operationsProcessed++;
          if (existingMandato) {
            result.mandatosUpdated++;
          } else {
            result.mandatosCreated++;
          }
          continue;
        }

        if (existingMandato) {
          // Update existing mandato
          const { error: updateError } = await supabase
            .from('mandatos')
            .update(mandatoData)
            .eq('id', existingMandato.id);

          if (updateError) {
            throw new Error(`Error updating mandato: ${updateError.message}`);
          }

          result.mandatosUpdated++;
          console.log(`[sync-operations] Updated mandato: ${existingMandato.id}`);
        } else {
          // Create new mandato
          const { data: newMandato, error: createError } = await supabase
            .from('mandatos')
            .insert({
              ...mandatoData,
              nombre: `${operation.deal_type === 'sale' ? 'Venta' : 'Compra'} - ${operation.company_name}`
            })
            .select('id')
            .single();

          if (createError) {
            throw new Error(`Error creating mandato: ${createError.message}`);
          }

          result.mandatosCreated++;
          console.log(`[sync-operations] Created mandato: ${newMandato.id}`);
        }

        result.operationsProcessed++;

      } catch (opError) {
        const errorMessage = opError instanceof Error ? opError.message : 'Unknown error';
        console.error(`[sync-operations] Error processing operation ${operation.id}:`, errorMessage);
        result.errors.push({
          operationId: operation.id,
          error: errorMessage
        });
      }
    }

    // Update sync log
    if (logId && !dryRun) {
      await supabase
        .from('operation_sync_log')
        .update({
          operations_processed: result.operationsProcessed,
          mandatos_created: result.mandatosCreated,
          mandatos_updated: result.mandatosUpdated,
          empresas_created: result.empresasCreated,
          errors_count: result.errors.length,
          errors: result.errors,
          status: result.errors.length > 0 ? 'completed_with_errors' : 'completed',
          duration_ms: Date.now() - startTime
        })
        .eq('id', logId);
    }

    console.log(`[sync-operations] Sync completed:`, result);

    return new Response(JSON.stringify({
      success: true,
      dryRun,
      result,
      durationMs: Date.now() - startTime
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('[sync-operations] Fatal error:', errorMessage);

    return new Response(JSON.stringify({
      success: false,
      error: errorMessage
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
