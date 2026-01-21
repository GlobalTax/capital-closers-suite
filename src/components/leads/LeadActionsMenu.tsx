import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { MoreHorizontal, Eye, Pencil, Phone, Trash2, Sparkles } from "lucide-react";

interface LeadActionsMenuProps {
  onView: () => void;
  onEdit?: () => void;
  onMarkContacted?: () => void;
  onEnrichApollo?: () => void;
  onDelete?: () => void;
}

export function LeadActionsMenu({ 
  onView, 
  onEdit, 
  onMarkContacted, 
  onEnrichApollo,
  onDelete 
}: LeadActionsMenuProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
          <MoreHorizontal className="h-4 w-4" />
          <span className="sr-only">Acciones</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuItem onClick={onView}>
          <Eye className="mr-2 h-4 w-4" />
          Ver detalle
        </DropdownMenuItem>
        {onEdit && (
          <DropdownMenuItem onClick={onEdit}>
            <Pencil className="mr-2 h-4 w-4" />
            Editar
          </DropdownMenuItem>
        )}
        {onMarkContacted && (
          <DropdownMenuItem onClick={onMarkContacted}>
            <Phone className="mr-2 h-4 w-4" />
            Marcar contactado
          </DropdownMenuItem>
        )}
        {onEnrichApollo && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={onEnrichApollo}>
              <Sparkles className="mr-2 h-4 w-4" />
              Enriquecer con Apollo
            </DropdownMenuItem>
          </>
        )}
        {onDelete && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={onDelete} className="text-destructive focus:text-destructive">
              <Trash2 className="mr-2 h-4 w-4" />
              Eliminar
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
