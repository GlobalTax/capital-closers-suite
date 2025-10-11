/**
 * Entity Linker - Vinculación inteligente de entidades
 */

import { supabase } from "@/integrations/supabase/client";
import { normalizeCompanyName } from "./csvParser";
import type { Empresa, Contacto } from "@/types";

export interface LinkResult {
  found: boolean;
  entity?: any;
  matchType?: 'exact' | 'normalized' | 'fuzzy' | 'created';
}

/**
 * Buscar empresa por múltiples criterios
 */
export const findEmpresa = async (data: {
  cif?: string;
  nombre: string;
  sitio_web?: string;
}): Promise<LinkResult> => {
  // 1. Buscar por CIF exacto (más confiable)
  if (data.cif) {
    const { data: empresaByCIF, error } = await supabase
      .from('empresas')
      .select('*')
      .eq('cif', data.cif.toUpperCase())
      .maybeSingle();
    
    if (!error && empresaByCIF) {
      return { found: true, entity: empresaByCIF, matchType: 'exact' };
    }
  }

  // 2. Buscar por nombre normalizado
  const normalizedName = normalizeCompanyName(data.nombre);
  
  const { data: empresas, error } = await supabase
    .from('empresas')
    .select('id, nombre, cif, sector, sitio_web');
  
  if (!error && empresas) {
    // Buscar coincidencia por nombre normalizado
    const match = empresas.find(e => 
      normalizeCompanyName(e.nombre) === normalizedName
    );
    
    if (match) {
      return { found: true, entity: match, matchType: 'normalized' };
    }
  }

  // 3. Buscar por dominio de sitio web
  if (data.sitio_web) {
    try {
      const domain = new URL(data.sitio_web).hostname.replace('www.', '');
      const { data: empresaByWeb, error: webError } = await supabase
        .from('empresas')
        .select('*')
        .ilike('sitio_web', `%${domain}%`)
        .maybeSingle();
      
      if (!webError && empresaByWeb) {
        return { found: true, entity: empresaByWeb, matchType: 'exact' };
      }
    } catch (e) {
      // URL inválida, continuar
    }
  }

  return { found: false };
};

/**
 * Crear o encontrar empresa
 */
export const findOrCreateEmpresa = async (
  data: {
    nombre: string;
    cif?: string;
    sector?: string;
    sitio_web?: string;
    facturacion?: number;
    empleados?: number;
  },
  importLogId?: string
): Promise<Empresa> => {
  // Intentar encontrar empresa existente
  const linkResult = await findEmpresa(data);
  
  if (linkResult.found && linkResult.entity) {
    return linkResult.entity as Empresa;
  }

  // Crear nueva empresa
  const newEmpresa: any = {
    nombre: data.nombre,
    cif: data.cif?.toUpperCase(),
    sector: data.sector || 'Sin clasificar',
    sitio_web: data.sitio_web,
    facturacion: data.facturacion,
    empleados: data.empleados,
    es_target: false,
    import_log_id: importLogId
  };

  const { data: created, error } = await supabase
    .from('empresas')
    .insert(newEmpresa)
    .select()
    .single();

  if (error) throw error;
  return created as Empresa;
};

/**
 * Buscar contacto por email o nombre+empresa
 */
export const findContacto = async (data: {
  email?: string;
  nombre: string;
  empresa_id?: string;
}): Promise<LinkResult> => {
  // 1. Buscar por email (más confiable)
  if (data.email) {
    const { data: contactoByEmail, error } = await supabase
      .from('contactos')
      .select('*')
      .eq('email', data.email.toLowerCase())
      .maybeSingle();
    
    if (!error && contactoByEmail) {
      return { found: true, entity: contactoByEmail, matchType: 'exact' };
    }
  }

  // 2. Buscar por nombre + empresa
  if (data.empresa_id) {
    const { data: contactos, error } = await supabase
      .from('contactos')
      .select('id, nombre, apellidos, email, empresa_principal_id')
      .eq('empresa_principal_id', data.empresa_id);
    
    if (!error && contactos) {
      const normalizedSearch = normalizeCompanyName(data.nombre);
      const match = contactos.find(c => 
        normalizeCompanyName(`${c.nombre} ${c.apellidos || ''}`) === normalizedSearch
      );
      
      if (match) {
        return { found: true, entity: match, matchType: 'normalized' };
      }
    }
  }

  return { found: false };
};

/**
 * Crear o encontrar contacto
 */
export const findOrCreateContacto = async (
  data: {
    nombre: string;
    apellidos?: string;
    email: string;
    telefono?: string;
    cargo?: string;
    empresa_id?: string;
    linkedin?: string;
    notas?: string;
  },
  importLogId?: string
): Promise<Contacto> => {
  // Intentar encontrar contacto existente
  const linkResult = await findContacto({
    email: data.email,
    nombre: data.nombre,
    empresa_id: data.empresa_id
  });
  
  if (linkResult.found && linkResult.entity) {
    return linkResult.entity as Contacto;
  }

  // Crear nuevo contacto
  const newContacto: any = {
    nombre: data.nombre,
    apellidos: data.apellidos,
    email: data.email.toLowerCase(),
    telefono: data.telefono,
    cargo: data.cargo,
    empresa_principal_id: data.empresa_id,
    linkedin: data.linkedin,
    notas: data.notas,
    import_log_id: importLogId
  };

  const { data: created, error } = await supabase
    .from('contactos')
    .insert(newContacto)
    .select()
    .single();

  if (error) throw error;
  return created as Contacto;
};

/**
 * Verificar si un mandato ya existe (por brevo_id o título+empresa)
 */
export const findMandato = async (data: {
  brevo_id?: string;
  titulo: string;
  empresa_id?: string;
}): Promise<LinkResult> => {
  // 1. Buscar por título + empresa (brevo_id no existe en schema)
  // Skip brevo_id search as it's not in the current schema

  // 2. Buscar por título + empresa
  if (data.empresa_id) {
    const { data: mandatos, error } = await supabase
      .from('mandatos')
      .select('id, descripcion, empresa_principal_id')
      .eq('empresa_principal_id', data.empresa_id);
    
    if (!error && mandatos) {
      const normalizedTitle = normalizeCompanyName(data.titulo);
      const match = mandatos.find(m => 
        normalizeCompanyName(m.descripcion || '') === normalizedTitle
      );
      
      if (match) {
        return { found: true, entity: match, matchType: 'normalized' };
      }
    }
  }

  return { found: false };
};
