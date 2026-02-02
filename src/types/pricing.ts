export type PricingMethodology = 'locked_box' | 'completion_accounts';

export type ShareholderType = 'persona_fisica' | 'sociedad' | 'holding';

export interface Shareholder {
  id: string;
  name: string;
  type: ShareholderType;
  percentage: number;
}

export type BridgeOperation = 'add' | 'subtract';

export interface PriceBridgeItem {
  id: string;
  label: string;
  value: number;
  operation: BridgeOperation;
  editable: boolean;
  source: 'manual' | 'financial_statement' | 'calculated';
  category?: 'debt' | 'cash' | 'wc' | 'other';
}

export interface LeakageItem {
  id: string;
  label: string;
  value: number;
  date: string;
  isPermitted: boolean;
}

export interface PriceCalculation {
  methodology: PricingMethodology;
  enterprise_value: number;
  
  // Dates
  locked_box_date?: string;
  completion_date?: string;
  
  // Locked Box specific
  leakage_items: LeakageItem[];
  total_leakage: number;
  permitted_leakage: number;
  
  // Completion Accounts specific
  target_working_capital: number;
  actual_working_capital: number;
  working_capital_adjustment: number;
  
  // Bridge items (customizable)
  bridge_items: PriceBridgeItem[];
  
  // Financial data from statements
  net_debt: number;
  cash_equivalents: number;
  long_term_debt: number;
  short_term_debt: number;
  
  // Working capital components
  inventories: number;
  trade_receivables: number;
  other_current_assets: number;
  trade_payables: number;
  other_current_liabilities: number;
  
  // Shareholder distribution
  shareholders: Shareholder[];
  
  // Result
  equity_value: number;
}

export interface PriceCalculatorState {
  calculation: PriceCalculation;
  isExpanded: boolean;
  selectedYear: number | null;
}

export const DEFAULT_BRIDGE_ITEMS: Omit<PriceBridgeItem, 'id' | 'value'>[] = [
  { label: 'Deuda Largo Plazo', operation: 'subtract', editable: true, source: 'financial_statement', category: 'debt' },
  { label: 'Deuda Corto Plazo', operation: 'subtract', editable: true, source: 'financial_statement', category: 'debt' },
  { label: 'Cash & Equivalentes', operation: 'add', editable: true, source: 'financial_statement', category: 'cash' },
  { label: 'Ajuste Working Capital', operation: 'add', editable: false, source: 'calculated', category: 'wc' },
];
