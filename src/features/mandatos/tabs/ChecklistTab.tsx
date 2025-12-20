import { ChecklistDynamicCard } from "@/components/mandatos/ChecklistDynamicCard";
import type { Mandato } from "@/types";

interface ChecklistTabProps {
  mandato: Mandato;
}

export function ChecklistTab({ mandato }: ChecklistTabProps) {
  return (
    <div className="space-y-6">
      <ChecklistDynamicCard
        mandatoId={mandato.id}
        mandatoTipo={mandato.tipo}
      />
    </div>
  );
}