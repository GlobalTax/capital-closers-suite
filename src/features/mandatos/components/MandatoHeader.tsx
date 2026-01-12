import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Edit, Trash2, FilePlus, MoreVertical, Target, Building2 } from "lucide-react";
import type { Mandato } from "@/types";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

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
  const isBuySide = mandato.tipo === "compra";
  
  // Colores diferenciados por tipo
  const tipoBadgeClass = isBuySide
    ? "bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300 border-orange-300"
    : "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300 border-blue-300";

  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate("/mandatos")}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            {/* Icono diferenciado */}
            {isBuySide ? (
              <Target className="h-6 w-6 text-orange-500" />
            ) : (
              <Building2 className="h-6 w-6 text-blue-500" />
            )}
            <h1 className="text-3xl font-medium">
              {mandato.empresa_principal?.nombre || "Mandato"}
            </h1>
            {/* Badge de tipo */}
            <Badge className={cn("gap-1", tipoBadgeClass)}>
              {isBuySide ? "Buy-Side" : "Sell-Side"}
            </Badge>
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
            {isBuySide ? "Mandato de Compra (Buy-Side)" : "Mandato de Venta (Sell-Side)"}
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
