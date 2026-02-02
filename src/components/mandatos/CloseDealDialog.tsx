import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Trophy, XCircle, Ban, AlertTriangle } from "lucide-react";
import { LOSS_REASON_OPTIONS } from "@/lib/constants";
import type { Mandato, MandatoOutcome, LossReasonType } from "@/types";

interface CloseDealDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mandato: Mandato;
  initialOutcome: "won" | "lost" | "cancelled";
  onConfirm: (data: CloseDealData) => void;
}

export interface CloseDealData {
  outcome: MandatoOutcome;
  loss_reason?: LossReasonType;
  loss_notes?: string;
  won_value?: number;
  fee_facturado?: number;
}

export function CloseDealDialog({
  open,
  onOpenChange,
  mandato,
  initialOutcome,
  onConfirm,
}: CloseDealDialogProps) {
  const [outcome, setOutcome] = useState<"won" | "lost" | "cancelled">(initialOutcome);
  const [lossReason, setLossReason] = useState<LossReasonType | "">("");
  const [lossNotes, setLossNotes] = useState("");
  const [wonValue, setWonValue] = useState<number | undefined>(mandato.valor || undefined);
  const [feeCobrado, setFeeCobrado] = useState<number | undefined>(undefined);

  useEffect(() => {
    if (open) {
      setOutcome(initialOutcome);
      setLossReason("");
      setLossNotes("");
      setWonValue(mandato.valor || undefined);
      setFeeCobrado(undefined);
    }
  }, [open, initialOutcome, mandato.valor]);

  const isLossOrCancel = outcome === "lost" || outcome === "cancelled";
  const canConfirm = outcome === "won" || (isLossOrCancel && lossReason !== "");

  const handleConfirm = () => {
    const data: CloseDealData = {
      outcome,
      ...(outcome === "won" && { 
        won_value: wonValue,
        fee_facturado: feeCobrado,
      }),
      ...(isLossOrCancel && { 
        loss_reason: lossReason as LossReasonType,
        loss_notes: lossNotes || undefined,
      }),
    };
    onConfirm(data);
    onOpenChange(false);
  };

  const tipoLabel = mandato.tipo === 'compra' ? 'Compra' : 'Venta';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Cierre de Operación M&A</DialogTitle>
          <DialogDescription>
            {tipoLabel}: {mandato.empresa_principal?.nombre || mandato.descripcion}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <div className="space-y-3">
            <Label>¿Cómo terminó esta operación?</Label>
            <RadioGroup
              value={outcome}
              onValueChange={(v) => setOutcome(v as "won" | "lost" | "cancelled")}
              className="grid grid-cols-3 gap-3"
            >
              <div>
                <RadioGroupItem value="won" id="won" className="peer sr-only" />
                <Label
                  htmlFor="won"
                  className="flex flex-col items-center justify-center rounded-lg border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-green-500 peer-data-[state=checked]:bg-green-500/10 cursor-pointer transition-colors"
                >
                  <Trophy className="mb-2 h-6 w-6 text-green-500" />
                  <span className="text-sm font-medium">Deal Cerrado</span>
                  <span className="text-xs text-muted-foreground">Operación OK</span>
                </Label>
              </div>
              <div>
                <RadioGroupItem value="lost" id="lost" className="peer sr-only" />
                <Label
                  htmlFor="lost"
                  className="flex flex-col items-center justify-center rounded-lg border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-destructive peer-data-[state=checked]:bg-destructive/10 cursor-pointer transition-colors"
                >
                  <XCircle className="mb-2 h-6 w-6 text-destructive" />
                  <span className="text-sm font-medium">No se cerró</span>
                  <span className="text-xs text-muted-foreground">Sin transacción</span>
                </Label>
              </div>
              <div>
                <RadioGroupItem value="cancelled" id="cancelled" className="peer sr-only" />
                <Label
                  htmlFor="cancelled"
                  className="flex flex-col items-center justify-center rounded-lg border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-orange-500 peer-data-[state=checked]:bg-orange-500/10 cursor-pointer transition-colors"
                >
                  <Ban className="mb-2 h-6 w-6 text-orange-500" />
                  <span className="text-sm font-medium">Cancelado</span>
                  <span className="text-xs text-muted-foreground">Cliente desiste</span>
                </Label>
              </div>
            </RadioGroup>
          </div>

          {outcome === "won" && (
            <div className="space-y-4 p-4 bg-green-500/5 border border-green-500/20 rounded-lg">
              <div className="space-y-2">
                <Label htmlFor="won-value">Valor del Deal (€)</Label>
                <Input
                  id="won-value"
                  type="number"
                  placeholder="1500000"
                  value={wonValue || ""}
                  onChange={(e) => setWonValue(e.target.value ? Number(e.target.value) : undefined)}
                />
                <p className="text-xs text-muted-foreground">
                  Valor estimado: €{(mandato.valor || 0).toLocaleString()}
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="fee-cobrado">Fee Cobrado (€)</Label>
                <Input
                  id="fee-cobrado"
                  type="number"
                  placeholder="75000"
                  value={feeCobrado || ""}
                  onChange={(e) => setFeeCobrado(e.target.value ? Number(e.target.value) : undefined)}
                />
                <p className="text-xs text-muted-foreground">
                  Honorarios facturados por esta operación
                </p>
              </div>
            </div>
          )}

          {isLossOrCancel && (
            <div className="space-y-4 p-4 bg-destructive/5 border border-destructive/20 rounded-lg">
              <div className="space-y-2">
                <Label htmlFor="loss-reason" className="flex items-center gap-2">
                  ¿Por qué {outcome === "lost" ? "no se cerró" : "se canceló"}?
                  <span className="text-destructive">*</span>
                </Label>
                <Select value={lossReason} onValueChange={(v) => setLossReason(v as LossReasonType)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar razón..." />
                  </SelectTrigger>
                  <SelectContent>
                    {LOSS_REASON_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="loss-notes">Notas de aprendizaje (opcional)</Label>
                <Textarea
                  id="loss-notes"
                  placeholder="¿Qué podríamos haber hecho diferente?"
                  value={lossNotes}
                  onChange={(e) => setLossNotes(e.target.value)}
                  rows={3}
                />
              </div>

              {!lossReason && (
                <div className="flex items-center gap-2 text-sm text-amber-600">
                  <AlertTriangle className="h-4 w-4" />
                  <span>Debes seleccionar una razón para continuar</span>
                </div>
              )}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button 
            onClick={handleConfirm} 
            disabled={!canConfirm}
            variant={outcome === "won" ? "default" : "destructive"}
          >
            Confirmar Cierre
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
