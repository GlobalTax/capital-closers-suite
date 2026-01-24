import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Edit, Trash2, FilePlus, MoreVertical, Target, Building2, Sparkles } from "lucide-react";
import type { Mandato } from "@/types";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { GenerateTasksDialog } from "@/components/mandatos/GenerateTasksDialog";
import { DeleteConfirmDialog } from "@/components/shared/DeleteConfirmDialog";

interface MandatoHeaderProps {
  mandato: Mandato;
  onEdit?: () => void;
  onDelete?: () => Promise<void>;
  onGenerateDocument?: () => void;
}

export function MandatoHeader({ mandato, onEdit, onDelete, onGenerateDocument }: MandatoHeaderProps) {
  const navigate = useNavigate();
  const [showGenerateTasks, setShowGenerateTasks] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const getBadgeVariant = (estado: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      prospecto: "secondary",
      activo: "default",
      en_negociacion: "outline",
      cerrado: "default",
      cancelado: "destructive",
    };
    return variants[estado] || "default";
  };

  const getPriorityBadge = (prioridad?: string) => {
    const badges: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
      urgente: { label: "🔴 Urgente", variant: "destructive" },
      alta: { label: "🟠 Alta", variant: "default" },
      media: { label: "🟡 Media", variant: "secondary" },
      baja: { label: "🟢 Baja", variant: "outline" },
    };
    return badges[prioridad || ""] || null;
  };

  const priorityBadge = getPriorityBadge(mandato.prioridad);
  const isBuySide = mandato.tipo === "compra";
  
  // Colores diferenciados por tipo
  const tipoBadgeClass = isBuySide
    ? "bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300 border-orange-300"
    : "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300 border-blue-300";

  const mandatoName = mandato.codigo || mandato.empresa_principal?.nombre || mandato.nombre_proyecto || "este mandato";

  const handleDeleteClick = () => {
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (onDelete) {
      await onDelete();
    }
  };

  return (
    <>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-3 md:gap-4 min-w-0">
          <Button variant="ghost" size="icon" onClick={() => navigate("/mandatos")} className="shrink-0 h-8 w-8 md:h-9 md:w-9">
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              {/* Icono diferenciado */}
              {isBuySide ? (
                <Target className="h-5 w-5 md:h-6 md:w-6 text-orange-500 shrink-0" />
              ) : (
                <Building2 className="h-5 w-5 md:h-6 md:w-6 text-blue-500 shrink-0" />
              )}
              <h1 className="text-xl md:text-3xl font-medium truncate">
                {mandato.empresa_principal?.nombre || mandato.cliente_externo || "Sin empresa"}
              </h1>
            </div>
            <div className="flex items-center gap-1.5 flex-wrap mt-1.5">
              {/* Badge de tipo */}
              <Badge className={cn("gap-1 text-xs", tipoBadgeClass)}>
                {isBuySide ? "Buy" : "Sell"}
              </Badge>
              <Badge variant={getBadgeVariant(mandato.estado)} className="text-xs">
                {mandato.estado}
              </Badge>
              {priorityBadge && (
                <Badge variant={priorityBadge.variant} className="text-xs">
                  {priorityBadge.label}
                </Badge>
              )}
            </div>
            {/* Nombre del proyecto */}
            {mandato.nombre_proyecto && (
              <p className="text-sm md:text-lg text-primary font-medium mt-1 truncate">
                {mandato.nombre_proyecto}
              </p>
            )}
            <p className="text-xs md:text-sm text-muted-foreground hidden sm:block">
              {isBuySide ? "Mandato de Compra (Buy-Side)" : "Mandato de Venta (Sell-Side)"}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 md:gap-2 shrink-0">
          <Button variant="outline" size="sm" onClick={() => setShowGenerateTasks(true)} className="h-8 px-2 md:px-3 text-xs md:text-sm">
            <Sparkles className="h-4 w-4" />
            <span className="hidden md:inline ml-1.5">Generar IA</span>
          </Button>
          {onGenerateDocument && (
            <Button variant="outline" size="sm" onClick={onGenerateDocument} className="h-8 px-2 md:px-3 text-xs md:text-sm">
              <FilePlus className="h-4 w-4" />
              <span className="hidden sm:inline ml-1.5">Doc</span>
            </Button>
          )}
          {onEdit && (
            <Button variant="outline" size="sm" onClick={onEdit} className="h-8 px-2 md:px-3 text-xs md:text-sm">
              <Edit className="h-4 w-4" />
              <span className="hidden sm:inline ml-1.5">Editar</span>
            </Button>
          )}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon" className="h-8 w-8">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="bg-background">
              {onDelete && (
                <DropdownMenuItem onClick={handleDeleteClick} className="text-destructive">
                  <Trash2 className="mr-2 h-4 w-4" />
                  Eliminar
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <GenerateTasksDialog
          open={showGenerateTasks}
          onOpenChange={setShowGenerateTasks}
          mandato={mandato}
        />
      </div>

      {onDelete && (
        <DeleteConfirmDialog
          open={deleteDialogOpen}
          onOpenChange={setDeleteDialogOpen}
          itemName={mandatoName}
          description="Se eliminarán todos los documentos, tareas y registros asociados a este mandato. Esta acción no se puede deshacer."
          onConfirm={handleConfirmDelete}
        />
      )}
    </>
  );
}
