/**
 * Servicio para gestión de campañas de Outbound con Apollo
 */

import { supabase } from '@/integrations/supabase/client';
import { DatabaseError } from '@/lib/error-handler';
import type {
  OutboundCampaign,
  OutboundProspect,
  OutboundFilters,
  ApolloSectorMapping,
  OutboundStats
} from '@/types/outbound';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;

// ============================================
// CAMPAÑAS
// ============================================

export async function getCampaigns(): Promise<OutboundCampaign[]> {
  const { data, error } = await supabase
    .from('outbound_campaigns')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(200);

  if (error) {
    throw new DatabaseError('Error al cargar campañas', { supabaseError: error, table: 'outbound_campaigns' });
  }

  return (data || []) as unknown as OutboundCampaign[];
}

export async function getCampaignById(id: string): Promise<OutboundCampaign | null> {
  const { data, error } = await supabase
    .from('outbound_campaigns')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    throw new DatabaseError('Error al cargar campaña', { supabaseError: error, table: 'outbound_campaigns' });
  }

  return data as unknown as OutboundCampaign;
}

export async function createCampaign(data: {
  name: string;
  description?: string;
  sector_id?: string;
  sector_name?: string;
  filters: OutboundFilters;
  apollo_keywords?: string[];
}): Promise<OutboundCampaign> {
  const { data: user } = await supabase.auth.getUser();
  
  const insertData = {
    name: data.name,
    description: data.description,
    sector_id: data.sector_id,
    sector_name: data.sector_name,
    filters: JSON.parse(JSON.stringify(data.filters)),
    apollo_keywords: data.apollo_keywords,
    created_by: user?.user?.id,
    status: 'draft' as const,
  };
  
  const { data: campaign, error } = await supabase
    .from('outbound_campaigns')
    .insert(insertData)
    .select()
    .single();

  if (error) {
    throw new DatabaseError('Error al crear campaña', { supabaseError: error, table: 'outbound_campaigns' });
  }

  return campaign as unknown as OutboundCampaign;
}

export async function updateCampaign(
  id: string, 
  data: Partial<OutboundCampaign>
): Promise<OutboundCampaign> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const updateData: any = { ...data };
  if (data.filters) {
    updateData.filters = JSON.parse(JSON.stringify(data.filters));
  }
  
  const { data: campaign, error } = await supabase
    .from('outbound_campaigns')
    .update(updateData)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    throw new DatabaseError('Error al actualizar campaña', { supabaseError: error, table: 'outbound_campaigns' });
  }

  return campaign as unknown as OutboundCampaign;
}

export async function deleteCampaign(id: string): Promise<void> {
  const { error } = await supabase
    .from('outbound_campaigns')
    .delete()
    .eq('id', id);

  if (error) {
    throw new DatabaseError('Error al eliminar campaña', { supabaseError: error, table: 'outbound_campaigns' });
  }
}

export async function archiveCampaign(id: string): Promise<void> {
  const { error } = await supabase
    .from('outbound_campaigns')
    .update({ status: 'archived', updated_at: new Date().toISOString() })
    .eq('id', id);

  if (error) {
    throw new DatabaseError('Error al archivar campaña', { supabaseError: error, table: 'outbound_campaigns' });
  }
}

// ============================================
// PROSPECTOS
// ============================================

export async function getProspects(campaignId: string): Promise<OutboundProspect[]> {
  const { data, error } = await supabase
    .from('outbound_prospects')
    .select('*')
    .eq('campaign_id', campaignId)
    .order('score', { ascending: false, nullsFirst: false })
    .limit(500);

  if (error) {
    throw new DatabaseError('Error al cargar prospectos', { supabaseError: error, table: 'outbound_prospects' });
  }

  return (data || []) as unknown as OutboundProspect[];
}

export interface PaginatedProspectsResult {
  prospects: OutboundProspect[];
  total: number;
  page: number;
  totalPages: number;
}

export async function getProspectsPaginated(
  campaignId: string,
  page: number = 1,
  pageSize: number = 50,
  search?: string,
  statusFilter?: string
): Promise<PaginatedProspectsResult> {
  let query = supabase
    .from('outbound_prospects')
    .select('*', { count: 'exact' })
    .eq('campaign_id', campaignId)
    .order('score', { ascending: false, nullsFirst: false });

  // Search filter (server-side)
  if (search && search.trim()) {
    query = query.or(`nombre.ilike.%${search}%,empresa.ilike.%${search}%,cargo.ilike.%${search}%`);
  }

  // Status filter
  if (statusFilter && statusFilter !== 'all') {
    if (statusFilter === 'selected') {
      query = query.eq('is_selected', true);
    } else {
      query = query.eq('enrichment_status', statusFilter);
    }
  }

  // Pagination
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;
  query = query.range(from, to);

  const { data, error, count } = await query;

  if (error) {
    throw new DatabaseError('Error al cargar prospectos', { supabaseError: error, table: 'outbound_prospects' });
  }

  return {
    prospects: (data || []) as unknown as OutboundProspect[],
    total: count || 0,
    page,
    totalPages: Math.ceil((count || 0) / pageSize),
  };
}

export async function updateProspect(
  id: string,
  data: Partial<OutboundProspect>
): Promise<OutboundProspect> {
  const { data: prospect, error } = await supabase
    .from('outbound_prospects')
    .update(data)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    throw new DatabaseError('Error al actualizar prospecto', { supabaseError: error, table: 'outbound_prospects' });
  }

  return prospect as unknown as OutboundProspect;
}

