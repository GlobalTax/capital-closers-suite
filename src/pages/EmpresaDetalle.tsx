import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { EditarEmpresaDrawer } from "@/components/empresas/EditarEmpresaDrawer";
import { DataTableEnhanced } from "@/components/shared/DataTableEnhanced";
import { getEmpresaById, deleteEmpresa, getEmpresaMandatos } from "@/services/empresas";
import type { Empresa, Mandato } from "@/types";
import { Building2, MapPin, Users, DollarSign, TrendingUp, Globe, Trash2, Edit, FileText, User } from "lucide-react";

export default function EmpresaDetalle() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [empresa, setEmpresa] = useState<Empresa | null>(null);
  const [mandatos, setMandatos] = useState<Mandato[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editDrawerOpen, setEditDrawerOpen] = useState(false);

  useEffect(() => {
    if (id) {
      cargarEmpresa();
      cargarMandatos();
    }
  }, [id]);

  const cargarEmpresa = async () => {
    if (!id) return;
    setLoading(true);
    try {
      const data = await getEmpresaById(id);
      setEmpresa(data);
    } catch (error) {
      console.error("Error cargando empresa:", error);
      toast.error("Error al cargar la empresa");
    } finally {
      setLoading(false);
    }
  };

  const cargarMandatos = async () => {
    if (!id) return;
    try {
      const data = await getEmpresaMandatos(id);
      setMandatos(data);
    } catch (error) {
      console.error("Error cargando mandatos:", error);
    }
  };

  const handleDelete = async () => {
    if (!id) return;
    try {
      await deleteEmpresa(id);
      toast.success("Empresa eliminada correctamente");
      navigate("/empresas");
    } catch (error) {
      console.error("Error eliminando empresa:", error);
      toast.error("Error al eliminar la empresa");
    }
  };

  const handleEmpresaActualizada = () => {
    cargarEmpresa();
    setEditDrawerOpen(false);
  };

  const mandatosColumns = [
    {
      key: "tipo",
      label: "Tipo",
      render: (value: string) => (
        <Badge variant={value === "compra" ? "default" : "secondary"}>
          {value === "compra" ? "Compra" : "Venta"}
        </Badge>
      ),
    },
    {
      key: "estado",
      label: "Estado",
      render: (value: string) => {
        const estados: Record<string, string> = {
          prospecto: "outline",
          activo: "default",
          en_negociacion: "secondary",
          cerrado: "default",
          cancelado: "destructive",
        };
        return <Badge variant={estados[value] as any}>{value}</Badge>;
      },
    },
    {
      key: "valor",
      label: "Valor",
      render: (value: number) => value ? `€${(value / 1000000).toFixed(1)}M` : "-",
    },
    {
      key: "fecha_inicio",
      label: "Fecha Inicio",
      render: (value: string) => value ? new Date(value).toLocaleDateString() : "-",
    },
  ];

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (!empresa) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Empresa no encontrada</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-semibold text-foreground">{empresa.nombre}</h1>
          <p className="text-muted-foreground mt-1">
            {empresa.sector + (empresa.subsector ? ` • ${empresa.subsector}` : "")}
          </p>
        </div>
        <div className="flex gap-2">
          {empresa.sitio_web && (
            <Button variant="outline" size="sm" onClick={() => window.open(empresa.sitio_web, "_blank")}>
              <Globe className="h-4 w-4 mr-2" />
              Sitio Web
            </Button>
          )}
          <Button variant="outline" size="sm" onClick={() => setEditDrawerOpen(true)}>
            <Edit className="h-4 w-4 mr-2" />
            Editar
          </Button>
          <Button variant="destructive" size="sm" onClick={() => setDeleteDialogOpen(true)}>
            <Trash2 className="h-4 w-4 mr-2" />
            Eliminar
          </Button>
        </div>
      </div>

      {empresa.es_target && (
        <Card className="border-primary">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5 text-primary" />
                Empresa Target
              </CardTitle>
              {empresa.nivel_interes && (
                <Badge variant={
                  empresa.nivel_interes === "Alto" ? "destructive" :
                  empresa.nivel_interes === "Medio" ? "default" : "secondary"
                }>
                  {empresa.nivel_interes} Interés
                </Badge>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              {empresa.estado_target && (
                <div>
                  <p className="text-sm text-muted-foreground">Estado</p>
                  <p className="font-medium">{empresa.estado_target}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="general" className="space-y-4">
        <TabsList>
          <TabsTrigger value="general">
            <Building2 className="h-4 w-4 mr-2" />
            Información General
          </TabsTrigger>
          <TabsTrigger value="financiero">
            <DollarSign className="h-4 w-4 mr-2" />
            Datos Financieros
          </TabsTrigger>
          <TabsTrigger value="mandatos">
            <FileText className="h-4 w-4 mr-2" />
            Mandatos ({mandatos.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="general">
          <Card>
            <CardHeader>
              <CardTitle>Información General</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {empresa.cif && (
                  <div>
                    <p className="text-sm text-muted-foreground flex items-center gap-2">
                      <Building2 className="h-4 w-4" />
                      CIF
                    </p>
                    <p className="font-medium">{empresa.cif}</p>
                  </div>
                )}
                {empresa.ubicacion && (
                  <div>
                    <p className="text-sm text-muted-foreground flex items-center gap-2">
                      <MapPin className="h-4 w-4" />
                      Ubicación
                    </p>
                    <p className="font-medium">{empresa.ubicacion}</p>
                  </div>
                )}
                {empresa.empleados && (
                  <div>
                    <p className="text-sm text-muted-foreground flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      Empleados
                    </p>
                    <p className="font-medium">{empresa.empleados}</p>
                  </div>
                )}
                {empresa.facturacion && (
                  <div>
                    <p className="text-sm text-muted-foreground flex items-center gap-2">
                      <DollarSign className="h-4 w-4" />
                      Facturación
                    </p>
                    <p className="font-medium">€{(empresa.facturacion / 1000000).toFixed(1)}M</p>
                  </div>
                )}
              </div>
              {empresa.descripcion && (
                <div>
                  <p className="text-sm text-muted-foreground mb-2">Descripción</p>
                  <p className="text-sm">{empresa.descripcion}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="financiero">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Información Financiera
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {empresa.revenue && (
                  <div>
                    <p className="text-sm text-muted-foreground flex items-center gap-2">
                      <DollarSign className="h-4 w-4" />
                      Revenue
                    </p>
                    <p className="text-lg font-semibold">€{(empresa.revenue / 1000000).toFixed(1)}M</p>
                  </div>
                )}
                {empresa.ebitda && (
                  <div>
                    <p className="text-sm text-muted-foreground flex items-center gap-2">
                      <TrendingUp className="h-4 w-4" />
                      EBITDA
                    </p>
                    <p className="text-lg font-semibold">€{(empresa.ebitda / 1000000).toFixed(1)}M</p>
                  </div>
                )}
                {empresa.margen_ebitda && (
                  <div>
                    <p className="text-sm text-muted-foreground flex items-center gap-2">
                      <TrendingUp className="h-4 w-4" />
                      Margen EBITDA
                    </p>
                    <p className="text-lg font-semibold">{empresa.margen_ebitda.toFixed(1)}%</p>
                  </div>
                )}
                {empresa.deuda && (
                  <div>
                    <p className="text-sm text-muted-foreground">Deuda</p>
                    <p className="text-lg font-semibold">€{(empresa.deuda / 1000000).toFixed(1)}M</p>
                  </div>
                )}
                {empresa.capital_circulante && (
                  <div>
                    <p className="text-sm text-muted-foreground">Capital Circulante</p>
                    <p className="text-lg font-semibold">€{(empresa.capital_circulante / 1000000).toFixed(1)}M</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="mandatos">
          <Card>
            <CardHeader>
              <CardTitle>Mandatos Relacionados</CardTitle>
            </CardHeader>
            <CardContent>
              {mandatos.length > 0 ? (
                <DataTableEnhanced
                  columns={mandatosColumns}
                  data={mandatos}
                  onRowClick={(row) => navigate(`/mandatos/${row.id}`)}
                  pageSize={5}
                />
              ) : (
                <p className="text-muted-foreground text-center py-8">
                  No hay mandatos relacionados con esta empresa
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <ConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        titulo="¿Eliminar empresa?"
        descripcion="Esta acción no se puede deshacer. La empresa será eliminada permanentemente."
        onConfirmar={handleDelete}
        textoConfirmar="Eliminar"
        textoCancelar="Cancelar"
        variant="destructive"
      />

      {empresa && (
        <EditarEmpresaDrawer
          open={editDrawerOpen}
          onOpenChange={setEditDrawerOpen}
          empresa={empresa}
          onEmpresaActualizada={handleEmpresaActualizada}
        />
      )}
    </div>
  );
}
