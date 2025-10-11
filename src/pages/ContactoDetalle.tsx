import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Mail, Linkedin, Building2, Edit, Trash2, Briefcase, Phone, MessageCircle, Clock, Banknote, TrendingUp, Activity, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useContacto, useDeleteContacto } from "@/hooks/queries/useContactos";
import { useContactoMandatos } from "@/hooks/queries/useContactosMandatos";
import { useContactoInteracciones } from "@/hooks/queries/useInteracciones";
import { useContactoDocumentos } from "@/hooks/queries/useDocumentos";
import type { Contacto, Mandato } from "@/types";
import type { Interaccion } from "@/services/interacciones";
import { TimelineActividad } from "@/components/shared/TimelineActividad";
import { NuevaInteraccionDialog } from "@/components/shared/NuevaInteraccionDialog";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { EditarContactoDrawer } from "@/components/contactos/EditarContactoDrawer";
import { BadgeStatus } from "@/components/shared/BadgeStatus";
import { format } from "date-fns";
import { es } from "date-fns/locale";

export default function ContactoDetalle() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editDrawerOpen, setEditDrawerOpen] = useState(false);

  const { data: contacto, isLoading: loadingContacto } = useContacto(id);
  const { data: mandatos = [], isLoading: loadingMandatos } = useContactoMandatos(id);
  const { data: interacciones = [], isLoading: loadingInteracciones } = useContactoInteracciones(id);
  const { data: documentos = [], isLoading: loadingDocumentos } = useContactoDocumentos(id);
  const deleteMutation = useDeleteContacto();

  const loading = loadingContacto || loadingMandatos || loadingInteracciones || loadingDocumentos;

  const handleDelete = async () => {
    if (!id) return;
    try {
      await deleteMutation.mutateAsync(id);
      navigate("/contactos");
    } catch (error) {
      // Error ya manejado por el hook
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

  const valorTotalMandatos = mandatos.reduce((sum, m) => sum + (m.valor || 0), 0);
  const ultimaInteraccion = interacciones[0];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate("/contactos")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">{contacto.nombre} {contacto.apellidos}</h1>
            <p className="text-muted-foreground">
              {contacto.cargo && `${contacto.cargo} `}
              {contacto.empresa_principal && `en ${contacto.empresa_principal.nombre}`}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setEditDrawerOpen(true)}>
            <Edit className="h-4 w-4 mr-2" />
            Editar
          </Button>
          <Button variant="destructive" onClick={() => setDeleteDialogOpen(true)}>
            <Trash2 className="h-4 w-4 mr-2" />
            Eliminar
          </Button>
        </div>
      </div>

      {/* Avatar y Contacto Rápido */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-6">
            <Avatar className="h-24 w-24">
              {contacto.avatar && <AvatarImage src={contacto.avatar} />}
              <AvatarFallback className="text-2xl">{getInitials(contacto.nombre, contacto.apellidos)}</AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {contacto.email && (
                  <Button variant="outline" size="sm" onClick={() => window.open(`mailto:${contacto.email}`)}>
                    <Mail className="h-4 w-4 mr-2" />
                    Email
                  </Button>
                )}
                {contacto.telefono && (
                  <>
                    <Button variant="outline" size="sm" onClick={() => window.open(`tel:${contacto.telefono}`)}>
                      <Phone className="h-4 w-4 mr-2" />
                      Llamar
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => window.open(`https://wa.me/${contacto.telefono.replace(/\D/g, '')}`)}>
                      <MessageCircle className="h-4 w-4 mr-2" />
                      WhatsApp
                    </Button>
                  </>
                )}
                {contacto.linkedin && (
                  <Button variant="outline" size="sm" onClick={() => window.open(contacto.linkedin!, '_blank')}>
                    <Linkedin className="h-4 w-4 mr-2" />
                    LinkedIn
                  </Button>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Métricas Resumen */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Mandatos</p>
                <p className="text-2xl font-bold">{mandatos.length}</p>
              </div>
              <Briefcase className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Última Actividad</p>
                <p className="text-lg font-semibold">
                  {ultimaInteraccion ? format(new Date(ultimaInteraccion.fecha), "dd MMM yyyy", { locale: es }) : "Sin actividad"}
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
                <p className="text-sm text-muted-foreground">Valor Total</p>
                <p className="text-2xl font-bold">€{(valorTotalMandatos / 1000000).toFixed(1)}M</p>
              </div>
              <Banknote className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="general" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="general">Información General</TabsTrigger>
          <TabsTrigger value="mandatos">Mandatos ({mandatos.length})</TabsTrigger>
          <TabsTrigger value="actividad">Actividad ({interacciones.length})</TabsTrigger>
          <TabsTrigger value="documentos">Documentos ({documentos.length})</TabsTrigger>
        </TabsList>

        {/* Tab: Información General */}
        <TabsContent value="general">
          <Card>
            <CardHeader>
              <CardTitle>Datos del Contacto</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Email</p>
                  <p className="font-medium">{contacto.email || "-"}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Teléfono</p>
                  <p className="font-medium">{contacto.telefono || "-"}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Cargo</p>
                  <p className="font-medium">{contacto.cargo || "-"}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Empresa</p>
                  <p className="font-medium">
                    {contacto.empresa_principal ? (
                      <span
                        className="text-primary cursor-pointer hover:underline"
                        onClick={() => navigate(`/empresas/${contacto.empresa_principal_id}`)}
                      >
                        {contacto.empresa_principal.nombre}
                      </span>
                    ) : "-"}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">LinkedIn</p>
                  <p className="font-medium">
                    {contacto.linkedin ? (
                      <a href={contacto.linkedin} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                        Ver perfil
                      </a>
                    ) : "-"}
                  </p>
                </div>
              </div>
              {contacto.notas && (
                <div>
                  <p className="text-sm text-muted-foreground mb-2">Notas</p>
                  <p className="text-sm bg-muted p-3 rounded-md">{contacto.notas}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab: Mandatos */}
        <TabsContent value="mandatos">
          <Card>
            <CardHeader>
              <CardTitle>Mandatos Asociados</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {mandatos.map((mandato) => (
                  <div
                    key={mandato.id}
                    className="p-4 border rounded-lg hover:bg-accent cursor-pointer transition-colors"
                    onClick={() => navigate(`/mandatos/${mandato.id}`)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h4 className="font-medium">{mandato.tipo === "compra" ? "Compra" : "Venta"}</h4>
                          <Badge>{mandato.estado}</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">{mandato.descripcion || "Sin descripción"}</p>
                      </div>
                      <div className="text-right">
                        {mandato.valor && <p className="font-semibold">€{(mandato.valor / 1000000).toFixed(1)}M</p>}
                        {mandato.fecha_inicio && (
                          <p className="text-sm text-muted-foreground">{format(new Date(mandato.fecha_inicio), "dd/MM/yyyy")}</p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
                {mandatos.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-8">No hay mandatos asociados</p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab: Actividad */}
        <TabsContent value="actividad">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Timeline de Interacciones</CardTitle>
              <NuevaInteraccionDialog contactoId={id} />
            </CardHeader>
            <CardContent>
              <TimelineActividad interacciones={interacciones} />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab: Documentos */}
        <TabsContent value="documentos">
          <Card>
            <CardHeader>
              <CardTitle>Documentos Compartidos</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {documentos.map((doc: any) => (
                  <div key={doc.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent">
                    <div className="flex items-center gap-3">
                      <FileText className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="font-medium text-sm">{doc.documento?.file_name || "Documento"}</p>
                        <p className="text-xs text-muted-foreground">
                          Compartido el {format(new Date(doc.created_at), "dd MMM yyyy", { locale: es })}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
                {documentos.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-8">No hay documentos compartidos</p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Dialogs */}
      <ConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirmar={handleDelete}
        titulo="Eliminar contacto"
        descripcion="¿Estás seguro de que deseas eliminar este contacto? Esta acción no se puede deshacer."
        variant="destructive"
      />

      {contacto && (
        <EditarContactoDrawer
          open={editDrawerOpen}
          onOpenChange={setEditDrawerOpen}
          contacto={contacto}
          onSuccess={() => setEditDrawerOpen(false)}
        />
      )}
    </div>
  );
}
