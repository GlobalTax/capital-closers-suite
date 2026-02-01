import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, Building2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useFinancialStatements } from "@/hooks/useFinancialStatements";

interface TargetEmpresa {
  id: string;
  nombre: string;
  sector_id?: string | null;
  empleados?: number | null;
  facturacion?: number | null;
  ebitda?: number | null;
}

interface Target {
  id: string;
  empresa_id: string | null;
  empresa?: TargetEmpresa | null;
  match_score?: number | null;
}

interface TargetFinancialsComparisonProps {
  targets: Target[];
  selectedTargetId?: string;
  onSelectTarget: (targetId: string) => void;
}

// Componente interno para obtener datos financieros de cada target
function TargetRow({ 
  target, 
  isSelected, 
  onSelect 
}: { 
  target: Target; 
  isSelected: boolean; 
  onSelect: () => void;
}) {
  const { statements } = useFinancialStatements(target.empresa_id || undefined);

  // Obtener el statement más reciente
  const latestStatement = useMemo(() => {
    if (!statements.length) return null;
    return statements.sort((a, b) => {
      if (a.year !== b.year) return b.year - a.year;
      // Q4 > Q3 > Q2 > Q1 > Anual
      const periodOrder = { 'annual': 0, 'q1': 1, 'q2': 2, 'q3': 3, 'q4': 4, 'h1': 1.5, 'h2': 3.5 };
      return (periodOrder[b.period_type as keyof typeof periodOrder] || 0) - 
             (periodOrder[a.period_type as keyof typeof periodOrder] || 0);
    })[0];
  }, [statements]);

  // Usar datos del statement o de la empresa como fallback
  const revenue = latestStatement?.revenue ?? target.empresa?.facturacion ?? null;
  const ebitda = latestStatement?.ebitda ?? target.empresa?.ebitda ?? null;
  const margin = revenue && ebitda ? (ebitda / revenue * 100) : null;
  const netProfit = latestStatement?.net_income ?? null;

  const formatCurrency = (value: number | null) => {
    if (value === null) return "-";
    if (value >= 1000000) return `€${(value / 1000000).toFixed(1)}M`;
    if (value >= 1000) return `€${(value / 1000).toFixed(0)}K`;
    return `€${value.toLocaleString()}`;
  };

  const formatPercent = (value: number | null) => {
    if (value === null) return "-";
    return `${value.toFixed(1)}%`;
  };

  return (
    <TableRow 
      className={cn(
        "cursor-pointer transition-colors",
        isSelected && "bg-primary/5 border-l-2 border-l-primary"
      )}
      onClick={onSelect}
    >
      <TableCell className="font-medium">
        <div className="flex items-center gap-2">
          <Building2 className="h-4 w-4 text-muted-foreground" />
          <span className="truncate max-w-[180px]">
            {target.empresa?.nombre || "Sin nombre"}
          </span>
        </div>
      </TableCell>
      <TableCell className="text-right font-mono">
        {formatCurrency(revenue)}
      </TableCell>
      <TableCell className="text-right font-mono">
        {formatCurrency(ebitda)}
      </TableCell>
      <TableCell className="text-right">
        {margin !== null ? (
          <Badge variant={margin >= 15 ? "default" : margin >= 10 ? "secondary" : "outline"}>
            {formatPercent(margin)}
          </Badge>
        ) : "-"}
      </TableCell>
      <TableCell className="text-right font-mono">
        {formatCurrency(netProfit)}
      </TableCell>
      <TableCell className="text-right">
        {target.empresa?.empleados ?? "-"}
      </TableCell>
      <TableCell className="text-right">
        {target.match_score !== null && target.match_score !== undefined ? (
          <Badge variant={target.match_score >= 80 ? "default" : "outline"}>
            {target.match_score}%
          </Badge>
        ) : "-"}
      </TableCell>
    </TableRow>
  );
}

export function TargetFinancialsComparison({ 
  targets, 
  selectedTargetId, 
  onSelectTarget 
}: TargetFinancialsComparisonProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <TrendingUp className="h-5 w-5" />
          Comparativa Financiera
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="min-w-[200px]">Target</TableHead>
                <TableHead className="text-right">Facturación</TableHead>
                <TableHead className="text-right">EBITDA</TableHead>
                <TableHead className="text-right">Margen</TableHead>
                <TableHead className="text-right">B. Neto</TableHead>
                <TableHead className="text-right">Empleados</TableHead>
                <TableHead className="text-right">Match</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {targets.map((target) => (
                <TargetRow
                  key={target.id}
                  target={target}
                  isSelected={target.id === selectedTargetId}
                  onSelect={() => onSelectTarget(target.id)}
                />
              ))}
            </TableBody>
          </Table>
        </div>
        <p className="text-xs text-muted-foreground mt-3">
          Haz clic en una fila para ver los estados financieros completos del target
        </p>
      </CardContent>
    </Card>
  );
}
