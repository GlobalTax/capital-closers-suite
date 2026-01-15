// Tipos para Search Funds - basados en la estructura real de sf_funds y sf_matches

export type SearchFundStatus = 'searching' | 'acquired' | 'inactive' | 'paused';

export type MatchStatus = 
  | 'nuevo'
  | 'contactado'
  | 'interesado'
  | 'nda_enviado'
  | 'teaser_enviado'
  | 'evaluando'
  | 'descartado'
  | 'en_negociacion';

export interface SearchFund {
  id: string;
  name: string;
  website: string | null;
  status: string | null;
  country_base: string | null;
  cities: string[] | null;
  sector_focus: string[] | null;
  sector_exclusions: string[] | null;
  geography_focus: string[] | null;
  deal_size_min: number | null;
  deal_size_max: number | null;
  ebitda_min: number | null;
  ebitda_max: number | null;
  revenue_min: number | null;
  revenue_max: number | null;
  investment_style: string | null;
  notes_internal: string | null;
  entity_type: string | null;
  description: string | null;
  founded_year: number | null;
  source_url: string | null;
  portfolio_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface SearchFundMatch {
  id: string;
  fund_id: string;
  crm_entity_type: string;
  crm_entity_id: string;
  status: string | null;
  match_score: number | null;
  match_reasons: unknown | null;
  notes: string | null;
  owner_user_id: string | null;
  contacted_at: string | null;
  last_interaction_at: string | null;
  teaser_sent_at: string | null;
  nda_sent_at: string | null;
  last_scored_at: string | null;
  created_at: string;
  updated_at: string;
  // Joined data
  fund?: SearchFund;
}

export interface SearchFundWithMatch extends SearchFund {
  match?: SearchFundMatch;
  matchScore?: number; // Calculated score for sorting
}

export const MATCH_STATUS_LABELS: Record<MatchStatus, string> = {
  nuevo: 'Nuevo',
  contactado: 'Contactado',
  interesado: 'Interesado',
  nda_enviado: 'NDA Enviado',
  teaser_enviado: 'Teaser Enviado',
  evaluando: 'Evaluando',
  descartado: 'Descartado',
  en_negociacion: 'En Negociación',
};

export const MATCH_STATUS_COLORS: Record<MatchStatus, string> = {
  nuevo: 'bg-slate-100 text-slate-700',
  contactado: 'bg-blue-100 text-blue-700',
  interesado: 'bg-green-100 text-green-700',
  nda_enviado: 'bg-purple-100 text-purple-700',
  teaser_enviado: 'bg-orange-100 text-orange-700',
  evaluando: 'bg-yellow-100 text-yellow-700',
  descartado: 'bg-red-100 text-red-700',
  en_negociacion: 'bg-emerald-100 text-emerald-700',
};
