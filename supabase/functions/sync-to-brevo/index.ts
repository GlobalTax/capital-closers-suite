import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const BREVO_API_KEY = Deno.env.get('BREVO_API_KEY');
const SUPABASE_URL = Deno.env.get('SUPABASE_URL') || 'https://fwhqtzkkvnjkazhaficj.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface BrevoContact {
  email: string;
  attributes: Record<string, any>;
  listIds?: number[];
  updateEnabled?: boolean;
}

interface BrevoCompany {
  name: string;
  attributes?: Record<string, any>;
}

interface BrevoDeal {
  name: string;
  attributes: {
    deal_value?: number;
    deal_stage?: string;
    [key: string]: any;
  };
  linkedContactsIds?: string[];
  linkedCompaniesIds?: string[];
}

// Mapear estado del mandato a etapa de deal en Brevo
function mapEstadoToBrevoStage(estado: string): string {
  const stageMap: Record<string, string> = {
    prospecto: 'Fase 1',
    activo: 'Fase 2',
    en_negociacion: 'Fase 3',
    cerrado: 'Won',
    cancelado: 'Lost',
  };
  return stageMap[estado] || 'Fase 1';
}

// Validar email
function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

// Sincronizar contacto con Brevo
async function syncContactToBrevo(contactData: any, supabase: any): Promise<void> {
  console.log('Syncing contact to Brevo:', contactData.email);

  if (!contactData.email || !isValidEmail(contactData.email)) {
    throw new Error('Email inválido o faltante');
  }

  const brevoContact: BrevoContact = {
    email: contactData.email,
    attributes: {
      NOMBRE: contactData.nombre || '',
      APELLIDOS: contactData.apellidos || '',
      TELEFONO: contactData.telefono || '',
      CARGO: contactData.cargo || '',
      LINKEDIN: contactData.linkedin || '',
      EMPRESA_ID: contactData.empresa_principal_id || ''
    },
    updateEnabled: true
  };

  try {
    const response = await fetch('https://api.brevo.com/v3/contacts', {
      method: 'POST',
      headers: {
        'accept': 'application/json',
        'content-type': 'application/json',
        'api-key': BREVO_API_KEY!
      },
      body: JSON.stringify(brevoContact)
    });

    const responseData = await response.json();

    if (response.ok || response.status === 400) {
      // 400 puede significar que el contacto ya existe, actualizar
      if (response.status === 400 && responseData.code === 'duplicate_parameter') {
        console.log('Contact already exists, updating...');
        const updateResponse = await fetch(`https://api.brevo.com/v3/contacts/${encodeURIComponent(contactData.email)}`, {
          method: 'PUT',
          headers: {
            'accept': 'application/json',
            'content-type': 'application/json',
            'api-key': BREVO_API_KEY!
          },
          body: JSON.stringify({ attributes: brevoContact.attributes })
        });

        if (!updateResponse.ok) {
          throw new Error(`Error actualizando contacto: ${await updateResponse.text()}`);
        }
      }

      // Actualizar campos de sincronización en la tabla contactos
      await supabase
        .from('contactos')
        .update({
          brevo_synced_at: new Date().toISOString(),
          brevo_id: contactData.email
        })
        .eq('id', contactData.id);

      // Actualizar log de sincronización
      await supabase
        .from('brevo_sync_log')
        .upsert({
          entity_type: 'contact',
          entity_id: contactData.id,
          sync_status: 'success',
          brevo_id: contactData.email,
          last_sync_at: new Date().toISOString(),
          sync_error: null
        }, { onConflict: 'entity_type,entity_id' });

      console.log('Contact synced successfully');
    } else {
      throw new Error(`Brevo API error: ${JSON.stringify(responseData)}`);
    }
  } catch (error: any) {
    console.error('Error syncing contact:', error);
    
    // Actualizar log con error
    await supabase
      .from('brevo_sync_log')
      .update({
        sync_status: 'error',
        sync_error: error.message,
        sync_attempts: supabase.raw('sync_attempts + 1'),
        last_sync_at: new Date().toISOString()
      })
      .eq('entity_type', 'contact')
      .eq('entity_id', contactData.id);

    throw error;
  }
}

