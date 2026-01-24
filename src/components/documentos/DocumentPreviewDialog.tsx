import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Download, FileText, Image as ImageIcon, Loader2 } from "lucide-react";
import type { Documento } from "@/types";

interface DocumentPreviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  document: Documento | null;
  previewUrl: string | null;
  isLoading?: boolean;
  onDownload?: (doc: Documento) => void;
}

export function DocumentPreviewDialog({
  open,
  onOpenChange,
  document,
  previewUrl,
  isLoading = false,
  onDownload,
}: DocumentPreviewDialogProps) {
  if (!document) return null;

  const isPdf = document.mime_type === "application/pdf";
  const isImage = document.mime_type?.startsWith("image/");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 truncate">
            {isPdf ? (
              <FileText className="h-5 w-5 text-red-500 flex-shrink-0" />
            ) : isImage ? (
              <ImageIcon className="h-5 w-5 text-blue-500 flex-shrink-0" />
            ) : (
              <FileText className="h-5 w-5 text-muted-foreground flex-shrink-0" />
            )}
            <span className="truncate">{document.file_name}</span>
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 min-h-0 bg-muted/30 rounded-lg overflow-hidden">
          {isLoading ? (
            <div className="flex items-center justify-center h-full">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : previewUrl ? (
            isPdf ? (
              <object
                data={previewUrl}
                type="application/pdf"
                className="w-full h-full"
              >
                <div className="flex flex-col items-center justify-center h-full gap-4 p-8 text-center">
                  <FileText className="h-16 w-16 text-muted-foreground" />
                  <p className="text-muted-foreground">
                    Tu navegador no soporta la vista previa de PDF.
                  </p>
                  {onDownload && (
                    <Button onClick={() => onDownload(document)}>
                      <Download className="h-4 w-4 mr-2" />
                      Descargar para ver
                    </Button>
                  )}
                </div>
              </object>
            ) : isImage ? (
              <div className="flex items-center justify-center h-full p-4">
                <img
                  src={previewUrl}
                  alt={document.file_name}
                  className="max-w-full max-h-full object-contain rounded"
                />
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full gap-4 p-8 text-center">
                <FileText className="h-16 w-16 text-muted-foreground" />
                <p className="text-muted-foreground">
                  Este tipo de archivo no se puede previsualizar.
                </p>
                {onDownload && (
                  <Button onClick={() => onDownload(document)}>
                    <Download className="h-4 w-4 mr-2" />
                    Descargar archivo
                  </Button>
                )}
              </div>
            )
          ) : (
            <div className="flex items-center justify-center h-full">
              <p className="text-muted-foreground">No se pudo cargar la vista previa</p>
            </div>
          )}
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          {onDownload && (
            <Button variant="outline" onClick={() => onDownload(document)}>
              <Download className="h-4 w-4 mr-2" />
              Descargar
            </Button>
          )}
          <Button variant="default" onClick={() => onOpenChange(false)}>
            Cerrar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
