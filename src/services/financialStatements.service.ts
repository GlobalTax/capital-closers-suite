import { supabase } from "@/integrations/supabase/client";
import type { FinancialStatement, FinancialStatementInsert, FinancialStatementUpdate } from "@/types/financials";

export async function getFinancialStatements(empresaId: string): Promise<FinancialStatement[]> {
  const { data, error } = await supabase
    .from('empresa_financial_statements')
    .select('*')
    .eq('empresa_id', empresaId)
    .order('year', { ascending: false });

  if (error) throw error;
  return data as FinancialStatement[];
}

export async function getFinancialStatement(id: string): Promise<FinancialStatement | null> {
  const { data, error } = await supabase
    .from('empresa_financial_statements')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    throw error;
  }
  return data as FinancialStatement;
}

export async function createFinancialStatement(statement: FinancialStatementInsert): Promise<FinancialStatement> {
  // Calculate totals and ratios
  const calculated = calculateTotalsAndRatios(statement);

  const { data, error } = await supabase
    .from('empresa_financial_statements')
    .insert({ ...statement, ...calculated })
    .select()
    .single();

  if (error) throw error;
  return data as FinancialStatement;
}

export async function updateFinancialStatement(
  id: string,
  updates: FinancialStatementUpdate
): Promise<FinancialStatement> {
  const calculated = calculateTotalsAndRatios(updates);

  const { data, error } = await supabase
    .from('empresa_financial_statements')
    .update({ ...updates, ...calculated })
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data as FinancialStatement;
}

export async function deleteFinancialStatement(id: string): Promise<void> {
  const { error } = await supabase
    .from('empresa_financial_statements')
    .delete()
    .eq('id', id);

  if (error) throw error;
}

function calculateTotalsAndRatios(data: Partial<FinancialStatementInsert>) {
  const result: Partial<FinancialStatementInsert> = {};

  // PyG totals
  if (data.revenue !== undefined || data.other_income !== undefined) {
    result.total_income = (data.revenue || 0) + (data.other_income || 0);
  }

  if (data.revenue !== undefined && data.cost_of_sales !== undefined) {
    result.gross_margin = (data.revenue || 0) - Math.abs(data.cost_of_sales || 0);
  }

  if (data.personnel_expenses !== undefined || data.other_operating_expenses !== undefined) {
    result.total_opex = Math.abs(data.personnel_expenses || 0) + Math.abs(data.other_operating_expenses || 0);
  }

  // Balance totals
  if (data.intangible_assets !== undefined || data.tangible_assets !== undefined || data.financial_assets !== undefined) {
    result.total_non_current_assets = (data.intangible_assets || 0) + (data.tangible_assets || 0) + (data.financial_assets || 0);
  }

  if (data.inventories !== undefined || data.trade_receivables !== undefined || data.cash_equivalents !== undefined || data.other_current_assets !== undefined) {
    result.total_current_assets = (data.inventories || 0) + (data.trade_receivables || 0) + (data.cash_equivalents || 0) + (data.other_current_assets || 0);
  }

  if (result.total_non_current_assets !== undefined || result.total_current_assets !== undefined) {
    result.total_assets = (result.total_non_current_assets || data.total_non_current_assets || 0) + (result.total_current_assets || data.total_current_assets || 0);
  }

  if (data.share_capital !== undefined || data.reserves !== undefined || data.retained_earnings !== undefined || data.current_year_result !== undefined) {
    result.total_equity = (data.share_capital || 0) + (data.reserves || 0) + (data.retained_earnings || 0) + (data.current_year_result || 0);
  }

  if (data.long_term_debt !== undefined || data.other_non_current_liabilities !== undefined) {
    result.total_non_current_liabilities = (data.long_term_debt || 0) + (data.other_non_current_liabilities || 0);
  }

  if (data.short_term_debt !== undefined || data.trade_payables !== undefined || data.other_current_liabilities !== undefined) {
    result.total_current_liabilities = (data.short_term_debt || 0) + (data.trade_payables || 0) + (data.other_current_liabilities || 0);
  }

  if (result.total_non_current_liabilities !== undefined || result.total_current_liabilities !== undefined) {
    result.total_liabilities = (result.total_non_current_liabilities || data.total_non_current_liabilities || 0) + (result.total_current_liabilities || data.total_current_liabilities || 0);
  }

  if (result.total_equity !== undefined || result.total_liabilities !== undefined) {
    result.total_equity_liabilities = (result.total_equity || data.total_equity || 0) + (result.total_liabilities || data.total_liabilities || 0);
  }

  // Ratios
  const totalCurrentAssets = result.total_current_assets || data.total_current_assets || 0;
  const totalCurrentLiabilities = result.total_current_liabilities || data.total_current_liabilities || 0;
  result.working_capital = totalCurrentAssets - totalCurrentLiabilities;

  const longTermDebt = data.long_term_debt || 0;
  const shortTermDebt = data.short_term_debt || 0;
  const cash = data.cash_equivalents || 0;
  result.net_debt = longTermDebt + shortTermDebt - cash;

  if (data.ebitda && data.ebitda > 0 && result.net_debt !== undefined) {
    result.debt_ebitda_ratio = result.net_debt / data.ebitda;
  }

  return result;
}

export async function extractFinancialDataFromImage(imageBase64: string): Promise<any> {
  const { data, error } = await supabase.functions.invoke('extract-financial-statements', {
    body: { image: imageBase64 }
  });

  if (error) throw error;
  return data;
}
