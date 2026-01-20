import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface CapittalContact {
  id: string;
  nombre: string;
  apellidos?: string;
  email?: string;
  telefono?: string;
  cargo?: string;
  empresa?: string;
  linkedin?: string;
  web?: string;
  notas?: string;
  tags?: string[];
  owner_id?: string;
  created_at?: string;
  updated_at?: string;
  deleted_at?: string;
}

interface SyncResult {
  contactsProcessed: number;
  contactsCreated: number;
  contactsUpdated: number;
  contactsSkipped: number;
  contactsArchived: number;
  errors: Array<{ capittalId: string; error: string }>;
}

// Normalizar email para deduplicación
function normalizeEmail(email: string | undefined): string | null {
  if (!email) return null;
  return email.toLowerCase().trim();
}

// Normalizar teléfono para deduplicación
function normalizePhone(phone: string | undefined): string | null {
  if (!phone) return null;
  return phone.replace(/\D/g, '');
}

// Buscar contacto existente por diferentes criterios
async function findExistingContact(
  supabase: any,
  contact: CapittalContact
): Promise<string | null> {
  // 1. Buscar por external_capittal_id
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
    capittal_synced_at: new Date().toISOString(),
    source: 'capittal',
  };
}

// Sincronizar un contacto individual
async function syncContact(
  supabase: any,
  contact: CapittalContact,
  result: SyncResult
): Promise<void> {
  try {
    const existingId = await findExistingContact(supabase, contact);
    const mappedData = mapCapittalToGoDeal(contact);
    
    // Manejar contactos eliminados en Capittal
    if (contact.deleted_at) {
      if (existingId) {
        // Opción B: Archivar en lugar de eliminar
        const { error } = await supabase
          .from('contactos')
          .update({
            notas: `[Archivado desde Capittal: ${new Date().toISOString()}]\n${contact.notas || ''}`,
            capittal_synced_at: new Date().toISOString(),
          })
          .eq('id', existingId);
        
        if (error) throw error;
        result.contactsArchived++;
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
    } else {
      // Crear nuevo contacto
      const { error } = await supabase
        .from('contactos')
        .insert(mappedData);
      
      if (error) throw error;
      result.contactsCreated++;
    }
    
    result.contactsProcessed++;
  } catch (error) {
    result.errors.push({
      capittalId: contact.id,
      error: error instanceof Error ? error.message : String(error),
    });
  }
}

// Obtener contactos de Capittal (adaptar según API real)
async function fetchCapittalContacts(
  apiUrl: string,
  apiKey: string,
  since?: string
): Promise<CapittalContact[]> {
  const url = new URL(`${apiUrl}/api/contacts`);
  if (since) {
    url.searchParams.set('modified_since', since);
  }
  url.searchParams.set('limit', '500');
  
  const response = await fetch(url.toString(), {
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Accept': 'application/json',
    },
  });
  
  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Capittal API error: ${response.status} - ${text}`);
  }
  
  const data = await response.json();
  return data.contacts || data || [];
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const capittalApiUrl = Deno.env.get("CAPITTAL_API_URL");
    const capittalApiKey = Deno.env.get("CAPITTAL_API_KEY");
    
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // Parsear body para determinar tipo de trigger
    let triggeredBy = 'manual';
    let contacts: CapittalContact[] = [];
    
    try {
      const body = await req.json();
      triggeredBy = body.triggered_by || 'manual';
      
      // Si vienen contactos directamente (webhook), usarlos
      if (body.contacts && Array.isArray(body.contacts)) {
        contacts = body.contacts;
      }
      
      // Si viene un solo contacto (webhook de evento)
      if (body.contact) {
        contacts = [body.contact];
      }
    } catch {
      // No body, es polling manual
    }
    
    // Crear registro de log
    const { data: logEntry, error: logError } = await supabase
      .from('capittal_contact_sync_log')
      .insert({
        triggered_by: triggeredBy,
        status: 'running',
      })
      .select()
      .single();
    
    if (logError) {
      console.error('Error creating log entry:', logError);
    }
    
    const logId = logEntry?.id;
    
    // Si no hay contactos proporcionados, obtenerlos de la API
    if (contacts.length === 0) {
      if (!capittalApiUrl || !capittalApiKey) {
        // Modo demo/test: crear contactos de prueba
        console.log('Capittal API not configured, using demo mode');
        
        const result: SyncResult = {
          contactsProcessed: 0,
          contactsCreated: 0,
          contactsUpdated: 0,
          contactsSkipped: 0,
          contactsArchived: 0,
          errors: [],
        };
        
        // Actualizar log con estado demo
        if (logId) {
          await supabase
            .from('capittal_contact_sync_log')
            .update({
              completed_at: new Date().toISOString(),
              status: 'completed',
              error_message: 'Demo mode - CAPITTAL_API_URL/KEY not configured',
              ...result,
            })
            .eq('id', logId);
        }
        
        return new Response(
          JSON.stringify({
            success: true,
            message: 'Demo mode - API credentials not configured',
            result,
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      // Obtener último timestamp de sync
      const { data: syncState } = await supabase
        .from('capittal_sync_state')
        .select('last_modified_timestamp')
        .eq('id', 'contacts')
        .single();
      
      const since = syncState?.last_modified_timestamp;
      
      try {
        contacts = await fetchCapittalContacts(capittalApiUrl, capittalApiKey, since);
      } catch (apiError) {
        console.error('Error fetching from Capittal:', apiError);
        
        if (logId) {
          await supabase
            .from('capittal_contact_sync_log')
            .update({
              completed_at: new Date().toISOString(),
              status: 'failed',
              error_message: apiError instanceof Error ? apiError.message : String(apiError),
            })
            .eq('id', logId);
        }
        
        throw apiError;
      }
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
    
    let lastTimestamp: string | null = null;
    
    for (const contact of contacts) {
      await syncContact(supabase, contact, result);
      
      // Trackear el último timestamp procesado
      const contactTimestamp = contact.updated_at || contact.created_at;
      if (contactTimestamp && (!lastTimestamp || contactTimestamp > lastTimestamp)) {
        lastTimestamp = contactTimestamp;
      }
    }
    
    // Actualizar estado del sync
    if (lastTimestamp) {
      await supabase
        .from('capittal_sync_state')
        .upsert({
          id: 'contacts',
          last_sync_at: new Date().toISOString(),
          last_modified_timestamp: lastTimestamp,
        });
    }
    
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
    
    return new Response(
      JSON.stringify({
        success: true,
        result,
        logId,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
    
  } catch (error) {
    console.error('Sync error:', error);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
