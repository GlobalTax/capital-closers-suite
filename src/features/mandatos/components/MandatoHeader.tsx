import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Edit, Trash2, FilePlus, MoreVertical } from "lucide-react";
import type { Mandato } from "@/types";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface MandatoHeaderProps {
  mandato: Mandato;
  onEdit?: () => void;
  onDelete?: () => void;
  onGenerateDocument?: () => void;
}

export function MandatoHeader({ mandato, onEdit, onDelete, onGenerateDocument }: MandatoHeaderProps) {
  const navigate = useNavigate();

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

  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate("/mandatos")}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-3xl font-medium">
              {mandato.empresa_principal?.nombre || "Mandato"}
            </h1>
            <Badge variant={getBadgeVariant(mandato.estado)}>
              {mandato.estado}
            </Badge>
            {priorityBadge && (
              <Badge variant={priorityBadge.variant}>
                {priorityBadge.label}
              </Badge>
            )}
          </div>
          <p className="text-muted-foreground">
            {mandato.tipo === "compra" ? "Mandato de Compra" : "Mandato de Venta"}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        {onGenerateDocument && (
          <Button variant="outline" onClick={onGenerateDocument}>
            <FilePlus className="mr-2 h-4 w-4" />
            Generar Documento
          </Button>
        )}
        {onEdit && (
          <Button variant="outline" onClick={onEdit}>
            <Edit className="mr-2 h-4 w-4" />
            Editar
          </Button>
        )}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="icon">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {onDelete && (
              <DropdownMenuItem onClick={onDelete} className="text-destructive">
                <Trash2 className="mr-2 h-4 w-4" />
                Eliminar
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
