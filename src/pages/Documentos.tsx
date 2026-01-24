import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { PageHeader } from "@/components/shared/PageHeader";
import { DataTableEnhanced } from "@/components/shared/DataTableEnhanced";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Download, Trash2, FileText, File, Image as ImageIcon, Eye, Loader2, FileSpreadsheet, Presentation } from "lucide-react";
import { UploadDialog } from "@/components/documentos/UploadDialog";
import { UnifiedDocumentViewer } from "@/components/shared/UnifiedDocumentViewer";
import { useDocumentPreview } from "@/hooks/useDocumentPreview";
import { useDocumentosPaginated, useDeleteDocumento } from "@/hooks/queries/useDocumentos";
import { downloadFile } from "@/services/uploads";
import { isPreviewable, isPdf, isImage, isOfficeDocument } from "@/lib/file-utils";
import type { Documento } from "@/types";
import { handleError } from "@/lib/error-handler";
import { DEFAULT_PAGE_SIZE } from "@/types/pagination";

export default function Documentos() {
  const [searchParams, setSearchParams] = useSearchParams();
  const page = parseInt(searchParams.get('page') || '1', 10);
  
  const { data: result, isLoading: loading, refetch } = useDocumentosPaginated(page, DEFAULT_PAGE_SIZE);
  const { mutate: deleteDoc, isPending: isDeleting } = useDeleteDocumento();
  
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<{ open: boolean; doc?: Documento }>({ open: false });
  const [downloading, setDownloading] = useState<string | null>(null);
  
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

  const documentos = result?.data || [];

  const handlePageChange = (newPage: number) => {
    setSearchParams({ page: newPage.toString() });
  };

  const handlePreview = async (doc: Documento) => {
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

  const handleDownload = async (doc: Documento) => {
    setDownloading(doc.id);
    try {
      await downloadFile(doc.storage_path, doc.file_name);
    } catch (error) {
      handleError(error, "Error al descargar el archivo");
    } finally {
      setDownloading(null);
    }
  };

  const handleDeleteClick = (doc: Documento) => {
    setDeleteConfirm({ open: true, doc });
  };

  const handleDeleteConfirm = () => {
    const doc = deleteConfirm.doc;
    if (!doc) return;
    
    deleteDoc({ id: doc.id, storagePath: doc.storage_path }, {
      onSuccess: () => {
        setDeleteConfirm({ open: false });
      }
    });
  };

  const getFileIcon = (mimeType: string) => {
    if (isImage(mimeType)) return <ImageIcon className="w-4 h-4 text-primary" />;
    if (isPdf(mimeType)) return <FileText className="w-4 h-4 text-destructive" />;
    if (mimeType.includes('spreadsheet') || mimeType.includes('excel')) {
      return <FileSpreadsheet className="w-4 h-4 text-green-600" />;
    }
    if (mimeType.includes('presentation') || mimeType.includes('powerpoint')) {
      return <Presentation className="w-4 h-4 text-orange-500" />;
    }
    if (mimeType.includes('word') || mimeType.includes('document')) {
      return <FileText className="w-4 h-4 text-blue-600" />;
    }
    return <File className="w-4 h-4 text-muted-foreground" />;
  };

  const columns = [
    { 
      key: "file_name", 
      label: "Archivo", 
      sortable: true, 
      filterable: true,
      render: (_: any, row: Documento) => (
        <div className="flex items-center gap-2">
          {getFileIcon(row.mime_type)}
          <span className="font-medium">{row.file_name}</span>
        </div>
      )
    },
    {
      key: "tipo",
      label: "Tipo",
      sortable: true,
      render: (value: string) => (
        <Badge variant="outline" className="capitalize">
          {value}
        </Badge>
      ),
    },
    { 
      key: "file_size_bytes", 
      label: "Tamaño",
      sortable: true,
      render: (value: number) => {
        if (value < 1024) return value + " B";
        if (value < 1024 * 1024) return (value / 1024).toFixed(1) + " KB";
        return (value / (1024 * 1024)).toFixed(1) + " MB";
      }
    },
    { 
      key: "created_at", 
      label: "Fecha", 
      sortable: true,
      render: (value: string) => new Date(value).toLocaleDateString('es-ES', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      })
    },
    {
      key: "id",
      label: "Acciones",
      render: (_: any, row: Documento) => (
        <div className="flex items-center gap-1">
          {isPreviewable(row.mime_type) && (
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                handlePreview(row);
              }}
              disabled={loadingPreviewId === row.id}
            >
              {loadingPreviewId === row.id ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Eye className="w-4 h-4" />
              )}
              <span className="ml-1 hidden sm:inline">Ver</span>
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              handleDownload(row);
            }}
            disabled={downloading === row.id}
          >
            {downloading === row.id ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Download className="w-4 h-4" />
            )}
            <span className="ml-1 hidden sm:inline">
              {downloading === row.id ? 'Descargando...' : 'Descargar'}
            </span>
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              handleDeleteClick(row);
            }}
          >
            <Trash2 className="w-4 h-4 text-destructive" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Documentos"
        description="Gestión de documentos y archivos"
        actionLabel="Subir Documento"
        onAction={() => setUploadDialogOpen(true)}
      />
      
      <DataTableEnhanced
        columns={columns}
        data={documentos}
        loading={loading}
        pageSize={DEFAULT_PAGE_SIZE}
        serverPagination={{
          currentPage: page,
          totalPages: result?.totalPages || 1,
          totalCount: result?.count || 0,
          onPageChange: handlePageChange,
        }}
      />

      <UploadDialog
        open={uploadDialogOpen}
        onOpenChange={setUploadDialogOpen}
        onSuccess={() => refetch()}
      />

      {/* Unified Document Viewer */}
      <UnifiedDocumentViewer
        open={isPreviewOpen}
        onOpenChange={setPreviewOpen}
        document={previewDocument}
        previewUrl={previewUrl}
        isLoading={isPreviewLoading}
        onDownload={previewDocument ? () => handleDownload(previewDocument as Documento) : undefined}
      />

      <AlertDialog open={deleteConfirm.open} onOpenChange={(open) => setDeleteConfirm({ open })}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar documento?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. El archivo "{deleteConfirm.doc?.file_name}" 
              será eliminado permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirm} className="bg-destructive hover:bg-destructive/90">
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
