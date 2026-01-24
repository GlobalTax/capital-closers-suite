import { useState, useEffect } from "react";
import { Download, Trash2, FileText, Image as ImageIcon, File, Loader2, Eye, FileSpreadsheet, Presentation } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
import { Badge } from "@/components/ui/badge";
import { UnifiedDocumentViewer } from "@/components/shared/UnifiedDocumentViewer";
import { useDocumentPreview } from "@/hooks/useDocumentPreview";
import { useDocumentStorage, MandatoDocumento } from "@/hooks/useDocumentStorage";
import { isPreviewable, isPdf, isImage, isOfficeDocument } from "@/lib/file-utils";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface DocumentListProps {
  mandatoId: string;
  onUpdate?: () => void;
}

export function DocumentList({ mandatoId, onUpdate }: DocumentListProps) {
  const [documents, setDocuments] = useState<MandatoDocumento[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [documentToDelete, setDocumentToDelete] = useState<MandatoDocumento | null>(null);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  const { listDocuments, getSignedUrl, deleteDocument } = useDocumentStorage();
  
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

  const loadDocuments = async () => {
    setLoading(true);
    try {
      const docs = await listDocuments(mandatoId);
      setDocuments(docs);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDocuments();
  }, [mandatoId]);

  const handlePreview = async (doc: MandatoDocumento) => {
    setLoadingPreviewId(doc.id);
    await openPreview({
      id: doc.id,
      file_name: doc.file_name,
      mime_type: doc.mime_type,
      storage_path: doc.storage_path,
      file_size_bytes: doc.file_size_bytes,
      created_at: doc.created_at,
    });
    setLoadingPreviewId(null);
  };

  const handleDownload = async (doc: MandatoDocumento) => {
    setDownloadingId(doc.id);
    try {
      const signedUrl = await getSignedUrl(doc.storage_path);
      if (signedUrl) {
        const link = document.createElement('a');
        link.href = signedUrl;
        link.download = doc.file_name;
        link.target = '_blank';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
    } finally {
      setDownloadingId(null);
    }
  };

  const handleDeleteClick = (doc: MandatoDocumento) => {
    setDocumentToDelete(doc);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!documentToDelete) return;

    const success = await deleteDocument(documentToDelete.id, documentToDelete.storage_path);
    if (success) {
      await loadDocuments();
      onUpdate?.();
    }

    setDeleteDialogOpen(false);
    setDocumentToDelete(null);
  };

  const getFileIcon = (mimeType: string) => {
    if (isImage(mimeType)) return <ImageIcon className="w-5 h-5 text-primary" />;
    if (isPdf(mimeType)) return <FileText className="w-5 h-5 text-destructive" />;
    if (mimeType.includes('spreadsheet') || mimeType.includes('excel')) {
      return <FileSpreadsheet className="w-5 h-5 text-green-600" />;
    }
    if (mimeType.includes('presentation') || mimeType.includes('powerpoint')) {
      return <Presentation className="w-5 h-5 text-orange-500" />;
    }
    if (mimeType.includes('word') || mimeType.includes('document')) {
      return <FileText className="w-5 h-5 text-blue-600" />;
    }
    return <File className="w-5 h-5 text-muted-foreground" />;
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  };

  const getTipoColor = (tipo: string): "default" | "secondary" | "destructive" | "outline" => {
    switch (tipo) {
      case "Contrato": return "default";
      case "NDA": return "destructive";
      case "Due Diligence": return "secondary";
      case "Financiero": return "outline";
      default: return "outline";
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (documents.length === 0) {
    return (
      <div className="text-center p-12 border border-dashed border-border rounded-2xl">
        <FileText className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
        <p className="text-lg font-medium mb-2">No hay documentos</p>
        <p className="text-sm text-muted-foreground">
          Los documentos subidos aparecerán aquí
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="border border-border rounded-2xl overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12"></TableHead>
              <TableHead>Nombre</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Tamaño</TableHead>
              <TableHead>Fecha</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {documents.map((doc) => (
              <TableRow key={doc.id}>
                <TableCell>{getFileIcon(doc.mime_type)}</TableCell>
                <TableCell>
                  <div>
                    <p className="font-medium">{doc.file_name}</p>
                    {doc.descripcion && (
                      <p className="text-sm text-muted-foreground">{doc.descripcion}</p>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant={getTipoColor(doc.tipo)}>{doc.tipo}</Badge>
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {formatFileSize(doc.file_size_bytes)}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {format(new Date(doc.created_at), "dd MMM yyyy", { locale: es })}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-2">
                    {isPreviewable(doc.mime_type) && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handlePreview(doc)}
                        disabled={loadingPreviewId === doc.id}
                      >
                        {loadingPreviewId === doc.id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <>
                            <Eye className="w-4 h-4 mr-2" />
                            Ver
                          </>
                        )}
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDownload(doc)}
                      disabled={downloadingId === doc.id}
                    >
                      {downloadingId === doc.id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <>
                          <Download className="w-4 h-4 mr-2" />
                          Descargar
                        </>
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteClick(doc)}
                    >
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Unified Document Viewer */}
      <UnifiedDocumentViewer
        open={isPreviewOpen}
        onOpenChange={setPreviewOpen}
        document={previewDocument}
        previewUrl={previewUrl}
        isLoading={isPreviewLoading}
        onDownload={previewDocument ? () => {
          const doc = documents.find(d => d.id === previewDocument.id);
          if (doc) handleDownload(doc);
        } : undefined}
      />

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar documento?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. El documento "{documentToDelete?.file_name}" será
              eliminado permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirm} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