// Sincronizar empresa con Brevo
async function syncCompanyToBrevo(companyData: any, supabase: any): Promise<void> {
  console.log('Syncing company to Brevo:', companyData.nombre);

  const brevoCompany: BrevoCompany = {
    name: companyData.nombre || 'Sin nombre',
    attributes: {
      CIF: companyData.cif || '',
      SECTOR: companyData.sector || '',
      SUBSECTOR: companyData.subsector || '',
      UBICACION: companyData.ubicacion || '',
      FACTURACION: companyData.facturacion?.toString() || '',
      EMPLEADOS: companyData.empleados?.toString() || '',
      SITIO_WEB: companyData.sitio_web || '',
      REVENUE: companyData.revenue?.toString() || '',
      EBITDA: companyData.ebitda?.toString() || '',
      ES_TARGET: companyData.es_target ? 'Sí' : 'No',
      ESTADO_TARGET: companyData.estado_target || ''
    }
  };

  try {
    const response = await fetch('https://api.brevo.com/v3/companies', {
      method: 'POST',
      headers: {
        'accept': 'application/json',
        'content-type': 'application/json',
        'api-key': BREVO_API_KEY!
      },
      body: JSON.stringify(brevoCompany)
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Brevo API error: ${JSON.stringify(errorData)}`);
    }

    const responseData = await response.json();

    // Actualizar log de sincronización
    await supabase
      .from('brevo_sync_log')
      .update({
        sync_status: 'success',
        brevo_id: responseData.id,
        last_sync_at: new Date().toISOString(),
        sync_error: null
      })
      .eq('entity_type', 'company')
      .eq('entity_id', companyData.id);

    console.log('Company synced successfully:', responseData.id);
  } catch (error: any) {
    console.error('Error syncing company:', error);
    
    // Actualizar log con error
    await supabase
      .from('brevo_sync_log')
      .update({
        sync_status: 'error',
        sync_error: error.message,
        sync_attempts: supabase.raw('sync_attempts + 1'),
        last_sync_at: new Date().toISOString()
      })
      .eq('entity_type', 'company')
      .eq('entity_id', companyData.id);

    throw error;
  }
}

// Crear deal en Brevo
async function createDealInBrevo(mandatoData: any, empresaId: string, supabase: any): Promise<void> {
  console.log('Creating deal in Brevo for mandato:', mandatoData.id);

  // Obtener empresa y contactos asociados
  const { data: empresa } = await supabase
    .from('empresas')
    .select('*')
    .eq('id', empresaId)
    .single();

  if (!empresa) {
    throw new Error('Empresa no encontrada');
  }

  // Obtener contactos del mandato
  const { data: mandatoContactos } = await supabase
    .from('mandato_contactos')
    .select('contacto:contactos(email)')
    .eq('mandato_id', mandatoData.id);

  // Obtener IDs de Brevo de los contactos
  const contactEmails = mandatoContactos?.map((mc: any) => mc.contacto?.email).filter(Boolean) || [];

  // Obtener Brevo ID de la empresa
  const { data: empresaLog } = await supabase
    .from('brevo_sync_log')
    .select('brevo_id')
    .eq('entity_type', 'company')
    .eq('entity_id', empresaId)
    .eq('sync_status', 'success')
    .single();

  // Generar ID corto (primeros 8 caracteres del UUID)
  const shortId = mandatoData.id.substring(0, 8).toUpperCase();
  const tipoTexto = mandatoData.tipo === 'compra' ? 'Compra' : 'Venta';
  
  const brevoDeal: BrevoDeal = {
    name: `${shortId} - ${empresa.nombre} - Proceso de ${tipoTexto}`,
    attributes: {
      deal_value: mandatoData.valor || mandatoData.valoracion_esperada || 0,
      deal_stage: mapEstadoToBrevoStage(mandatoData.estado),
      tipo_mandato: mandatoData.tipo || '',
      fecha_inicio: mandatoData.fecha_inicio || '',
      fecha_cierre_prevista: mandatoData.fecha_cierre || '',
      descripcion: mandatoData.descripcion || '',
      valoracion_esperada: mandatoData.valoracion_esperada?.toString() || '',
      mandato_id: mandatoData.id,
      numero_mandato: shortId
    },
    linkedContactsIds: contactEmails,
    linkedCompaniesIds: empresaLog?.brevo_id ? [empresaLog.brevo_id] : []
  };

  try {
    const response = await fetch('https://api.brevo.com/v3/crm/deals', {
      method: 'POST',
      headers: {
        'accept': 'application/json',
        'content-type': 'application/json',
        'api-key': BREVO_API_KEY!
      },
      body: JSON.stringify(brevoDeal)
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Brevo API error: ${JSON.stringify(errorData)}`);
    }

    const responseData = await response.json();

    // Actualizar log de sincronización
    await supabase
      .from('brevo_sync_log')
      .update({
        sync_status: 'success',
        brevo_id: responseData.id,
        last_sync_at: new Date().toISOString(),
        sync_error: null
      })
      .eq('entity_type', 'deal')
      .eq('entity_id', mandatoData.id);

    console.log('Deal created successfully:', responseData.id);
  } catch (error: any) {
    console.error('Error creating deal:', error);
    
    // Actualizar log con error
    await supabase
      .from('brevo_sync_log')
      .update({
        sync_status: 'error',
        sync_error: error.message,
        sync_attempts: supabase.raw('sync_attempts + 1'),
        last_sync_at: new Date().toISOString()
      })
      .eq('entity_type', 'deal')
      .eq('entity_id', mandatoData.id);

    throw error;
  }
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
    const { type, id, mandato_id, empresa_id, data } = await req.json();

    console.log('Sync request received:', { type, id, mandato_id, empresa_id });

    switch (type) {
      case 'contact':
        await syncContactToBrevo(data, supabase);
        break;
      
      case 'company':
        await syncCompanyToBrevo(data, supabase);
        break;
      
      case 'deal':
        await createDealInBrevo(data, empresa_id, supabase);
        break;
      
      default:
        throw new Error(`Tipo de sincronización desconocido: ${type}`);
    }

    return new Response(
      JSON.stringify({ success: true, message: `${type} sincronizado correctamente` }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('Error en sync-to-brevo:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
