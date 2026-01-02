import type { FinancialStatement } from "@/types/financials";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

interface FinancialRatiosViewProps {
  statement: FinancialStatement;
}

export function FinancialRatiosView({ statement }: FinancialRatiosViewProps) {
  const formatCurrency = (value: number | null) => {
    if (value === null || value === undefined) return "-";
    return new Intl.NumberFormat('es-ES', { 
      style: 'currency', 
      currency: statement.currency || 'EUR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0 
    }).format(value);
  };

  const formatPercent = (value: number | null) => {
    if (value === null || value === undefined) return "-";
    return `${value.toFixed(1)}%`;
  };

  const formatRatio = (value: number | null) => {
    if (value === null || value === undefined) return "-";
    return `${value.toFixed(2)}x`;
  };

  // Calculate ratios
  const ebitdaMargin = statement.revenue && statement.ebitda 
    ? (statement.ebitda / statement.revenue) * 100 
    : null;
  
  const netMargin = statement.revenue && statement.net_income 
    ? (statement.net_income / statement.revenue) * 100 
    : null;

  const grossMarginPct = statement.revenue && statement.gross_margin 
    ? (statement.gross_margin / statement.revenue) * 100 
    : null;

  const currentRatio = statement.total_current_assets && statement.total_current_liabilities
    ? statement.total_current_assets / statement.total_current_liabilities
    : null;

  const debtToEquity = statement.total_liabilities && statement.total_equity && statement.total_equity > 0
    ? statement.total_liabilities / statement.total_equity
    : null;

  const roe = statement.net_income && statement.total_equity && statement.total_equity > 0
    ? (statement.net_income / statement.total_equity) * 100
    : null;

  const roa = statement.net_income && statement.total_assets && statement.total_assets > 0
    ? (statement.net_income / statement.total_assets) * 100
    : null;

  const ratioCards = [
    {
      title: "Margen Bruto",
      value: formatPercent(grossMarginPct),
      description: "Gross Margin",
      positive: grossMarginPct !== null && grossMarginPct > 30,
    },
    {
      title: "Margen EBITDA",
      value: formatPercent(ebitdaMargin),
      description: "EBITDA / Ingresos",
      positive: ebitdaMargin !== null && ebitdaMargin > 15,
    },
    {
      title: "Margen Neto",
      value: formatPercent(netMargin),
      description: "Beneficio Neto / Ingresos",
      positive: netMargin !== null && netMargin > 5,
    },
    {
      title: "Capital Circulante",
      value: formatCurrency(statement.working_capital),
      description: "Activo Corriente - Pasivo Corriente",
      positive: statement.working_capital !== null && statement.working_capital > 0,
    },
    {
      title: "Ratio de Liquidez",
      value: formatRatio(currentRatio),
      description: "Current Ratio",
      positive: currentRatio !== null && currentRatio > 1.5,
    },
    {
      title: "Deuda Neta",
      value: formatCurrency(statement.net_debt),
      description: "Deuda Financiera - Tesorería",
      positive: statement.net_debt !== null && statement.net_debt < 0,
    },
    {
      title: "Deuda / EBITDA",
      value: formatRatio(statement.debt_ebitda_ratio),
      description: "Leverage Ratio",
      positive: statement.debt_ebitda_ratio !== null && statement.debt_ebitda_ratio < 3,
    },
    {
      title: "Deuda / Patrimonio",
      value: formatRatio(debtToEquity),
      description: "Debt to Equity",
      positive: debtToEquity !== null && debtToEquity < 2,
    },
    {
      title: "ROE",
      value: formatPercent(roe),
      description: "Return on Equity",
      positive: roe !== null && roe > 15,
    },
    {
      title: "ROA",
      value: formatPercent(roa),
      description: "Return on Assets",
      positive: roa !== null && roa > 5,
    },
  ];

  return (
    <div className="space-y-4">
      <h4 className="font-medium">Ratios Financieros - {statement.year}</h4>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {ratioCards.map((ratio, idx) => (
          <div key={idx} className="border rounded-lg p-4 space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">{ratio.title}</span>
              {ratio.value !== "-" && (
                ratio.positive ? (
                  <TrendingUp className="h-4 w-4 text-green-500" />
                ) : (
                  <TrendingDown className="h-4 w-4 text-amber-500" />
                )
              )}
            </div>
            <p className="text-xl font-semibold">{ratio.value}</p>
            <p className="text-xs text-muted-foreground">{ratio.description}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
