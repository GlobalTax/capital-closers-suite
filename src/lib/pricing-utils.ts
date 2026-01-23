import type { PriceCalculation, PriceBridgeItem } from "@/types/pricing";

export function formatCurrency(value: number | null | undefined): string {
  if (value === null || value === undefined) return '—';
  return new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatCurrencyCompact(value: number): string {
  if (Math.abs(value) >= 1_000_000) {
    return `${(value / 1_000_000).toFixed(1)}M €`;
  }
  if (Math.abs(value) >= 1_000) {
    return `${(value / 1_000).toFixed(0)}K €`;
  }
  return formatCurrency(value);
}

export function calculateEquityValue(
  enterpriseValue: number,
  bridgeItems: PriceBridgeItem[]
): number {
  return bridgeItems.reduce((acc, item) => {
    return item.operation === 'add' 
      ? acc + item.value 
      : acc - item.value;
  }, enterpriseValue);
}

export function calculateNetDebt(
  longTermDebt: number,
  shortTermDebt: number,
  cashEquivalents: number
): number {
  return longTermDebt + shortTermDebt - cashEquivalents;
}

export function calculateWorkingCapital(
  inventories: number,
  tradeReceivables: number,
  otherCurrentAssets: number,
  tradePayables: number,
  otherCurrentLiabilities: number
): number {
  const currentAssets = inventories + tradeReceivables + otherCurrentAssets;
  const currentLiabilities = tradePayables + otherCurrentLiabilities;
  return currentAssets - currentLiabilities;
}

export function formatPriceSummary(calc: PriceCalculation): string {
  const methodologyLabel = calc.methodology === 'locked_box' 
    ? 'Locked Box' 
    : 'Completion Accounts';
  
  let summary = `
═══════════════════════════════════════════
  CÁLCULO DE PRECIO DEFINITIVO
  Metodología: ${methodologyLabel}
═══════════════════════════════════════════

Enterprise Value:           ${formatCurrency(calc.enterprise_value)}
`;

  calc.bridge_items.forEach(item => {
    const sign = item.operation === 'add' ? '(+)' : '(-)';
    const formattedValue = formatCurrency(item.value);
    summary += `${sign} ${item.label.padEnd(24)} ${formattedValue}\n`;
  });

  if (calc.methodology === 'completion_accounts') {
    summary += `
───────────────────────────────────────────
Working Capital:
  WC Objetivo:              ${formatCurrency(calc.target_working_capital)}
  WC Real:                  ${formatCurrency(calc.actual_working_capital)}
  Ajuste:                   ${formatCurrency(calc.working_capital_adjustment)}
`;
  }

  if (calc.methodology === 'locked_box' && calc.leakage_items.length > 0) {
    summary += `
───────────────────────────────────────────
Leakage:
  Total Leakage:            ${formatCurrency(calc.total_leakage)}
  Permitted Leakage:        ${formatCurrency(calc.permitted_leakage)}
  Net Leakage:              ${formatCurrency(calc.total_leakage - calc.permitted_leakage)}
`;
  }

  summary += `
═══════════════════════════════════════════
EQUITY VALUE:               ${formatCurrency(calc.equity_value)}
═══════════════════════════════════════════
`;

  return summary.trim();
}

export function exportPriceToCSV(calc: PriceCalculation): void {
  const methodologyLabel = calc.methodology === 'locked_box' 
    ? 'Locked Box' 
    : 'Completion Accounts';

  let csvContent = 'Concepto,Operación,Importe,Fuente\n';
  csvContent += `Enterprise Value,,${calc.enterprise_value},Manual\n`;
  
  calc.bridge_items.forEach(item => {
    csvContent += `${item.label},${item.operation === 'add' ? 'Sumar' : 'Restar'},${item.value},${item.source}\n`;
  });

  if (calc.methodology === 'completion_accounts') {
    csvContent += `WC Objetivo,,${calc.target_working_capital},Manual\n`;
    csvContent += `WC Real,,${calc.actual_working_capital},CCAA\n`;
    csvContent += `Ajuste WC,,${calc.working_capital_adjustment},Calculado\n`;
  }

  csvContent += `\nEquity Value,,${calc.equity_value},Calculado\n`;
  csvContent += `\nMetodología,${methodologyLabel}\n`;

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', `precio_definitivo_${new Date().toISOString().split('T')[0]}.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export function generateId(): string {
  return Math.random().toString(36).substring(2, 9);
}
