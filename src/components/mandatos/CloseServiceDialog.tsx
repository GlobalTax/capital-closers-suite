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
import { Switch } from "@/components/ui/switch";
import { CheckCircle2, Ban, AlertTriangle, Calendar } from "lucide-react";
import { SERVICE_CANCEL_REASONS, MANDATO_CATEGORIA_LABELS } from "@/lib/constants";
import type { Mandato, MandatoOutcome } from "@/types";
import { format } from "date-fns";

interface CloseServiceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mandato: Mandato;
  initialOutcome: "won" | "lost" | "cancelled";
  onConfirm: (data: CloseServiceData) => void;
}

export interface CloseServiceData {
  outcome: MandatoOutcome;
  cancel_reason?: string;
  cancel_notes?: string;
  fee_facturado?: number;
  fecha_entrega?: string;
  parcialmente_facturado?: boolean;
  importe_parcial?: number;
}

type ServiceOutcome = "delivered" | "cancelled";

export function CloseServiceDialog({
  open,
  onOpenChange,
  mandato,
  initialOutcome,
  onConfirm,
}: CloseServiceDialogProps) {
  const [outcome, setOutcome] = useState<ServiceOutcome>(
    initialOutcome === "cancelled" ? "cancelled" : "delivered"
  );
  const [cancelReason, setCancelReason] = useState<string>("");
  const [cancelNotes, setCancelNotes] = useState("");
  const [feeFinal, setFeeFinal] = useState<number | undefined>(undefined);
  const [fechaEntrega, setFechaEntrega] = useState<string>(format(new Date(), 'yyyy-MM-dd'));
  const [parcialmenteFacturado, setParcialmenteFacturado] = useState(false);
  const [importeParcial, setImporteParcial] = useState<number | undefined>(undefined);

  useEffect(() => {
    if (open) {
      setOutcome(initialOutcome === "cancelled" ? "cancelled" : "delivered");
      setCancelReason("");
      setCancelNotes("");
      setFeeFinal(undefined);
      setFechaEntrega(format(new Date(), 'yyyy-MM-dd'));
      setParcialmenteFacturado(false);
      setImporteParcial(undefined);
    }
  }, [open, initialOutcome]);

  const canConfirm = outcome === "delivered" || (outcome === "cancelled" && cancelReason !== "");

  const handleConfirm = () => {
    // Map service outcome to mandato outcome
    const mandatoOutcome: MandatoOutcome = outcome === "delivered" ? "won" : "cancelled";
    
    const data: CloseServiceData = {
      outcome: mandatoOutcome,
      ...(outcome === "delivered" && { 
        fee_facturado: feeFinal,
        fecha_entrega: fechaEntrega,
      }),
      ...(outcome === "cancelled" && { 
        cancel_reason: cancelReason,
        cancel_notes: cancelNotes || undefined,
        parcialmente_facturado: parcialmenteFacturado,
        importe_parcial: parcialmenteFacturado ? importeParcial : undefined,
      }),
    };
    onConfirm(data);
    onOpenChange(false);
  };

  const categoriaLabel = mandato.categoria 
    ? MANDATO_CATEGORIA_LABELS[mandato.categoria]?.label || mandato.categoria 
    : 'Servicio';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Cierre de Servicio</DialogTitle>
          <DialogDescription>
            {categoriaLabel}: {mandato.empresa_principal?.nombre || mandato.descripcion}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <div className="space-y-3">
            <Label>¿Cómo terminó este servicio?</Label>
            <RadioGroup
              value={outcome}
              onValueChange={(v) => setOutcome(v as ServiceOutcome)}
              className="grid grid-cols-2 gap-3"
            >
              <div>
                <RadioGroupItem value="delivered" id="delivered" className="peer sr-only" />
                <Label
                  htmlFor="delivered"
                  className="flex flex-col items-center justify-center rounded-lg border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-green-500 peer-data-[state=checked]:bg-green-500/10 cursor-pointer transition-colors"
                >
                  <CheckCircle2 className="mb-2 h-6 w-6 text-green-500" />
                  <span className="text-sm font-medium">Entregado</span>
                  <span className="text-xs text-muted-foreground">Servicio completado</span>
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
                  <span className="text-xs text-muted-foreground">No se prestó</span>
                </Label>
              </div>
            </RadioGroup>
          </div>

          {outcome === "delivered" && (
            <div className="space-y-4 p-4 bg-green-500/5 border border-green-500/20 rounded-lg">
              <div className="space-y-2">
                <Label htmlFor="fee-final">Honorarios Facturados (€)</Label>
                <Input
                  id="fee-final"
                  type="number"
                  placeholder="15000"
                  value={feeFinal || ""}
                  onChange={(e) => setFeeFinal(e.target.value ? Number(e.target.value) : undefined)}
                />
                {(mandato as any).honorario_estimado && (
                  <p className="text-xs text-muted-foreground">
                    Estimado: €{((mandato as any).honorario_estimado).toLocaleString()}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="fecha-entrega" className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Fecha de Entrega
                </Label>
                <Input
                  id="fecha-entrega"
                  type="date"
                  value={fechaEntrega}
                  onChange={(e) => setFechaEntrega(e.target.value)}
                />
              </div>
            </div>
          )}

          {outcome === "cancelled" && (
            <div className="space-y-4 p-4 bg-orange-500/5 border border-orange-500/20 rounded-lg">
              <div className="space-y-2">
                <Label htmlFor="cancel-reason" className="flex items-center gap-2">
                  ¿Por qué se canceló?
                  <span className="text-destructive">*</span>
                </Label>
                <Select value={cancelReason} onValueChange={setCancelReason}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar razón..." />
                  </SelectTrigger>
                  <SelectContent>
                    {SERVICE_CANCEL_REASONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="cancel-notes">Notas (opcional)</Label>
                <Textarea
                  id="cancel-notes"
                  placeholder="Detalles adicionales..."
                  value={cancelNotes}
                  onChange={(e) => setCancelNotes(e.target.value)}
                  rows={2}
                />
              </div>

              <div className="flex items-center justify-between p-3 bg-background rounded-md border">
                <div className="space-y-0.5">
                  <Label htmlFor="partial-billing">¿Se facturó algo?</Label>
                  <p className="text-xs text-muted-foreground">
                    Marcar si hubo facturación parcial
                  </p>
                </div>
                <Switch
                  id="partial-billing"
                  checked={parcialmenteFacturado}
                  onCheckedChange={setParcialmenteFacturado}
                />
              </div>

              {parcialmenteFacturado && (
                <div className="space-y-2">
                  <Label htmlFor="importe-parcial">Importe Facturado (€)</Label>
                  <Input
                    id="importe-parcial"
                    type="number"
                    placeholder="5000"
                    value={importeParcial || ""}
                    onChange={(e) => setImporteParcial(e.target.value ? Number(e.target.value) : undefined)}
                  />
                </div>
              )}

              {!cancelReason && (
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
            variant={outcome === "delivered" ? "default" : "destructive"}
          >
            Confirmar Cierre
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
