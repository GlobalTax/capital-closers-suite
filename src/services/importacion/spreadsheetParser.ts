/**
 * Universal Spreadsheet Parser - Soporte para CSV, XLSX, XLS
 * Usa SheetJS (xlsx) para parsing robusto de archivos
 */

import * as XLSX from 'xlsx';

export interface ParsedSpreadsheet {
  headers: string[];
  rows: Record<string, string>[];
  rawRows: string[][];
  format: 'xlsx' | 'xls' | 'csv';
  totalRows: number;
  emptyRowsSkipped: number;
}

/**
 * Normaliza un header: trim, lowercase, eliminar acentos y caracteres especiales
 */
export const normalizeHeader = (header: string): string => {
  if (header === null || header === undefined) return '';
  
  return header
    .toString()
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Eliminar acentos
    .replace(/[_\-]+/g, '_') // Normalizar guiones
    .trim();
};

/**
 * Detecta si una fila está completamente vacía
 */
const isEmptyRow = (row: any[]): boolean => {
  if (!row || !Array.isArray(row)) return true;
  
  return row.every(cell => 
    cell === null || 
    cell === undefined || 
    String(cell).trim() === ''
  );
};

/**
 * Limpia un valor de celda
 */
const cleanCellValue = (value: any): string => {
  if (value === null || value === undefined) return '';
  
  // Manejar números, fechas, etc.
  if (typeof value === 'number') {
    return String(value);
  }
  
  if (value instanceof Date) {
    return value.toISOString().split('T')[0]; // YYYY-MM-DD
  }
  
  return String(value).trim();
};

/**
 * Parser universal para CSV, XLSX y XLS
 */
export const parseSpreadsheet = async (file: File): Promise<ParsedSpreadsheet> => {
  const extension = file.name.split('.').pop()?.toLowerCase() || '';
  const validExtensions = ['xlsx', 'xls', 'csv'];
  
  if (!validExtensions.includes(extension)) {
    throw new Error(`Formato no soportado: .${extension}. Use CSV, XLS o XLSX.`);
  }

  try {
    const arrayBuffer = await file.arrayBuffer();
    
    // Opciones de lectura para xlsx
    const readOptions: XLSX.ParsingOptions = {
      type: 'array',
      cellDates: true, // Parsear fechas correctamente
      cellText: false,
      cellNF: false,
      raw: false, // Obtener valores formateados
    };
    
    const workbook = XLSX.read(arrayBuffer, readOptions);
    
    // Tomar primera hoja
    const sheetName = workbook.SheetNames[0];
    if (!sheetName) {
      throw new Error('El archivo no contiene hojas de cálculo');
    }
    
    const sheet = workbook.Sheets[sheetName];
    
    // Convertir a JSON (array de arrays)
    const rawData: any[][] = XLSX.utils.sheet_to_json(sheet, { 
      header: 1,
      defval: '',
      raw: false, // Convertir todo a string
      blankrows: false
    });

    if (rawData.length === 0) {
      throw new Error('El archivo está vacío');
    }

    if (rawData.length < 2) {
      throw new Error('El archivo debe tener al menos una fila de encabezados y una fila de datos');
    }

    // Primera fila son los headers
    const rawHeaders = rawData[0] as any[];
    
    // Normalizar headers y filtrar vacíos
    const headers: string[] = [];
    const headerIndexMap: number[] = []; // Mapea índice normalizado a índice original
    
    rawHeaders.forEach((h, index) => {
      const normalized = normalizeHeader(h);
      if (normalized.length > 0) {
        headers.push(normalized);
        headerIndexMap.push(index);
      }
    });

    if (headers.length === 0) {
      throw new Error('No se encontraron encabezados válidos en la primera fila');
    }

    const rawRows: string[][] = [];
    const rows: Record<string, string>[] = [];
    let emptyRowsSkipped = 0;

    // Procesar filas (saltando header)
    for (let i = 1; i < rawData.length; i++) {
      const rowArray = rawData[i] as any[];
      
      // Ignorar filas completamente vacías
      if (isEmptyRow(rowArray)) {
        emptyRowsSkipped++;
        continue;
      }

      // Guardar fila raw para debugging
      rawRows.push(rowArray.map(cleanCellValue));

      // Crear objeto con headers normalizados
      const row: Record<string, string> = {};
      headers.forEach((header, normalizedIndex) => {
        const originalIndex = headerIndexMap[normalizedIndex];
        const value = rowArray[originalIndex];
        row[header] = cleanCellValue(value);
      });
      
      rows.push(row);
    }

    if (rows.length === 0) {
      throw new Error('No se encontraron filas con datos válidos');
    }

    console.log(`[SpreadsheetParser] Archivo ${extension.toUpperCase()} procesado:`, {
      headers,
      totalRows: rows.length,
      emptyRowsSkipped,
      sampleRow: rows[0]
    });

    return {
      headers,
      rows,
      rawRows,
      format: extension as 'xlsx' | 'xls' | 'csv',
      totalRows: rows.length,
      emptyRowsSkipped
    };

  } catch (error: any) {
    console.error('[SpreadsheetParser] Error:', error);
    
    // Mejorar mensajes de error
    if (error.message?.includes('password')) {
      throw new Error('El archivo está protegido con contraseña');
    }
    
    if (error.message?.includes('Unsupported')) {
      throw new Error('Formato de archivo no compatible. Use CSV, XLS o XLSX.');
    }
    
    throw new Error(`Error al leer archivo: ${error.message || 'formato desconocido'}`);
  }
};

/**
 * Detecta el formato del archivo por extensión o contenido
 */
export const detectFileFormat = (file: File): 'xlsx' | 'xls' | 'csv' | 'unknown' => {
  const extension = file.name.split('.').pop()?.toLowerCase();
  
  if (extension === 'xlsx') return 'xlsx';
  if (extension === 'xls') return 'xls';
  if (extension === 'csv') return 'csv';
  
  // Detectar por MIME type
  if (file.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet') {
    return 'xlsx';
  }
  if (file.type === 'application/vnd.ms-excel') {
    return 'xls';
  }
  if (file.type === 'text/csv' || file.type === 'application/csv') {
    return 'csv';
  }
  
  return 'unknown';
};
