import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Edit, Trash2 } from "lucide-react";
import type { Mandato } from "@/types";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreVertical } from "lucide-react";

interface MandatoHeaderProps {
  mandato: Mandato;
  onEdit?: () => void;
  onDelete?: () => void;
}

export function MandatoHeader({ mandato, onEdit, onDelete }: MandatoHeaderProps) {
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

  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate("/mandatos")}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-3xl font-bold">
              {mandato.empresa_principal?.nombre || "Mandato"}
            </h1>
            <Badge variant={getBadgeVariant(mandato.estado)}>
              {mandato.estado}
            </Badge>
          </div>
          <p className="text-muted-foreground">
            {mandato.tipo === "compra" ? "Mandato de Compra" : "Mandato de Venta"}
          </p>
        </div>
      </div>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="icon">
            <MoreVertical className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {onEdit && (
            <DropdownMenuItem onClick={onEdit}>
              <Edit className="mr-2 h-4 w-4" />
              Editar
            </DropdownMenuItem>
          )}
          {onDelete && (
            <DropdownMenuItem onClick={onDelete} className="text-destructive">
              <Trash2 className="mr-2 h-4 w-4" />
              Eliminar
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
