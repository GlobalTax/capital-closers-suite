import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const BREVO_API_KEY = Deno.env.get('BREVO_API_KEY');
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface BrevoContact {
  id: number;
  email: string;
  attributes: {
    NOMBRE?: string;
    FNAME?: string;
    LASTNAME?: string;
    LNAME?: string;
    APELLIDOS?: string;
    COMPANY?: string;
    EMPRESA?: string;
    CARGO?: string;
    TELEFONO?: string;
    PHONE?: string;
    SMS?: string;
    LINKEDIN?: string;
    [key: string]: any;
  };
  listIds?: number[];
  createdAt?: string;
  modifiedAt?: string;
}

interface SyncResult {
  contactos_created: number;
  contactos_updated: number;
  contactos_skipped: number;
  empresas_created: number;
  empresas_linked: number;
  errors: string[];
  total_brevo_contacts: number;
}

// Validar email
function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

// Parsear nombre completo en nombre y apellidos
function parseFullName(fullName: string | undefined): { nombre: string; apellidos: string } {
  if (!fullName || fullName.trim() === '') {
    return { nombre: '', apellidos: '' };
  }
  
  const parts = fullName.trim().split(/\s+/);
  if (parts.length === 1) {
    return { nombre: parts[0], apellidos: '' };
  }
  
  return {
    nombre: parts[0],
    apellidos: parts.slice(1).join(' ')
  };
}

