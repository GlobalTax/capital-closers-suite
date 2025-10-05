import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Mail, Linkedin, Building2, Edit, Trash2, Briefcase, Phone, MessageCircle, Clock, Banknote, TrendingUp, Activity, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getContactoById, deleteContacto, getContactoMandatos } from "@/services/contactos";
import { fetchInteraccionesByContacto, type Interaccion } from "@/services/interacciones";
import { getContactoDocumentos } from "@/services/documentos";
import type { Contacto, Mandato } from "@/types";
import { TimelineActividad } from "@/components/shared/TimelineActividad";
import { NuevaInteraccionDialog } from "@/components/shared/NuevaInteraccionDialog";
import { toast } from "sonner";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { EditarContactoDrawer } from "@/components/contactos/EditarContactoDrawer";
import { BadgeStatus } from "@/components/shared/BadgeStatus";
import { format } from "date-fns";
import { es } from "date-fns/locale";

export default function ContactoDetalle() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [contacto, setContacto] = useState<Contacto | null>(null);
  const [mandatos, setMandatos] = useState<Mandato[]>([]);
  const [interacciones, setInteracciones] = useState<Interaccion[]>([]);
  const [documentos, setDocumentos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editDrawerOpen, setEditDrawerOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const cargarDatos = async () => {
    if (!id) return;

    setLoading(true);
    try {
      const [contactoData, mandatosData, interaccionesData, documentosData] = await Promise.all([
        getContactoById(id),
        getContactoMandatos(id),
        fetchInteraccionesByContacto(id),
        getContactoDocumentos(id),
      ]);

      setContacto(contactoData);
      setMandatos(mandatosData || []);
      setInteracciones(interaccionesData || []);
      setDocumentos(documentosData || []);
    } catch (error) {
      console.error("Error cargando contacto:", error);
      toast.error("Error al cargar los datos del contacto");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarDatos();
  }, [id]);

  const handleDelete = async () => {
    if (!id) return;

    setDeleting(true);
    try {
      await deleteContacto(id);
      toast.success("Contacto eliminado correctamente");
      navigate("/contactos");
    } catch (error) {
      console.error("Error eliminando contacto:", error);
      toast.error("Error al eliminar el contacto");
    } finally {
      setDeleting(false);
      setDeleteDialogOpen(false);
    }
  };

  const getInitials = (nombre: string, apellidos?: string) => {
    const initials = `${nombre.charAt(0)}${apellidos?.charAt(0) || ""}`;
    return initials.toUpperCase();
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (!contacto) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <p className="text-muted-foreground">Contacto no encontrado</p>
        <Button variant="outline" onClick={() => navigate("/contactos")} className="mt-4">
          Volver a Contactos
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate("/contactos")}>
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div className="flex-1 flex items-start gap-4">
          <Avatar className="w-20 h-20">
            <AvatarImage src={contacto.avatar} />
            <AvatarFallback className="text-2xl">
              {getInitials(contacto.nombre, contacto.apellidos)}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <h1 className="text-3xl font-semibold">
              {contacto.nombre} {contacto.apellidos}
            </h1>
            {contacto.cargo && (
              <p className="text-muted-foreground mt-1 flex items-center gap-2">
                <Briefcase className="w-4 h-4" />
                {contacto.cargo}
                {contacto.empresa_principal && (
                  <>
                    <span>en</span>
                    <button
                      onClick={() => navigate(`/empresas/${contacto.empresa_principal?.id}`)}
                      className="text-primary hover:underline"
                    >
                      {contacto.empresa_principal.nombre}
                    </button>
                  </>
                )}
              </p>
            )}
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => setEditDrawerOpen(true)}>
            <Edit className="w-4 h-4 mr-2" />
            Editar
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setDeleteDialogOpen(true)}
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Eliminar
          </Button>
        </div>
      </div>

      {/* Botones de acción rápida mejorados */}
      <div className="flex flex-wrap gap-2">
        {contacto.email && (
          <Button variant="outline" asChild>
            <a href={`mailto:${contacto.email}`}>
              <Mail className="w-4 h-4 mr-2" />
              Email
            </a>
          </Button>
        )}
        {contacto.telefono && (
          <>
            <Button variant="outline" asChild>
              <a href={`tel:${contacto.telefono}`}>
                <Phone className="w-4 h-4 mr-2" />
                Llamar
              </a>
            </Button>
            <Button variant="outline" asChild>
              <a href={`https://wa.me/${contacto.telefono.replace(/\s/g, '')}`} target="_blank" rel="noopener noreferrer">
                <MessageCircle className="w-4 h-4 mr-2" />
                WhatsApp
              </a>
            </Button>
          </>
        )}
        {contacto.linkedin && (
          <Button variant="outline" asChild>
            <a href={contacto.linkedin} target="_blank" rel="noopener noreferrer">
              <Linkedin className="w-4 h-4 mr-2" />
              LinkedIn
            </a>
          </Button>
        )}
      </div>

      {/* Métricas rápidas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                <Briefcase className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Mandatos</p>
                <p className="text-2xl font-bold">{mandatos.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-secondary/10 flex items-center justify-center">
                <Clock className="h-5 w-5 text-secondary-foreground" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Última actividad</p>
                <p className="text-sm font-medium">
                  {contacto.updated_at 
                    ? format(new Date(contacto.updated_at), "d MMM yyyy", { locale: es })
                    : "Sin actividad"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-green-500/10 flex items-center justify-center">
                <Banknote className="h-5 w-5 text-green-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Valor en mandatos</p>
                <p className="text-2xl font-bold">
                  {mandatos.reduce((sum, m) => sum + (m.valor || 0), 0).toLocaleString("es-ES")} €
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="informacion" className="w-full">
        <TabsList>
          <TabsTrigger value="informacion">Información General</TabsTrigger>
          <TabsTrigger value="mandatos">
            Mandatos Relacionados ({mandatos.length})
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

        {/* Tab Información */}
        <TabsContent value="informacion" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Datos de Contacto</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-4">
              {contacto.email && (
                <div>
                  <p className="text-sm text-muted-foreground">Email</p>
                  <a
                    href={`mailto:${contacto.email}`}
                    className="font-medium text-primary hover:underline"
                  >
                    {contacto.email}
                  </a>
                </div>
              )}
              {contacto.telefono && (
                <div>
                  <p className="text-sm text-muted-foreground">Teléfono</p>
                  <a
                    href={`tel:${contacto.telefono}`}
                    className="font-medium text-primary hover:underline"
                  >
                    {contacto.telefono}
                  </a>
                </div>
              )}
              {contacto.cargo && (
                <div>
                  <p className="text-sm text-muted-foreground">Cargo</p>
                  <p className="font-medium">{contacto.cargo}</p>
                </div>
              )}
              {contacto.empresa_principal && (
                <div>
                  <p className="text-sm text-muted-foreground">Empresa</p>
                  <button
                    onClick={() => navigate(`/empresas/${contacto.empresa_principal?.id}`)}
                    className="font-medium text-primary hover:underline flex items-center gap-1"
                  >
                    <Building2 className="w-4 h-4" />
                    {contacto.empresa_principal.nombre}
                  </button>
                </div>
              )}
              {contacto.linkedin && (
                <div>
                  <p className="text-sm text-muted-foreground">LinkedIn</p>
                  <a
                    href={contacto.linkedin}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-medium text-primary hover:underline flex items-center gap-1"
                  >
                    <Linkedin className="w-4 h-4" />
                    Ver perfil
                  </a>
                </div>
              )}
            </CardContent>
          </Card>

          {contacto.notas && (
            <Card>
              <CardHeader>
                <CardTitle>Notas</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm whitespace-pre-wrap">{contacto.notas}</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Tab Mandatos mejorado */}
        <TabsContent value="mandatos">
          {mandatos.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <div className="flex flex-col items-center gap-3">
                  <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center">
                    <Briefcase className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <p className="text-muted-foreground">
                    Este contacto no está asociado a ningún mandato
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {mandatos.map((mandato) => {
                // Buscar el rol del contacto en este mandato
                const contactoRol = mandato.contactos?.find(mc => mc.contacto_id === id);
                
                return (
                  <Card
                    key={mandato.id}
                    className="cursor-pointer hover:border-primary transition-colors hover:shadow-md"
                    onClick={() => navigate(`/mandatos/${mandato.id}`)}
                  >
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <CardTitle className="text-xl">
                              {mandato.empresa_principal?.nombre || "Sin cliente"}
                            </CardTitle>
                            {contactoRol && (
                              <Badge variant="outline" className="text-xs">
                                {contactoRol.rol}
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground mt-1">
                            {mandato.descripcion}
                          </p>
                          {contactoRol?.notas && (
                            <p className="text-xs text-muted-foreground mt-2 italic">
                              📝 {contactoRol.notas}
                            </p>
                          )}
                        </div>
                        <div className="flex gap-2">
                          <Badge variant={mandato.tipo === "venta" ? "default" : "secondary"}>
                            {mandato.tipo === "venta" ? "🏷️ Venta" : "🛒 Compra"}
                          </Badge>
                          <BadgeStatus status={mandato.estado} type="mandato" />
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div className="flex items-center gap-2">
                          <Banknote className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <p className="text-muted-foreground text-xs">Valor Estimado</p>
                            <p className="font-semibold">
                              {mandato.valor?.toLocaleString("es-ES") || 0} €
                            </p>
                          </div>
                        </div>
                        
                        {mandato.empresa_principal?.sector && (
                          <div className="flex items-center gap-2">
                            <Building2 className="h-4 w-4 text-muted-foreground" />
                            <div>
                              <p className="text-muted-foreground text-xs">Sector</p>
                              <p className="font-medium">{mandato.empresa_principal.sector}</p>
                            </div>
                          </div>
                        )}
                        
                        {mandato.fecha_inicio && (
                          <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4 text-muted-foreground" />
                            <div>
                              <p className="text-muted-foreground text-xs">Inicio</p>
                              <p className="font-medium">
                                {format(new Date(mandato.fecha_inicio), "MMM yyyy", { locale: es })}
                              </p>
                            </div>
                          </div>
                        )}
                        
                        {mandato.prioridad && (
                          <div className="flex items-center gap-2">
                            <TrendingUp className="h-4 w-4 text-muted-foreground" />
                            <div>
                              <p className="text-muted-foreground text-xs">Prioridad</p>
                              <Badge 
                                variant={
                                  mandato.prioridad === "alta" ? "destructive" : 
                                  mandato.prioridad === "media" ? "default" : 
                                  "secondary"
                                }
                                className="text-xs"
                              >
                                {mandato.prioridad}
                              </Badge>
                            </div>
                          </div>
                        )}
                      </div>
                      
                      {/* Métricas adicionales si están disponibles */}
                      {(mandato.total_ingresos || mandato.total_gastos) && (
                        <div className="mt-4 pt-4 border-t grid grid-cols-3 gap-4 text-xs">
                          <div>
                            <p className="text-muted-foreground">Ingresos</p>
                            <p className="font-semibold text-green-600">
                              {mandato.total_ingresos?.toLocaleString("es-ES") || 0} €
                            </p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Gastos</p>
                            <p className="font-semibold text-red-600">
                              {mandato.total_gastos?.toLocaleString("es-ES") || 0} €
                            </p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Balance</p>
                            <p className="font-semibold">
                              {mandato.balance_neto?.toLocaleString("es-ES") || 0} €
                            </p>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        {/* Tab Actividad */}
        <TabsContent value="actividad">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Timeline de Actividad</CardTitle>
                <NuevaInteraccionDialog 
                  contactoId={id} 
                  onSuccess={cargarDatos}
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

      {/* Dialogs */}
      <ConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirmar={handleDelete}
        titulo="¿Eliminar contacto?"
        descripcion={`¿Estás seguro de que deseas eliminar a ${contacto.nombre} ${contacto.apellidos}? Esta acción no se puede deshacer.`}
        variant="destructive"
      />

      <EditarContactoDrawer
        open={editDrawerOpen}
        onOpenChange={setEditDrawerOpen}
        contacto={contacto}
        onSuccess={cargarDatos}
      />
    </div>
  );
}
