import { useState } from "react";
import { PageHeader } from "@/components/shared/PageHeader";
import { DataTable } from "@/components/shared/DataTable";
import { Badge } from "@/components/ui/badge";

export default function Mandatos() {
  const [mandatos] = useState([
    {
      id: "M-001",
      empresa: "TechCorp Solutions",
      cliente: "María García",
      estado: "En progreso",
      valor: "€2.5M",
      fecha: "2024-01-15",
    },
    {
      id: "M-002",
      empresa: "InnovateLab",
      cliente: "Carlos Ruiz",
      estado: "Negociación",
      valor: "€1.8M",
      fecha: "2024-01-20",
    },
    {
      id: "M-003",
      empresa: "DataStream Inc",
      cliente: "Ana Martínez",
      estado: "Due Diligence",
      valor: "€3.2M",
      fecha: "2024-01-10",
    },
  ]);

  const columns = [
    { key: "id", label: "ID Mandato" },
    { key: "empresa", label: "Empresa" },
    { key: "cliente", label: "Cliente" },
    {
      key: "estado",
      label: "Estado",
      render: (value: string) => {
        const variants: Record<string, "default" | "secondary" | "outline"> = {
          "En progreso": "default",
          "Negociación": "secondary",
          "Due Diligence": "outline",
        };
        return <Badge variant={variants[value] || "default"}>{value}</Badge>;
      },
    },
    { key: "valor", label: "Valor Estimado" },
    { key: "fecha", label: "Fecha Inicio" },
  ];

  return (
    <div>
      <PageHeader
        title="Mandatos"
        description="Gestiona todos los mandatos de venta activos"
        actionLabel="Nuevo Mandato"
        onAction={() => console.log("Crear nuevo mandato")}
      />
      <DataTable
        columns={columns}
        data={mandatos}
        onRowClick={(row) => console.log("Detalles de:", row)}
      />
    </div>
  );
}
