import { supabase } from '@/integrations/supabase/client';
import type { SearchFund, SearchFundMatch, MatchStatus } from '@/types/searchFunds';

// Obtener todos los Search Funds activos
export async function fetchSearchFunds(filters?: {
  sector?: string;
  ebitdaMin?: number;
  ebitdaMax?: number;
  status?: string;
  search?: string;
}): Promise<SearchFund[]> {
  let query = supabase
    .from('sf_funds')
    .select('*')
    .order('name')
    .limit(500);

  if (filters?.status) {
    query = query.eq('status', filters.status);
  }

  if (filters?.search) {
    query = query.ilike('name', `%${filters.search}%`);
  }

  const { data, error } = await query;

  if (error) throw error;

  let results = (data || []) as unknown as SearchFund[];
  
  // Filtrar por sector en cliente (sector_focus es un array)
  if (filters?.sector) {
    const sectorLower = filters.sector.toLowerCase();
    results = results.filter(sf => 
      sf.sector_focus?.some(s => s.toLowerCase().includes(sectorLower))
    );
  }

  // Filtrar por rango EBITDA en cliente
  if (filters?.ebitdaMin !== undefined) {
    results = results.filter(sf => 
      sf.ebitda_max === null || sf.ebitda_max >= filters.ebitdaMin!
    );
  }
  
  if (filters?.ebitdaMax !== undefined) {
    results = results.filter(sf => 
      sf.ebitda_min === null || sf.ebitda_min <= filters.ebitdaMax!
    );
  }

  return results;
}

// Obtener un Search Fund por ID
export async function getSearchFundById(id: string): Promise<SearchFund | null> {
  const { data, error } = await supabase
    .from('sf_funds')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    console.error('[SearchFunds] Error getting by id:', error);
    return null;
  }

  return data as unknown as SearchFund;
}

// Obtener matches de un mandato
export async function getMatchesForMandato(mandatoId: string): Promise<SearchFundMatch[]> {
  const { data, error } = await supabase
    .from('sf_matches')
    .select('*')
    .eq('crm_entity_type', 'mandato')
    .eq('crm_entity_id', mandatoId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('[SearchFunds] Error getting matches:', error);
    throw error;
  }

  return (data || []) as unknown as SearchFundMatch[];
}

// Obtener matches con datos del fondo
export async function getMatchesWithFundsForMandato(mandatoId: string): Promise<SearchFundMatch[]> {
  // Primero obtenemos los matches
  const matches = await getMatchesForMandato(mandatoId);
  
  if (matches.length === 0) return [];

  // Luego obtenemos los fondos asociados
  const fundIds = matches.map(m => m.fund_id);
  const { data: funds, error } = await supabase
    .from('sf_funds')
    .select('*')
    .in('id', fundIds);

  if (error) {
    console.error('[SearchFunds] Error getting funds for matches:', error);
    throw error;
  }

  // Combinamos los datos
  const fundsMap = new Map((funds || []).map(f => [f.id, f]));
  
  return matches.map(match => ({
    ...match,
    fund: fundsMap.get(match.fund_id) as unknown as SearchFund | undefined,
  }));
}

// Crear un match entre Search Fund y Mandato
export async function matchSearchFundToMandato(
  fundId: string,
  mandatoId: string,
  notes?: string
): Promise<SearchFundMatch> {
  const { data, error } = await supabase
    .from('sf_matches')
    .insert({
      fund_id: fundId,
      crm_entity_type: 'mandato',
      crm_entity_id: mandatoId,
      status: 'nuevo',
      notes: notes || null,
    })
    .select()
    .single();

  if (error) {
    console.error('[SearchFunds] Error creating match:', error);
    throw error;
  }

  return data as unknown as SearchFundMatch;
}

// Eliminar un match
export async function removeMatchFromMandato(matchId: string): Promise<void> {
  const { error } = await supabase
    .from('sf_matches')
    .delete()
    .eq('id', matchId);

  if (error) {
    console.error('[SearchFunds] Error removing match:', error);
    throw error;
  }
}

// Actualizar estado del match
export async function updateMatchStatus(
  matchId: string,
  status: MatchStatus,
  additionalFields?: Partial<{
    notes: string;
    contacted_at: string;
    teaser_sent_at: string;
    nda_sent_at: string;
  }>
): Promise<SearchFundMatch> {
  const updateData: Record<string, unknown> = {
    status,
    updated_at: new Date().toISOString(),
  };

  // Actualizar last_interaction_at automáticamente
  updateData.last_interaction_at = new Date().toISOString();

  // Si cambia a contactado y no tiene contacted_at, establecerlo
  if (status === 'contactado' && !additionalFields?.contacted_at) {
    updateData.contacted_at = new Date().toISOString();
  }

  if (additionalFields) {
    Object.assign(updateData, additionalFields);
  }

  const { data, error } = await supabase
    .from('sf_matches')
    .update(updateData)
    .eq('id', matchId)
    .select()
    .single();

  if (error) {
    console.error('[SearchFunds] Error updating match status:', error);
    throw error;
  }

  return data as unknown as SearchFundMatch;
}

// Actualizar notas del match
export async function updateMatchNotes(matchId: string, notes: string): Promise<void> {
  const { error } = await supabase
    .from('sf_matches')
    .update({ 
      notes,
      updated_at: new Date().toISOString(),
    })
    .eq('id', matchId);

  if (error) {
    console.error('[SearchFunds] Error updating match notes:', error);
    throw error;
  }
}

// Verificar si un fondo ya está asociado a un mandato
export async function isAlreadyMatched(fundId: string, mandatoId: string): Promise<boolean> {
  const { data, error } = await supabase
    .from('sf_matches')
    .select('id')
    .eq('fund_id', fundId)
    .eq('crm_entity_type', 'mandato')
    .eq('crm_entity_id', mandatoId)
    .maybeSingle();

  if (error) {
    console.error('[SearchFunds] Error checking match:', error);
    return false;
  }

  return !!data;
}

// Obtener IDs de fondos ya asociados a un mandato
export async function getMatchedFundIds(mandatoId: string): Promise<string[]> {
  const { data, error } = await supabase
    .from('sf_matches')
    .select('fund_id')
    .eq('crm_entity_type', 'mandato')
    .eq('crm_entity_id', mandatoId);

  if (error) {
    console.error('[SearchFunds] Error getting matched fund ids:', error);
    return [];
  }

  return (data || []).map(d => d.fund_id);
}
