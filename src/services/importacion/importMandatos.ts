/**
 * Servicio de importación de Mandatos
 */

import { supabase } from "@/integrations/supabase/client";
import { findOrCreateEmpresa, findMandato } from "./entityLinker";
import { validateMandatoRow } from "./validator";
import type { ImportConfig, ImportResult } from "@/hooks/useImportacion";

export const importMandato = async (
  row: Record<string, string>,
  rowIndex: number,
  config: ImportConfig,
  importLogId: string
): Promise<ImportResult> => {
  const name = row.titulo || row.nombre || row.deal_name || `Mandato ${rowIndex + 1}`;

  try {
    // 1. Validar datos
    const validation = validateMandatoRow(row);
    if (!validation.isValid) {
      return {
        name,
        status: 'error',
        message: validation.errors.map(e => e.message).join('; '),
        rowIndex
      };
    }

    // 2. Crear o encontrar empresa
    const empresa = await findOrCreateEmpresa(
      {
        nombre: row.empresa_nombre || row.company_name || 'Sin nombre',
        cif: row.empresa_cif || row.cif,
        sector: row.sector || row.industry || 'Sin clasificar',
        sitio_web: row.sitio_web || row.website
      },
      importLogId
    );

    // 3. Verificar si el mandato ya existe
    const existingMandato = await findMandato({
      brevo_id: row.brevo_id || row.deal_id,
      titulo: row.titulo || row.deal_name,
      empresa_id: empresa.id
    });

    if (existingMandato.found) {
      if (config.estrategiaDuplicados === 'skip') {
        return {
          name,
          status: 'skipped',
          message: 'Mandato duplicado (omitido)',
          rowIndex
        };
      } else if (config.estrategiaDuplicados === 'update') {
        // Actualizar mandato existente
        const { error } = await supabase
          .from('mandatos')
          .update({
            tipo: (row.tipo || row.type || 'venta').toLowerCase(),
            estado: (row.estado || row.status || 'prospecto').toLowerCase(),
            valor: parseFloat(row.valor || row.value || row.amount || '0') || null,
            descripcion: row.descripcion || row.description || row.titulo || name,
            fecha_inicio: row.fecha_inicio || row.start_date || null,
            brevo_id: row.brevo_id || row.deal_id || null,
            updated_at: new Date().toISOString()
          })
          .eq('id', existingMandato.entity.id);

        if (error) throw error;

        return {
          name,
          status: 'success',
          message: 'Mandato actualizado',
          rowIndex
        };
      }
      // create_new: continuar con la creación
    }

    // 4. Crear nuevo mandato
    const mandatoData: any = {
      tipo: (row.tipo || row.type || 'venta').toLowerCase(),
      empresa_principal_id: empresa.id,
      estado: (row.estado || row.status || 'prospecto').toLowerCase(),
      valor: parseFloat(row.valor || row.value || row.amount || '0') || null,
      descripcion: row.descripcion || row.description || row.titulo || name,
      fecha_inicio: row.fecha_inicio || row.start_date || null,
      fecha_cierre: row.fecha_cierre || row.close_date || null,
      brevo_id: row.brevo_id || row.deal_id || null,
      import_log_id: importLogId
    };

    const { error: insertError } = await supabase
      .from('mandatos')
      .insert(mandatoData);

    if (insertError) throw insertError;

    return {
      name,
      status: 'success',
      message: `✓ Mandato creado (Empresa: ${empresa.nombre})`,
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

export const importMandatos = async (
  rows: Record<string, string>[],
  config: ImportConfig,
  importLogId: string,
  onProgress?: (current: number, total: number) => void
): Promise<ImportResult[]> => {
  const results: ImportResult[] = [];

  for (let i = 0; i < rows.length; i++) {
    const result = await importMandato(rows[i], i, config, importLogId);
    results.push(result);
    
    if (onProgress) {
      onProgress(i + 1, rows.length);
    }
  }

  return results;
};
