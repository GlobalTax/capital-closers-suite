import { useState } from "react";
import { MandatoChecklistTask } from "@/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Pencil, Trash2, ExternalLink, ChevronDown, Paperclip } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { TaskFilesTree } from "./TaskFilesTree";
import { useTaskFiles } from "@/hooks/useTaskFiles";

interface ChecklistTaskRowProps {
  task: MandatoChecklistTask;
  onEdit: (task: MandatoChecklistTask) => void;
  onDelete: (id: string) => void;
  onStatusChange: (id: string, newStatus: MandatoChecklistTask["estado"]) => void;
}

export function ChecklistTaskRow({ task, onEdit, onDelete, onStatusChange }: ChecklistTaskRowProps) {
  const [showFiles, setShowFiles] = useState(false);
  const { files, loading: filesLoading, uploading, uploadFile, deleteFile } = useTaskFiles(task.id);

  const getEstadoColor = (estado: MandatoChecklistTask["estado"]) => {
    switch (estado) {
      case "✅ Completa":
        return "bg-green-500/10 text-green-600 border-green-500/20";
      case "🔄 En curso":
        return "bg-yellow-500/10 text-yellow-600 border-yellow-500/20";
      default:
        return "bg-gray-500/10 text-gray-600 border-gray-500/20";
    }
  };

  const getResponsableColor = (responsable?: string) => {
    const colors: Record<string, string> = {
      "Dirección M&A": "bg-purple-500/10 text-purple-600",
      "Analista": "bg-blue-500/10 text-blue-600",
      "Asesor M&A": "bg-indigo-500/10 text-indigo-600",
      "Marketing": "bg-pink-500/10 text-pink-600",
      "Legal": "bg-red-500/10 text-red-600",
      "Research": "bg-cyan-500/10 text-cyan-600",
      "M&A Support": "bg-teal-500/10 text-teal-600",
    };
    return colors[responsable || ""] || "bg-gray-500/10 text-gray-600";
  };

  const getSistemaColor = (sistema?: string) => {
    const colors: Record<string, string> = {
      "Brevo": "bg-orange-500/10 text-orange-600",
      "CRM": "bg-blue-500/10 text-blue-600",
      "Lovable.dev": "bg-purple-500/10 text-purple-600",
      "DealSuite": "bg-green-500/10 text-green-600",
      "ARX": "bg-red-500/10 text-red-600",
      "Data Room": "bg-yellow-500/10 text-yellow-600",
      "Supabase": "bg-emerald-500/10 text-emerald-600",
    };
    return colors[sistema || ""] || "bg-gray-500/10 text-gray-600";
  };

  const isOverdue = task.fecha_limite && !task.fecha_completada && 
    new Date(task.fecha_limite) < new Date();

  return (
    <div className="border rounded-lg p-4 space-y-3 hover:bg-accent/50 transition-colors">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 space-y-2">
          <div className="flex items-center gap-2 flex-wrap">
            <h4 className="font-medium text-foreground">{task.tarea}</h4>
            <Badge className={getEstadoColor(task.estado)}>
              {task.estado}
            </Badge>
          </div>
          
          {task.descripcion && (
            <p className="text-sm text-muted-foreground">{task.descripcion}</p>
          )}

          <div className="flex flex-wrap gap-2">
            {task.responsable && (
              <Badge variant="outline" className={getResponsableColor(task.responsable)}>
                {task.responsable}
              </Badge>
            )}
            {task.sistema && (
              <Badge variant="outline" className={getSistemaColor(task.sistema)}>
                {task.sistema}
              </Badge>
            )}
            {task.fecha_limite && (
              <Badge 
                variant="outline" 
                className={isOverdue ? "border-red-500 text-red-600" : ""}
              >
                📅 {format(new Date(task.fecha_limite), "dd MMM yyyy", { locale: es })}
                {isOverdue && " (Vencida)"}
              </Badge>
            )}
          </div>

          {task.url_relacionada && (
            <a 
              href={task.url_relacionada} 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-sm text-primary hover:underline flex items-center gap-1"
            >
              <ExternalLink className="w-3 h-3" />
              Ver enlace relacionado
            </a>
          )}

          {task.notas && (
            <p className="text-xs text-muted-foreground italic mt-2">
              📝 {task.notas}
            </p>
          )}
        </div>

        <div className="flex gap-1">
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => onEdit(task)}
          >
            <Pencil className="w-4 h-4" />
          </Button>
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => onDelete(task.id)}
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {task.estado !== "✅ Completa" && (
        <div className="flex gap-2">
          <Button 
            size="sm" 
            variant="outline"
            onClick={() => onStatusChange(task.id, "🔄 En curso")}
            disabled={task.estado === "🔄 En curso"}
          >
            Marcar en curso
          </Button>
          <Button 
            size="sm" 
            variant="default"
            onClick={() => onStatusChange(task.id, "✅ Completa")}
          >
            Marcar completada
          </Button>
        </div>
      )}

      {/* Sección de archivos */}
      <div className="mt-3 border-t pt-3">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowFiles(!showFiles)}
          className="w-full justify-between hover:bg-accent/50"
        >
          <span className="flex items-center gap-2">
            <Paperclip className="w-4 h-4" />
            Archivos adjuntos ({files.length})
          </span>
          <ChevronDown className={cn("w-4 h-4 transition-transform", showFiles && "rotate-180")} />
        </Button>

        {showFiles && (
          <TaskFilesTree
            taskId={task.id}
            files={files}
            onFileUpload={uploadFile}
            onFileDelete={deleteFile}
            loading={filesLoading}
            uploading={uploading}
          />
        )}
      </div>
    </div>
  );
}
