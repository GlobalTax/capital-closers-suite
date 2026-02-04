// Types for Corporate Buyers module

export interface BuyerSourceTag {
  id: string;
  key: string;
  label: string;
  color: string | null;
  is_active: boolean;
  created_at: string;
}

export interface CorporateBuyer {
  id: string;
  name: string;
  buyer_type: 'corporate' | 'holding' | 'family_office' | 'strategic_buyer';
  country_base: string | null;
  sector_focus: string[] | null;
  geography_focus: string[] | null;
  revenue_min: number | null;
  revenue_max: number | null;
  ebitda_min: number | null;
  ebitda_max: number | null;
  deal_size_min: number | null;
  deal_size_max: number | null;
  website: string | null;
  description: string | null;
  created_at: string;
  updated_at: string;
  is_active: boolean;
  source_tag_id: string | null;
  // Joined data
  source_tag?: BuyerSourceTag | null;
}

export interface CreateCorporateBuyerInput {
  name: string;
  buyer_type: CorporateBuyer['buyer_type'];
  source_tag_id: string;
  country_base?: string | null;
  sector_focus?: string[] | null;
  geography_focus?: string[] | null;
  revenue_min?: number | null;
  revenue_max?: number | null;
  ebitda_min?: number | null;
  ebitda_max?: number | null;
  deal_size_min?: number | null;
  deal_size_max?: number | null;
  website?: string | null;
  description?: string | null;
}

export interface UpdateCorporateBuyerInput extends Partial<CreateCorporateBuyerInput> {
  is_active?: boolean;
}

export interface CorporateBuyersFilters {
  search?: string;
  buyer_type?: CorporateBuyer['buyer_type'] | null;
  source_tag_id?: string | null;
  country_base?: string | null;
  is_active?: boolean;
}

export interface CreateSourceTagInput {
  key: string;
  label: string;
  color?: string;
}

export interface UpdateSourceTagInput {
  label?: string;
  color?: string;
  is_active?: boolean;
}

export const BUYER_TYPE_OPTIONS = [
  { value: 'corporate', label: 'Corporativo' },
  { value: 'holding', label: 'Holding' },
  { value: 'family_office', label: 'Family Office' },
  { value: 'strategic_buyer', label: 'Comprador Estratégico' },
] as const;

export const getBuyerTypeLabel = (type: CorporateBuyer['buyer_type']): string => {
  const option = BUYER_TYPE_OPTIONS.find(o => o.value === type);
  return option?.label || type;
};
