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
    toast.success(`Descargando ${doc.nombre}...`);
  };

  const columns = [
    { key: "nombre", label: "Nombre", sortable: true, filterable: true },
    {
      key: "tipo",
      label: "Tipo",
      sortable: true,
      render: (value: string) => <Badge variant="outline">{value}</Badge>,
    },
    { key: "mandato", label: "Mandato", sortable: true, filterable: true },
    { key: "fecha", label: "Fecha", sortable: true },
    { key: "tamano", label: "Tamaño" },
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
