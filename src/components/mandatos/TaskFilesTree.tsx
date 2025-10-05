import { useState } from "react";
import { Download, Trash2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { FileUploadDialog } from "./FileUploadDialog";
import type { MandatoChecklistTaskFile } from "@/types";
import { getFileIcon, formatFileSize } from "@/lib/file-utils";
import { downloadTaskFile } from "@/services/checklistFiles";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { toast } from "@/hooks/use-toast";

interface TaskFilesTreeProps {
  taskId: string;
  files: MandatoChecklistTaskFile[];
  onFileUpload: (file: File, description?: string, userId?: string) => Promise<void>;
  onFileDelete: (fileId: string, filePath: string) => Promise<void>;
  loading?: boolean;
  uploading?: boolean;
}

export function TaskFilesTree({
  taskId,
  files,
  onFileUpload,
  onFileDelete,
  loading = false,
  uploading = false
}: TaskFilesTreeProps) {
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<{
    open: boolean;
    fileId?: string;
    filePath?: string;
    fileName?: string;
  }>({ open: false });

  const handleDownload = async (file: MandatoChecklistTaskFile) => {
    try {
      const url = await downloadTaskFile(file.file_path);
      window.open(url, '_blank');
      
      toast({
        title: "Descargando archivo",
        description: `"${file.file_name}"`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo descargar el archivo",
        variant: "destructive",
      });
    }
  };

  const handleDeleteConfirm = () => {
    if (deleteConfirm.fileId && deleteConfirm.filePath) {
      onFileDelete(deleteConfirm.fileId, deleteConfirm.filePath);
      setDeleteConfirm({ open: false });
    }
  };

  if (loading) {
    return (
      <div className="space-y-2 mt-3">
        <Skeleton className="h-16 w-full" />
        <Skeleton className="h-16 w-full" />
      </div>
    );
  }

  return (
    <>
      <div className="mt-3 space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-muted-foreground">
            📁 Archivos adjuntos ({files.length})
          </span>
          <Button
            size="sm"
            variant="outline"
            onClick={() => setUploadDialogOpen(true)}
            disabled={uploading}
          >
            <Plus className="w-4 h-4 mr-1" />
            Adjuntar
          </Button>
        </div>

        {files.length === 0 ? (
          <div className="text-center py-6 border-2 border-dashed rounded-lg">
            <p className="text-sm text-muted-foreground">
              No hay archivos adjuntos
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {files.map((file) => {
              const FileIcon = getFileIcon(file.mime_type);
              
              return (
                <div
                  key={file.id}
                  className="flex items-center gap-3 p-3 border rounded-lg hover:bg-accent/50 transition-colors"
                >
                  <FileIcon className="w-5 h-5 text-primary flex-shrink-0" />
                  
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{file.file_name}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="secondary" className="text-xs">
                        {formatFileSize(file.file_size_bytes)}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {format(new Date(file.created_at), "dd MMM yyyy", { locale: es })}
                      </span>
                    </div>
                    {file.description && (
                      <p className="text-xs text-muted-foreground mt-1 italic">
                        {file.description}
                      </p>
                    )}
                  </div>

                  <div className="flex gap-1 flex-shrink-0">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleDownload(file)}
                      title="Descargar"
                    >
                      <Download className="w-4 h-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() =>
                        setDeleteConfirm({
                          open: true,
                          fileId: file.id,
                          filePath: file.file_path,
                          fileName: file.file_name
                        })
                      }
                      title="Eliminar"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <FileUploadDialog
        open={uploadDialogOpen}
        onOpenChange={setUploadDialogOpen}
        onUpload={onFileUpload}
        uploading={uploading}
      />

      <ConfirmDialog
        open={deleteConfirm.open}
        onOpenChange={(open) => setDeleteConfirm({ open })}
        onConfirmar={handleDeleteConfirm}
        titulo="¿Eliminar archivo?"
        descripcion={`¿Estás seguro de que quieres eliminar "${deleteConfirm.fileName}"? Esta acción no se puede deshacer.`}
        variant="destructive"
      />
    </>
  );
}
