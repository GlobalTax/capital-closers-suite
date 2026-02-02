import { CloseDealDialog, CloseDealData } from "./CloseDealDialog";
import { CloseServiceDialog, CloseServiceData } from "./CloseServiceDialog";
import type { Mandato, MandatoOutcome, LossReasonType } from "@/types";

interface CloseMandatoDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mandato: Mandato;
  initialOutcome: "won" | "lost" | "cancelled";
  onConfirm: (data: CloseData) => void;
}

export interface CloseData {
  outcome: MandatoOutcome;
  loss_reason?: LossReasonType;
  loss_notes?: string;
  won_value?: number;
  fee_facturado?: number;
  fecha_entrega?: string;
  parcialmente_facturado?: boolean;
  importe_parcial?: number;
}

/**
 * Router component that shows the appropriate closing dialog
 * based on the mandate category (M&A operation vs Service)
 */
export function CloseMandatoDialog({
  open,
  onOpenChange,
  mandato,
  initialOutcome,
  onConfirm,
}: CloseMandatoDialogProps) {
  const isMAOperation = mandato.categoria === 'operacion_ma';

  const handleDealConfirm = (data: CloseDealData) => {
    onConfirm({
      outcome: data.outcome,
      loss_reason: data.loss_reason,
      loss_notes: data.loss_notes,
      won_value: data.won_value,
      fee_facturado: data.fee_facturado,
    });
  };

  const handleServiceConfirm = (data: CloseServiceData) => {
    // Map service cancel_reason to loss_reason for consistency
    onConfirm({
      outcome: data.outcome,
      loss_reason: data.cancel_reason as LossReasonType | undefined,
      loss_notes: data.cancel_notes,
      fee_facturado: data.fee_facturado,
      fecha_entrega: data.fecha_entrega,
      parcialmente_facturado: data.parcialmente_facturado,
      importe_parcial: data.importe_parcial,
    });
  };

  if (isMAOperation) {
    return (
      <CloseDealDialog
        open={open}
        onOpenChange={onOpenChange}
        mandato={mandato}
        initialOutcome={initialOutcome}
        onConfirm={handleDealConfirm}
      />
    );
  }

  return (
    <CloseServiceDialog
      open={open}
      onOpenChange={onOpenChange}
      mandato={mandato}
      initialOutcome={initialOutcome}
      onConfirm={handleServiceConfirm}
    />
  );
}
