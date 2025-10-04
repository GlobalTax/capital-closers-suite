import { useState } from "react";
import { PageHeader } from "@/components/shared/PageHeader";
import { DataTable } from "@/components/shared/DataTable";
import { Badge } from "@/components/ui/badge";
import { FileText, Download } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Documentos() {
  const [documentos] = useState([
    {
      nombre: "Contrato_TechCorp_2024.pdf",
      tipo: "Contrato",
      mandato: "M-001",
      fecha: "2024-01-15",
      tamano: "2.3 MB",
    },
    {
      nombre: "DD_Report_InnovateLab.xlsx",
      tipo: "Due Diligence",
      mandato: "M-002",
      fecha: "2024-01-20",
      tamano: "5.1 MB",
    },
    {
      nombre: "Valuation_DataStream.pdf",
      tipo: "Valoración",
      mandato: "M-003",
      fecha: "2024-01-18",
      tamano: "1.8 MB",
    },
  ]);

  const columns = [
    {
      key: "nombre",
      label: "Documento",
      render: (value: string) => (
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded bg-primary/10 flex items-center justify-center">
            <FileText className="w-4 h-4 text-primary" />
          </div>
          <span className="font-medium">{value}</span>
        </div>
      ),
    },
    {
      key: "tipo",
      label: "Tipo",
      render: (value: string) => <Badge variant="outline">{value}</Badge>,
    },
    { key: "mandato", label: "Mandato" },
    { key: "fecha", label: "Fecha Subida" },
    { key: "tamano", label: "Tamaño" },
    {
      key: "acciones",
      label: "Acciones",
      render: () => (
        <Button variant="ghost" size="sm">
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
        description="Repositorio de documentos y archivos"
        actionLabel="Subir Documento"
        onAction={() => console.log("Subir documento")}
      />
      <DataTable columns={columns} data={documentos} />
    </div>
  );
}
