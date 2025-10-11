import { ChecklistMACard } from "@/components/mandatos/ChecklistMACard";
import type { Mandato } from "@/types";

interface ChecklistTabProps {
  mandato: Mandato;
}

export function ChecklistTab({ mandato }: ChecklistTabProps) {
  return (
    <div className="space-y-6">
      <ChecklistMACard
        mandatoId={mandato.id}
        mandatoTipo={mandato.tipo}
      />
    </div>
  );
}
