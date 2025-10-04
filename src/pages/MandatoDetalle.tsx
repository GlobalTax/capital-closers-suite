import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, FileText, Activity } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { getMandatoById, fetchActividades, fetchDocumentos } from "@/services/api";
import type { Mandato, Actividad, Documento } from "@/types";
import { BadgeStatus } from "@/components/shared/BadgeStatus";

export default function MandatoDetalle() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [mandato, setMandato] = useState<Mandato | null>(null);
  const [actividades, setActividades] = useState<Actividad[]>([]);
  const [documentos, setDocumentos] = useState<Documento[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const cargarDatos = async () => {
      if (!id) return;
      
      setLoading(true);
      try {
        const [mandatoData, actividadesData, documentosData] = await Promise.all([
          getMandatoById(id),
          fetchActividades(id),
          fetchDocumentos(),
        ]);
        
        setMandato(mandatoData);
        setActividades(actividadesData);
        setDocumentos(documentosData.filter(d => d.mandatoId === id));
      } catch (error) {
        console.error("Error cargando mandato:", error);
      } finally {
        setLoading(false);
      }
    };

    cargarDatos();
  }, [id]);

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (!mandato) {
    return <div>Mandato no encontrado</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate("/mandatos")}>
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div className="flex-1">
          <h1 className="text-3xl font-semibold">{mandato.empresa}</h1>
          <p className="text-muted-foreground mt-1">ID: {mandato.id}</p>
        </div>
        <BadgeStatus status={mandato.estado} type="mandato" />
      </div>

      <Tabs defaultValue="info" className="w-full">
        <TabsList>
          <TabsTrigger value="info">Información</TabsTrigger>
          <TabsTrigger value="documentos">
            Documentos ({documentos.length})
          </TabsTrigger>
          <TabsTrigger value="actividad">
            Actividad ({actividades.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="info" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Detalles del Mandato</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Cliente</p>
                <p className="font-medium">{mandato.cliente}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Valor Estimado</p>
                <p className="font-medium">{mandato.valor}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Fecha Inicio</p>
                <p className="font-medium">{mandato.fecha}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Responsable</p>
                <p className="font-medium">{mandato.responsable}</p>
              </div>
              <div className="col-span-2">
                <p className="text-sm text-muted-foreground">Descripción</p>
                <p className="font-medium">{mandato.descripcion}</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="documentos">
          <Card>
            <CardHeader>
              <CardTitle>Documentos Asociados</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {documentos.map((doc) => (
                  <div key={doc.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <FileText className="w-4 h-4 text-muted-foreground" />
                      <div>
                        <p className="font-medium text-sm">{doc.nombre}</p>
                        <p className="text-xs text-muted-foreground">{doc.tamano} • {doc.fecha}</p>
                      </div>
                    </div>
                    <Badge variant="outline">{doc.tipo}</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="actividad">
          <Card>
            <CardHeader>
              <CardTitle>Timeline de Actividad</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {actividades.map((actividad) => (
                  <div key={actividad.id} className="flex gap-4">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <Activity className="w-4 h-4 text-primary" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-sm">{actividad.titulo}</p>
                      {actividad.descripcion && (
                        <p className="text-sm text-muted-foreground mt-1">{actividad.descripcion}</p>
                      )}
                      <p className="text-xs text-muted-foreground mt-2">
                        {actividad.usuario} • {new Date(actividad.fecha).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
