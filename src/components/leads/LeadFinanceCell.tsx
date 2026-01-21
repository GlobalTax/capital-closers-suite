import { TrendingDown } from "lucide-react";

interface LeadFinanceCellProps {
  valoracion?: number;
  facturacion?: number;
  ebitda?: number;
}

const formatCompact = (value: number | undefined): string => {
  if (value === undefined || value === null) return '';
  if (value >= 1000000) {
    return `${(value / 1000000).toFixed(1)}M€`;
  } else if (value >= 1000) {
    return `${Math.round(value / 1000)}K€`;
  }
  return `${Math.round(value)}€`;
};

export function LeadFinanceCell({ valoracion, facturacion, ebitda }: LeadFinanceCellProps) {
  const hasData = valoracion || facturacion || ebitda;
  
  if (!hasData) {
    return <span className="text-muted-foreground text-xs">-</span>;
  }

  // Si solo hay valoración
  if (valoracion && !facturacion && !ebitda) {
    return (
      <div className="flex items-center gap-1 text-xs">
        <TrendingDown className="w-3 h-3 text-amber-500" />
        <span className="font-medium text-amber-600">{formatCompact(valoracion)}</span>
      </div>
    );
  }

  // Formato condensado: valoración - facturación - ebitda
  const parts: string[] = [];
  if (valoracion) parts.push(formatCompact(valoracion));
  if (facturacion) parts.push(formatCompact(facturacion));
  if (ebitda) parts.push(formatCompact(ebitda));

  return (
    <div className="flex flex-col gap-0.5 text-xs">
      {valoracion && (
        <div className="flex items-center gap-1">
          <TrendingDown className="w-3 h-3 text-amber-500" />
          <span className="font-medium text-amber-600">{formatCompact(valoracion)}</span>
        </div>
      )}
      {(facturacion || ebitda) && (
        <span className="text-muted-foreground text-[11px]">
          {facturacion ? formatCompact(facturacion) : '-'}
          {' · '}
          {ebitda ? formatCompact(ebitda) : '-'}
        </span>
      )}
    </div>
  );
}
