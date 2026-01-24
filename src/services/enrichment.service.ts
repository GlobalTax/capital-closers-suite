/**
 * Enrichment Service
 * Handles the logic for enriching, merging, and applying company data
 */

import { supabase } from "@/integrations/supabase/client";
import type {
  EnrichedData,
  ExistingEmpresa,
  FieldDiff,
  MergeMode,
  MergeResult,
  ContactWithDedupe,
} from "@/types/enrichment";
import { validateBeforeCreate, type EmpresaValidationResult } from "./empresas.validator";

// Fields that can be merged
const MERGEABLE_FIELDS: { field: keyof ExistingEmpresa; label: string }[] = [
  { field: 'nombre', label: 'Nombre' },
  { field: 'descripcion', label: 'Descripción' },
  { field: 'sector', label: 'Sector' },
  { field: 'empleados', label: 'Empleados' },
  { field: 'sitio_web', label: 'Sitio Web' },
  { field: 'ubicacion', label: 'Ubicación' },
  { field: 'cnae_codigo', label: 'CNAE' },
  { field: 'cnae_descripcion', label: 'CNAE Descripción' },
];

/**
 * Check for duplicates after enrichment
 */
export async function checkDuplicates(
  enrichedData: EnrichedData
): Promise<EmpresaValidationResult> {
  return validateBeforeCreate({
    nombre: enrichedData.nombre,
    cif: null, // Enrichment doesn't provide CIF
    sitio_web: enrichedData.sitio_web || null,
  });
}

/**
 * Fetch full empresa data for merge comparison
 */
export async function fetchEmpresaForMerge(
  empresaId: string
): Promise<ExistingEmpresa | null> {
  const { data, error } = await supabase
    .from('empresas')
    .select('id, nombre, descripcion, sector, sector_id, empleados, sitio_web, ubicacion, cif, facturacion, ebitda, cnae_codigo, cnae_descripcion, actividades_destacadas')
    .eq('id', empresaId)
    .maybeSingle();

  if (error || !data) return null;
  return data as ExistingEmpresa;
}

/**
 * Calculate field differences between existing and incoming data
 */
export function calculateFieldDiff(
  existing: ExistingEmpresa,
  incoming: EnrichedData
): FieldDiff[] {
  return MERGEABLE_FIELDS.map(({ field, label }) => {
    const oldValue = existing[field];
    let newValue: string | number | null | undefined;

    // Map incoming data to existing field names
    switch (field) {
      case 'nombre':
        newValue = incoming.nombre;
        break;
      case 'descripcion':
        newValue = incoming.descripcion;
        break;
      case 'sector':
        newValue = incoming.sector;
        break;
      case 'empleados':
        newValue = incoming.empleados;
        break;
      case 'sitio_web':
        newValue = incoming.sitio_web;
        break;
      case 'ubicacion':
        newValue = incoming.ubicacion;
        break;
      case 'cnae_codigo':
        newValue = incoming.cnae_codigo;
        break;
      case 'cnae_descripcion':
        newValue = incoming.cnae_descripcion;
        break;
      default:
        newValue = undefined;
    }

    const isConflict = oldValue != null && newValue != null && oldValue !== newValue;

    return {
      field,
      label,
      oldValue,
      newValue,
      isConflict,
      selected: newValue != null && (oldValue == null || isConflict),
    };
  });
}

/**
 * Get fields that are empty in the existing empresa
 */
export function getEmptyFields(empresa: ExistingEmpresa): string[] {
  return MERGEABLE_FIELDS
    .filter(({ field }) => empresa[field] == null || empresa[field] === '')
    .map(({ field }) => field);
}

/**
 * Check contacts for duplicates
 */
export async function dedupeContacts(
  contacts: EnrichedData['contactos'],
  empresaId?: string
): Promise<ContactWithDedupe[]> {
  if (!contacts.length) return [];

  // Get existing contacts by email or phone
  const emails = contacts.map(c => c.email).filter(Boolean) as string[];
  const phones = contacts.map(c => c.telefono).filter(Boolean) as string[];

  let existingContacts: Array<{ id: string; nombre: string; apellidos?: string; email?: string; telefono?: string }> = [];

  if (emails.length > 0 || phones.length > 0) {
    let query = supabase.from('contactos').select('id, nombre, apellidos, email, telefono');
    
    if (empresaId) {
      query = query.eq('empresa_principal_id', empresaId);
    }

    if (emails.length > 0 && phones.length > 0) {
      query = query.or(`email.in.(${emails.join(',')}),telefono.in.(${phones.join(',')})`);
    } else if (emails.length > 0) {
      query = query.in('email', emails);
    } else {
      query = query.in('telefono', phones);
    }

    const { data } = await query;
    existingContacts = data || [];
  }

  return contacts.map(contact => {
    const existingByEmail = contact.email
      ? existingContacts.find(e => e.email?.toLowerCase() === contact.email?.toLowerCase())
      : null;
    const existingByPhone = contact.telefono
      ? existingContacts.find(e => e.telefono === contact.telefono)
      : null;
    const existing = existingByEmail || existingByPhone;

    return {
      ...contact,
      selected: !existing,
      isDuplicate: !!existing,
      existingContactId: existing?.id,
      existingContactName: existing ? `${existing.nombre} ${existing.apellidos || ''}`.trim() : undefined,
    };
  });
}

