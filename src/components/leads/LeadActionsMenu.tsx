import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { MoreHorizontal, Eye, Pencil, Phone, Video, Users, Clock, Trash2, Sparkles, UserCheck } from "lucide-react";

interface LeadActionsMenuProps {
  onView: () => void;
  onEdit?: () => void;
  onMarkContacted?: () => void;
  onEnrichApollo?: () => void;
  onDelete?: () => void;
  onLogCall?: () => void;
  onLogVideoCall?: () => void;
  onLogMeeting?: () => void;
  onConvertToClient?: () => void;
}

export function LeadActionsMenu({ 
  onView, 
  onEdit, 
  onMarkContacted, 
  onEnrichApollo,
  onDelete,
  onLogCall,
  onLogVideoCall,
  onLogMeeting,
  onConvertToClient,
}: LeadActionsMenuProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
          <MoreHorizontal className="h-4 w-4" />
          <span className="sr-only">Acciones</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-52">
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
        
        {/* Time tracking actions */}
        {(onLogCall || onLogVideoCall || onLogMeeting) && (
          <>
            <DropdownMenuSeparator />
            {onLogCall && (
              <DropdownMenuItem onClick={onLogCall}>
                <Phone className="mr-2 h-4 w-4 text-blue-500" />
                Registrar llamada
              </DropdownMenuItem>
            )}
            {onLogVideoCall && (
              <DropdownMenuItem onClick={onLogVideoCall}>
                <Video className="mr-2 h-4 w-4 text-purple-500" />
                Registrar videollamada
              </DropdownMenuItem>
            )}
            {onLogMeeting && (
              <DropdownMenuItem onClick={onLogMeeting}>
                <Users className="mr-2 h-4 w-4 text-orange-500" />
                Registrar reunión
              </DropdownMenuItem>
            )}
          </>
        )}
        
        {onMarkContacted && (
          <DropdownMenuItem onClick={onMarkContacted}>
            <Phone className="mr-2 h-4 w-4" />
            Marcar contactado
          </DropdownMenuItem>
        )}
        
        {onConvertToClient && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={onConvertToClient} className="text-green-600 focus:text-green-600">
              <UserCheck className="mr-2 h-4 w-4" />
              Convertir a cliente
            </DropdownMenuItem>
          </>
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
