/**
 * Servicio de importación de Mandatos
 */

import { supabase } from "@/integrations/supabase/client";
import { findOrCreateEmpresa, findMandato } from "./entityLinker";
import { validateMandatoRow } from "./validator";
import { normalizeMandatoRow } from "./columnNormalizer";
import type { ImportConfig, ImportResult } from "@/hooks/useImportacion";

export const importMandato = async (
  row: Record<string, string>,
  rowIndex: number,
  config: ImportConfig,
  importLogId: string
): Promise<ImportResult> => {
  // Normalizar la fila primero (mapeo flexible de columnas)
  const normalizedRow = normalizeMandatoRow(row);
  const name = normalizedRow.titulo || `Mandato ${rowIndex + 1}`;

  try {
    // 1. Validar datos normalizados
    const validation = validateMandatoRow(normalizedRow);
    if (!validation.isValid) {
      return {
        name,
        status: 'error',
        message: `Fila ${rowIndex + 1}: ${validation.errors.map(e => e.message).join('; ')}`,
        rowIndex
      };
    }

    // 2. Crear o encontrar empresa
    const empresa = await findOrCreateEmpresa(
      {
        nombre: normalizedRow.empresa_nombre || 'Sin nombre',
        cif: normalizedRow.empresa_cif,
        sector: normalizedRow.sector || 'Sin clasificar',
        sitio_web: normalizedRow.sitio_web
      },
      importLogId
    );

    // 3. Verificar si el mandato ya existe (por título + empresa)
    const existingMandato = await findMandato({
      titulo: normalizedRow.titulo,
      empresa_id: empresa.id
    });

    if (existingMandato.found) {
      if (config.estrategiaDuplicados === 'skip') {
        return {
          name,
          status: 'skipped',
          message: `⏭️ Ya existe '${name}' para ${empresa.nombre}`,
          rowIndex
        };
      }
      // create_new: permitir duplicados
    }

    // 4. Crear nuevo mandato
    const mandatoData: any = {
      tipo: normalizedRow.tipo || 'venta',
      empresa_principal_id: empresa.id,
      estado: normalizedRow.estado || 'prospecto',
      valor: normalizedRow.valor ? parseFloat(normalizedRow.valor) : null,
      descripcion: normalizedRow.descripcion || normalizedRow.titulo || name,
      fecha_inicio: normalizedRow.fecha_inicio || null,
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
