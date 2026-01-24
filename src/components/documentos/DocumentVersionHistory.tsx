import { useState } from "react";
import { History, Download, Clock, Eye, FileText, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { UnifiedDocumentViewer } from "@/components/shared/UnifiedDocumentViewer";
import { useDocumentPreview } from "@/hooks/useDocumentPreview";
import { useDocumentVersions } from "@/hooks/useDocumentFolders";
import { useDocumentStorage } from "@/hooks/useDocumentStorage";
import { isPreviewable } from "@/lib/file-utils";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import type { DocumentWithVersion } from "@/types/documents";

interface DocumentVersionHistoryProps {
  document: DocumentWithVersion;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function DocumentVersionHistory({
  document,
  open,
  onOpenChange,
}: DocumentVersionHistoryProps) {
  const { data: versions, isLoading } = useDocumentVersions(document.id);
  const { getSignedUrl } = useDocumentStorage();
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  // Preview with unified hook
  const {
    previewDocument,
    previewUrl,
    isPreviewLoading,
    isPreviewOpen,
    openPreview,
    setPreviewOpen,
  } = useDocumentPreview();
  const [loadingPreviewId, setLoadingPreviewId] = useState<string | null>(null);

  const handlePreview = async (version: DocumentWithVersion) => {
    setLoadingPreviewId(version.id);
    await openPreview({
      id: version.id,
      file_name: version.file_name,
      mime_type: version.mime_type,
      storage_path: version.storage_path,
      file_size_bytes: version.file_size_bytes,
      created_at: version.created_at,
    });
    setLoadingPreviewId(null);
  };

  const handleDownload = async (version: DocumentWithVersion) => {
    setDownloadingId(version.id);
    try {
      const url = await getSignedUrl(version.storage_path);
      if (url) {
        const link = window.document.createElement('a');
        link.href = url;
        link.download = version.file_name;
        link.target = '_blank';
        window.document.body.appendChild(link);
        link.click();
        window.document.body.removeChild(link);
      }
    } finally {
      setDownloadingId(null);
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <History className="w-5 h-5" />
              Historial de Versiones
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">
              {document.file_name}
            </p>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : versions && versions.length > 0 ? (
            <ScrollArea className="max-h-[400px]">
              <div className="space-y-3">
                {versions.map((version) => (
                  <div
                    key={version.id}
                    className="flex items-start gap-4 p-4 border border-border rounded-xl bg-card"
                  >
                    <div className="p-2 bg-primary/10 rounded-lg">
                      <FileText className="w-5 h-5 text-primary" />
                    </div>

                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">Versión {version.version}</span>
                        {version.is_latest_version && (
                          <Badge variant="default" className="text-xs">
                            Actual
                          </Badge>
                        )}
                      </div>

                      <p className="text-sm text-muted-foreground truncate">
                        {version.file_name}
                      </p>

                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {format(new Date(version.created_at), "dd MMM yyyy, HH:mm", { locale: es })}
                        </span>
                        <span>{formatFileSize(version.file_size_bytes)}</span>
                      </div>
                    </div>

                    <div className="flex gap-1">
                      {isPreviewable(version.mime_type) && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handlePreview(version)}
                          disabled={loadingPreviewId === version.id}
                          title="Ver"
                        >
                          {loadingPreviewId === version.id ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Eye className="w-4 h-4" />
                          )}
                        </Button>
                      )}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDownload(version)}
                        disabled={downloadingId === version.id}
                      >
                        {downloadingId === version.id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Download className="w-4 h-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <History className="w-10 h-10 mx-auto mb-2 opacity-50" />
              <p>No hay versiones anteriores</p>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Unified Document Viewer for version preview */}
      <UnifiedDocumentViewer
        open={isPreviewOpen}
        onOpenChange={setPreviewOpen}
        document={previewDocument}
        previewUrl={previewUrl}
        isLoading={isPreviewLoading}
        onDownload={previewDocument ? () => {
          const version = versions?.find(v => v.id === previewDocument.id);
          if (version) handleDownload(version);
        } : undefined}
      />
    </>
  );
}
