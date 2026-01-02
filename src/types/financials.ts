export interface FinancialStatement {
  id: string;
  empresa_id: string;
  year: number;
  period_type: 'annual' | 'q1' | 'q2' | 'q3' | 'q4' | 'h1' | 'h2';
  is_audited: boolean;
  currency: string;

  // PyG
  revenue: number | null;
  other_income: number | null;
  total_income: number | null;
  cost_of_sales: number | null;
  gross_margin: number | null;
  personnel_expenses: number | null;
  other_operating_expenses: number | null;
  total_opex: number | null;
  ebitda: number | null;
  depreciation_amortization: number | null;
  ebit: number | null;
  financial_result: number | null;
  ebt: number | null;
  taxes: number | null;
  net_income: number | null;

  // Balance - Activo
  intangible_assets: number | null;
  tangible_assets: number | null;
  financial_assets: number | null;
  total_non_current_assets: number | null;
  inventories: number | null;
  trade_receivables: number | null;
  cash_equivalents: number | null;
  other_current_assets: number | null;
  total_current_assets: number | null;
  total_assets: number | null;

  // Balance - Patrimonio Neto
  share_capital: number | null;
  reserves: number | null;
  retained_earnings: number | null;
  current_year_result: number | null;
  total_equity: number | null;

  // Balance - Pasivo
  long_term_debt: number | null;
  other_non_current_liabilities: number | null;
  total_non_current_liabilities: number | null;
  short_term_debt: number | null;
  trade_payables: number | null;
  other_current_liabilities: number | null;
  total_current_liabilities: number | null;
  total_liabilities: number | null;
  total_equity_liabilities: number | null;

  // Ratios
  working_capital: number | null;
  net_debt: number | null;
  debt_ebitda_ratio: number | null;

  // Metadata
  source: 'manual' | 'ai_image' | 'import';
  source_document_id: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export type FinancialStatementInsert = Omit<FinancialStatement, 'id' | 'created_at' | 'updated_at'>;
export type FinancialStatementUpdate = Partial<FinancialStatementInsert>;

export interface ExtractedFinancialData {
  year: number;
  period_type: string;
  pyg: {
    revenue?: number;
    other_income?: number;
    cost_of_sales?: number;
    gross_margin?: number;
    personnel_expenses?: number;
    other_operating_expenses?: number;
    ebitda?: number;
    depreciation_amortization?: number;
    ebit?: number;
    financial_result?: number;
    ebt?: number;
    taxes?: number;
    net_income?: number;
  };
  balance: {
    intangible_assets?: number;
    tangible_assets?: number;
    financial_assets?: number;
    inventories?: number;
    trade_receivables?: number;
    cash_equivalents?: number;
    other_current_assets?: number;
    share_capital?: number;
    reserves?: number;
    retained_earnings?: number;
    long_term_debt?: number;
    other_non_current_liabilities?: number;
    short_term_debt?: number;
    trade_payables?: number;
    other_current_liabilities?: number;
  };
}
