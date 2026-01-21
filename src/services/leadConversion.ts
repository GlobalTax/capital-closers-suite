import { supabase } from "@/integrations/supabase/client";
import type { Empresa, Contacto, Mandato } from "@/types";

export interface ConversionData {
  // Empresa data
  empresa: {
    nombre: string;
    cif?: string;
    sector?: string;
    web?: string;
    email?: string;
    telefono?: string;
    direccion?: string;
    pais?: string;
    facturacion?: number;
    ebitda?: number;
    empleados?: number;
  };
  // Mandato data
  mandato: {
    codigo: string;
    descripcion: string;
    tipo: 'compra' | 'venta';
    categoria?: string;
    valor?: number;
    estructura_honorarios?: string;
    porcentaje_exito?: number;
    fee_fijo?: number;
    retainer_mensual?: number;
  };
  // Contacto data
  contacto: {
    nombre: string;
    apellidos?: string;
    email: string;
    telefono?: string;
    cargo?: string;
    rol_en_mandato?: string;
  };
}

export interface ConversionResult {
  success: boolean;
  empresaId?: string;
  mandatoId?: string;
  contactoId?: string;
  error?: string;
}

// Convert a lead to a full client with empresa, mandato, and contacto
export async function convertLeadToClient(
  leadId: string,
  leadType: 'contact' | 'valuation' | 'collaborator',
  data: ConversionData
): Promise<ConversionResult> {
  try {
    // 1. Create or find empresa
    let empresaId: string;
    
    // Check if empresa with same CIF exists
    if (data.empresa.cif) {
      const { data: existingEmpresa } = await supabase
        .from('empresas')
        .select('id')
        .eq('cif', data.empresa.cif)
        .maybeSingle();
      
      if (existingEmpresa) {
        empresaId = existingEmpresa.id;
      } else {
        const { data: newEmpresa, error: empresaError } = await supabase
          .from('empresas')
          .insert({
            nombre: data.empresa.nombre,
            cif: data.empresa.cif,
            sector: data.empresa.sector,
            web: data.empresa.web,
            email: data.empresa.email,
            telefono: data.empresa.telefono,
            direccion: data.empresa.direccion,
            pais: data.empresa.pais || 'España',
            facturacion: data.empresa.facturacion,
            ebitda: data.empresa.ebitda,
            empleados: data.empresa.empleados,
            es_cliente: true,
          })
          .select('id')
          .single();
        
        if (empresaError) throw empresaError;
        empresaId = newEmpresa.id;
      }
    } else {
      const { data: newEmpresa, error: empresaError } = await supabase
        .from('empresas')
        .insert({
          nombre: data.empresa.nombre,
          sector: data.empresa.sector,
          web: data.empresa.web,
          email: data.empresa.email,
          telefono: data.empresa.telefono,
          pais: data.empresa.pais || 'España',
          facturacion: data.empresa.facturacion,
          ebitda: data.empresa.ebitda,
          empleados: data.empresa.empleados,
          es_cliente: true,
        })
        .select('id')
        .single();
      
      if (empresaError) throw empresaError;
      empresaId = newEmpresa.id;
    }

    // 2. Create mandato
    const { data: newMandato, error: mandatoError } = await supabase
      .from('mandatos')
      .insert({
        codigo: data.mandato.codigo,
        descripcion: data.mandato.descripcion,
        tipo: data.mandato.tipo,
        categoria: data.mandato.categoria || 'operation_ma',
        estado: 'activo',
        pipeline_stage: 'propuesta',
        valor: data.mandato.valor,
        empresa_principal_id: empresaId,
        estructura_honorarios: data.mandato.estructura_honorarios || 'exito',
        porcentaje_exito: data.mandato.porcentaje_exito,
        fee_fijo: data.mandato.fee_fijo,
        retainer_mensual: data.mandato.retainer_mensual,
        fecha_inicio: new Date().toISOString().split('T')[0],
      })
      .select('id')
      .single();

    if (mandatoError) throw mandatoError;
    const mandatoId = newMandato.id;

    // 3. Create contacto
    const { data: newContacto, error: contactoError } = await supabase
      .from('contactos')
      .insert({
        nombre: data.contacto.nombre,
        apellidos: data.contacto.apellidos,
        email: data.contacto.email,
        telefono: data.contacto.telefono,
        cargo: data.contacto.cargo,
        empresa_principal_id: empresaId,
        es_cliente: true,
      })
      .select('id')
      .single();

    if (contactoError) throw contactoError;
    const contactoId = newContacto.id;

    // 4. Link contacto to mandato
    await supabase
      .from('mandato_contactos')
      .insert({
        mandato_id: mandatoId,
        contacto_id: contactoId,
        rol: data.contacto.rol_en_mandato || 'cliente',
        es_principal: true,
      });

    // 5. Update the lead status to converted
    if (leadType === 'valuation') {
      // For valuations, we might want to mark it somehow
      // This would require adding a status field to advisor_valuations
    } else if (leadType === 'contact') {
      await supabase
        .from('acquisition_leads')
        .update({ status: 'converted' })
        .eq('id', leadId);
    }

    // 6. Migrate any existing mandate_leads entries
    const { data: existingMandateLeads } = await supabase
      .from('mandate_leads')
      .select('id')
      .or(`valuation_id.eq.${leadId},admin_lead_id.eq.${leadId}`);

    if (existingMandateLeads && existingMandateLeads.length > 0) {
      // Link the empresa to the mandate_leads
      await supabase
        .from('mandate_leads')
        .update({ empresa_id: empresaId })
        .or(`valuation_id.eq.${leadId},admin_lead_id.eq.${leadId}`);
    }

    return {
      success: true,
      empresaId,
      mandatoId,
      contactoId,
    };
  } catch (error: any) {
    console.error('Error converting lead:', error);
    return {
      success: false,
      error: error.message || 'Error al convertir el lead',
    };
  }
}

// Get conversion suggestions based on lead data
export function getConversionSuggestions(lead: {
  nombre: string;
  email: string;
  empresa?: string;
  sector?: string;
  valoracion?: number;
  facturacion?: number;
  ebitda?: number;
  phone?: string;
}): Partial<ConversionData> {
  // Parse name into nombre and apellidos
  const nameParts = lead.nombre.split(' ');
  const nombre = nameParts[0];
  const apellidos = nameParts.slice(1).join(' ');

  return {
    empresa: {
      nombre: lead.empresa || '',
      sector: lead.sector,
      facturacion: lead.facturacion,
      ebitda: lead.ebitda,
    },
    contacto: {
      nombre,
      apellidos: apellidos || undefined,
      email: lead.email,
      telefono: lead.phone,
    },
    mandato: {
      codigo: '',
      descripcion: lead.empresa ? `Asesoramiento M&A - ${lead.empresa}` : '',
      tipo: 'venta',
      valor: lead.valoracion,
    },
  };
}
