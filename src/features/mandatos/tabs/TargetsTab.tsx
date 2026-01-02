import { useState } from "react";
import { EmpresasAsociadasCard } from "@/components/mandatos/EmpresasAsociadasCard";
import { NuevoTargetDrawer } from "@/components/targets/NuevoTargetDrawer";
import { AsociarEmpresaDialog } from "@/components/empresas/AsociarEmpresaDialog";
import { Button } from "@/components/ui/button";
import { Plus, Search } from "lucide-react";
import type { Mandato } from "@/types";

interface TargetsTabProps {
  mandato: Mandato;
  onRefresh: () => void;
}

export function TargetsTab({ mandato, onRefresh }: TargetsTabProps) {
  const [nuevoTargetOpen, setNuevoTargetOpen] = useState(false);
  const [asociarEmpresaOpen, setAsociarEmpresaOpen] = useState(false);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Empresas Target</h3>
          <p className="text-sm text-muted-foreground">
            Gestiona las empresas objetivo asociadas a este mandato
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setAsociarEmpresaOpen(true)}>
            <Search className="w-4 h-4 mr-2" />
            Buscar Existente
          </Button>
          <Button onClick={() => setNuevoTargetOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Nuevo Target
          </Button>
        </div>
      </div>

      <EmpresasAsociadasCard
        empresas={mandato.empresas || []}
        onAddEmpresa={() => setNuevoTargetOpen(true)}
        mandatoId={mandato.id}
        onRefresh={onRefresh}
      />

      <NuevoTargetDrawer
        open={nuevoTargetOpen}
        onOpenChange={setNuevoTargetOpen}
        mandatoId={mandato.id}
        onSuccess={onRefresh}
      />

      <AsociarEmpresaDialog
        open={asociarEmpresaOpen}
        onOpenChange={setAsociarEmpresaOpen}
        mandatoId={mandato.id}
        onSuccess={onRefresh}
      />
    </div>
  );
}
