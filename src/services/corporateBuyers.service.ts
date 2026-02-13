import { supabase } from "@/integrations/supabase/client";
import { DatabaseError } from "@/lib/error-handler";
import type {
  CorporateBuyer, 
  CreateCorporateBuyerInput, 
  UpdateCorporateBuyerInput,
  CorporateBuyersFilters,
  BuyerSourceTag,
  CreateSourceTagInput,
  UpdateSourceTagInput
} from "@/types/corporateBuyers";

// ============ CORPORATE BUYERS ============

export async function getCorporateBuyers(
  filters?: CorporateBuyersFilters
): Promise<CorporateBuyer[]> {
  let query = supabase
    .from('corporate_buyers')
    .select(`
      *,
      source_tag:buyer_source_tags(*)
    `)
    .eq('is_active', true)
    .order('name', { ascending: true });

  if (filters?.search) {
    query = query.ilike('name', `%${filters.search}%`);
  }
  if (filters?.buyer_type) {
    query = query.eq('buyer_type', filters.buyer_type);
  }
  if (filters?.source_tag_id) {
    query = query.eq('source_tag_id', filters.source_tag_id);
  }
  if (filters?.country_base) {
    query = query.ilike('country_base', `%${filters.country_base}%`);
  }

  const { data, error } = await query.limit(500);
  if (error) throw new DatabaseError('Error al obtener corporate buyers', { supabaseError: error, table: 'corporate_buyers' });
  return data as CorporateBuyer[];
}

export async function getCorporateBuyerById(id: string): Promise<CorporateBuyer | null> {
  const { data, error } = await supabase
    .from('corporate_buyers')
    .select(`
      *,
      source_tag:buyer_source_tags(*)
    `)
    .eq('id', id)
    .single();
  
  if (error) throw new DatabaseError('Error al obtener corporate buyer', { supabaseError: error, table: 'corporate_buyers' });
  return data as CorporateBuyer;
}

export async function createCorporateBuyer(
  input: CreateCorporateBuyerInput
): Promise<CorporateBuyer> {
  const { data, error } = await supabase
    .from('corporate_buyers')
    .insert({
      name: input.name,
      buyer_type: input.buyer_type,
      source_tag_id: input.source_tag_id,
      country_base: input.country_base || null,
      sector_focus: input.sector_focus || null,
      geography_focus: input.geography_focus || null,
      revenue_min: input.revenue_min || null,
      revenue_max: input.revenue_max || null,
      ebitda_min: input.ebitda_min || null,
      ebitda_max: input.ebitda_max || null,
      deal_size_min: input.deal_size_min || null,
      deal_size_max: input.deal_size_max || null,
      website: input.website || null,
      description: input.description || null,
      is_active: true,
    })
    .select(`
      *,
      source_tag:buyer_source_tags(*)
    `)
    .single();

  if (error) throw new DatabaseError('Error al crear corporate buyer', { supabaseError: error, table: 'corporate_buyers' });
  return data as CorporateBuyer;
}

export async function updateCorporateBuyer(
  id: string,
  input: UpdateCorporateBuyerInput
): Promise<CorporateBuyer> {
  const { data, error } = await supabase
    .from('corporate_buyers')
    .update({
      ...input,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select(`
      *,
      source_tag:buyer_source_tags(*)
    `)
    .single();

  if (error) throw new DatabaseError('Error al actualizar corporate buyer', { supabaseError: error, table: 'corporate_buyers' });
  return data as CorporateBuyer;
}

export async function deleteCorporateBuyer(id: string): Promise<void> {
  // Soft delete
  const { error } = await supabase
    .from('corporate_buyers')
    .update({ is_active: false, updated_at: new Date().toISOString() })
    .eq('id', id);

  if (error) throw new DatabaseError('Error al eliminar corporate buyer', { supabaseError: error, table: 'corporate_buyers' });
}

// ============ KPIs ============

export interface CorporateBuyersKPIs {
  total: number;
  byType: Record<string, number>;
  bySource: Record<string, number>;
  withContacts: number;
}

export async function getCorporateBuyersKPIs(): Promise<CorporateBuyersKPIs> {
  const { data, error } = await supabase
    .from('corporate_buyers')
    .select(`
      id,
      buyer_type,
      source_tag_id,
      source_tag:buyer_source_tags(key)
    `)
    .eq('is_active', true)
    .limit(1000);

  if (error) throw new DatabaseError('Error al obtener KPIs', { supabaseError: error, table: 'corporate_buyers' });

  const buyers = data || [];
  const byType: Record<string, number> = {};
  const bySource: Record<string, number> = {};

  buyers.forEach((buyer) => {
    // Count by type
    byType[buyer.buyer_type] = (byType[buyer.buyer_type] || 0) + 1;
    
    // Count by source
    const sourceKey = (buyer.source_tag as { key: string } | null)?.key || 'sin_origen';
    bySource[sourceKey] = (bySource[sourceKey] || 0) + 1;
  });

  // Count buyers with contacts
  const { count: withContacts } = await supabase
    .from('corporate_contacts')
    .select('buyer_id', { count: 'exact', head: true });

  return {
    total: buyers.length,
    byType,
    bySource,
    withContacts: withContacts || 0,
  };
}

// ============ SOURCE TAGS ============

export async function getBuyerSourceTags(includeInactive = false): Promise<BuyerSourceTag[]> {
  let query = supabase
    .from('buyer_source_tags')
    .select('*')
    .order('label', { ascending: true });

  if (!includeInactive) {
    query = query.eq('is_active', true);
  }

  const { data, error } = await query.limit(200);
  if (error) throw new DatabaseError('Error al obtener source tags', { supabaseError: error, table: 'buyer_source_tags' });
  return data as BuyerSourceTag[];
}

export async function createSourceTag(input: CreateSourceTagInput): Promise<BuyerSourceTag> {
  const { data, error } = await supabase
    .from('buyer_source_tags')
    .insert({
      key: input.key.toLowerCase().replace(/\s+/g, '_'),
      label: input.label,
      color: input.color || '#6366f1',
      is_active: true,
    })
    .select()
    .single();

  if (error) throw new DatabaseError('Error al crear source tag', { supabaseError: error, table: 'buyer_source_tags' });
  return data as BuyerSourceTag;
}

export async function updateSourceTag(
  id: string,
  input: UpdateSourceTagInput
): Promise<BuyerSourceTag> {
  const { data, error } = await supabase
    .from('buyer_source_tags')
    .update(input)
    .eq('id', id)
    .select()
    .single();

  if (error) throw new DatabaseError('Error al actualizar source tag', { supabaseError: error, table: 'buyer_source_tags' });
  return data as BuyerSourceTag;
}
