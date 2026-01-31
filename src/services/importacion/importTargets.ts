/**
 * Servicio de importación masiva de targets para mandatos de compra
 * Soporta importación desde Excel/CSV y Apollo
 */

import { supabase } from "@/integrations/supabase/client";
import type { ImportResult, ImportConfig } from "@/hooks/useImportacion";
import type { BuyerType } from "@/types";

export interface TargetImportRow {
  nombre: string;           // Requerido
  sector?: string;
  ubicacion?: string;
  facturacion?: number | string;
  empleados?: number | string;
  sitio_web?: string;
  contacto_nombre?: string;
  contacto_email?: string;
  contacto_telefono?: string;
  buyer_type?: BuyerType;
  tags?: string[];
  notas?: string;
}

export interface TargetImportConfig extends ImportConfig {
  defaultBuyerType?: BuyerType;
  defaultTags?: string[];
}

export interface ApolloProspect {
  id?: string;
  organization?: {
    name: string;
    industry?: string;
    country?: string;
    estimated_num_employees?: number;
    primary_domain?: string;
  };
  first_name?: string;
  last_name?: string;
  email?: string;
  phone_numbers?: Array<{ raw_number?: string }>;
  title?: string;
  linkedin_url?: string;
}

/**
 * Parsea un valor de facturación a número
 */
const parseFacturacion = (value: string | number | undefined): number | undefined => {
  if (!value) return undefined;
  if (typeof value === 'number') return value;
  
  const cleaned = value
    .replace(/[€$,.\s]/g, '')
    .replace(/M/gi, '000000')
    .replace(/K/gi, '000');
  const parsed = parseInt(cleaned, 10);
  return isNaN(parsed) ? undefined : parsed;
};

/**
 * Parsea un valor de empleados a número
 */
const parseEmpleados = (value: string | number | undefined): number | undefined => {
  if (!value) return undefined;
  if (typeof value === 'number') return value;
  
  // Manejar rangos: "10-50" -> tomar el primero
  const cleaned = value.split('-')[0].replace(/[^\d]/g, '');
  const parsed = parseInt(cleaned, 10);
  return isNaN(parsed) ? undefined : parsed;
};

/**
 * Normaliza el nombre de empresa para comparación de duplicados
 */
const normalizeCompanyName = (name: string): string => {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]/g, '')
    .trim();
};

/**
 * Busca una empresa por nombre normalizado
 */
const findEmpresaByName = async (nombre: string): Promise<{ id: string } | null> => {
  const normalized = normalizeCompanyName(nombre);
  
  const { data, error } = await supabase
    .from('empresas')
    .select('id, nombre')
    .limit(100);
  
  if (error || !data) return null;
  
  // Buscar coincidencia por nombre normalizado
  const match = data.find(e => normalizeCompanyName(e.nombre) === normalized);
  return match ? { id: match.id } : null;
};

/**
 * Crea una nueva empresa
 */
const createEmpresa = async (row: TargetImportRow): Promise<{ id: string }> => {
  const { data, error } = await supabase
    .from('empresas')
    .insert({
      nombre: row.nombre.trim(),
      sector: row.sector || undefined,
      ubicacion: row.ubicacion || undefined,
      facturacion: parseFacturacion(row.facturacion),
      empleados: parseEmpleados(row.empleados),
      sitio_web: row.sitio_web || undefined,
      descripcion: row.notas || undefined,
      es_target: true,
    })
    .select('id')
    .single();
  
  if (error) throw error;
  return data;
};

/**
 * Vincula una empresa a un mandato como target
 */
const addEmpresaAsMandatoTarget = async (
  mandatoId: string, 
  empresaId: string,
  config: TargetImportConfig,
  row: TargetImportRow
): Promise<void> => {
  const { error } = await supabase
    .from('mandato_empresas')
    .insert({
      mandato_id: mandatoId,
      empresa_id: empresaId,
      rol: 'target',
      notas: row.notas || undefined,
      buyer_type: row.buyer_type || config.defaultBuyerType || undefined,
      tags: [...(row.tags || []), ...(config.defaultTags || [])],
      funnel_stage: 'long_list',
      pipeline_stage_target: 'identificada',
    });
  
  if (error) {
    // Ignorar error de duplicado
    if (error.code === '23505') {
      throw new Error('Esta empresa ya está asociada como target a este mandato');
    }
    throw error;
  }
};

/**
 * Crea un contacto y lo asocia a una empresa
 */
