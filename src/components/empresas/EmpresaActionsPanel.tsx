import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  Mail,
  Phone,
  Globe,
  Calendar,
  CheckSquare,
  Search,
  Edit,
  Trash2,
} from "lucide-react";

interface EmpresaActionsPanelProps {
  onEdit: () => void;
  onDelete: () => void;
}

export function EmpresaActionsPanel({ onEdit, onDelete }: EmpresaActionsPanelProps) {
  return (
    <Card className="sticky top-6">
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Acciones</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        <Button className="w-full justify-start gap-2 bg-purple-600 hover:bg-purple-700 text-white">
          <Mail className="h-4 w-4" />
          Contactar
        </Button>
        
        <Button variant="outline" className="w-full justify-start gap-2">
          <Phone className="h-4 w-4" />
          Llamar
        </Button>
        
        <Button variant="outline" className="w-full justify-start gap-2">
          <Globe className="h-4 w-4" />
          Visitar Website
        </Button>

        <Separator className="my-2" />
        
        <Button variant="outline" className="w-full justify-start gap-2">
          <Calendar className="h-4 w-4" />
          Agendar Reunión
        </Button>
        
        <Button variant="outline" className="w-full justify-start gap-2">
          <CheckSquare className="h-4 w-4" />
          Crear Tarea
        </Button>
        
        <Button variant="outline" className="w-full justify-start gap-2">
          <Search className="h-4 w-4" />
          Añadir a Búsqueda
        </Button>

        <Separator className="my-2" />
        
        <Button variant="outline" className="w-full justify-start gap-2" onClick={onEdit}>
          <Edit className="h-4 w-4" />
          Editar Empresa
        </Button>
        
        <Button variant="destructive" className="w-full justify-start gap-2" onClick={onDelete}>
          <Trash2 className="h-4 w-4" />
          Eliminar
        </Button>
      </CardContent>
    </Card>
  );
}
