import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const BATCH_SIZE = 5;
const DELAY_BETWEEN_MS = 2000; // 2s between calls to avoid rate limits

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const firecrawlKey = Deno.env.get('FIRECRAWL_API_KEY');
    const lovableKey = Deno.env.get('LOVABLE_API_KEY');
    const cronSecret = Deno.env.get('CRON_SECRET');

    // Auth: accept service role, cron secret, or admin user
    const authHeader = req.headers.get('Authorization') || '';
    const xCronSecret = req.headers.get('x-cron-secret');
    
    const isServiceRole = authHeader === `Bearer ${serviceRoleKey}`;
    const isCronCall = xCronSecret && xCronSecret === cronSecret;

    if (!isServiceRole && !isCronCall) {
      // Verify admin user
      const supabaseAuth = createClient(supabaseUrl, Deno.env.get('SUPABASE_ANON_KEY')!, {
        global: { headers: { Authorization: authHeader } }
      });
      const { data: { user } } = await supabaseAuth.auth.getUser();
      if (!user) {
        return new Response(JSON.stringify({ error: 'Unauthorized' }), {
          status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
      const { data: adminUser } = await supabaseAuth.from('admin_users')
        .select('role, is_active')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .maybeSingle();
      if (!adminUser || !['admin', 'super_admin'].includes(adminUser.role)) {
        return new Response(JSON.stringify({ error: 'Forbidden' }), {
          status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
    }

    if (!firecrawlKey || !lovableKey) {
      return new Response(
        JSON.stringify({ error: 'API keys not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey);

    // Parse optional body params
    let batchSize = BATCH_SIZE;
    let empresaIds: string[] | null = null;
    
    try {
      const body = await req.json();
      if (body.batchSize) batchSize = Math.min(body.batchSize, 20);
      if (body.empresaIds) empresaIds = body.empresaIds;
    } catch { /* no body */ }

    // If specific IDs provided, queue them first
    if (empresaIds?.length) {
      for (const id of empresaIds) {
        await supabase.from('enrichment_queue').upsert({
          entity_type: 'empresa',
          entity_id: id,
          priority: 8,
          status: 'pending',
          attempts: 0,
        }, { onConflict: 'entity_id', ignoreDuplicates: true });
      }
    }

    // Fetch pending items from queue
    const { data: queueItems, error: fetchError } = await supabase
      .from('enrichment_queue')
      .select('id, entity_id')
      .eq('entity_type', 'empresa')
      .eq('status', 'pending')
      .lt('attempts', 3)
      .order('priority', { ascending: false })
      .order('created_at', { ascending: true })
      .limit(batchSize);

    if (fetchError) throw fetchError;

    if (!queueItems?.length) {
      return new Response(
        JSON.stringify({ success: true, processed: 0, message: 'No items in queue' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Processing ${queueItems.length} items from enrichment queue`);

    const results: Array<{ empresaId: string; status: string; error?: string }> = [];

    for (const item of queueItems) {
      // Mark as processing
      await supabase.from('enrichment_queue')
        .update({ status: 'processing', started_at: new Date().toISOString(), attempts: item.attempts ?? 0 + 1 })
        .eq('id', item.id);

      try {
        // Get empresa data
        const { data: empresa } = await supabase
          .from('empresas')
          .select('id, nombre, sitio_web, descripcion, sector, empleados, fecha_enriquecimiento')
          .eq('id', item.entity_id)
          .single();

        if (!empresa) {
          await supabase.from('enrichment_queue')
            .update({ status: 'skipped', error_message: 'Empresa not found', completed_at: new Date().toISOString() })
            .eq('id', item.id);
          results.push({ empresaId: item.entity_id, status: 'skipped', error: 'Not found' });
          continue;
        }

        // Skip if already enriched
        if (empresa.fecha_enriquecimiento) {
          await supabase.from('enrichment_queue')
            .update({ status: 'skipped', error_message: 'Already enriched', completed_at: new Date().toISOString() })
            .eq('id', item.id);
          results.push({ empresaId: item.entity_id, status: 'skipped', error: 'Already enriched' });
          continue;
        }

        // Determine search input: prefer web URL, fallback to name
        const searchInput = empresa.sitio_web || empresa.nombre;

        // Call enrich-company-v2 internally
        const enrichResponse = await fetch(`${supabaseUrl}/functions/v1/enrich-company-v2`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${serviceRoleKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ input: searchInput }),
        });

        const enrichData = await enrichResponse.json();

        if (!enrichData.success) {
          await supabase.from('enrichment_queue')
            .update({ 
              status: 'failed', 
              error_message: enrichData.error || 'Enrichment failed',
              completed_at: new Date().toISOString(),
              result_data: enrichData,
            })
            .eq('id', item.id);
          results.push({ empresaId: item.entity_id, status: 'failed', error: enrichData.error });
          continue;
        }

        // Apply enrichment in empty_only mode (don't overwrite existing data)
        const enrichedData = enrichData.data;
        const updateFields: Record<string, any> = {
          fuente_enriquecimiento: enrichedData.fuente,
          fecha_enriquecimiento: new Date().toISOString(),
        };

        const fieldsUpdated: string[] = [];

        // Only fill empty fields
        const fieldMap: Record<string, any> = {
          descripcion: enrichedData.descripcion,
          sector: enrichedData.sector,
          sector_id: enrichedData.sector_id,
          empleados: enrichedData.empleados,
          sitio_web: enrichedData.sitio_web,
          ubicacion: enrichedData.ubicacion,
          cnae_codigo: enrichedData.cnae_codigo,
          cnae_descripcion: enrichedData.cnae_descripcion,
          actividades_destacadas: enrichedData.actividades_destacadas,
          linkedin: enrichedData.linkedin,
        };

        // Get current empresa data for all fields
        const { data: currentEmpresa } = await supabase
          .from('empresas')
          .select('descripcion, sector, sector_id, empleados, sitio_web, ubicacion, cnae_codigo, cnae_descripcion, actividades_destacadas, linkedin, ai_fields_locked')
          .eq('id', empresa.id)
          .single();

        const lockedFields = currentEmpresa?.ai_fields_locked || [];

        for (const [field, value] of Object.entries(fieldMap)) {
          if (value == null) continue;
          if (lockedFields.includes(field)) continue; // Respect locked fields
          if (currentEmpresa && currentEmpresa[field] != null && currentEmpresa[field] !== '') continue; // Only fill empty
          updateFields[field] = value;
          fieldsUpdated.push(field);
        }

        // Apply update
        const { error: updateError } = await supabase
          .from('empresas')
          .update(updateFields)
          .eq('id', empresa.id);

        if (updateError) throw updateError;

        // Create contacts (only non-duplicates)
        let contactsCreated = 0;
        if (enrichedData.contactos?.length) {
          for (const contact of enrichedData.contactos) {
            if (!contact.nombre) continue;
            
            // Check for existing contact by email
            if (contact.email) {
              const { data: existing } = await supabase
                .from('contactos')
                .select('id')
                .eq('email', contact.email)
                .maybeSingle();
              if (existing) continue;
            }

            const nameParts = contact.nombre.split(' ');
            const { error: contactError } = await supabase.from('contactos').insert({
              nombre: nameParts[0],
              apellidos: nameParts.slice(1).join(' ') || null,
              cargo: contact.cargo,
              email: contact.email,
              linkedin: contact.linkedin,
              empresa_principal_id: empresa.id,
            });

            if (!contactError) contactsCreated++;
          }
        }

        // Mark as completed
        await supabase.from('enrichment_queue')
          .update({
            status: 'completed',
            completed_at: new Date().toISOString(),
            result_data: { fieldsUpdated, contactsCreated },
          })
          .eq('id', item.id);

        results.push({ empresaId: item.entity_id, status: 'completed' });

        // Log to ai_activity_log
        await supabase.from('ai_activity_log').insert({
          module: 'batch-enrichment',
          entity_type: 'empresa',
          entity_id: empresa.id,
          success: true,
          model: 'openai/gpt-5-mini',
        });

      } catch (err) {
        console.error(`Error processing ${item.entity_id}:`, err);
        await supabase.from('enrichment_queue')
          .update({
            status: 'failed',
            error_message: err instanceof Error ? err.message : 'Unknown error',
            completed_at: new Date().toISOString(),
          })
          .eq('id', item.id);
        results.push({ empresaId: item.entity_id, status: 'failed', error: String(err) });
      }

      // Delay between items to avoid rate limits
      if (queueItems.indexOf(item) < queueItems.length - 1) {
        await new Promise(resolve => setTimeout(resolve, DELAY_BETWEEN_MS));
      }
    }

    const summary = {
      success: true,
      processed: results.length,
      completed: results.filter(r => r.status === 'completed').length,
      failed: results.filter(r => r.status === 'failed').length,
      skipped: results.filter(r => r.status === 'skipped').length,
      results,
    };

    console.log('Batch enrichment complete:', JSON.stringify(summary));

    return new Response(
      JSON.stringify(summary),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in batch-enrich-companies:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