const createContacto = async (
  empresaId: string,
  nombre: string,
  email?: string,
  telefono?: string
): Promise<void> => {
  const nombreParts = nombre.split(' ');
  const firstName = nombreParts[0] || 'Contacto';
  const lastName = nombreParts.slice(1).join(' ') || undefined;
  
  // Normalizar email
  const normalizedEmail = email?.toLowerCase().trim();
  
  // Verificar si el contacto ya existe
  if (normalizedEmail) {
    const { data: existing } = await supabase
      .from('contactos')
      .select('id')
      .eq('email', normalizedEmail)
      .maybeSingle();
    
    if (existing) {
      // Ya existe, actualizar empresa_principal_id si no tiene
      await supabase
        .from('contactos')
        .update({ empresa_principal_id: empresaId })
        .eq('id', existing.id)
        .is('empresa_principal_id', null);
      return;
    }
  }
  
  // Crear nuevo contacto
  const { error } = await supabase
    .from('contactos')
    .insert({
      nombre: firstName,
      apellidos: lastName,
      email: normalizedEmail || undefined,
      telefono: telefono || undefined,
      empresa_principal_id: empresaId,
    });
  
  if (error) throw error;
};

/**
 * Importa targets desde un archivo Excel/CSV parseado
 */
export async function importTargetsFromSpreadsheet(
  mandatoId: string,
  rows: TargetImportRow[],
  config: TargetImportConfig,
  onProgress?: (current: number, total: number) => void
): Promise<ImportResult[]> {
  const results: ImportResult[] = [];
  
  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    
    // Reportar progreso
    onProgress?.(i + 1, rows.length);
    
    // Validar nombre requerido
    if (!row.nombre || row.nombre.trim().length < 2) {
      results.push({
        name: row.nombre || `Fila ${i + 1}`,
        status: 'error',
        message: 'Nombre de empresa requerido (mínimo 2 caracteres)',
        rowIndex: i,
      });
      continue;
    }
    
    try {
      // Buscar empresa existente
      const existingEmpresa = await findEmpresaByName(row.nombre);
      
      let empresaId: string;
      
      if (existingEmpresa) {
        if (config.estrategiaDuplicados === 'skip') {
          results.push({
            name: row.nombre,
            status: 'skipped',
            message: 'Empresa ya existe en el CRM',
            rowIndex: i,
          });
          continue;
        }
        // Usar empresa existente
        empresaId = existingEmpresa.id;
      } else {
        // Crear nueva empresa
        const newEmpresa = await createEmpresa(row);
        empresaId = newEmpresa.id;
      }
      
      // Vincular como target al mandato
      try {
        await addEmpresaAsMandatoTarget(mandatoId, empresaId, config, row);
      } catch (linkError: any) {
        if (linkError.message?.includes('ya está asociada')) {
          results.push({
            name: row.nombre,
            status: 'skipped',
            message: 'Ya es target de este mandato',
            rowIndex: i,
          });
          continue;
        }
        throw linkError;
      }
      
      // Crear contacto si hay datos
      if (row.contacto_nombre || row.contacto_email) {
        try {
          await createContacto(
            empresaId,
            row.contacto_nombre || 'Contacto',
            row.contacto_email,
            row.contacto_telefono
          );
        } catch (contactError) {
          console.warn('[importTargets] Error creando contacto:', contactError);
          // No fallar la importación por error de contacto
        }
      }
      
      results.push({
        name: row.nombre,
        status: 'success',
        message: existingEmpresa ? 'Empresa existente vinculada' : 'Nueva empresa creada',
        rowIndex: i,
      });
      
    } catch (error: any) {
      console.error('[importTargets] Error procesando fila:', i, error);
      results.push({
        name: row.nombre,
        status: 'error',
        message: error.message || 'Error desconocido',
        rowIndex: i,
      });
    }
  }
  
  return results;
}

/**
 * Convierte prospects de Apollo a filas de importación
 */
export function convertApolloToTargetRows(prospects: ApolloProspect[]): TargetImportRow[] {
  return prospects.map(prospect => ({
    nombre: prospect.organization?.name || 'Sin nombre',
    sector: prospect.organization?.industry || undefined,
    ubicacion: prospect.organization?.country || undefined,
    empleados: prospect.organization?.estimated_num_employees,
    sitio_web: prospect.organization?.primary_domain 
      ? `https://${prospect.organization.primary_domain}` 
      : undefined,
    contacto_nombre: [prospect.first_name, prospect.last_name].filter(Boolean).join(' ') || undefined,
    contacto_email: prospect.email || undefined,
    contacto_telefono: prospect.phone_numbers?.[0]?.raw_number || undefined,
  }));
}

/**
 * Importa targets desde una búsqueda de Apollo
 */
export async function importTargetsFromApollo(
  mandatoId: string,
  prospects: ApolloProspect[],
  config: TargetImportConfig,
  onProgress?: (current: number, total: number) => void
): Promise<ImportResult[]> {
  // Convertir prospects a formato estándar
  const rows = convertApolloToTargetRows(prospects);
  
  // Añadir tag de origen
  const configWithTag: TargetImportConfig = {
    ...config,
    defaultTags: [...(config.defaultTags || []), 'apollo_import'],
  };
  
  return importTargetsFromSpreadsheet(mandatoId, rows, configWithTag, onProgress);
}
