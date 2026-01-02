import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { PageHeader } from "@/components/shared/PageHeader";
import { DataTableEnhanced } from "@/components/shared/DataTableEnhanced";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Download, Trash2, FileText, File, Image as ImageIcon } from "lucide-react";
import { UploadDialog } from "@/components/documentos/UploadDialog";
import { useDocumentosPaginated, useDeleteDocumento } from "@/hooks/queries/useDocumentos";
import { downloadFile } from "@/services/uploads";
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

  const documentos = result?.data || [];

  const handlePageChange = (newPage: number) => {
    setSearchParams({ page: newPage.toString() });
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
    if (mimeType.startsWith('image/')) return <ImageIcon className="w-4 h-4 text-primary" />;
    if (mimeType === 'application/pdf') return <FileText className="w-4 h-4 text-destructive" />;
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
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              handleDownload(row);
            }}
            disabled={downloading === row.id}
          >
            <Download className="w-4 h-4 mr-2" />
            {downloading === row.id ? 'Descargando...' : 'Descargar'}
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
