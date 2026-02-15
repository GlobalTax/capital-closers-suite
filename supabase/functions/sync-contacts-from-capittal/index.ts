import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getCorsHeaders, requireAuth } from '../_shared/auth.ts';

interface CapittalContact {
  id: string;
  nombre: string;
  apellidos?: string;
  email?: string;
  telefono?: string;
  cargo?: string;
  empresa_principal_id?: string;
  linkedin?: string;
  notas?: string;
  created_at?: string;
  updated_at?: string;
  merged_into_contacto_id?: string;
}

interface SyncResult {
  contactsProcessed: number;
  contactsCreated: number;
  contactsUpdated: number;
  contactsSkipped: number;
  contactsArchived: number;
  errors: Array<{ capittalId: string; error: string }>;
}

interface SyncContext {
  correlationId: string;
  triggeredBy: 'webhook' | 'polling' | 'manual';
  startedAt: Date;
}

// Logging estructurado
function log(ctx: SyncContext, level: string, message: string, data?: Record<string, unknown>) {
  console.log(JSON.stringify({
    correlationId: ctx.correlationId,
    level,
    message,
    triggeredBy: ctx.triggeredBy,
    timestamp: new Date().toISOString(),
    elapsedMs: Date.now() - ctx.startedAt.getTime(),
    ...data,
  }));
}

