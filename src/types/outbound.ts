/**
 * Tipos para el sistema de Outbound sectorial con Apollo
 */

export interface OutboundFilters {
  revenue_min?: number;
  revenue_max?: number;
  employee_ranges?: string[];
  locations?: string[];
  titles?: string[];
  seniority?: string[];
  keywords?: string[];
}

export interface OutboundCampaign {
  id: string;
  name: string;
  description?: string;
  sector_id?: string;
  sector_name?: string;
  filters: OutboundFilters;
  apollo_keywords?: string[];
  status: 'draft' | 'searching' | 'enriching' | 'completed' | 'archived';
  total_found: number;
  total_enriched: number;
  total_imported: number;
  credits_used: number;
  created_by?: string;
  created_at: string;
  updated_at: string;
  last_search_at?: string;
  completed_at?: string;
}

export interface OutboundProspect {
  id: string;
  campaign_id: string;
  
  // Datos básicos de Apollo (gratis)
  apollo_id?: string;
  apollo_org_id?: string;
  nombre: string;
  apellidos?: string;
  cargo?: string;
  empresa?: string;
  linkedin_url?: string;
  website_domain?: string;
  
  // Datos de empresa
  company_linkedin_url?: string;
  company_size?: string;
  company_revenue_range?: string;
  company_industry?: string;
  company_location?: string;
  
  // Datos enriquecidos (requieren créditos)
  email?: string;
  email_status?: string;
  telefono?: string;
  telefono_type?: string;
  
  // Estado
  enrichment_status: 'pending' | 'enriching' | 'enriched' | 'failed' | 'skipped';
  import_status: 'not_imported' | 'imported' | 'duplicate' | 'rejected';
  
  // Tracking
  enriched_at?: string;
  imported_at?: string;
  imported_lead_id?: string;
  
  // UI
  is_selected: boolean;
  notes?: string;
  score?: number;
  
  created_at: string;
  updated_at: string;
}

export interface ApolloSectorMapping {
  id: string;
  sector_id?: string;
  sector_name: string;
  apollo_keywords: string[];
  apollo_industries: string[];
  sic_codes: string[];
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// Apollo API response types
export interface ApolloPersonResult {
  id: string;
  first_name: string;
  last_name: string;
  title: string;
  linkedin_url: string;
  organization?: {
    id: string;
    name: string;
    website_url: string;
    linkedin_url: string;
    estimated_num_employees: number;
    industry: string;
    primary_domain: string;
  };
  email?: string;
  phone_numbers?: Array<{
    raw_number: string;
    type: string;
  }>;
}

export interface ApolloSearchResponse {
  people: ApolloPersonResult[];
  pagination: {
    page: number;
    per_page: number;
    total_entries: number;
    total_pages: number;
  };
}

// Stats para UI
export interface OutboundStats {
  totalCampaigns: number;
  activeCampaigns: number;
  totalProspects: number;
  totalEnriched: number;
  totalImported: number;
  creditsUsed: number;
}
