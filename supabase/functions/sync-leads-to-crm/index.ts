import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SyncResult {
  leadsProcessed: number;
  contactosCreated: number;
  empresasCreated: number;
  errors: Array<{ table: string; id: string; error: string }>;
}

interface Lead {
  id: string;
  email?: string;
  full_name?: string;
  contact_name?: string;
  company?: string;
  company_name?: string;
  phone?: string;
  cif?: string;
  industry?: string;
  revenue?: number;
  ebitda?: number;
  country?: string;
  location?: string;
  empresa_id?: string;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Parse request body for options
    let triggeredBy = 'cron';
    try {
      const body = await req.json();
      triggeredBy = body?.triggered_by || 'cron';
    } catch {
      // No body or invalid JSON, use defaults
    }

    console.log(`[sync-leads-to-crm] Starting sync, triggered by: ${triggeredBy}`);

    // Create sync log entry
    const { data: syncLog, error: syncLogError } = await supabase
      .from('crm_sync_log')
      .insert({ triggered_by: triggeredBy })
      .select()
      .single();

    if (syncLogError) {
      console.error('[sync-leads-to-crm] Error creating sync log:', syncLogError);
    }

    const result: SyncResult = {
      leadsProcessed: 0,
      contactosCreated: 0,
      empresasCreated: 0,
      errors: []
    };

    // 1. Sync company_valuations
    console.log('[sync-leads-to-crm] Processing company_valuations...');
    const { data: valuations, error: valError } = await supabase
      .from('company_valuations')
      .select('id, email, contact_name, company_name, phone, cif, industry, revenue, ebitda, location, empresa_id')
      .is('crm_synced_at', null)
      .eq('is_deleted', false)
      .limit(100);

    if (valError) {
      console.error('[sync-leads-to-crm] Error fetching valuations:', valError);
      result.errors.push({ table: 'company_valuations', id: 'fetch', error: valError.message });
    } else if (valuations?.length) {
      console.log(`[sync-leads-to-crm] Found ${valuations.length} valuations to sync`);
      for (const lead of valuations) {
        try {
          const syncResult = await syncLead(supabase, lead, 'company_valuations');
          result.leadsProcessed++;
          result.contactosCreated += syncResult.contactoCreated ? 1 : 0;
          result.empresasCreated += syncResult.empresaCreated ? 1 : 0;
        } catch (error) {
          console.error(`[sync-leads-to-crm] Error syncing valuation ${lead.id}:`, error);
          result.errors.push({ table: 'company_valuations', id: lead.id, error: String(error) });
        }
      }
    }

    // 2. Sync contact_leads
    console.log('[sync-leads-to-crm] Processing contact_leads...');
    const { data: contactLeads, error: clError } = await supabase
      .from('contact_leads')
      .select('id, email, full_name, company, phone, country')
      .is('crm_synced_at', null)
      .eq('is_deleted', false)
      .limit(100);

    if (clError) {
      console.error('[sync-leads-to-crm] Error fetching contact_leads:', clError);
      result.errors.push({ table: 'contact_leads', id: 'fetch', error: clError.message });
    } else if (contactLeads?.length) {
      console.log(`[sync-leads-to-crm] Found ${contactLeads.length} contact_leads to sync`);
      for (const lead of contactLeads) {
        try {
          const syncResult = await syncLead(supabase, lead, 'contact_leads');
          result.leadsProcessed++;
          result.contactosCreated += syncResult.contactoCreated ? 1 : 0;
          result.empresasCreated += syncResult.empresaCreated ? 1 : 0;
        } catch (error) {
          console.error(`[sync-leads-to-crm] Error syncing contact_lead ${lead.id}:`, error);
          result.errors.push({ table: 'contact_leads', id: lead.id, error: String(error) });
        }
      }
    }

    // 3. Sync general_contact_leads
    console.log('[sync-leads-to-crm] Processing general_contact_leads...');
    const { data: generalLeads, error: glError } = await supabase
      .from('general_contact_leads')
      .select('id, email, full_name, company, phone, cif, country')
      .is('crm_synced_at', null)
      .limit(100);

    if (glError) {
      console.error('[sync-leads-to-crm] Error fetching general_contact_leads:', glError);
      result.errors.push({ table: 'general_contact_leads', id: 'fetch', error: glError.message });
    } else if (generalLeads?.length) {
      console.log(`[sync-leads-to-crm] Found ${generalLeads.length} general_contact_leads to sync`);
      for (const lead of generalLeads) {
        try {
          const syncResult = await syncLead(supabase, lead, 'general_contact_leads');
          result.leadsProcessed++;
          result.contactosCreated += syncResult.contactoCreated ? 1 : 0;
          result.empresasCreated += syncResult.empresaCreated ? 1 : 0;
        } catch (error) {
          console.error(`[sync-leads-to-crm] Error syncing general_contact_lead ${lead.id}:`, error);
          result.errors.push({ table: 'general_contact_leads', id: lead.id, error: String(error) });
        }
      }
    }