/**
 * Apply enrichment data to create or update empresa
 */
export async function applyEnrichment(
  enrichedData: EnrichedData,
  existingEmpresaId: string | null,
  mergeMode: MergeMode,
  fieldSelections: Record<string, boolean>,
  contactsToImport: ContactWithDedupe[],
  mandatoId?: string
): Promise<MergeResult> {
  let empresaId: string;
  let action: 'created' | 'updated' | 'skipped';
  const fieldsUpdated: string[] = [];

  if (existingEmpresaId && mergeMode !== 'create_new') {
    // Update existing empresa
    empresaId = existingEmpresaId;
    const existing = await fetchEmpresaForMerge(existingEmpresaId);
    
    if (!existing) {
      throw new Error('Empresa no encontrada');
    }

    const updateData: Record<string, any> = {
      fuente_enriquecimiento: enrichedData.fuente,
      fecha_enriquecimiento: new Date().toISOString(),
    };

    // Build update based on mode and selections
    const diffs = calculateFieldDiff(existing, enrichedData);
    
    for (const diff of diffs) {
      if (diff.newValue == null) continue;
      
      const shouldUpdate = mergeMode === 'empty_only'
        ? diff.oldValue == null
        : fieldSelections[diff.field] ?? diff.selected;

      if (shouldUpdate) {
        updateData[diff.field] = diff.newValue;
        fieldsUpdated.push(diff.field);
      }
    }

    // Add sector_id if sector is being updated
    if (fieldsUpdated.includes('sector') && enrichedData.sector_id) {
      updateData.sector_id = enrichedData.sector_id;
    }

    // Add activities if available
    if (enrichedData.actividades_destacadas?.length) {
      updateData.actividades_destacadas = enrichedData.actividades_destacadas;
    }

    if (Object.keys(updateData).length > 2) { // More than just source tracking
      const { error } = await supabase
        .from('empresas')
        .update(updateData)
        .eq('id', empresaId);

      if (error) throw error;
      action = 'updated';
    } else {
      action = 'skipped';
    }
  } else {
    // Create new empresa
    const insertData: Record<string, any> = {
      nombre: enrichedData.nombre,
      descripcion: enrichedData.descripcion,
      sector: enrichedData.sector,
      sector_id: enrichedData.sector_id,
      empleados: enrichedData.empleados,
      sitio_web: enrichedData.sitio_web,
      ubicacion: enrichedData.ubicacion,
      cnae_codigo: enrichedData.cnae_codigo,
      cnae_descripcion: enrichedData.cnae_descripcion,
      actividades_destacadas: enrichedData.actividades_destacadas,
      fuente_enriquecimiento: enrichedData.fuente,
      fecha_enriquecimiento: new Date().toISOString(),
      es_target: true,
    };

    const { data, error } = await supabase
      .from('empresas')
      .insert(insertData as any)
      .select('id')
      .single();

    if (error) throw error;
    empresaId = data.id;
    action = 'created';
    fieldsUpdated.push(...Object.keys(insertData).filter(k => insertData[k] != null));
  }

  // Associate to mandato if provided
  if (mandatoId && action === 'created') {
    await supabase.from('mandato_empresas').insert({
      mandato_id: mandatoId,
      empresa_id: empresaId,
      rol: 'target',
    });
  }

  // Create selected contacts
  const selectedContacts = contactsToImport.filter(c => c.selected && c.nombre);
  let contactsCreated = 0;
  let contactsSkipped = 0;

  for (const contact of selectedContacts) {
    if (contact.isDuplicate) {
      contactsSkipped++;
      continue;
    }

    const nameParts = contact.nombre.split(' ');
    const nombre = nameParts[0];
    const apellidos = nameParts.slice(1).join(' ') || null;

    const { error } = await supabase.from('contactos').insert({
      nombre,
      apellidos,
      cargo: contact.cargo,
      email: contact.email,
      linkedin: contact.linkedin,
      telefono: contact.telefono,
      empresa_principal_id: empresaId,
    });

    if (!error) {
      contactsCreated++;
    }
  }

  // Log to audit
  await logEnrichmentAudit(empresaId, action, fieldsUpdated, enrichedData.fuente);

  return {
    empresaId,
    action,
    fieldsUpdated,
    contactsCreated,
    contactsSkipped: contactsSkipped + selectedContacts.filter(c => c.isDuplicate).length,
  };
}

/**
 * Log enrichment action to audit logs
 */
async function logEnrichmentAudit(
  empresaId: string,
  action: 'created' | 'updated' | 'skipped',
  fieldsUpdated: string[],
  source: string
): Promise<void> {
  try {
    await supabase.from('audit_logs').insert({
      action: action === 'created' ? 'INSERT' : 'UPDATE',
      table_name: 'empresas',
      record_id: empresaId,
      new_values: {
        enrichment_action: action,
        enrichment_source: source,
        fields_enriched: fieldsUpdated,
      },
      changed_fields: fieldsUpdated,
    });
  } catch (err) {
    console.error('Failed to log enrichment audit:', err);
  }
}