// Generar ID de correlación
function generateCorrelationId(): string {
  return `sync-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
}

// Normalizar email para deduplicación
function normalizeEmail(email: string | undefined | null): string | null {
  if (!email) return null;
  return email.toLowerCase().trim();
}

// Normalizar teléfono para deduplicación
function normalizePhone(phone: string | undefined | null): string | null {
  if (!phone) return null;
  return phone.replace(/\D/g, '');
}

// Buscar contacto existente por diferentes criterios en GoDeal
async function findExistingGoDealContact(
  supabase: any,
  contact: CapittalContact
): Promise<string | null> {
  // 1. Buscar por external_capittal_id (más confiable)
  const { data: byId } = await supabase
    .from('contactos')
    .select('id')
    .eq('external_capittal_id', contact.id)
    .maybeSingle();
  
  if (byId) return byId.id;
  
  // 2. Buscar por email normalizado
  const normalizedEmail = normalizeEmail(contact.email);
  if (normalizedEmail) {
    const { data: byEmail } = await supabase
      .from('contactos')
      .select('id')
      .eq('email', normalizedEmail)
      .neq('source', 'capittal')
      .maybeSingle();
    
    if (byEmail) return byEmail.id;
  }
  
  // 3. Fallback: teléfono + nombre
  const normalizedPhone = normalizePhone(contact.telefono);
  if (normalizedPhone && contact.nombre) {
    const { data: byPhoneName } = await supabase
      .from('contactos')
      .select('id')
      .ilike('nombre', contact.nombre)
      .eq('telefono', normalizedPhone)
      .neq('source', 'capittal')
      .maybeSingle();
    
    if (byPhoneName) return byPhoneName.id;
  }
  
  return null;
}

// Mapear contacto de Capittal a formato de GoDeal
function mapCapittalToGoDeal(contact: CapittalContact) {
  return {
    external_capittal_id: contact.id,
    nombre: contact.nombre,
    apellidos: contact.apellidos || null,
    email: normalizeEmail(contact.email),
    telefono: normalizePhone(contact.telefono),
    cargo: contact.cargo || null,
    linkedin: contact.linkedin || null,
    notas: contact.notas || null,
    empresa_principal_id: contact.empresa_principal_id || null,
    capittal_synced_at: new Date().toISOString(),
    source: 'capittal',
  };
}

// Sincronizar un contacto individual
async function syncContact(
  supabase: any,
  contact: CapittalContact,
  result: SyncResult,
  ctx: SyncContext
): Promise<void> {
  try {
    const existingId = await findExistingGoDealContact(supabase, contact);
    const mappedData = mapCapittalToGoDeal(contact);
    
    // Manejar contactos mergeados en Capittal (tratarlos como archivados)
    if (contact.merged_into_contacto_id) {
      if (existingId) {
        const { error } = await supabase
          .from('contactos')
          .update({
            notas: `[Fusionado en Capittal: ${new Date().toISOString()}] → ${contact.merged_into_contacto_id}\n${contact.notas || ''}`,
            capittal_synced_at: new Date().toISOString(),
          })
          .eq('id', existingId);
        
        if (error) throw error;
        result.contactsArchived++;
        log(ctx, 'info', 'Contact archived (merged)', { capittalId: contact.id, godealId: existingId });
      } else {
        result.contactsSkipped++;
      }
      return;
    }
    
    if (existingId) {
      // Actualizar contacto existente
      const { error } = await supabase
        .from('contactos')
        .update(mappedData)
        .eq('id', existingId);
      
      if (error) throw error;
      result.contactsUpdated++;
      log(ctx, 'debug', 'Contact updated', { capittalId: contact.id, godealId: existingId });
    } else {
      // Crear nuevo contacto
      const { error } = await supabase
        .from('contactos')
        .insert(mappedData);
      
      if (error) throw error;
      result.contactsCreated++;
      log(ctx, 'debug', 'Contact created', { capittalId: contact.id });
    }
    
    result.contactsProcessed++;
  } catch (error) {
    result.errors.push({
      capittalId: contact.id,
      error: error instanceof Error ? error.message : String(error),
    });
    log(ctx, 'error', 'Error syncing contact', { 
      capittalId: contact.id, 
      error: error instanceof Error ? error.message : String(error) 
    });
  }
}

// Obtener contactos de Capittal directamente desde la base de datos compartida
async function fetchCapittalContactsFromDB(
  supabase: any,
  since?: string | null,
  ctx?: SyncContext
): Promise<CapittalContact[]> {
  // Consultar contactos que NO tienen source='capittal' (los originales)
  // O contactos que fueron modificados desde la última sincronización
  
  let query = supabase
    .from('contactos')
    .select('id, nombre, apellidos, email, telefono, cargo, empresa_principal_id, linkedin, notas, created_at, updated_at, merged_into_contacto_id')
    .or('source.is.null,source.neq.capittal')
    .order('updated_at', { ascending: true })
    .limit(500);
  
  if (since) {
    query = query.gt('updated_at', since);
  }
  
  const { data, error } = await query;
  
  if (error) {
    throw new Error(`Error fetching contacts from DB: ${error.message}`);
  }
  
  if (ctx) {
    log(ctx, 'info', 'Fetched contacts from database', { 
      count: data?.length || 0, 
      since: since || 'all' 
    });
  }
  
  return (data || []) as CapittalContact[];
}

// Procesar en batches para evitar timeouts
const BATCH_SIZE = 50;

async function processBatches(
  supabase: any,
  contacts: CapittalContact[],
  result: SyncResult,
  ctx: SyncContext
): Promise<void> {
  for (let i = 0; i < contacts.length; i += BATCH_SIZE) {
    const batch = contacts.slice(i, i + BATCH_SIZE);
    const batchNum = Math.floor(i / BATCH_SIZE) + 1;
    const totalBatches = Math.ceil(contacts.length / BATCH_SIZE);
    
    log(ctx, 'info', `Processing batch ${batchNum}/${totalBatches}`, { 
      batchSize: batch.length,
      progress: `${i + batch.length}/${contacts.length}`
    });
    
    // Procesar batch secuencialmente para evitar conflictos
    for (const contact of batch) {
      await syncContact(supabase, contact, result, ctx);
    }
  }
}

serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const { user, error: authError } = await requireAuth(req, corsHeaders);
  if (authError) return authError;

  const ctx: SyncContext = {
    correlationId: generateCorrelationId(),
    triggeredBy: 'manual',
    startedAt: new Date(),
  };

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // Parsear body para determinar tipo de trigger
    try {
      const body = await req.json();
      ctx.triggeredBy = body.triggered_by || 'manual';
    } catch {
      // No body, es manual
    }
    
    log(ctx, 'info', 'Starting contact sync', { triggeredBy: ctx.triggeredBy });
    
    // Verificar si el sync está habilitado
    const { data: syncState } = await supabase
      .from('capittal_sync_state')
      .select('*')
      .eq('id', 'contacts')
      .maybeSingle();
    
    if (syncState && !syncState.is_enabled) {
      log(ctx, 'warn', 'Sync is disabled');
      return new Response(
        JSON.stringify({
          success: false,
          message: 'Sync is disabled',
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    // Crear registro de log
    const { data: logEntry, error: logError } = await supabase
      .from('capittal_contact_sync_log')
      .insert({
        triggered_by: ctx.triggeredBy,
        status: 'running',
      })
      .select()
      .single();
    
    if (logError) {
      log(ctx, 'error', 'Error creating log entry', { error: logError.message });
    }
    
    const logId = logEntry?.id;
    
    // Obtener último timestamp de sync
    const since = syncState?.last_modified_timestamp;
    
    // Obtener contactos directamente de la base de datos
    const contacts = await fetchCapittalContactsFromDB(supabase, since, ctx);
    
    if (contacts.length === 0) {
      log(ctx, 'info', 'No new contacts to sync');
      
      if (logId) {
        await supabase
          .from('capittal_contact_sync_log')
          .update({
            completed_at: new Date().toISOString(),
            status: 'completed',
            contacts_processed: 0,
          })
          .eq('id', logId);
      }
      
      // Actualizar last_sync_at aunque no haya cambios
      await supabase
        .from('capittal_sync_state')
        .upsert({
          id: 'contacts',
          last_sync_at: new Date().toISOString(),
          is_enabled: true,
        });
      
      return new Response(
        JSON.stringify({
          success: true,
          message: 'No new contacts to sync',
          result: {
            contactsProcessed: 0,
            contactsCreated: 0,
            contactsUpdated: 0,
            contactsSkipped: 0,
            contactsArchived: 0,
            errors: [],
          },
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    // Procesar contactos
    const result: SyncResult = {
      contactsProcessed: 0,
      contactsCreated: 0,
      contactsUpdated: 0,
      contactsSkipped: 0,
      contactsArchived: 0,
      errors: [],
    };
    
    await processBatches(supabase, contacts, result, ctx);
    
    // Obtener el último timestamp procesado
    const lastContact = contacts[contacts.length - 1];
    const lastTimestamp = lastContact?.updated_at || lastContact?.created_at;
    
    // Actualizar estado del sync
    await supabase
      .from('capittal_sync_state')
      .upsert({
        id: 'contacts',
        last_sync_at: new Date().toISOString(),
        last_modified_timestamp: lastTimestamp,
        is_enabled: true,
      });
    
    // Actualizar log
    const finalStatus = result.errors.length > 0 
      ? (result.contactsProcessed > 0 ? 'partial' : 'failed')
      : 'completed';
    
    if (logId) {
      await supabase
        .from('capittal_contact_sync_log')
        .update({
          completed_at: new Date().toISOString(),
          status: finalStatus,
          last_capittal_timestamp: lastTimestamp,
          contacts_processed: result.contactsProcessed,
          contacts_created: result.contactsCreated,
          contacts_updated: result.contactsUpdated,
          contacts_skipped: result.contactsSkipped,
          contacts_archived: result.contactsArchived,
          errors: result.errors,
        })
        .eq('id', logId);
    }
    
    log(ctx, 'info', 'Sync completed', {
      status: finalStatus,
      ...result,
      durationMs: Date.now() - ctx.startedAt.getTime(),
    });
    
    return new Response(
      JSON.stringify({
        success: true,
        result,
        logId,
        correlationId: ctx.correlationId,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
    
  } catch (error) {
    log(ctx, 'error', 'Sync failed', { 
      error: error instanceof Error ? error.message : String(error) 
    });
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        correlationId: ctx.correlationId,
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
