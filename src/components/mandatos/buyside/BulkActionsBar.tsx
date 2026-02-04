import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Archive, X } from "lucide-react";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";

interface BulkActionsBarProps {
  selectedCount: number;
  onClearSelection: () => void;
  onArchive: () => void;
  isArchiving?: boolean;
}

export function BulkActionsBar({
  selectedCount,
  onClearSelection,
  onArchive,
  isArchiving = false,
}: BulkActionsBarProps) {
  const [confirmOpen, setConfirmOpen] = useState(false);

  if (selectedCount === 0) return null;

  return (
    <>
      <div className="flex items-center gap-3 px-4 py-2.5 bg-primary/10 border border-primary/20 rounded-lg animate-in slide-in-from-top-2 duration-200">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-primary">
            {selectedCount} target{selectedCount > 1 ? "s" : ""} seleccionado{selectedCount > 1 ? "s" : ""}
          </span>
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0 text-muted-foreground hover:text-foreground"
            onClick={onClearSelection}
          >
            <X className="h-3.5 w-3.5" />
          </Button>
        </div>

        <div className="h-4 w-px bg-border" />

        <Button
          variant="outline"
          size="sm"
          className="h-7 text-amber-600 hover:text-amber-700 hover:bg-amber-50 border-amber-200"
          onClick={() => setConfirmOpen(true)}
          disabled={isArchiving}
        >
          <Archive className="h-3.5 w-3.5 mr-1.5" />
          Archivar
        </Button>
      </div>

      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        titulo={`¿Archivar ${selectedCount} target${selectedCount > 1 ? "s" : ""}?`}
        descripcion={`${selectedCount > 1 ? "Los targets seleccionados serán excluidos" : "El target seleccionado será excluido"} de los KPIs activos y del Kanban. Podrás restaurarlos más tarde desde la vista de archivados.`}
        onConfirmar={() => {
          onArchive();
          setConfirmOpen(false);
        }}
        textoConfirmar="Archivar"
        textoCancelar="Cancelar"
      />
    </>
  );
}
