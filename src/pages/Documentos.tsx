import { useState, useEffect } from "react";
import { PageHeader } from "@/components/shared/PageHeader";
import { DataTableEnhanced } from "@/components/shared/DataTableEnhanced";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Download, Trash2, FileText, File, Image as ImageIcon } from "lucide-react";
import { UploadDialog } from "@/components/documentos/UploadDialog";
import { listUserFiles, getSignedUrl, deleteFile, downloadFile } from "@/services/uploads";
import type { Documento } from "@/types";
import { toast } from "sonner";

export default function Documentos() {
  const [documentos, setDocumentos] = useState<Documento[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<{ open: boolean; doc?: Documento }>({ open: false });
  const [downloading, setDownloading] = useState<string | null>(null);

  useEffect(() => {
    cargarDocumentos();
  }, []);

  const cargarDocumentos = async () => {
    setLoading(true);
    try {
      const data = await listUserFiles();
      setDocumentos(data);
    } catch (error) {
      console.error("Error cargando documentos:", error);
      toast.error("Error al cargar los documentos");
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async (doc: Documento) => {
    setDownloading(doc.id);
    try {
      await downloadFile(doc.storage_path, doc.file_name);
      toast.success(`Descargando ${doc.file_name}...`);
    } catch (error) {
      console.error("Error downloading file:", error);
      toast.error("Error al descargar el archivo");
    } finally {
      setDownloading(null);
    }
  };

  const handleDeleteClick = (doc: Documento) => {
    setDeleteConfirm({ open: true, doc });
  };

  const handleDeleteConfirm = async () => {
    const doc = deleteConfirm.doc;
    if (!doc) return;

    try {
      await deleteFile(doc.id, doc.storage_path);
      toast.success("Documento eliminado correctamente");
      cargarDocumentos();
    } catch (error) {
      console.error("Error deleting file:", error);
      toast.error("Error al eliminar el documento");
    } finally {
      setDeleteConfirm({ open: false });
    }
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
        pageSize={15}
      />

      <UploadDialog
        open={uploadDialogOpen}
        onOpenChange={setUploadDialogOpen}
        onSuccess={cargarDocumentos}
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
