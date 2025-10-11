import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Clock,
  CheckSquare,
  Upload,
  Building2,
  Calendar,
  Activity,
  Edit,
  Trash2,
} from "lucide-react";

interface MandatoActionsPanelProps {
  onRegistrarTiempo: () => void;
  onCrearTarea: () => void;
  onSubirDocumento: () => void;
  onAñadirEmpresa: () => void;
  onProgramarReunion: () => void;
  onVerTimeline: () => void;
  onEditar: () => void;
  onEliminar: () => void;
}

export function MandatoActionsPanel({
  onRegistrarTiempo,
  onCrearTarea,
  onSubirDocumento,
  onAñadirEmpresa,
  onProgramarReunion,
  onVerTimeline,
  onEditar,
  onEliminar,
}: MandatoActionsPanelProps) {
  return (
    <Card className="sticky top-4 h-fit">
      <CardHeader>
        <CardTitle className="text-base">Acciones</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        <Button
          onClick={onRegistrarTiempo}
          className="w-full justify-start bg-purple-600 hover:bg-purple-700 text-white"
        >
          <Clock className="h-4 w-4 mr-2" />
          Registrar Tiempo
        </Button>

        <Button
          onClick={onCrearTarea}
          variant="outline"
          className="w-full justify-start"
        >
          <CheckSquare className="h-4 w-4 mr-2" />
          Crear Tarea
        </Button>

        <Button
          onClick={onSubirDocumento}
          variant="outline"
          className="w-full justify-start"
        >
          <Upload className="h-4 w-4 mr-2" />
          Subir Documento
        </Button>

        <Button
          onClick={onAñadirEmpresa}
          variant="outline"
          className="w-full justify-start"
        >
          <Building2 className="h-4 w-4 mr-2" />
          Añadir Empresa
        </Button>

        <Separator className="my-2" />

        <Button
          onClick={onProgramarReunion}
          variant="outline"
          className="w-full justify-start"
        >
          <Calendar className="h-4 w-4 mr-2" />
          Programar Reunión
        </Button>

        <Button
          onClick={onVerTimeline}
          variant="outline"
          className="w-full justify-start"
        >
          <Activity className="h-4 w-4 mr-2" />
          Ver Timeline
        </Button>

        <Separator className="my-2" />

        <Button
          onClick={onEditar}
          variant="outline"
          className="w-full justify-start"
        >
          <Edit className="h-4 w-4 mr-2" />
          Editar Mandato
        </Button>

        <Button
          onClick={onEliminar}
          variant="destructive"
          className="w-full justify-start"
        >
          <Trash2 className="h-4 w-4 mr-2" />
          Eliminar
        </Button>
      </CardContent>
    </Card>
  );
}
