import { useRef, useState } from "react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { 
  FileText, 
  Upload, 
  Download, 
  Trash2, 
  Loader2, 
  FileSpreadsheet,
  File,
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
  useCompanyDocumentsByCategory, 
  useUploadCompanyDocument, 
  useDeleteCompanyDocument,
  useDownloadCompanyDocument 
} from "@/hooks/queries/useCompanyDocuments";
import {
  type CompanyDocumentCategory,
  type CompanyDocument,
  CATEGORY_LABELS,
  ALLOWED_EXTENSIONS,
  validateFileForCategory,
} from "@/services/companyDocuments.service";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface CompanyDocumentCategorySectionProps {
  empresaId: string;
  category: CompanyDocumentCategory;
  icon?: React.ReactNode;
}

function getFileIcon(mimeType: string) {
  if (mimeType.includes('spreadsheet') || mimeType.includes('excel') || mimeType.includes('csv')) {
    return <FileSpreadsheet className="h-5 w-5 text-green-600" />;
  }
  if (mimeType.includes('presentation') || mimeType.includes('powerpoint')) {
    return <FileText className="h-5 w-5 text-orange-600" />;
  }
  if (mimeType.includes('pdf')) {
    return <FileText className="h-5 w-5 text-red-600" />;
  }
  if (mimeType.includes('word') || mimeType.includes('document')) {
    return <FileText className="h-5 w-5 text-blue-600" />;
  }
  return <File className="h-5 w-5 text-muted-foreground" />;
}

function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

export function CompanyDocumentCategorySection({ 
  empresaId, 
  category,
  icon 
}: CompanyDocumentCategorySectionProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploadingFiles, setUploadingFiles] = useState<Set<string>>(new Set());
  const [deleteDialog, setDeleteDialog] = useState<CompanyDocument | null>(null);

  const { data: documents = [], isLoading, refetch } = useCompanyDocumentsByCategory(empresaId, category);
  const uploadMutation = useUploadCompanyDocument();
  const deleteMutation = useDeleteCompanyDocument();
  const downloadMutation = useDownloadCompanyDocument();

  const allowedExts = ALLOWED_EXTENSIONS[category];
  const acceptString = allowedExts.join(',');

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    // Validar todos los archivos primero
    const validFiles: File[] = [];
    const invalidFiles: { name: string; error: string }[] = [];

    for (const file of files) {
      const validation = validateFileForCategory(file, category);
      if (validation.valid) {
        validFiles.push(file);
      } else {
        invalidFiles.push({ name: file.name, error: validation.error || 'Archivo inválido' });
      }
    }

    // Mostrar errores de archivos inválidos
    if (invalidFiles.length > 0) {
      invalidFiles.forEach(({ name, error }) => {
        toast.error(`${name}: ${error}`);
      });
    }

    // Subir archivos válidos
    if (validFiles.length > 0) {
      const newUploading = new Set(uploadingFiles);
      validFiles.forEach(f => newUploading.add(f.name));
      setUploadingFiles(newUploading);

      // Subir en paralelo con control de errores individuales
      const uploadPromises = validFiles.map(async (file) => {
        try {
          await uploadMutation.mutateAsync({
            empresaId,
            file,
            category,
          });
        } catch (error: any) {
          toast.error(`Error al subir ${file.name}: ${error.message}`);
        } finally {
          setUploadingFiles(prev => {
            const next = new Set(prev);
            next.delete(file.name);
            return next;
          });
        }
      });

      await Promise.allSettled(uploadPromises);
    }

    // Limpiar input
    if (inputRef.current) {
      inputRef.current.value = '';
    }
  };

  const handleDownload = (doc: CompanyDocument) => {
    if (!doc.documento) return;
    downloadMutation.mutate({
      storagePath: doc.documento.storage_path,
      fileName: doc.documento.file_name,
    });
  };

  const handleDelete = async () => {
    if (!deleteDialog?.documento) return;
    
    await deleteMutation.mutateAsync({
      empresaDocumentoId: deleteDialog.id,
      documentoId: deleteDialog.documento.id,
      storagePath: deleteDialog.documento.storage_path,
      empresaId,
      category,
    });
    
    setDeleteDialog(null);
  };

  const isUploading = uploadingFiles.size > 0;

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            {icon || <FileText className="h-5 w-5" />}
            {CATEGORY_LABELS[category]}
            <Badge variant="secondary" className="ml-2">
              {documents.length}
            </Badge>
          </CardTitle>
          <div className="flex items-center gap-2">
            <input
              ref={inputRef}
              type="file"
              multiple
              accept={acceptString}
              onChange={handleFileSelect}
              className="hidden"
              id={`upload-${category}`}
            />
            <Button
              size="sm"
              variant="outline"
              onClick={() => inputRef.current?.click()}
              disabled={isUploading}
            >
              {isUploading ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Upload className="h-4 w-4 mr-2" />
              )}
              {isUploading ? `Subiendo ${uploadingFiles.size}...` : 'Subir archivos'}
            </Button>
          </div>
        </div>
        <p className="text-xs text-muted-foreground mt-1">
          Formatos permitidos: {allowedExts.join(', ')}
        </p>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : documents.length === 0 ? (
          <div className="text-center py-8 border-2 border-dashed rounded-lg">
            <FileText className="h-10 w-10 mx-auto text-muted-foreground mb-2" />
            <p className="text-sm text-muted-foreground">
              No hay documentos en esta categoría
            </p>
            <Button
              variant="ghost"
              size="sm"
              className="mt-2"
              onClick={() => inputRef.current?.click()}
            >
              <Upload className="h-4 w-4 mr-2" />
              Subir primer documento
            </Button>
          </div>
        ) : (
          <div className="space-y-2">
            {documents.map((doc) => (
              <div
                key={doc.id}
                className={cn(
                  "flex items-center justify-between p-3 border rounded-lg hover:bg-accent/50 transition-colors",
                  downloadMutation.isPending && "opacity-50"
                )}
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  {doc.documento && getFileIcon(doc.documento.mime_type)}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">
                      {doc.documento?.file_name || 'Documento'}
                    </p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span>
                        {format(new Date(doc.fecha_compartido), "d MMM yyyy, HH:mm", { locale: es })}
                      </span>
                      {doc.documento?.file_size_bytes && (
                        <>
                          <span>•</span>
                          <span>{formatFileSize(doc.documento.file_size_bytes)}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => handleDownload(doc)}
                    disabled={downloadMutation.isPending || !doc.documento}
                    title="Descargar"
                  >
                    <Download className="h-4 w-4" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => setDeleteDialog(doc)}
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

      {/* Delete confirmation dialog */}
      <AlertDialog open={!!deleteDialog} onOpenChange={() => setDeleteDialog(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-destructive" />
              ¿Eliminar documento?
            </AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. El documento{' '}
              <strong>{deleteDialog?.documento?.file_name}</strong> será eliminado permanentemente.
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
    </Card>
  );
}
