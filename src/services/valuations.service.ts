import { supabase } from "@/integrations/supabase/client";

export interface CompanyValuation {
  id: string;
  company_name: string;
  contact_name: string;
  email: string;
  phone?: string;
  industry: string;
  employee_range: string;
  revenue?: number;
  ebitda?: number;
  final_valuation?: number;
  valuation_range_min?: number;
  valuation_range_max?: number;
  ebitda_multiple_used?: number;
  cif?: string;
  location?: string;
  created_at: string;
  empresa_id?: string;
  match_type?: 'linked' | 'cif_match' | 'name_match' | 'no_match';
}

export interface SectorMultiple {
  sector_name: string;
  ebitda_multiple_min: number;
  ebitda_multiple_median: number;
  ebitda_multiple_max: number;
  revenue_multiple_min: number;
  revenue_multiple_median: number;
  revenue_multiple_max: number;
  net_profit_multiple_min: number;
  net_profit_multiple_median: number;
  net_profit_multiple_max: number;
}

// Fetch valuations for a specific empresa by ID, CIF or name
export async function fetchEmpresaValuations(empresaId: string, cif?: string, nombre?: string): Promise<CompanyValuation[]> {
  // First try linked valuations
  let query = supabase
    .from('company_valuations')
    .select('*')
    .eq('empresa_id', empresaId)
    .order('created_at', { ascending: false });

  const { data: linkedData, error: linkedError } = await query;
  
  if (linkedError) throw linkedError;

  // If we have linked valuations, return them
  if (linkedData && linkedData.length > 0) {
    return linkedData.map(v => ({ ...v, match_type: 'linked' as const }));
  }

  // Otherwise try to find by CIF or company name
  const results: CompanyValuation[] = [];

  if (cif) {
    const { data: cifData } = await supabase
      .from('company_valuations')
      .select('*')
      .ilike('cif', cif.trim())
      .is('empresa_id', null)
      .order('created_at', { ascending: false });

    if (cifData) {
      results.push(...cifData.map(v => ({ ...v, match_type: 'cif_match' as const })));
    }
  }

  if (nombre && results.length === 0) {
    const { data: nameData } = await supabase
      .from('company_valuations')
      .select('*')
      .ilike('company_name', nombre.trim())
      .is('empresa_id', null)
      .order('created_at', { ascending: false });

    if (nameData) {
      results.push(...nameData.map(v => ({ ...v, match_type: 'name_match' as const })));
    }
  }

  return results;
}

// Fetch all sector multiples for comparables
export async function fetchSectorMultiples(): Promise<SectorMultiple[]> {
  const { data, error } = await supabase
    .from('advisor_valuation_multiples')
    .select('*')
    .eq('is_active', true)
    .order('display_order', { ascending: true });

  if (error) throw error;
  return data || [];
}

// Get sector multiple for a specific sector
export async function getSectorMultiple(sectorName: string): Promise<SectorMultiple | null> {
  const { data, error } = await supabase
    .from('advisor_valuation_multiples')
    .select('*')
    .ilike('sector_name', `%${sectorName}%`)
    .eq('is_active', true)
    .limit(1)
    .maybeSingle();

  if (error) throw error;
  return data;
}

// Link a valuation to an empresa
export async function linkValuationToEmpresa(valuationId: string, empresaId: string): Promise<boolean> {
  const { error } = await supabase
    .from('company_valuations')
    .update({ empresa_id: empresaId })
    .eq('id', valuationId);

  if (error) throw error;
  return true;
}

// Unlink a valuation from an empresa
export async function unlinkValuationFromEmpresa(valuationId: string): Promise<boolean> {
  const { error } = await supabase
    .from('company_valuations')
    .update({ empresa_id: null })
    .eq('id', valuationId);

  if (error) throw error;
  return true;
}

// Search valuations for linking
export async function searchValuations(query: string): Promise<CompanyValuation[]> {
  const { data, error } = await supabase
    .from('company_valuations')
    .select('*')
    .or(`company_name.ilike.%${query}%,cif.ilike.%${query}%,email.ilike.%${query}%`)
    .is('empresa_id', null)
    .order('created_at', { ascending: false })
    .limit(20);

  if (error) throw error;
  return data || [];
}
