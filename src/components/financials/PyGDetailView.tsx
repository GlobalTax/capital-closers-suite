import type { FinancialStatement } from "@/types/financials";

interface PyGDetailViewProps {
  statement: FinancialStatement;
}

export function PyGDetailView({ statement }: PyGDetailViewProps) {
  const formatCurrency = (value: number | null) => {
    if (value === null || value === undefined) return "-";
    return new Intl.NumberFormat('es-ES', { 
      style: 'currency', 
      currency: statement.currency || 'EUR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0 
    }).format(value);
  };

  const rows = [
    { label: "Cifra de Negocios", value: statement.revenue, bold: true },
    { label: "Otros Ingresos de Explotación", value: statement.other_income },
    { label: "TOTAL INGRESOS", value: statement.total_income, bold: true, highlight: true },
    { label: "", value: null, separator: true },
    { label: "Coste de Ventas / Aprovisionamientos", value: statement.cost_of_sales ? -Math.abs(statement.cost_of_sales) : null, negative: true },
    { label: "MARGEN BRUTO", value: statement.gross_margin, bold: true, highlight: true },
    { label: "", value: null, separator: true },
    { label: "Gastos de Personal", value: statement.personnel_expenses ? -Math.abs(statement.personnel_expenses) : null, negative: true },
    { label: "Otros Gastos de Explotación", value: statement.other_operating_expenses ? -Math.abs(statement.other_operating_expenses) : null, negative: true },
    { label: "TOTAL OPEX", value: statement.total_opex ? -Math.abs(statement.total_opex) : null, bold: true, negative: true },
    { label: "", value: null, separator: true },
    { label: "EBITDA", value: statement.ebitda, bold: true, highlight: true, primary: true },
    { label: "", value: null, separator: true },
    { label: "Amortizaciones", value: statement.depreciation_amortization ? -Math.abs(statement.depreciation_amortization) : null, negative: true },
    { label: "EBIT / Resultado de Explotación", value: statement.ebit, bold: true, highlight: true },
    { label: "", value: null, separator: true },
    { label: "Resultado Financiero", value: statement.financial_result },
    { label: "EBT / Resultado Antes de Impuestos", value: statement.ebt, bold: true },
    { label: "Impuesto sobre Beneficios", value: statement.taxes ? -Math.abs(statement.taxes) : null, negative: true },
    { label: "", value: null, separator: true },
    { label: "BENEFICIO NETO", value: statement.net_income, bold: true, highlight: true, primary: true },
  ];

  return (
    <div className="space-y-1">
      <h4 className="font-medium mb-3">Cuenta de Pérdidas y Ganancias - {statement.year}</h4>
      <div className="border rounded-lg overflow-hidden">
        {rows.map((row, idx) => {
          if (row.separator) {
            return <div key={idx} className="h-px bg-border" />;
          }
          return (
            <div
              key={idx}
              className={`flex justify-between items-center px-4 py-2 ${
                row.highlight ? 'bg-muted/50' : ''
              } ${row.primary ? 'bg-primary/10' : ''}`}
            >
              <span className={row.bold ? 'font-medium' : 'text-muted-foreground'}>
                {row.label}
              </span>
              <span className={`${row.bold ? 'font-semibold' : ''} ${
                row.negative && row.value ? 'text-destructive' : ''
              } ${row.primary ? 'text-primary font-bold' : ''}`}>
                {formatCurrency(row.value)}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
