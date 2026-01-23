import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowUp, ArrowDown, Info } from "lucide-react";
import { formatCurrency } from "@/lib/pricing-utils";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface WorkingCapitalAdjustmentProps {
  targetWC: number;
  actualWC: number;
  adjustment: number;
  inventories: number;
  tradeReceivables: number;
  otherCurrentAssets: number;
  tradePayables: number;
  otherCurrentLiabilities: number;
  onTargetChange: (value: number) => void;
  onActualChange: (value: number) => void;
}

export function WorkingCapitalAdjustment({
  targetWC,
  actualWC,
  adjustment,
  inventories,
  tradeReceivables,
  otherCurrentAssets,
  tradePayables,
  otherCurrentLiabilities,
  onTargetChange,
  onActualChange,
}: WorkingCapitalAdjustmentProps) {
  const isPositive = adjustment >= 0;

  return (
    <div className="rounded-lg border bg-muted/30 p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="font-semibold text-sm flex items-center gap-2">
          Ajuste de Working Capital
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger>
                <Info className="h-4 w-4 text-muted-foreground" />
              </TooltipTrigger>
              <TooltipContent className="max-w-xs">
                <p className="text-xs">
                  El ajuste de WC se calcula como la diferencia entre el WC real a fecha de cierre
                  y el WC objetivo acordado. Un exceso de WC incrementa el precio, un déficit lo reduce.
                </p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </h4>
      </div>

      {/* WC Breakdown */}
      <div className="grid grid-cols-2 gap-4 text-xs text-muted-foreground border-b pb-3">
        <div>
          <span className="font-medium">Activo Corriente:</span>
          <ul className="ml-2 mt-1 space-y-0.5">
            <li>Inventarios: {formatCurrency(inventories)}</li>
            <li>Deudores: {formatCurrency(tradeReceivables)}</li>
            <li>Otros: {formatCurrency(otherCurrentAssets)}</li>
          </ul>
        </div>
        <div>
          <span className="font-medium">Pasivo Corriente:</span>
          <ul className="ml-2 mt-1 space-y-0.5">
            <li>Acreedores: {formatCurrency(tradePayables)}</li>
            <li>Otros: {formatCurrency(otherCurrentLiabilities)}</li>
          </ul>
        </div>
      </div>

      {/* Inputs */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="target-wc" className="text-xs">
            WC Objetivo (NWC Target)
          </Label>
          <Input
            id="target-wc"
            type="number"
            value={targetWC || ''}
            onChange={(e) => onTargetChange(parseFloat(e.target.value) || 0)}
            placeholder="0"
            className="h-9"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="actual-wc" className="text-xs">
            WC Real a Cierre
          </Label>
          <Input
            id="actual-wc"
            type="number"
            value={actualWC || ''}
            onChange={(e) => onActualChange(parseFloat(e.target.value) || 0)}
            placeholder="0"
            className="h-9"
          />
        </div>
      </div>

      {/* Result */}
      <div className={cn(
        "flex items-center justify-between p-3 rounded-lg",
        isPositive ? "bg-emerald-500/10" : "bg-red-500/10"
      )}>
        <span className="text-sm font-medium">
          Ajuste {isPositive ? 'a favor comprador' : 'a favor vendedor'}
        </span>
        <div className={cn(
          "flex items-center gap-1 font-bold",
          isPositive ? "text-emerald-600" : "text-red-600"
        )}>
          {isPositive ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />}
          {formatCurrency(Math.abs(adjustment))}
        </div>
      </div>

      <p className="text-xs text-muted-foreground">
        Fórmula: WC Real ({formatCurrency(actualWC)}) - WC Objetivo ({formatCurrency(targetWC)}) = {formatCurrency(adjustment)}
      </p>
    </div>
  );
}
