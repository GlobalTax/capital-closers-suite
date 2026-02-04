import { useState } from "react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { 
  FileText, 
  Upload, 
  Download, 
  Trash2, 
  Loader2, 
  AlertCircle 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { 
  useModelosByCategory, 
  useDeleteModelo,
  useDownloadModelo 
} from "@/hooks/queries/useModelos";
import { ModeloUploadDialog } from "./ModeloUploadDialog";
import type { ModeloCategory, DocumentTemplate } from "@/types/documents";
import { MODELO_CATEGORY_LABELS } from "@/types/documents";
import { cn } from "@/lib/utils";

interface ModeloCategorySectionProps {
  category: ModeloCategory;
}

function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

export function ModeloCategorySection({ category }: ModeloCategorySectionProps) {
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState<DocumentTemplate | null>(null);

  const { data: modelos = [], isLoading } = useModelosByCategory(category);
  const deleteMutation = useDeleteModelo();
  const downloadMutation = useDownloadModelo();

  const handleDownload = (modelo: DocumentTemplate) => {
    if (!modelo.template_url || !modelo.file_name) return;
    downloadMutation.mutate({
      storagePath: modelo.template_url,
      fileName: modelo.file_name,
    });
  };

  const handleDelete = async () => {
    if (!deleteDialog) return;
    
    await deleteMutation.mutateAsync({
      id: deleteDialog.id,
      category,
    });
    
    setDeleteDialog(null);
  };

  return (
    <>
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-base">
              <FileText className="h-5 w-5" />
              {MODELO_CATEGORY_LABELS[category]}
              <Badge variant="secondary" className="ml-2">
                {modelos.length}
              </Badge>
            </CardTitle>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setUploadDialogOpen(true)}
            >
              <Upload className="h-4 w-4 mr-2" />
              Subir modelo
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : modelos.length === 0 ? (
            <div className="text-center py-8 border-2 border-dashed rounded-lg">
              <FileText className="h-10 w-10 mx-auto text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground">
                No hay modelos en esta categoría
              </p>
              <Button
                variant="ghost"
                size="sm"
                className="mt-2"
                onClick={() => setUploadDialogOpen(true)}
              >
                <Upload className="h-4 w-4 mr-2" />
                Subir primer modelo
              </Button>
            </div>
          ) : (
            <div className="space-y-2">
              {modelos.map((modelo) => (
                <div
                  key={modelo.id}
                  className={cn(
                    "flex items-center justify-between p-3 border rounded-lg hover:bg-accent/50 transition-colors",
                    downloadMutation.isPending && "opacity-50"
                  )}
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <FileText className="h-5 w-5 text-primary shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">
                        {modelo.name}
                      </p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span className="truncate">{modelo.file_name}</span>
                        {modelo.file_size_bytes && (
                          <>
                            <span>•</span>
                            <span>{formatFileSize(modelo.file_size_bytes)}</span>
                          </>
                        )}
                        <span>•</span>
                        <span>
                          {format(new Date(modelo.created_at), "d MMM yyyy", { locale: es })}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => handleDownload(modelo)}
                      disabled={downloadMutation.isPending || !modelo.template_url}
                      title="Descargar"
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => setDeleteDialog(modelo)}
                      disabled={deleteMutation.isPending}
                      className="text-destructive hover:text-destructive"
                      title="Eliminar"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Upload Dialog */}
      <ModeloUploadDialog
        open={uploadDialogOpen}
        onOpenChange={setUploadDialogOpen}
        category={category}
      />

      {/* Delete confirmation dialog */}
      <AlertDialog open={!!deleteDialog} onOpenChange={() => setDeleteDialog(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-destructive" />
              ¿Eliminar modelo?
            </AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. El modelo{' '}
              <strong>{deleteDialog?.name}</strong> será eliminado.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : null}
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
