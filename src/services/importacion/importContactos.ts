/**
 * Servicio de importación de Contactos
 */

import { supabase } from "@/integrations/supabase/client";
import { findOrCreateEmpresa, findContacto } from "./entityLinker";
import { validateContactoRow } from "./validator";
import type { ImportConfig, ImportResult } from "@/hooks/useImportacion";

export const importContacto = async (
  row: Record<string, string>,
  rowIndex: number,
  config: ImportConfig,
  importLogId: string
): Promise<ImportResult> => {
  const name = `${row.nombre || row.first_name || 'Sin nombre'} ${row.apellidos || row.last_name || ''}`.trim();

  try {
    // 1. Validar datos
    const validation = validateContactoRow(row);
    if (!validation.isValid) {
      return {
        name,
        status: 'error',
        message: validation.errors.map(e => e.message).join('; '),
        rowIndex
      };
    }

    // 2. Crear o encontrar empresa si se proporciona
    let empresaId: string | undefined;
    if (config.autoCrearEmpresas && (row.empresa_nombre || row.company_name)) {
      const empresa = await findOrCreateEmpresa(
        {
          nombre: row.empresa_nombre || row.company_name,
          cif: row.empresa_cif || row.company_cif,
          sector: row.sector || 'Sin clasificar'
        },
        importLogId
      );
      empresaId = empresa.id;
    }

    // 3. Verificar si el contacto ya existe
    const existingContacto = await findContacto({
      email: row.email,
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
        // Actualizar contacto existente
        const { error } = await supabase
          .from('contactos')
          .update({
            nombre: row.nombre || row.first_name,
            apellidos: row.apellidos || row.last_name || null,
            telefono: row.telefono || row.phone || null,
            cargo: row.cargo || row.position || row.title || null,
            empresa_principal_id: empresaId || null,
            linkedin: row.linkedin || null,
            notas: row.notas || row.notes || null,
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

    // 4. Crear nuevo contacto
    const contactoData: any = {
      nombre: row.nombre || row.first_name,
      apellidos: row.apellidos || row.last_name || null,
      email: (row.email || '').toLowerCase(),
      telefono: row.telefono || row.phone || null,
      cargo: row.cargo || row.position || row.title || null,
      empresa_principal_id: empresaId || null,
      linkedin: row.linkedin || null,
      notas: row.notas || row.notes || null,
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
