/**
 * Servicio de importación de Contactos
 * Soporta datos ya normalizados con normalizeContactoRow()
 */

import { supabase } from "@/integrations/supabase/client";
import { findOrCreateEmpresa, findContacto } from "./entityLinker";
import { validateContactoRowTolerant } from "./validator";
import { normalizeContactoRow } from "./columnNormalizer";
import type { ImportConfig, ImportResult } from "@/hooks/useImportacion";

export const importContacto = async (
  row: Record<string, string>,
  rowIndex: number,
  config: ImportConfig,
  importLogId: string
): Promise<ImportResult> => {
  // NUEVO: Normalizar la fila primero para mapear columnas flexibles
  const normalizedRow = normalizeContactoRow(row);
  
  const name = `${normalizedRow.nombre || 'Sin nombre'} ${normalizedRow.apellidos || ''}`.trim();

  try {
    // 1. Validar datos con validación TOLERANTE
    const validation = validateContactoRowTolerant(normalizedRow);
    if (!validation.isValid) {
      return {
        name,
        status: 'error',
        message: validation.errors.filter(e => e.severity === 'error').map(e => e.message).join('; '),
        rowIndex
      };
    }

    // 2. Crear o encontrar empresa si se proporciona (usando datos normalizados)
    let empresaId: string | undefined;
    if (config.autoCrearEmpresas && normalizedRow.empresa_nombre) {
      const empresa = await findOrCreateEmpresa(
        {
          nombre: normalizedRow.empresa_nombre,
          cif: normalizedRow.empresa_cif,
          sector: normalizedRow.sector || 'Sin clasificar'
        },
        importLogId
      );
      empresaId = empresa.id;
    }

    // 3. Verificar si el contacto ya existe (usando email normalizado)
    const existingContacto = await findContacto({
      email: normalizedRow.email,
      nombre: name,
      empresa_id: empresaId
    });

    if (existingContacto.found) {
      if (config.estrategiaDuplicados === 'skip') {
        return {
          name,
          status: 'skipped',
          message: 'Contacto duplicado (omitido)',
          rowIndex
        };
      } else if (config.estrategiaDuplicados === 'update') {
        // Actualizar contacto existente con datos normalizados
        const { error } = await supabase
          .from('contactos')
          .update({
            nombre: normalizedRow.nombre,
            apellidos: normalizedRow.apellidos || null,
            telefono: normalizedRow.telefono || null,
            cargo: normalizedRow.cargo || null,
            empresa_principal_id: empresaId || null,
            linkedin: normalizedRow.linkedin || null,
            notas: normalizedRow.notas || null,
            updated_at: new Date().toISOString()
          })
          .eq('id', existingContacto.entity.id);

        if (error) throw error;

        return {
          name,
          status: 'success',
          message: 'Contacto actualizado',
          rowIndex
        };
      }
      // create_new: continuar con la creación
    }

    // 4. Crear nuevo contacto con datos normalizados
    const contactoData: any = {
      nombre: normalizedRow.nombre,
      apellidos: normalizedRow.apellidos || null,
      email: normalizedRow.email || null,
      telefono: normalizedRow.telefono || null,
      cargo: normalizedRow.cargo || null,
      empresa_principal_id: empresaId || null,
      linkedin: normalizedRow.linkedin || null,
      notas: normalizedRow.notas || null,
      import_log_id: importLogId
    };

    const { error: insertError } = await supabase
      .from('contactos')
      .insert(contactoData);

    if (insertError) throw insertError;

    return {
      name,
      status: 'success',
      message: `✓ Contacto creado${empresaId ? ` (vinculado a empresa)` : ''}`,
      rowIndex
    };

  } catch (error: any) {
    return {
      name,
      status: 'error',
      message: error.message || 'Error desconocido',
      rowIndex
    };
  }
};

export const importContactos = async (
  rows: Record<string, string>[],
  config: ImportConfig,
  importLogId: string,
  onProgress?: (current: number, total: number) => void
): Promise<ImportResult[]> => {
  const results: ImportResult[] = [];

  for (let i = 0; i < rows.length; i++) {
    const result = await importContacto(rows[i], i, config, importLogId);
    results.push(result);
    
    if (onProgress) {
      onProgress(i + 1, rows.length);
    }
  }

  return results;
};
