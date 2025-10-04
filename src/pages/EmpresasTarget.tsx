import { useState } from "react";
import { PageHeader } from "@/components/shared/PageHeader";
import { DataTable } from "@/components/shared/DataTable";
import { Badge } from "@/components/ui/badge";

export default function EmpresasTarget() {
  const [empresas] = useState([
    {
      nombre: "FutureTech SA",
      sector: "Tecnología",
      facturacion: "€5.2M",
      empleados: 45,
      ubicacion: "Madrid",
      interes: "Alto",
    },
    {
      nombre: "BioHealth Labs",
      sector: "Salud",
      facturacion: "€3.8M",
      empleados: 32,
      ubicacion: "Barcelona",
      interes: "Medio",
    },
    {
      nombre: "EcoEnergy Solutions",
      sector: "Energía",
      facturacion: "€7.1M",
      empleados: 68,
      ubicacion: "Valencia",
      interes: "Alto",
    },
  ]);

  const columns = [
    { key: "nombre", label: "Empresa" },
    { key: "sector", label: "Sector" },
    { key: "facturacion", label: "Facturación" },
    { key: "empleados", label: "Empleados" },
    { key: "ubicacion", label: "Ubicación" },
    {
      key: "interes",
      label: "Nivel de Interés",
      render: (value: string) => {
        const variants: Record<string, "default" | "secondary" | "outline"> = {
          Alto: "default",
          Medio: "secondary",
          Bajo: "outline",
        };
        return <Badge variant={variants[value] || "default"}>{value}</Badge>;
      },
    },
  ];

  return (
    <div>
      <PageHeader
        title="Empresas Target"
        description="Empresas objetivo para adquisición o inversión"
        actionLabel="Nueva Empresa"
        onAction={() => console.log("Crear nueva empresa target")}
      />
      <DataTable
        columns={columns}
        data={empresas}
        onRowClick={(row) => console.log("Detalles de:", row)}
      />
    </div>
  );
}
