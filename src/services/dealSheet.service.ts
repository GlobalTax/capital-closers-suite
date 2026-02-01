import { supabase } from "@/integrations/supabase/client";
import type { DealSheet, DealSheetFormData } from "@/types/dealSheet";

export async function fetchDealSheet(mandatoId: string): Promise<DealSheet | null> {
  const { data, error } = await supabase
    .from('deal_sheets')
    .select('*')
    .eq('mandato_id', mandatoId)
    .maybeSingle();

  if (error) throw error;
  
  if (!data) return null;
  
  return {
    ...data,
    investment_highlights_es: data.investment_highlights_es || [],
    investment_highlights_en: data.investment_highlights_en || [],
    process_requirements: data.process_requirements || [],
  } as DealSheet;
}

export async function upsertDealSheet(
  mandatoId: string,
  formData: DealSheetFormData
): Promise<DealSheet> {
  const { data, error } = await supabase
    .from('deal_sheets')
    .upsert({
      mandato_id: mandatoId,
      ...formData,
      updated_at: new Date().toISOString(),
    }, {
      onConflict: 'mandato_id',
    })
    .select()
    .single();

  if (error) throw error;
  
  return {
    ...data,
    investment_highlights_es: data.investment_highlights_es || [],
    investment_highlights_en: data.investment_highlights_en || [],
    process_requirements: data.process_requirements || [],
  } as DealSheet;
}

export async function publishDealSheet(
  dealSheetId: string,
  userId: string
): Promise<DealSheet> {
  const { data, error } = await supabase
    .from('deal_sheets')
    .update({
      status: 'published',
      published_at: new Date().toISOString(),
      published_by: userId,
      updated_at: new Date().toISOString(),
    })
    .eq('id', dealSheetId)
    .select()
    .single();

  if (error) throw error;
  
  return {
    ...data,
    investment_highlights_es: data.investment_highlights_es || [],
    investment_highlights_en: data.investment_highlights_en || [],
    process_requirements: data.process_requirements || [],
  } as DealSheet;
}

export async function unpublishDealSheet(dealSheetId: string): Promise<DealSheet> {
  const { data, error } = await supabase
    .from('deal_sheets')
    .update({
      status: 'draft',
      published_at: null,
      published_by: null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', dealSheetId)
    .select()
    .single();

  if (error) throw error;
  
  return {
    ...data,
    investment_highlights_es: data.investment_highlights_es || [],
    investment_highlights_en: data.investment_highlights_en || [],
    process_requirements: data.process_requirements || [],
  } as DealSheet;
}
