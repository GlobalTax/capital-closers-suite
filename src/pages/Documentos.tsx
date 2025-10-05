import { useState, useEffect } from "react";
import { PageHeader } from "@/components/shared/PageHeader";
import { DataTableEnhanced } from "@/components/shared/DataTableEnhanced";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { fetchDocumentos } from "@/services/api";
import type { Documento } from "@/types";
import { toast } from "sonner";

export default function Documentos() {
  const [documentos, setDocumentos] = useState<Documento[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    cargarDocumentos();
  }, []);

  const cargarDocumentos = async () => {
    setLoading(true);
    try {
      const data = await fetchDocumentos();
      setDocumentos(data);
    } catch (error) {
      console.error("Error cargando documentos:", error);
      toast.error("Error al cargar los documentos");
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = (doc: Documento) => {
    toast.success(`Descargando ${doc.file_name}...`);
  };

  const columns = [
    { key: "file_name", label: "Nombre", sortable: true, filterable: true },
    {
      key: "tipo",
      label: "Tipo",
      sortable: true,
      render: (value: string) => <Badge variant="outline">{value}</Badge>,
    },
    { key: "mandato_id", label: "Mandato", sortable: true, filterable: true },
    { 
      key: "created_at", 
      label: "Fecha", 
      sortable: true,
      render: (value: string) => new Date(value).toLocaleDateString()
    },
    { 
      key: "file_size_bytes", 
      label: "Tamaño",
      render: (value: number) => {
        if (value < 1024) return value + " B";
        if (value < 1024 * 1024) return (value / 1024).toFixed(1) + " KB";
        return (value / (1024 * 1024)).toFixed(1) + " MB";
      }
    },
    {
      key: "id",
      label: "Acciones",
      render: (_: any, row: Documento) => (
        <Button
          variant="ghost"
          size="sm"
          onClick={(e) => {
            e.stopPropagation();
            handleDownload(row);
          }}
        >
          <Download className="w-4 h-4 mr-2" />
          Descargar
        </Button>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Documentos"
        description="Gestión de documentos y archivos"
        actionLabel="Subir Documento"
        onAction={() => toast.info("Función disponible próximamente")}
      />
      <DataTableEnhanced
        columns={columns}
        data={documentos}
        loading={loading}
        pageSize={15}
      />
    </div>
  );
}