// Obtener todos los contactos de Brevo con paginación
async function fetchAllBrevoContacts(): Promise<BrevoContact[]> {
  const allContacts: BrevoContact[] = [];
  const limit = 50;
  let offset = 0;
  let hasMore = true;

  console.log('Fetching contacts from Brevo...');

  while (hasMore) {
    const response = await fetch(
      `https://api.brevo.com/v3/contacts?limit=${limit}&offset=${offset}&sort=desc`,
      {
        method: 'GET',
        headers: {
          'accept': 'application/json',
          'api-key': BREVO_API_KEY!
        }
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Brevo API error: ${JSON.stringify(errorData)}`);
    }

    const data = await response.json();
    const contacts = data.contacts || [];
    
    allContacts.push(...contacts);
    console.log(`Fetched ${allContacts.length} contacts so far...`);

    if (contacts.length < limit) {
      hasMore = false;
    } else {
      offset += limit;
    }

    // Small delay to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  console.log(`Total contacts fetched from Brevo: ${allContacts.length}`);
  return allContacts;
}

// Buscar o crear empresa por nombre
async function findOrCreateEmpresa(
  supabase: any,
  companyName: string
): Promise<string | null> {
  if (!companyName || companyName.trim() === '') {
    return null;
  }

  const normalizedName = companyName.trim();

  // Buscar empresa existente
  const { data: existing } = await supabase
    .from('empresas')
    .select('id')
    .ilike('nombre', normalizedName)
    .limit(1)
    .single();

  if (existing) {
    return existing.id;
  }

  // Crear nueva empresa
  const { data: newEmpresa, error } = await supabase
    .from('empresas')
    .insert({
      nombre: normalizedName,
      brevo_synced_at: new Date().toISOString()
    })
    .select('id')
    .single();

  if (error) {
    console.error('Error creating empresa:', error);
    return null;
  }

  return newEmpresa?.id || null;
}

// Sincronizar contactos desde Brevo
async function syncContactsFromBrevo(supabase: any): Promise<SyncResult> {
  const result: SyncResult = {
    contactos_created: 0,
    contactos_updated: 0,
    contactos_skipped: 0,
    empresas_created: 0,
    empresas_linked: 0,
    errors: [],
    total_brevo_contacts: 0
  };

  try {
    // Obtener todos los contactos de Brevo
    const brevoContacts = await fetchAllBrevoContacts();
    result.total_brevo_contacts = brevoContacts.length;

    // Obtener todos los contactos existentes por email
    const { data: existingContacts } = await supabase
      .from('contactos')
      .select('id, email, brevo_id');

    const existingByEmail = new Map<string, { id: string; email: string; brevo_id?: string }>(
      (existingContacts || []).map((c: any) => [c.email?.toLowerCase(), c])
    );

    // Obtener empresas existentes para el cache
    const { data: existingEmpresas } = await supabase
      .from('empresas')
      .select('id, nombre');

    const empresasByName = new Map<string, string>(
      (existingEmpresas || []).map((e: any) => [e.nombre?.toLowerCase(), e.id])
    );

    const empresasCreatedSet = new Set<string>();

    for (const brevoContact of brevoContacts) {
      try {
        const email = brevoContact.email?.toLowerCase();
        
        if (!email || !isValidEmail(email)) {
          result.contactos_skipped++;
          continue;
        }

        const attrs = brevoContact.attributes || {};
        
        // Extraer nombre y apellidos
        let nombre = attrs.NOMBRE || attrs.FNAME || '';
        let apellidos = attrs.APELLIDOS || attrs.LASTNAME || attrs.LNAME || '';
        
        // Si no hay nombre pero hay un nombre completo en algún campo
        if (!nombre && !apellidos) {
          const fullName = attrs.FULLNAME || attrs.NAME || '';
          const parsed = parseFullName(fullName);
          nombre = parsed.nombre;
          apellidos = parsed.apellidos;
        }

        // Obtener empresa
        const companyName = attrs.COMPANY || attrs.EMPRESA || '';
        let empresaId: string | null = null;

        if (companyName) {
          const normalizedCompany = companyName.trim().toLowerCase();
          
          if (empresasByName.has(normalizedCompany)) {
            empresaId = empresasByName.get(normalizedCompany)!;
            result.empresas_linked++;
          } else {
            // Crear nueva empresa
            const { data: newEmpresa, error: empresaError } = await supabase
              .from('empresas')
              .insert({
                nombre: companyName.trim(),
                brevo_synced_at: new Date().toISOString()
              })
              .select('id')
              .single();

            if (!empresaError && newEmpresa) {
              empresaId = newEmpresa.id;
              empresasByName.set(normalizedCompany, newEmpresa.id);
              
              if (!empresasCreatedSet.has(normalizedCompany)) {
                empresasCreatedSet.add(normalizedCompany);
                result.empresas_created++;
              }
            }
          }
        }

        const contactData = {
          nombre: nombre || 'Sin nombre',
          apellidos: apellidos || '',
          email: email,
          telefono: attrs.TELEFONO || attrs.PHONE || attrs.SMS || '',
          cargo: attrs.CARGO || '',
          linkedin: attrs.LINKEDIN || '',
          empresa_principal_id: empresaId,
          brevo_id: brevoContact.id.toString(),
          brevo_synced_at: new Date().toISOString()
        };

        const existing = existingByEmail.get(email);

        if (existing) {
          // Actualizar contacto existente
          const { error: updateError } = await supabase
            .from('contactos')
            .update(contactData)
            .eq('id', existing.id);

          if (updateError) {
            result.errors.push(`Error updating ${email}: ${updateError.message}`);
          } else {
            result.contactos_updated++;
          }
        } else {
          // Crear nuevo contacto
          const { error: insertError } = await supabase
            .from('contactos')
            .insert(contactData);

          if (insertError) {
            result.errors.push(`Error creating ${email}: ${insertError.message}`);
          } else {
            result.contactos_created++;
            existingByEmail.set(email, { id: '', email, brevo_id: brevoContact.id.toString() });
          }
        }
      } catch (contactError: any) {
        result.errors.push(`Error processing contact: ${contactError.message}`);
      }
    }

    // Registrar en brevo_sync_log
    await supabase.from('brevo_sync_log').insert({
      entity_type: 'bulk_import',
      entity_id: crypto.randomUUID(),
      sync_status: result.errors.length > 0 ? 'partial' : 'success',
      brevo_id: 'sync-from-brevo',
      last_sync_at: new Date().toISOString(),
      sync_error: result.errors.length > 0 ? result.errors.slice(0, 10).join('; ') : null
    });

  } catch (error: any) {
    console.error('Error in syncContactsFromBrevo:', error);
    result.errors.push(`General error: ${error.message}`);
  }

  return result;
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    if (!BREVO_API_KEY) {
      throw new Error('BREVO_API_KEY no configurada');
    }

    if (!SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error('SUPABASE_SERVICE_ROLE_KEY no configurada');
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    console.log('Starting sync from Brevo...');
    const result = await syncContactsFromBrevo(supabase);
    console.log('Sync completed:', result);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Sincronización completada',
        result 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('Error en sync-from-brevo:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
