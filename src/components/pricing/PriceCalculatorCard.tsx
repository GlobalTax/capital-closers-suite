import { useState } from "react";
import { 
  Calculator, 
  ChevronDown, 
  ChevronUp, 
  Copy, 
  Download, 
  RotateCcw,
  Info 
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { toast } from "sonner";
import { usePriceCalculator } from "@/hooks/usePriceCalculator";
import { MethodologySelector } from "./MethodologySelector";
import { PriceBridgeTable } from "./PriceBridgeTable";
import { WorkingCapitalAdjustment } from "./WorkingCapitalAdjustment";
import { LeakageSection } from "./LeakageSection";
import { ShareholderDistribution } from "./ShareholderDistribution";
import { formatCurrency, formatPriceSummary, exportPriceToCSV } from "@/lib/pricing-utils";
import { Skeleton } from "@/components/ui/skeleton";

interface PriceCalculatorCardProps {
  empresaId: string;
  mandatoId?: string;
}

export function PriceCalculatorCard({ empresaId, mandatoId }: PriceCalculatorCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  
  const {
    calculation,
    statements,
    currentStatement,
    selectedYear,
    setSelectedYear,
    isLoading,
    setMethodology,
    setEnterpriseValue,
    setTargetWorkingCapital,
    setActualWorkingCapital,
    updateBridgeItem,
    addBridgeItem,
    removeBridgeItem,
    addLeakageItem,
    removeLeakageItem,
    setLockedBoxDate,
    addShareholder,
    updateShareholder,
    removeShareholder,
    resetCalculation,
  } = usePriceCalculator(empresaId);

  const handleCopyToClipboard = () => {
    const summary = formatPriceSummary(calculation);
    navigator.clipboard.writeText(summary);
    toast.success('Resumen copiado al portapapeles');
  };

  const handleExport = () => {
    exportPriceToCSV(calculation);
    toast.success('Exportando a CSV...');
  };

  const availableYears = statements.map(s => s.year);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-64" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-32 w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader 
        className="cursor-pointer hover:bg-muted/50 transition-colors"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Calculator className="h-5 w-5 text-primary" />
            <CardTitle className="text-lg">Calculadora de Precio Definitivo</CardTitle>
            <Badge variant="outline" className="text-xs">
              Simulación
            </Badge>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger>
                  <Info className="h-4 w-4 text-muted-foreground" />
                </TooltipTrigger>
                <TooltipContent>
                  <p className="text-xs max-w-xs">
                    Esta herramienta es una simulación para calcular el precio definitivo.
                    Los datos no se guardan en base de datos.
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          <div className="flex items-center gap-4">
            {calculation.equity_value > 0 && (
              <div className="text-right">
                <div className="text-xs text-muted-foreground">Equity Value</div>
                <div className="text-lg font-bold text-primary">
                  {formatCurrency(calculation.equity_value)}
                </div>
              </div>
            )}
            {isExpanded ? (
              <ChevronUp className="h-5 w-5 text-muted-foreground" />
            ) : (
              <ChevronDown className="h-5 w-5 text-muted-foreground" />
            )}
          </div>
        </div>
      </CardHeader>

      {isExpanded && (
        <CardContent className="space-y-6">
          {/* Controls Row */}
          <div className="flex flex-wrap items-center justify-between gap-4">
            <MethodologySelector
              value={calculation.methodology}
              onChange={setMethodology}
            />

            <div className="flex items-center gap-2">
              {availableYears.length > 0 && (
                <Select
                  value={selectedYear?.toString() || availableYears[0]?.toString()}
                  onValueChange={(v) => setSelectedYear(parseInt(v))}
                >
                  <SelectTrigger className="w-32">
                    <SelectValue placeholder="Año CCAA" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableYears.map((year) => (
                      <SelectItem key={year} value={year.toString()}>
                        CCAA {year}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}

              <Button variant="outline" size="icon" onClick={resetCalculation}>
                <RotateCcw className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* No financial data warning */}
          {!currentStatement && (
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
              No hay estados financieros cargados para esta empresa. 
              Los valores del bridge se pueden introducir manualmente.
            </div>
          )}

          {/* Price Bridge Table */}
          <PriceBridgeTable
            enterpriseValue={calculation.enterprise_value}
            bridgeItems={calculation.bridge_items}
            equityValue={calculation.equity_value}
            onEnterpriseValueChange={setEnterpriseValue}
            onUpdateItem={updateBridgeItem}
            onRemoveItem={removeBridgeItem}
            onAddItem={addBridgeItem}
          />

          {/* Methodology-specific sections */}
          {calculation.methodology === 'completion_accounts' && (
            <WorkingCapitalAdjustment
              targetWC={calculation.target_working_capital}
              actualWC={calculation.actual_working_capital}
              adjustment={calculation.working_capital_adjustment}
              inventories={calculation.inventories}
              tradeReceivables={calculation.trade_receivables}
              otherCurrentAssets={calculation.other_current_assets}
              tradePayables={calculation.trade_payables}
              otherCurrentLiabilities={calculation.other_current_liabilities}
              onTargetChange={setTargetWorkingCapital}
              onActualChange={setActualWorkingCapital}
            />
          )}

          {calculation.methodology === 'locked_box' && (
            <LeakageSection
              lockedBoxDate={calculation.locked_box_date}
              leakageItems={calculation.leakage_items}
              totalLeakage={calculation.total_leakage}
              permittedLeakage={calculation.permitted_leakage}
              onDateChange={setLockedBoxDate}
              onAddItem={addLeakageItem}
              onRemoveItem={removeLeakageItem}
            />
          )}

          {/* Shareholder Distribution */}
          <ShareholderDistribution
            equityValue={calculation.equity_value}
            shareholders={calculation.shareholders}
            onAddShareholder={addShareholder}
            onUpdateShareholder={updateShareholder}
            onRemoveShareholder={removeShareholder}
          />

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button variant="outline" onClick={handleCopyToClipboard}>
              <Copy className="h-4 w-4 mr-2" />
              Copiar resumen
            </Button>
            <Button variant="outline" onClick={handleExport}>
              <Download className="h-4 w-4 mr-2" />
              Exportar CSV
            </Button>
          </div>
        </CardContent>
      )}
    </Card>
  );
}
