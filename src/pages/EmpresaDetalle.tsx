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
import { Building2, MapPin, Users, DollarSign, TrendingUp, Globe, Trash2, Edit, FileText, User, Phone, Mail, Linkedin, Target, Clock, Briefcase, Activity, UserPlus, BarChart3, Percent, Calculator } from "lucide-react";
import { TimelineActividad } from "@/components/shared/TimelineActividad";
import { NuevaInteraccionDialog } from "@/components/shared/NuevaInteraccionDialog";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Progress } from "@/components/ui/progress";
import { ColorfulFinancialKPI } from "@/components/empresas/ColorfulFinancialKPI";
import { EmpresaActionsPanel } from "@/components/empresas/EmpresaActionsPanel";
import { EmpresaBadge } from "@/components/empresas/EmpresaBadges";
import { FinancialAnalysisSection } from "@/components/empresas/FinancialAnalysisSection";
import { ValuationTab } from "@/components/empresas/ValuationTab";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb";

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
  const margenEbitda = empresa.revenue && empresa.ebitda ? (empresa.ebitda / empresa.revenue) * 100 : empresa.margen_ebitda;

  return (
    <div className="space-y-6">
      {/* Breadcrumb Navigation */}
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="/">Dashboard</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink href="/empresas">Empresas</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>{empresa.nombre}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      {/* Header with Icon and Badges */}
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-4">
          <div className="h-16 w-16 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0">
            <Building2 className="h-8 w-8 text-purple-600" />
          </div>
          <div>
            <div className="flex items-center gap-2 mb-2">
              <h1 className="text-3xl font-medium text-foreground">{empresa.nombre}</h1>
              {empresa.es_target && <EmpresaBadge variant="prioritaria" />}
              {empresa.potencial_search_fund && <EmpresaBadge variant="search_fund" />}
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              {empresa.ubicacion && (
                <>
                  <MapPin className="h-4 w-4" />
                  <span>{empresa.ubicacion}</span>
                  <span>•</span>
                </>
              )}
              {empresa.empleados && (
                <>
                  <Users className="h-4 w-4" />
                  <span>{empresa.empleados} empleados</span>
                  <span>•</span>
                </>
              )}
              {empresa.facturacion && (
                <>
                  <DollarSign className="h-4 w-4" />
                  <span>€{(empresa.facturacion / 1000000).toFixed(1)}M</span>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Layout: Main content + Sidebar */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-3 space-y-6">
          {/* Colorful Financial KPIs */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <ColorfulFinancialKPI
              label="Facturación"
              value={empresa.revenue ? `€${(empresa.revenue / 1000000).toFixed(1)}M` : empresa.facturacion ? `€${(empresa.facturacion / 1000000).toFixed(1)}M` : "-"}
              subtitle="Revenue anual"
              icon={TrendingUp}
              colorScheme="green"
            />
            <ColorfulFinancialKPI
              label="EBITDA"
              value={empresa.ebitda ? `€${(empresa.ebitda / 1000000).toFixed(1)}M` : "-"}
              subtitle="Beneficio operativo"
              icon={BarChart3}
              colorScheme="purple"
            />
            <ColorfulFinancialKPI
              label="Empleados"
              value={empresa.empleados?.toString() || "-"}
              subtitle="Plantilla total"
              icon={Users}
              colorScheme="blue"
            />
            <ColorfulFinancialKPI
              label="Margen EBITDA"
              value={margenEbitda ? `${margenEbitda.toFixed(1)}%` : "-"}
              subtitle="Rentabilidad"
              icon={Percent}
              colorScheme="yellow"
            />
          </div>

          {/* Tabs Navigation */}
          <Tabs defaultValue="general" className="space-y-4">
            <TabsList className="grid grid-cols-7 w-full bg-muted/50">
              <TabsTrigger 
                value="general" 
                className="data-[state=active]:bg-background data-[state=active]:border-b-2 data-[state=active]:border-purple-600"
              >
                <Building2 className="h-5 w-5 mr-2" />
                General
              </TabsTrigger>
              <TabsTrigger 
                value="financiero"
                className="data-[state=active]:bg-background data-[state=active]:border-b-2 data-[state=active]:border-purple-600"
              >
                <DollarSign className="h-5 w-5 mr-2" />
                Financiero
              </TabsTrigger>
              <TabsTrigger 
                value="valoracion"
                className="data-[state=active]:bg-background data-[state=active]:border-b-2 data-[state=active]:border-purple-600"
              >
                <Calculator className="h-5 w-5 mr-2" />
                Valoración
              </TabsTrigger>
              <TabsTrigger 
                value="contactos"
                className="data-[state=active]:bg-background data-[state=active]:border-b-2 data-[state=active]:border-purple-600"
              >
                <User className="h-5 w-5 mr-2" />
                Contactos ({contactos.length})
              </TabsTrigger>
              <TabsTrigger 
                value="mandatos"
                className="data-[state=active]:bg-background data-[state=active]:border-b-2 data-[state=active]:border-purple-600"
              >
                <Briefcase className="h-5 w-5 mr-2" />
                Mandatos ({mandatos.length})
              </TabsTrigger>
              <TabsTrigger 
                value="actividad"
                className="data-[state=active]:bg-background data-[state=active]:border-b-2 data-[state=active]:border-purple-600"
              >
                <Activity className="h-5 w-5 mr-2" />
                Actividad ({interacciones.length})
              </TabsTrigger>
              <TabsTrigger 
                value="documentos"
                className="data-[state=active]:bg-background data-[state=active]:border-b-2 data-[state=active]:border-purple-600"
              >
                <FileText className="h-5 w-5 mr-2" />
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
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <TrendingUp className="h-5 w-5" />
                      Información Financiera Detallada
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
                          <p className="text-lg font-medium">€{(empresa.revenue / 1000000).toFixed(1)}M</p>
                        </div>
                      )}
                      {empresa.ebitda && (
                        <div>
                          <p className="text-sm text-muted-foreground flex items-center gap-2">
                            <TrendingUp className="h-4 w-4" />
                            EBITDA
                          </p>
                          <p className="text-lg font-medium">€{(empresa.ebitda / 1000000).toFixed(1)}M</p>
                        </div>
                      )}
                      {margenEbitda && (
                        <div>
                          <p className="text-sm text-muted-foreground flex items-center gap-2">
                            <TrendingUp className="h-4 w-4" />
                            Margen EBITDA
                          </p>
                          <p className="text-lg font-medium">{margenEbitda.toFixed(1)}%</p>
                        </div>
                      )}
                      {empresa.deuda && (
                        <div>
                          <p className="text-sm text-muted-foreground">Deuda</p>
                          <p className="text-lg font-medium">€{(empresa.deuda / 1000000).toFixed(1)}M</p>
                        </div>
                      )}
                      {empresa.capital_circulante && (
                        <div>
                          <p className="text-sm text-muted-foreground">Capital Circulante</p>
                          <p className="text-lg font-medium">€{(empresa.capital_circulante / 1000000).toFixed(1)}M</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>

                <FinancialAnalysisSection
                  revenue={empresa.revenue || empresa.facturacion}
                  ebitda={empresa.ebitda}
                  deuda={empresa.deuda}
                  margenEbitda={margenEbitda}
                />
              </div>
            </TabsContent>

            {/* Tab Valoración */}
            <TabsContent value="valoracion">
              <ValuationTab empresa={empresa} />
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
        </div>

        {/* Sidebar - Actions Panel */}
        <div className="lg:col-span-1">
          <EmpresaActionsPanel
            onEdit={() => setEditDrawerOpen(true)}
            onDelete={() => setDeleteDialogOpen(true)}
          />
        </div>
      </div>

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
