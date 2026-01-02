import type { FinancialStatement } from "@/types/financials";

interface BalanceSheetViewProps {
  statement: FinancialStatement;
}

export function BalanceSheetView({ statement }: BalanceSheetViewProps) {
  const formatCurrency = (value: number | null) => {
    if (value === null || value === undefined) return "-";
    return new Intl.NumberFormat('es-ES', { 
      style: 'currency', 
      currency: statement.currency || 'EUR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0 
    }).format(value);
  };

  const activoRows = [
    { label: "ACTIVO NO CORRIENTE", value: null, header: true },
    { label: "Inmovilizado Intangible", value: statement.intangible_assets },
    { label: "Inmovilizado Material", value: statement.tangible_assets },
    { label: "Inversiones Financieras L/P", value: statement.financial_assets },
    { label: "Total Activo No Corriente", value: statement.total_non_current_assets, bold: true },
    { label: "", value: null, separator: true },
    { label: "ACTIVO CORRIENTE", value: null, header: true },
    { label: "Existencias", value: statement.inventories },
    { label: "Deudores Comerciales", value: statement.trade_receivables },
    { label: "Efectivo y Equivalentes", value: statement.cash_equivalents },
    { label: "Otros Activos Corrientes", value: statement.other_current_assets },
    { label: "Total Activo Corriente", value: statement.total_current_assets, bold: true },
    { label: "", value: null, separator: true },
    { label: "TOTAL ACTIVO", value: statement.total_assets, bold: true, highlight: true },
  ];

  const pasivoRows = [
    { label: "PATRIMONIO NETO", value: null, header: true },
    { label: "Capital Social", value: statement.share_capital },
    { label: "Reservas", value: statement.reserves },
    { label: "Resultados de Ejercicios Anteriores", value: statement.retained_earnings },
    { label: "Resultado del Ejercicio", value: statement.current_year_result },
    { label: "Total Patrimonio Neto", value: statement.total_equity, bold: true },
    { label: "", value: null, separator: true },
    { label: "PASIVO NO CORRIENTE", value: null, header: true },
    { label: "Deudas L/P Entidades de Crédito", value: statement.long_term_debt },
    { label: "Otros Pasivos No Corrientes", value: statement.other_non_current_liabilities },
    { label: "Total Pasivo No Corriente", value: statement.total_non_current_liabilities, bold: true },
    { label: "", value: null, separator: true },
    { label: "PASIVO CORRIENTE", value: null, header: true },
    { label: "Deudas C/P Entidades de Crédito", value: statement.short_term_debt },
    { label: "Acreedores Comerciales", value: statement.trade_payables },
    { label: "Otros Pasivos Corrientes", value: statement.other_current_liabilities },
    { label: "Total Pasivo Corriente", value: statement.total_current_liabilities, bold: true },
    { label: "", value: null, separator: true },
    { label: "TOTAL PASIVO", value: statement.total_liabilities, bold: true },
    { label: "TOTAL PN + PASIVO", value: statement.total_equity_liabilities, bold: true, highlight: true },
  ];

  const renderRows = (rows: typeof activoRows) => (
    <div className="border rounded-lg overflow-hidden">
      {rows.map((row, idx) => {
        if (row.separator) {
          return <div key={idx} className="h-px bg-border" />;
        }
        if (row.header) {
          return (
            <div key={idx} className="px-4 py-2 bg-muted font-medium text-sm">
              {row.label}
            </div>
          );
        }
        return (
          <div
            key={idx}
            className={`flex justify-between items-center px-4 py-2 ${
              row.highlight ? 'bg-primary/10' : ''
            }`}
          >
            <span className={row.bold ? 'font-medium' : 'text-muted-foreground text-sm'}>
              {row.label}
            </span>
            <span className={row.bold ? 'font-semibold' : ''}>
              {formatCurrency(row.value)}
            </span>
          </div>
        );
      })}
    </div>
  );

  return (
    <div className="space-y-4">
      <h4 className="font-medium">Balance de Situación - {statement.year}</h4>
      <div className="grid md:grid-cols-2 gap-4">
        <div>
          <h5 className="text-sm font-medium mb-2 text-muted-foreground">ACTIVO</h5>
          {renderRows(activoRows)}
        </div>
        <div>
          <h5 className="text-sm font-medium mb-2 text-muted-foreground">PASIVO Y PATRIMONIO NETO</h5>
          {renderRows(pasivoRows)}
        </div>
      </div>
    </div>
  );
}
