// Deal Sheet types for standardized candidate information sharing

export interface DealSheet {
  id: string;
  mandato_id: string;
  
  // Executive summary (multilingual)
  executive_summary_es: string | null;
  executive_summary_en: string | null;
  
  // Investment highlights
  investment_highlights_es: string[];
  investment_highlights_en: string[];
  
  // Sale rationale
  sale_rationale_es: string | null;
  sale_rationale_en: string | null;
  
  // Ideal buyer profile
  ideal_buyer_profile_es: string | null;
  ideal_buyer_profile_en: string | null;
  
  // Financial visibility configuration
  show_revenue_range: boolean;
  show_ebitda_range: boolean;
  show_ebitda_margin: boolean;
  show_employees: boolean;
  show_exact_financials: boolean;
  
  // Custom financial ranges
  custom_revenue_min: number | null;
  custom_revenue_max: number | null;
  custom_ebitda_min: number | null;
  custom_ebitda_max: number | null;
  
  // Process information
  transaction_type: TransactionType | null;
  valuation_multiple_min: number | null;
  valuation_multiple_max: number | null;
  expected_timeline: string | null;
  process_requirements: string[];
  
  // Status
  status: DealSheetStatus;
  published_at: string | null;
  published_by: string | null;
  
  created_at: string;
  updated_at: string;
}

export type DealSheetStatus = 'draft' | 'published';
export type TransactionType = '100%' | 'majority' | 'minority';

export interface DealSheetFormData {
  executive_summary_es: string;
  executive_summary_en: string;
  investment_highlights_es: string[];
  investment_highlights_en: string[];
  sale_rationale_es: string;
  sale_rationale_en: string;
  ideal_buyer_profile_es: string;
  ideal_buyer_profile_en: string;
  show_revenue_range: boolean;
  show_ebitda_range: boolean;
  show_ebitda_margin: boolean;
  show_employees: boolean;
  show_exact_financials: boolean;
  custom_revenue_min: number | null;
  custom_revenue_max: number | null;
  custom_ebitda_min: number | null;
  custom_ebitda_max: number | null;
  transaction_type: TransactionType | null;
  valuation_multiple_min: number | null;
  valuation_multiple_max: number | null;
  expected_timeline: string;
  process_requirements: string[];
}

export const TRANSACTION_TYPE_LABELS: Record<TransactionType, string> = {
  '100%': '100% del capital',
  'majority': 'Mayoría (>50%)',
  'minority': 'Minoritaria (<50%)',
};

export const DEFAULT_DEAL_SHEET_FORM: DealSheetFormData = {
  executive_summary_es: '',
  executive_summary_en: '',
  investment_highlights_es: [],
  investment_highlights_en: [],
  sale_rationale_es: '',
  sale_rationale_en: '',
  ideal_buyer_profile_es: '',
  ideal_buyer_profile_en: '',
  show_revenue_range: true,
  show_ebitda_range: true,
  show_ebitda_margin: true,
  show_employees: true,
  show_exact_financials: false,
  custom_revenue_min: null,
  custom_revenue_max: null,
  custom_ebitda_min: null,
  custom_ebitda_max: null,
  transaction_type: null,
  valuation_multiple_min: null,
  valuation_multiple_max: null,
  expected_timeline: '',
  process_requirements: [],
};
