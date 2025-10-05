import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Mail, Linkedin, Building2, Edit, Trash2, Briefcase } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getContactoById, deleteContacto, getContactoMandatos } from "@/services/contactos";
import type { Contacto, Mandato } from "@/types";
import { toast } from "sonner";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { EditarContactoDrawer } from "@/components/contactos/EditarContactoDrawer";
import { BadgeStatus } from "@/components/shared/BadgeStatus";

export default function ContactoDetalle() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [contacto, setContacto] = useState<Contacto | null>(null);
  const [mandatos, setMandatos] = useState<Mandato[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editDrawerOpen, setEditDrawerOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const cargarDatos = async () => {
    if (!id) return;

    setLoading(true);
    try {
      const [contactoData, mandatosData] = await Promise.all([
        getContactoById(id),
        getContactoMandatos(id),
      ]);

      setContacto(contactoData);
      setMandatos(mandatosData || []);
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

      {/* Botones de acción rápida */}
      <div className="flex gap-2">
        {contacto.email && (
          <Button variant="outline" asChild>
            <a href={`mailto:${contacto.email}`}>
              <Mail className="w-4 h-4 mr-2" />
              Enviar Email
            </a>
          </Button>
        )}
        {contacto.linkedin && (
          <Button variant="outline" asChild>
            <a href={contacto.linkedin} target="_blank" rel="noopener noreferrer">
              <Linkedin className="w-4 h-4 mr-2" />
              Ver LinkedIn
            </a>
          </Button>
        )}
      </div>

      <Tabs defaultValue="informacion" className="w-full">
        <TabsList>
          <TabsTrigger value="informacion">Información General</TabsTrigger>
          <TabsTrigger value="mandatos">
            Mandatos Relacionados ({mandatos.length})
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

        {/* Tab Mandatos */}
        <TabsContent value="mandatos">
          {mandatos.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <p className="text-muted-foreground">
                  Este contacto no está asociado a ningún mandato
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {mandatos.map((mandato) => (
                <Card
                  key={mandato.id}
                  className="cursor-pointer hover:border-primary transition-colors"
                  onClick={() => navigate(`/mandatos/${mandato.id}`)}
                >
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-xl">
                          {mandato.empresa_principal?.nombre || "Sin cliente"}
                        </CardTitle>
                        <p className="text-sm text-muted-foreground mt-1">
                          {mandato.descripcion}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Badge variant={mandato.tipo === "venta" ? "default" : "secondary"}>
                          {mandato.tipo === "venta" ? "Venta" : "Compra"}
                        </Badge>
                        <BadgeStatus status={mandato.estado} type="mandato" />
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div>
                        <p className="text-muted-foreground">Valor Estimado</p>
                        <p className="font-medium">
                          {mandato.valor?.toLocaleString("es-ES") || 0} €
                        </p>
                      </div>
                      {mandato.empresa_principal?.sector && (
                        <div>
                          <p className="text-muted-foreground">Sector</p>
                          <p className="font-medium">{mandato.empresa_principal.sector}</p>
                        </div>
                      )}
                      {mandato.prioridad && (
                        <div>
                          <p className="text-muted-foreground">Prioridad</p>
                          <Badge variant="outline">{mandato.prioridad}</Badge>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
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
