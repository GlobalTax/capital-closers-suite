/**
 * Servicio para gestión de campañas de Outbound con Apollo
 */

import { supabase } from '@/integrations/supabase/client';
import type { 
  OutboundCampaign, 
  OutboundProspect, 
  OutboundFilters,
  ApolloSectorMapping,
  OutboundStats 
} from '@/types/outbound';

const SUPABASE_URL = 'https://fwhqtzkkvnjkazhaficj.supabase.co';

// ============================================
// CAMPAÑAS
// ============================================

export async function getCampaigns(): Promise<OutboundCampaign[]> {
  const { data, error } = await supabase
    .from('outbound_campaigns')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('[Outbound] Error fetching campaigns:', error);
    throw new Error('Error al cargar campañas');
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
    console.error('[Outbound] Error fetching campaign:', error);
    throw new Error('Error al cargar campaña');
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
    console.error('[Outbound] Error creating campaign:', error);
    throw new Error('Error al crear campaña');
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
    console.error('[Outbound] Error updating campaign:', error);
    throw new Error('Error al actualizar campaña');
  }

  return campaign as unknown as OutboundCampaign;
}

export async function deleteCampaign(id: string): Promise<void> {
  const { error } = await supabase
    .from('outbound_campaigns')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('[Outbound] Error deleting campaign:', error);
    throw new Error('Error al eliminar campaña');
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
    .order('score', { ascending: false, nullsFirst: false });

  if (error) {
    console.error('[Outbound] Error fetching prospects:', error);
    throw new Error('Error al cargar prospectos');
  }

  return (data || []) as unknown as OutboundProspect[];
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
    console.error('[Outbound] Error updating prospect:', error);
    throw new Error('Error al actualizar prospecto');
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
    console.error('[Outbound] Error updating selection:', error);
    throw new Error('Error al actualizar selección');
  }
}

export async function deleteProspects(ids: string[]): Promise<void> {
  const { error } = await supabase
    .from('outbound_prospects')
    .delete()
    .in('id', ids);

  if (error) {
    console.error('[Outbound] Error deleting prospects:', error);
    throw new Error('Error al eliminar prospectos');
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

// ============================================
// MAPEO DE SECTORES
// ============================================

export async function getSectorMappings(): Promise<ApolloSectorMapping[]> {
  const { data, error } = await supabase
    .from('apollo_sector_mapping')
    .select('*')
    .eq('is_active', true)
    .order('sector_name');

  if (error) {
    console.error('[Outbound] Error fetching sector mappings:', error);
    throw new Error('Error al cargar mapeo de sectores');
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
    console.error('[Outbound] Error fetching sector mapping:', error);
    return null;
  }

  return data as unknown as ApolloSectorMapping;
}

// ============================================
// ESTADÍSTICAS
// ============================================

export async function getOutboundStats(): Promise<OutboundStats> {
  const { data: campaigns, error: campaignsError } = await supabase
    .from('outbound_campaigns')
    .select('status, total_found, total_enriched, total_imported, credits_used');

  if (campaignsError) {
    console.error('[Outbound] Error fetching stats:', campaignsError);
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
