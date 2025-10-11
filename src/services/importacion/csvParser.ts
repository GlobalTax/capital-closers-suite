/**
 * CSV Parser - Manejo robusto de archivos CSV
 */

export interface ParsedCSV {
  headers: string[];
  rows: Record<string, string>[];
  rawRows: string[][];
}

export const parseCSVLine = (line: string): string[] => {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    const nextChar = line[i + 1];

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  
  result.push(current.trim());
  return result;
};

export const parseCSV = async (file: File): Promise<ParsedCSV> => {
  const text = await file.text();
  const lines = text.split('\n').filter(line => line.trim());
  
  if (lines.length < 2) {
    throw new Error('El archivo CSV debe tener al menos una fila de encabezados y una fila de datos');
  }

  const headers = parseCSVLine(lines[0]).map(h => h.toLowerCase().trim());
  const rawRows: string[][] = [];
  const rows: Record<string, string>[] = [];

  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i]);
    rawRows.push(values);
    
    const row: Record<string, string> = {};
    headers.forEach((header, index) => {
      row[header] = values[index] || '';
    });
    rows.push(row);
  }

  return { headers, rows, rawRows };
};

export const normalizeText = (text: string): string => {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove accents
    .replace(/[^a-z0-9\s]/g, '') // Remove special chars
    .trim();
};

export const normalizeCompanyName = (name: string): string => {
  return normalizeText(name)
    .replace(/\b(s\.?a\.?|s\.?l\.?|s\.?l\.?u\.?|s\.?a\.?u\.?)\b/g, '')
    .trim();
};
