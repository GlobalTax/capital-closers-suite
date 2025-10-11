import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { EditarEmpresaDrawer } from "@/components/empresas/EditarEmpresaDrawer";
import { DataTableEnhanced } from "@/components/shared/DataTableEnhanced";
import { useEmpresa, useDeleteEmpresa } from "@/hooks/queries/useEmpresas";
import { useEmpresaMandatos, useEmpresaContactos } from "@/hooks/queries/useEmpresaMandatos";
import { useEmpresaInteracciones } from "@/hooks/queries/useInteracciones";
import { useEmpresaDocumentos } from "@/hooks/queries/useDocumentos";
import type { Mandato, Contacto } from "@/types";
import { Building2, MapPin, Users, DollarSign, TrendingUp, Globe, Trash2, Edit, FileText, User, Phone, Mail, Linkedin, Target, Clock, Briefcase, Activity, UserPlus } from "lucide-react";
import { TimelineActividad } from "@/components/shared/TimelineActividad";
import { NuevaInteraccionDialog } from "@/components/shared/NuevaInteraccionDialog";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Progress } from "@/components/ui/progress";

export default function EmpresaDetalle() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  // React Query hooks
  const { data: empresa, isLoading: loadingEmpresa, refetch: refetchEmpresa } = useEmpresa(id);
  const { data: mandatos = [], isLoading: loadingMandatos } = useEmpresaMandatos(id);
  const { data: contactos = [], isLoading: loadingContactos } = useEmpresaContactos(id);
  const { data: interacciones = [], isLoading: loadingInteracciones } = useEmpresaInteracciones(id);
  const { data: documentos = [], isLoading: loadingDocumentos } = useEmpresaDocumentos(id);
  
  const { mutate: deleteEmpresaMutation } = useDeleteEmpresa();
  
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editDrawerOpen, setEditDrawerOpen] = useState(false);
  
  const loading = loadingEmpresa || loadingMandatos || loadingContactos;

  const handleDelete = () => {
    if (!id) return;
    deleteEmpresaMutation(id, {
      onSuccess: () => {
        navigate("/empresas");
      }
    });
  };

  const handleEmpresaActualizada = () => {
    refetchEmpresa();
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

  const valorTotalMandatos = mandatos.reduce((sum, m) => sum + (m.valor || 0), 0);
  const mandatosActivos = mandatos.filter(m => m.estado === 'activo' || m.estado === 'en_negociacion');

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-3xl font-semibold text-foreground">{empresa.nombre}</h1>
              {empresa.es_target && (
                <Badge variant="default" className="text-sm">
                  🎯 Target {empresa.nivel_interes && `• ${empresa.nivel_interes} Interés`}
                </Badge>
              )}
            </div>
            <p className="text-muted-foreground mt-1">
              {empresa.sector + (empresa.subsector ? ` • ${empresa.subsector}` : "")}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          {empresa.sitio_web && (
            <Button variant="outline" size="sm" onClick={() => window.open(empresa.sitio_web, "_blank")}>
              <Globe className="h-4 w-4 mr-2" />
              Web
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

      {/* Quick Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Mandatos Activos</p>
                <p className="text-2xl font-bold">{mandatosActivos.length}</p>
                {valorTotalMandatos > 0 && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Total: €{(valorTotalMandatos / 1000000).toFixed(1)}M
                  </p>
                )}
              </div>
              <Briefcase className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Última Actividad</p>
                <p className="text-lg font-semibold">
                  {empresa.updated_at ? format(new Date(empresa.updated_at), "dd MMM yyyy", { locale: es }) : "-"}
                </p>
              </div>
              <Clock className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Valor en Mandatos</p>
                <p className="text-2xl font-bold">
                  {valorTotalMandatos > 0 ? `€${(valorTotalMandatos / 1000000).toFixed(1)}M` : "-"}
                </p>
              </div>
              <TrendingUp className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
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
        <TabsList className="grid grid-cols-6 w-full">
          <TabsTrigger value="general">
            <Building2 className="h-4 w-4 mr-2" />
            General
          </TabsTrigger>
          <TabsTrigger value="financiero">
            <DollarSign className="h-4 w-4 mr-2" />
            Financiero
          </TabsTrigger>
          <TabsTrigger value="contactos">
            <User className="h-4 w-4 mr-2" />
            Contactos ({contactos.length})
          </TabsTrigger>
          <TabsTrigger value="mandatos">
            <Briefcase className="h-4 w-4 mr-2" />
            Mandatos ({mandatos.length})
          </TabsTrigger>
          <TabsTrigger value="actividad">
            <Activity className="h-4 w-4 mr-2" />
            Actividad ({interacciones.length})
          </TabsTrigger>
          <TabsTrigger value="documentos">
            <FileText className="h-4 w-4 mr-2" />
            Documentos ({documentos.length})
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
            <CardContent className="space-y-6">
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

              {/* Visualizaciones financieras */}
              {empresa.margen_ebitda && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium">Margen EBITDA</p>
                    <span className="text-sm font-semibold">{empresa.margen_ebitda.toFixed(1)}%</span>
                  </div>
                  <Progress 
                    value={Math.min(empresa.margen_ebitda, 100)} 
                    className="h-2"
                  />
                  <p className="text-xs text-muted-foreground">
                    {empresa.margen_ebitda > 20 ? "🟢 Excelente" : empresa.margen_ebitda > 10 ? "🟡 Bueno" : "🔴 Bajo"}
                  </p>
                </div>
              )}

              {empresa.ebitda && empresa.deuda && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium">Ratio Deuda/EBITDA</p>
                    <span className="text-sm font-semibold">
                      {(empresa.deuda / empresa.ebitda).toFixed(1)}x
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {(empresa.deuda / empresa.ebitda) < 3 
                      ? "🟢 Bajo endeudamiento" 
                      : (empresa.deuda / empresa.ebitda) < 5 
                      ? "🟡 Endeudamiento moderado" 
                      : "🔴 Alto endeudamiento"}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab Contactos */}
        <TabsContent value="contactos">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Contactos Asociados</CardTitle>
                <Button size="sm" onClick={() => navigate(`/contactos/nuevo?empresaId=${id}`)}>
                  <UserPlus className="h-4 w-4 mr-2" />
                  Añadir Contacto
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {contactos.length > 0 ? (
                <div className="space-y-2">
                  {contactos.map((contacto) => (
                    <div
                      key={contacto.id}
                      className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent cursor-pointer"
                      onClick={() => navigate(`/contactos/${contacto.id}`)}
                    >
                      <div className="flex items-center gap-4">
                        <div>
                          <p className="font-medium">{contacto.nombre} {contacto.apellidos}</p>
                          <p className="text-sm text-muted-foreground">{contacto.cargo}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {contacto.email && (
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={(e) => {
                              e.stopPropagation();
                              window.location.href = `mailto:${contacto.email}`;
                            }}
                          >
                            <Mail className="h-4 w-4" />
                          </Button>
                        )}
                        {contacto.telefono && (
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={(e) => {
                              e.stopPropagation();
                              window.location.href = `tel:${contacto.telefono}`;
                            }}
                          >
                            <Phone className="h-4 w-4" />
                          </Button>
                        )}
                        {contacto.linkedin && (
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={(e) => {
                              e.stopPropagation();
                              window.open(contacto.linkedin, '_blank');
                            }}
                          >
                            <Linkedin className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <User className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">No hay contactos asociados a esta empresa</p>
                </div>
              )}
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

        {/* Tab Actividad */}
        <TabsContent value="actividad">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Timeline de Actividad</CardTitle>
                <NuevaInteraccionDialog 
                  empresaId={id} 
                  onSuccess={() => {}}
                />
              </div>
            </CardHeader>
            <CardContent>
              <TimelineActividad interacciones={interacciones} />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab Documentos */}
        <TabsContent value="documentos">
          <Card>
            <CardHeader>
              <CardTitle>Documentos Compartidos</CardTitle>
            </CardHeader>
            <CardContent>
              {documentos.length > 0 ? (
                <div className="space-y-2">
                  {documentos.map((doc: any) => (
                    <div key={doc.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent">
                      <div className="flex items-center gap-3">
                        <FileText className="h-5 w-5 text-muted-foreground" />
                        <div>
                          <p className="font-medium">{doc.documento?.file_name || 'Documento'}</p>
                          <p className="text-xs text-muted-foreground">
                            Compartido {format(new Date(doc.fecha_compartido), "d MMM yyyy", { locale: es })}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">No hay documentos compartidos</p>
                </div>
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
