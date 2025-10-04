import { useState } from "react";
import { PageHeader } from "@/components/shared/PageHeader";
import { DataTable } from "@/components/shared/DataTable";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

export default function Clientes() {
  const [clientes] = useState([
    {
      nombre: "María García",
      empresa: "TechCorp Solutions",
      email: "maria@techcorp.com",
      telefono: "+34 600 123 456",
      mandatos: 2,
      estado: "Activo",
    },
    {
      nombre: "Carlos Ruiz",
      empresa: "InnovateLab",
      email: "carlos@innovatelab.com",
      telefono: "+34 600 234 567",
      mandatos: 1,
      estado: "Activo",
    },
    {
      nombre: "Ana Martínez",
      empresa: "DataStream Inc",
      email: "ana@datastream.com",
      telefono: "+34 600 345 678",
      mandatos: 3,
      estado: "Activo",
    },
  ]);

  const columns = [
    {
      key: "nombre",
      label: "Cliente",
      render: (value: string) => (
        <div className="flex items-center gap-3">
          <Avatar className="w-8 h-8">
            <AvatarFallback className="bg-primary/10 text-primary text-xs">
              {value
                .split(" ")
                .map((n) => n[0])
                .join("")}
            </AvatarFallback>
          </Avatar>
          <span className="font-medium">{value}</span>
        </div>
      ),
    },
    { key: "empresa", label: "Empresa" },
    { key: "email", label: "Email" },
    { key: "telefono", label: "Teléfono" },
    { key: "mandatos", label: "Mandatos Activos" },
  ];

  return (
    <div>
      <PageHeader
        title="Clientes"
        description="Base de datos de clientes y contactos"
        actionLabel="Nuevo Cliente"
        onAction={() => console.log("Crear nuevo cliente")}
      />
      <DataTable
        columns={columns}
        data={clientes}
        onRowClick={(row) => console.log("Detalles de:", row)}
      />
    </div>
  );
}
