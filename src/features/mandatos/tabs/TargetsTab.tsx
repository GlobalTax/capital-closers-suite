import { EmpresasAsociadasCard } from "@/components/mandatos/EmpresasAsociadasCard";
import type { Mandato } from "@/types";

interface TargetsTabProps {
  mandato: Mandato;
  onRefresh: () => void;
}

export function TargetsTab({ mandato, onRefresh }: TargetsTabProps) {
  return (
    <div className="space-y-6">
      <EmpresasAsociadasCard
        empresas={mandato.empresas || []}
        onAddEmpresa={onRefresh}
      />
    </div>
  );
}