export async function updateProspectsSelection(
  ids: string[],
  isSelected: boolean
): Promise<void> {
  const { error } = await supabase
    .from('outbound_prospects')
    .update({ is_selected: isSelected })
    .in('id', ids);

  if (error) {
    throw new DatabaseError('Error al actualizar selección', { supabaseError: error, table: 'outbound_prospects' });
  }
}

export async function deleteProspects(ids: string[]): Promise<void> {
  const { error } = await supabase
    .from('outbound_prospects')
    .delete()
    .in('id', ids);

  if (error) {
    throw new DatabaseError('Error al eliminar prospectos', { supabaseError: error, table: 'outbound_prospects' });
  }
}

// ============================================
// APOLLO API CALLS (via Edge Functions)
// ============================================

export async function searchApolloProspects(
  campaignId: string,
  keywords: string[],
  filters: OutboundFilters,
  page: number = 1
): Promise<{
  prospects: OutboundProspect[];
  total: number;
  hasMore: boolean;
}> {
  const { data: session } = await supabase.auth.getSession();
  
  const response = await fetch(`${SUPABASE_URL}/functions/v1/search-apollo-prospects`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${session?.session?.access_token}`,
    },
    body: JSON.stringify({
      campaign_id: campaignId,
      keywords,
      filters,
      page,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Error al buscar en Apollo');
  }

  return response.json();
}

export async function enrichProspects(
  prospectIds: string[],
  includePhone: boolean = false
): Promise<{
  enriched: number;
  failed: number;
  creditsUsed: number;
}> {
  const { data: session } = await supabase.auth.getSession();
  
  const response = await fetch(`${SUPABASE_URL}/functions/v1/enrich-apollo-bulk`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${session?.session?.access_token}`,
    },
    body: JSON.stringify({
      prospect_ids: prospectIds,
      include_phone: includePhone,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Error al enriquecer prospectos');
  }

  return response.json();
}

// ============================================
// IMPORTAR A CRM
// ============================================

export async function importProspectsToLeads(
  prospectIds: string[]
): Promise<{
  imported: number;
  duplicates: number;
  failed: number;
}> {
  const { data: session } = await supabase.auth.getSession();
  
  const response = await fetch(`${SUPABASE_URL}/functions/v1/import-outbound-leads`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${session?.session?.access_token}`,
    },
    body: JSON.stringify({
      prospect_ids: prospectIds,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Error al importar prospectos');
  }

  return response.json();
}

export async function importAllProspects(campaignId: string): Promise<{
  imported: number;
  duplicates: number;
  failed: number;
}> {
  // Get all enriched, non-imported prospect IDs
  const { data: prospects, error } = await supabase
    .from('outbound_prospects')
    .select('id')
    .eq('campaign_id', campaignId)
    .eq('enrichment_status', 'enriched')
    .eq('import_status', 'not_imported');

  if (error) {
    throw new DatabaseError('Error al obtener prospectos', { supabaseError: error, table: 'outbound_prospects' });
  }

  if (!prospects || prospects.length === 0) {
    return { imported: 0, duplicates: 0, failed: 0 };
  }

  // Use existing import function
  return importProspectsToLeads(prospects.map(p => p.id));
}

// ============================================
// MAPEO DE SECTORES
// ============================================

export async function getSectorMappings(): Promise<ApolloSectorMapping[]> {
  const { data, error } = await supabase
    .from('apollo_sector_mapping')
    .select('*')
    .eq('is_active', true)
    .order('sector_name')
    .limit(200);

  if (error) {
    throw new DatabaseError('Error al cargar mapeo de sectores', { supabaseError: error, table: 'apollo_sector_mapping' });
  }

  return (data || []) as unknown as ApolloSectorMapping[];
}

export async function getSectorMapping(sectorId: string): Promise<ApolloSectorMapping | null> {
  const { data, error } = await supabase
    .from('apollo_sector_mapping')
    .select('*')
    .eq('sector_id', sectorId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    throw new DatabaseError('Error al cargar mapeo de sector', { supabaseError: error, table: 'apollo_sector_mapping' });
  }

  return data as unknown as ApolloSectorMapping;
}

// ============================================
// ESTADÍSTICAS
// ============================================

export async function getOutboundStats(): Promise<OutboundStats> {
  const { data: campaigns, error: campaignsError } = await supabase
    .from('outbound_campaigns')
    .select('status, total_found, total_enriched, total_imported, credits_used')
    .limit(500);

  if (campaignsError) {
    return {
      totalCampaigns: 0,
      activeCampaigns: 0,
      totalProspects: 0,
      totalEnriched: 0,
      totalImported: 0,
      creditsUsed: 0,
    };
  }

  const stats = (campaigns || []).reduce(
    (acc, c) => ({
      totalCampaigns: acc.totalCampaigns + 1,
      activeCampaigns: acc.activeCampaigns + (c.status !== 'archived' && c.status !== 'completed' ? 1 : 0),
      totalProspects: acc.totalProspects + (c.total_found || 0),
      totalEnriched: acc.totalEnriched + (c.total_enriched || 0),
      totalImported: acc.totalImported + (c.total_imported || 0),
      creditsUsed: acc.creditsUsed + (c.credits_used || 0),
    }),
    {
      totalCampaigns: 0,
      activeCampaigns: 0,
      totalProspects: 0,
      totalEnriched: 0,
      totalImported: 0,
      creditsUsed: 0,
    }
  );

  return stats;
}
