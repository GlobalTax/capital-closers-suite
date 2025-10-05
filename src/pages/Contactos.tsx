import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { PageHeader } from "@/components/shared/PageHeader";
import { DataTableEnhanced } from "@/components/shared/DataTableEnhanced";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { fetchContactos } from "@/services/contactos";
import type { Contacto } from "@/types";
import { toast } from "sonner";
import { NuevoContactoDrawer } from "@/components/contactos/NuevoContactoDrawer";

export default function Contactos() {
  const navigate = useNavigate();
  const [contactos, setContactos] = useState<Contacto[]>([]);
  const [loading, setLoading] = useState(true);
  const [drawerOpen, setDrawerOpen] = useState(false);

  useEffect(() => {
    cargarContactos();
  }, []);

  const cargarContactos = async () => {
    setLoading(true);
    try {
      const data = await fetchContactos();
      setContactos(data);
    } catch (error) {
      console.error("Error cargando contactos:", error);
      toast.error("Error al cargar los contactos");
    } finally {
      setLoading(false);
    }
  };

  const columns = [
    {
      key: "nombre",
      label: "Contacto",
      sortable: true,
      filterable: true,
      render: (_value: string, row: Contacto) => (
        <div className="flex items-center gap-3">
          <Avatar className="w-8 h-8">
            <AvatarFallback className="bg-primary/10 text-primary text-xs">
              {row.nombre.split(" ").map((n) => n[0]).join("")}
            </AvatarFallback>
          </Avatar>
          <div>
            <p className="font-medium">{row.nombre} {row.apellidos || ""}</p>
            {row.cargo && <p className="text-xs text-muted-foreground">{row.cargo}</p>}
          </div>
        </div>
      ),
    },
    { 
      key: "empresa_principal", 
      label: "Empresa", 
      sortable: true, 
      filterable: true,
      render: (_value: any, row: Contacto) => row.empresa_principal?.nombre || "-"
    },
    { key: "email", label: "Email", filterable: true },
    { key: "telefono", label: "Teléfono" },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Contactos"
        description="Gestiona tus contactos"
        actionLabel="Nuevo Contacto"
        onAction={() => setDrawerOpen(true)}
      />
      <DataTableEnhanced
        columns={columns}
        data={contactos}
        loading={loading}
        onRowClick={(row) => navigate(`/contactos/${row.id}`)}
      />

      <NuevoContactoDrawer
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        onSuccess={cargarContactos}
      />
    </div>
  );
}