    // Update sync log
    if (syncLog?.id) {
      await supabase
        .from('crm_sync_log')
        .update({
          completed_at: new Date().toISOString(),
          status: result.errors.length > 0 ? 'completed_with_errors' : 'completed',
          leads_processed: result.leadsProcessed,
          contactos_created: result.contactosCreated,
          empresas_created: result.empresasCreated,
          errors: result.errors
        })
        .eq('id', syncLog.id);
    }

    console.log('[sync-leads-to-crm] Sync completed:', result);

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200
    });

  } catch (error) {
    console.error('[sync-leads-to-crm] Fatal error:', error);
    return new Response(JSON.stringify({ error: String(error) }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500
    });
  }
});

async function syncLead(
  supabase: any, 
  lead: Lead, 
  table: string
): Promise<{ contactoCreated: boolean; empresaCreated: boolean }> {
  let contactoId: string | null = null;
  let empresaId: string | null = lead.empresa_id || null;
  let contactoCreated = false;
  let empresaCreated = false;

  const email = lead.email?.toLowerCase().trim();
  const companyName = lead.company_name || lead.company;
  const contactName = lead.contact_name || lead.full_name;

  // 1. Find or create empresa
  if (companyName && !empresaId) {
    // First try to find by CIF
    if (lead.cif) {
      const { data: existingByCif } = await supabase
        .from('empresas')
        .select('id')
        .eq('cif', lead.cif)
        .maybeSingle();
      
      if (existingByCif) {
        empresaId = existingByCif.id;
        console.log(`[sync-leads-to-crm] Found empresa by CIF: ${empresaId}`);
      }
    }

    // Then try by name
    if (!empresaId) {
      const { data: existingByName } = await supabase
        .from('empresas')
        .select('id')
        .ilike('nombre', companyName.trim())
        .maybeSingle();
      
      if (existingByName) {
        empresaId = existingByName.id;
        console.log(`[sync-leads-to-crm] Found empresa by name: ${empresaId}`);
      }
    }

    // Create new empresa if not found
    if (!empresaId) {
      const empresaData: any = {
        nombre: companyName.trim(),
        cif: lead.cif || null,
        sector: lead.industry || null,
        facturacion: lead.revenue || null,
        ebitda: lead.ebitda || null,
        ubicacion: lead.country || lead.location || null
      };

      const { data: newEmpresa, error: empresaError } = await supabase
        .from('empresas')
        .insert(empresaData)
        .select('id')
        .single();

      if (empresaError) {
        console.error(`[sync-leads-to-crm] Error creating empresa:`, empresaError);
      } else {
        empresaId = newEmpresa.id;
        empresaCreated = true;
        console.log(`[sync-leads-to-crm] Created empresa: ${empresaId}`);
      }
    }
  }

  // 2. Find or create contacto
  if (email) {
    const { data: existingContacto } = await supabase
      .from('contactos')
      .select('id')
      .eq('email', email)
      .maybeSingle();

    if (existingContacto) {
      contactoId = existingContacto.id;
      console.log(`[sync-leads-to-crm] Found contacto by email: ${contactoId}`);
    } else if (contactName) {
      // Split name into nombre and apellidos
      const nameParts = contactName.trim().split(' ');
      const nombre = nameParts[0] || '';
      const apellidos = nameParts.slice(1).join(' ') || '';

      const contactoData: any = {
        nombre,
        apellidos,
        email,
        telefono: lead.phone || null,
        empresa_principal_id: empresaId
      };

      const { data: newContacto, error: contactoError } = await supabase
        .from('contactos')
        .insert(contactoData)
        .select('id')
        .single();

      if (contactoError) {
        console.error(`[sync-leads-to-crm] Error creating contacto:`, contactoError);
      } else {
        contactoId = newContacto.id;
        contactoCreated = true;
        console.log(`[sync-leads-to-crm] Created contacto: ${contactoId}`);
      }
    }
  }

  // 3. Update the lead with sync info
  const updateData: any = {
    crm_synced_at: new Date().toISOString(),
    crm_contacto_id: contactoId
  };

  // company_valuations has empresa_id, not crm_empresa_id
  // other tables have crm_empresa_id
  if (table === 'company_valuations') {
    if (!lead.empresa_id && empresaId) {
      updateData.empresa_id = empresaId;
    }
  } else {
    updateData.crm_empresa_id = empresaId;
  }

  const { error: updateError } = await supabase
    .from(table)
    .update(updateData)
    .eq('id', lead.id);

  if (updateError) {
    console.error(`[sync-leads-to-crm] Error updating ${table} ${lead.id}:`, updateError);
  }

  return { contactoCreated, empresaCreated };
}
