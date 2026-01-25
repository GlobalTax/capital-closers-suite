import { useState, useEffect, useRef } from "react";
import { Download, FileText, Image as ImageIcon, FileSpreadsheet, Presentation, File, Loader2, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { formatFileSize, isPdf, isImage, isOfficeDocument, getPreviewType } from "@/lib/file-utils";
import { getSignedUrl } from "@/services/uploads";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { documentAccessLogService } from "@/services/documentAccessLog.service";
import { handleSignedUrlError, parseEdgeFunctionError } from "@/lib/signedUrlErrors";

export interface DocumentInfo {
  id?: string;
  file_name: string;
  mime_type: string;
  storage_path: string;
  file_size_bytes?: number;
  created_at?: string;
}

interface UnifiedDocumentViewerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  document: DocumentInfo | null;
  previewUrl?: string | null;
  onDownload?: () => void;
  isLoading?: boolean;
}

/**
 * Unified Document Viewer supporting PDFs, images, and Office documents.
 * - PDFs: rendered inline with <object>
 * - Images: rendered with <img>
 * - Office: rendered via Microsoft Office Online Viewer
 */
export function UnifiedDocumentViewer({
  open,
  onOpenChange,
  document,
  previewUrl: externalPreviewUrl,
  onDownload,
  isLoading = false,
}: UnifiedDocumentViewerProps) {
  const [internalUrl, setInternalUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const blobUrlRef = useRef<string | null>(null);

  // Cleanup blob URLs when component unmounts or URL changes
  useEffect(() => {
    return () => {
      if (blobUrlRef.current) {
        URL.revokeObjectURL(blobUrlRef.current);
        blobUrlRef.current = null;
      }
    };
  }, []);

  // Generate blob URL if not provided externally
  useEffect(() => {
    if (!open || !document?.storage_path) {
      // Cleanup when closing
      if (blobUrlRef.current) {
        URL.revokeObjectURL(blobUrlRef.current);
        blobUrlRef.current = null;
      }
      setInternalUrl(null);
      return;
    }

    if (externalPreviewUrl) {
      setInternalUrl(externalPreviewUrl);
      return;
    }

    const fetchUrl = async () => {
      // Cleanup previous blob URL
      if (blobUrlRef.current) {
        URL.revokeObjectURL(blobUrlRef.current);
        blobUrlRef.current = null;
      }
      
      setLoading(true);
      try {
        // Expiration param is ignored now (using .download())
        const expiration = isOfficeDocument(document.mime_type) ? 7200 : 3600;
        const url = await getSignedUrl(document.storage_path, expiration);
        
        // Track blob URL for cleanup
        if (url && url.startsWith('blob:')) {
          blobUrlRef.current = url;
        }
        
        setInternalUrl(url);
        
        // Log preview access when URL loads successfully
        if (url && document.id) {
          documentAccessLogService.logAccess(document.id, document.file_name, 'preview')
            .catch(err => console.error('[UnifiedDocumentViewer] Error logging access:', err));
        }
      } catch (error: any) {
        console.error("[UnifiedDocumentViewer] Error getting document URL:", error);
        handleSignedUrlError(parseEdgeFunctionError(error), 'UnifiedDocumentViewer');
        setInternalUrl(null);
      } finally {
        setLoading(false);
      }
    };

    fetchUrl();
  }, [open, document?.storage_path, externalPreviewUrl]);

  if (!document) return null;

  const previewUrl = externalPreviewUrl || internalUrl;
  const previewType = getPreviewType(document.mime_type);
  const showLoading = isLoading || loading;

  const getDocumentIcon = () => {
    if (isPdf(document.mime_type)) return <FileText className="w-5 h-5 text-destructive" />;
    if (isImage(document.mime_type)) return <ImageIcon className="w-5 h-5 text-primary" />;
    if (document.mime_type.includes('spreadsheet') || document.mime_type.includes('excel')) {
      return <FileSpreadsheet className="w-5 h-5 text-green-600" />;
    }
    if (document.mime_type.includes('presentation') || document.mime_type.includes('powerpoint')) {
      return <Presentation className="w-5 h-5 text-orange-500" />;
    }
    if (document.mime_type.includes('word') || document.mime_type.includes('document')) {
      return <FileText className="w-5 h-5 text-blue-600" />;
    }
    return <File className="w-5 h-5 text-muted-foreground" />;
  };

  const getOfficeViewerUrl = (signedUrl: string) => {
    const encodedUrl = encodeURIComponent(signedUrl);
    return `https://view.officeapps.live.com/op/view.aspx?src=${encodedUrl}`;
  };

  const renderPreview = () => {
    if (showLoading) {
      return (
        <div className="flex flex-col items-center justify-center h-full min-h-[400px] gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Cargando documento...</p>
        </div>
      );
    }

    if (!previewUrl) {
      return (
        <div className="flex flex-col items-center justify-center h-full min-h-[400px] gap-4 text-muted-foreground">
          <File className="w-16 h-16 opacity-50" />
          <p>No se pudo cargar la vista previa</p>
          {onDownload && (
            <Button onClick={onDownload} variant="outline">
              <Download className="w-4 h-4 mr-2" />
              Descargar para ver
            </Button>
          )}
        </div>
      );
    }

    switch (previewType) {
      case 'pdf':
        return (
          <div className="relative w-full h-full min-h-[500px]">
            <object
              data={previewUrl}
              type="application/pdf"
              className="w-full h-full min-h-[500px] rounded-lg"
            >
              {/* Fallback for browsers that don't support PDF preview */}
              <div className="flex flex-col items-center justify-center h-full min-h-[400px] gap-4 p-8 text-center">
                <FileText className="w-16 h-16 text-destructive opacity-50" />
                <p className="text-muted-foreground">
                  Tu navegador no soporta la visualización de PDFs.
                </p>
                {onDownload && (
                  <Button onClick={onDownload} variant="outline">
                    <Download className="w-4 h-4 mr-2" />
                    Descargar para ver
                  </Button>
                )}
              </div>
            </object>
          </div>
        );

      case 'image':
        return (
          <div className="flex items-center justify-center p-4 bg-muted/30 rounded-lg min-h-[400px]">
            <img
              src={previewUrl}
              alt={document.file_name}
              className="max-w-full max-h-[60vh] object-contain rounded-lg shadow-lg"
            />
          </div>
        );

      case 'office':
        return (
          <div className="relative w-full h-full min-h-[500px]">
            <iframe
              src={getOfficeViewerUrl(previewUrl)}
              className="w-full h-full min-h-[500px] rounded-lg border-0"
              title={document.file_name}
            />
            <div className="absolute bottom-2 right-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.open(getOfficeViewerUrl(previewUrl), '_blank')}
              >
                <ExternalLink className="w-4 h-4 mr-2" />
                Abrir en nueva pestaña
              </Button>
            </div>
          </div>
        );

      default:
        return (
          <div className="flex flex-col items-center justify-center h-full min-h-[400px] gap-4 text-muted-foreground p-8 text-center">
            <File className="w-16 h-16 opacity-50" />
            <div>
              <p className="font-medium">Vista previa no disponible</p>
              <p className="text-sm mt-1">
                Este tipo de archivo no se puede previsualizar directamente.
              </p>
            </div>
            {onDownload && (
              <Button onClick={onDownload} variant="outline">
                <Download className="w-4 h-4 mr-2" />
                Descargar archivo
              </Button>
            )}
          </div>
        );
    }
  };

  const handleOpenInNewTab = () => {
    if (previewUrl) {
      window.open(previewUrl, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[80vw] max-w-[80vw] h-[80vh] max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 pr-8">
            {getDocumentIcon()}
            <span className="truncate">{document.file_name}</span>
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-auto">
          {renderPreview()}
        </div>

        <DialogFooter className="flex-row justify-between items-center gap-4 sm:justify-between">
          <div className="text-sm text-muted-foreground flex flex-wrap gap-2">
            {document.file_size_bytes && (
              <span>{formatFileSize(document.file_size_bytes)}</span>
            )}
            {document.file_size_bytes && document.created_at && (
              <span>•</span>
            )}
            {document.created_at && (
              <span>
                {format(new Date(document.created_at), "d MMM yyyy", { locale: es })}
              </span>
            )}
          </div>
          <div className="flex gap-2">
            {previewUrl && (
              <Button variant="outline" onClick={handleOpenInNewTab}>
                <ExternalLink className="w-4 h-4 mr-2" />
                Abrir en pestaña
              </Button>
            )}
            {onDownload && (
              <Button variant="outline" onClick={onDownload}>
                <Download className="w-4 h-4 mr-2" />
                Descargar
              </Button>
            )}
            <Button variant="secondary" onClick={() => onOpenChange(false)}>
              Cerrar
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
