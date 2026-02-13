/**
 * Centralized company validation for duplicate detection
 */

import { supabase } from "@/integrations/supabase/client";

export interface EmpresaValidationResult {
  isValid: boolean;
  isDuplicate: boolean;
  existingEmpresa?: { 
    id: string; 
    nombre: string; 
    cif?: string | null;
    sector?: string | null;
  };
  matchType?: 'cif' | 'nombre' | 'web';
  errors: string[];
}

/**
 * Normalize company name for comparison
 */
export function normalizeCompanyName(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/\s+/g, ' ')
    .replace(/[.,;:]+$/, '')
    .replace(/\b(s\.?l\.?u?\.?|s\.?a\.?|s\.?l\.?l\.?)\b/gi, '')
    .trim();
}

/**
 * Extract domain from URL or website
 */
function extractDomain(url: string): string | null {
  try {
    const cleaned = url.startsWith('http') ? url : `https://${url}`;
    return new URL(cleaned).hostname.replace('www.', '').toLowerCase();
  } catch {
    return null;
  }
}

/**
 * Validate before creating a company - checks for duplicates
 */
export async function validateBeforeCreate(
  data: { 
    nombre: string; 
    cif?: string | null; 
    sitio_web?: string | null; 
  }
): Promise<EmpresaValidationResult> {
  const errors: string[] = [];

  // Basic validation
  if (!data.nombre?.trim()) {
    return {
      isValid: false,
      isDuplicate: false,
      errors: ['El nombre de la empresa es requerido']
    };
  }

  // 1. Check by CIF (most reliable)
  if (data.cif?.trim()) {
    const normalizedCif = data.cif.toUpperCase().trim();
    const { data: existingByCif } = await supabase
      .from('empresas')
      .select('id, nombre, cif, sector')
      .eq('cif', normalizedCif)
      .maybeSingle();

    if (existingByCif) {
      return {
        isValid: false,
        isDuplicate: true,
        existingEmpresa: existingByCif,
        matchType: 'cif',
        errors: [`Ya existe una empresa con CIF ${normalizedCif}: ${existingByCif.nombre}`]
      };
    }
  }

  // 2. Check by normalized name — server-side filtering
  const normalizedName = normalizeCompanyName(data.nombre);
  // Use ilike with the base name (without legal suffixes) for efficient server-side search
  const searchTerm = normalizedName.split(' ').filter(Boolean).join('%');
  const { data: candidateEmpresas } = await supabase
    .from('empresas')
    .select('id, nombre, cif, sector')
    .ilike('nombre', `%${searchTerm}%`)
    .limit(50);

  if (candidateEmpresas) {
    const matchByName = candidateEmpresas.find(e =>
      normalizeCompanyName(e.nombre) === normalizedName
    );

    if (matchByName) {
      return {
        isValid: false,
        isDuplicate: true,
        existingEmpresa: matchByName,
        matchType: 'nombre',
        errors: [`Ya existe una empresa con nombre similar: ${matchByName.nombre}`]
      };
    }
  }

  // 3. Check by website domain
  if (data.sitio_web?.trim()) {
    const domain = extractDomain(data.sitio_web);
    if (domain) {
      const { data: existingByWeb } = await supabase
        .from('empresas')
        .select('id, nombre, cif, sector, sitio_web')
        .ilike('sitio_web', `%${domain}%`)
        .maybeSingle();

      if (existingByWeb) {
        return {
          isValid: false,
          isDuplicate: true,
          existingEmpresa: existingByWeb,
          matchType: 'web',
          errors: [`Ya existe una empresa con el mismo sitio web: ${existingByWeb.nombre}`]
        };
      }
    }
  }

  return {
    isValid: true,
    isDuplicate: false,
    errors
  };
}

/**
 * Find existing company by multiple criteria - returns best match
 */
export async function findExistingEmpresa(
  data: { 
    nombre: string; 
    cif?: string | null; 
    sitio_web?: string | null; 
  }
): Promise<{ id: string; nombre: string; cif?: string | null } | null> {
  const validation = await validateBeforeCreate(data);
  return validation.existingEmpresa || null;
}
