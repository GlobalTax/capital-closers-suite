import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Mail, Phone, Globe, MapPin, TrendingUp, Plus, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { getTargetById, updateTarget, createTarea, fetchDocumentos } from "@/services/api";
import type { EmpresaTarget, TargetEstado, Documento } from "@/types";
import { BadgeStatus } from "@/components/shared/BadgeStatus";
import { TARGET_ESTADOS } from "@/lib/constants";
import { toast } from "sonner";
import { InteraccionTimeline } from "@/components/targets/InteraccionTimeline";
import { DatosFinancierosForm } from "@/components/targets/DatosFinancierosForm";

export default function TargetDetalle() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [target, setTarget] = useState<EmpresaTarget | null>(null);
  const [loading, setLoading] = useState(true);
  const [documentos, setDocumentos] = useState<Documento[]>([]);

  useEffect(() => {
    cargarDatos();
  }, [id]);

  const cargarDatos = async () => {
    if (!id) return;

    setLoading(true);
    try {
      const [targetData, docsData] = await Promise.all([
        getTargetById(id),
        fetchDocumentos(),
      ]);
      setTarget(targetData);
      setDocumentos(docsData.filter((d) => d.mandato_id === targetData?.mandatoId));
    } catch (error) {
      console.error("Error cargando target:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleEstadoChange = async (nuevoEstado: TargetEstado) => {
    if (!target) return;

    try {
      await updateTarget(target.id, { estado: nuevoEstado });
      setTarget({ ...target, estado: nuevoEstado });
      toast.success(`Estado actualizado a "${nuevoEstado}"`);

      // Regla de negocio: crear tarea automática en DD
      if (nuevoEstado === "en_dd") {
        await createTarea({
          titulo: "Preparar Due Diligence",
          descripcion: `Due Diligence para ${target.nombre}`,
          prioridad: "alta",
          estado: "pendiente",
          fechaVencimiento: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
            .toISOString()
            .split("T")[0],
          mandatoId: target.mandatoId,
        });
        toast.success("Tarea de Due Diligence creada automáticamente", {
          description: "Prioridad: Alta • Vencimiento: +7 días",
        });
      }
    } catch (error) {
      toast.error("Error al actualizar estado");
    }
  };

  const formatCurrency = (value: number | undefined) => {
    if (!value) return null;
    return `€${(value / 1000000).toFixed(1)}M`;
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (!target) {
    return <div>Empresa target no encontrada</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate("/targets")}>
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div className="flex-1">
          <h1 className="text-3xl font-semibold">{target.nombre}</h1>
          <p className="text-muted-foreground mt-1">
            {target.sector} • {target.ubicacion}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={target.estado || "pendiente"} onValueChange={handleEstadoChange}>
            <SelectTrigger className="w-[200px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {TARGET_ESTADOS.map((estado) => (
                <SelectItem key={estado} value={estado}>
                  {estado === "en_dd" ? "Due Diligence" : estado.charAt(0).toUpperCase() + estado.slice(1)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Contacto Principal */}
      {target.contactoPrincipal && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                <span className="text-primary font-semibold">
                  {target.contactoPrincipal.charAt(0)}
                </span>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Contacto Principal</p>
                <p className="font-medium">{target.contactoPrincipal}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              Revenue
            </CardTitle>
          </CardHeader>
          <CardContent>
            {formatCurrency(target.revenue) ? (
              <p className="text-2xl font-bold">{formatCurrency(target.revenue)}</p>
            ) : (
              <Badge variant="outline" className="text-muted-foreground">
                Sin datos
              </Badge>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">EBITDA</CardTitle>
          </CardHeader>
          <CardContent>
            {formatCurrency(target.ebitda) ? (
              <p className="text-2xl font-bold">{formatCurrency(target.ebitda)}</p>
            ) : (
              <Badge variant="outline" className="text-muted-foreground">
                Sin datos
              </Badge>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Empleados</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{target.empleados}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Ubicación</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-muted-foreground" />
              <p className="text-sm">{target.ubicacion}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="resumen" className="space-y-4">
        <TabsList>
          <TabsTrigger value="resumen">Resumen</TabsTrigger>
          <TabsTrigger value="interacciones">Interacciones</TabsTrigger>
          <TabsTrigger value="documentos">Documentos</TabsTrigger>
          <TabsTrigger value="financieros">Datos Financieros</TabsTrigger>
        </TabsList>

        {/* Tab Resumen */}
        <TabsContent value="resumen" className="space-y-4">
          {target.descripcion && (
            <Card>
              <CardHeader>
                <CardTitle>Descripción</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">{target.descripcion}</p>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle>Información de Contacto</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {target.contactoPrincipal && (
                <div>
                  <p className="text-sm text-muted-foreground">Contacto Principal</p>
                  <p className="font-medium">{target.contactoPrincipal}</p>
                </div>
              )}
              {target.email && (
                <div>
                  <p className="text-sm text-muted-foreground flex items-center gap-2">
                    <Mail className="w-4 h-4" />
                    Email
                  </p>
                  <p className="font-medium">{target.email}</p>
                </div>
              )}
              {target.telefono && (
                <div>
                  <p className="text-sm text-muted-foreground flex items-center gap-2">
                    <Phone className="w-4 h-4" />
                    Teléfono
                  </p>
                  <p className="font-medium">{target.telefono}</p>
                </div>
              )}
              {target.sitioWeb && (
                <div>
                  <p className="text-sm text-muted-foreground flex items-center gap-2">
                    <Globe className="w-4 h-4" />
                    Sitio Web
                  </p>
                  <a
                    href={target.sitioWeb}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-medium text-primary hover:underline"
                  >
                    {target.sitioWeb}
                  </a>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab Interacciones */}
        <TabsContent value="interacciones">
          <InteraccionTimeline
            interacciones={target.interacciones || []}
            targetId={target.id}
            onUpdate={cargarDatos}
          />
        </TabsContent>

        {/* Tab Documentos */}
        <TabsContent value="documentos" className="space-y-4">
          <div className="flex justify-end">
            <Button onClick={() => toast.info("Función disponible próximamente")}>
              <Upload className="w-4 h-4 mr-2" />
              Subir Documento
            </Button>
          </div>
          <Card>
            <CardHeader>
              <CardTitle>Documentos Asociados</CardTitle>
            </CardHeader>
            <CardContent>
              {documentos.length > 0 ? (
                <div className="space-y-2">
                  {documentos.map((doc) => (
                    <div
                      key={doc.id}
                      className="flex items-center justify-between p-3 border rounded-lg"
                    >
                      <div>
                        <p className="font-medium">{doc.file_name}</p>
                        <p className="text-sm text-muted-foreground">
                          {doc.tipo} • {new Date(doc.created_at).toLocaleDateString()} • {
                            doc.file_size_bytes < 1024 ? doc.file_size_bytes + " B" :
                            doc.file_size_bytes < 1024 * 1024 ? (doc.file_size_bytes / 1024).toFixed(1) + " KB" :
                            (doc.file_size_bytes / (1024 * 1024)).toFixed(1) + " MB"
                          }
                        </p>
                      </div>
                      <BadgeStatus status={doc.tipo as any} type="mandato" />
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-8">
                  No hay documentos asociados
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab Datos Financieros */}
        <TabsContent value="financieros">
          <DatosFinancierosForm
            targetId={target.id}
            datosActuales={target.datosFinancieros}
            onUpdate={cargarDatos}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
