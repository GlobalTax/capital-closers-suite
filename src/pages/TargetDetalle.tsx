import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Mail, Phone, Globe, MapPin, Users as UsersIcon, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { getTargetById } from "@/services/api";
import type { EmpresaTarget } from "@/types";
import { BadgeStatus } from "@/components/shared/BadgeStatus";

export default function TargetDetalle() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [target, setTarget] = useState<EmpresaTarget | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const cargarDatos = async () => {
      if (!id) return;
      
      setLoading(true);
      try {
        const targetData = await getTargetById(id);
        setTarget(targetData);
      } catch (error) {
        console.error("Error cargando target:", error);
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

  if (!target) {
    return <div>Empresa target no encontrada</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate("/targets")}>
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div className="flex-1">
          <h1 className="text-3xl font-semibold">{target.nombre}</h1>
          <p className="text-muted-foreground mt-1">{target.sector} • {target.ubicacion}</p>
        </div>
        <BadgeStatus status={target.interes} type="interes" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              Facturación
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{target.facturacion}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <UsersIcon className="w-4 h-4" />
              Empleados
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{target.empleados}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <MapPin className="w-4 h-4" />
              Ubicación
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm">{target.ubicacion}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Nivel de Interés</CardTitle>
          </CardHeader>
          <CardContent>
            <BadgeStatus status={target.interes} type="interes" />
          </CardContent>
        </Card>
      </div>

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
              <a href={target.sitioWeb} target="_blank" rel="noopener noreferrer" className="font-medium text-primary hover:underline">
                {target.sitioWeb}
              </a>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
