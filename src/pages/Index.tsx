import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { format, subDays, isPast } from "date-fns";
import { es } from "date-fns/locale";
import { 
  Calendar, 
  AlertCircle, 
  Activity, 
  Users, 
  Building2,
  CheckCircle2,
  ArrowRight,
  Phone,
  Mail,
  MessageCircle,
  FileText,
  Linkedin,
  MapPin,
  Briefcase
} from "lucide-react";
import { toast } from "sonner";
import type { Interaccion } from "@/services/interacciones";
import { AlertsSummaryWidget } from "@/components/dashboard/AlertsSummaryWidget";
import { OnboardingWidget } from "@/components/dashboard/OnboardingWidget";
import { useAlertsRealtime } from "@/hooks/useAlertsRealtime";
import { DailyDigestCard } from "@/components/tasks/DailyDigestCard";
import { TaskHealthAlerts } from "@/components/tasks/TaskHealthAlerts";

interface ProximaAccion extends Interaccion {
  contacto?: { nombre: string; apellidos: string };
  empresa?: { nombre: string };
}

interface Stats {
  totalInteracciones: number;
  proximasAcciones: number;
  contactosInactivos: number;
  empresasInactivas: number;
}

const iconMap: Record<string, any> = {
  llamada: Phone,
  email: Mail,
  whatsapp: MessageCircle,
  reunion: Calendar,
  nota: FileText,
  linkedin: Linkedin,
  visita: MapPin,
};

const colorMap: Record<string, string> = {
  llamada: "text-blue-500",
  email: "text-purple-500",
  whatsapp: "text-green-500",
  reunion: "text-orange-500",
  nota: "text-gray-500",
  linkedin: "text-blue-600",
  visita: "text-red-500",
};

export default function Index() {
  const navigate = useNavigate();
  const [stats, setStats] = useState<Stats>({
    totalInteracciones: 0,
    proximasAcciones: 0,
    contactosInactivos: 0,
    empresasInactivas: 0
  });
  const [proximasAcciones, setProximasAcciones] = useState<ProximaAccion[]>([]);
  const [interaccionesRecientes, setInteraccionesRecientes] = useState<ProximaAccion[]>([]);
  const [loading, setLoading] = useState(true);

  // Suscripción a alertas en tiempo real
  useAlertsRealtime();

  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    setLoading(true);
    try {
      const thirtyDaysAgo = subDays(new Date(), 30).toISOString();
      const today = new Date().toISOString().split('T')[0];

      // Cargar estadísticas de interacciones del último mes
      const { data: interaccionesMes, error: errorInteracciones } = await supabase
        .from('interacciones')
        .select('id, siguiente_accion, fecha_siguiente_accion')
        .gte('fecha', thirtyDaysAgo);

      if (errorInteracciones) throw errorInteracciones;

      // Contar próximas acciones pendientes
      const pendientes = interaccionesMes?.filter(
        i => i.siguiente_accion && i.fecha_siguiente_accion && i.fecha_siguiente_accion >= today
      ).length || 0;

      // Contactos sin actividad en 30 días
      const { count: contactosInactivos, error: errorContactos } = await supabase
        .from('contactos')
        .select('id', { count: 'exact', head: true })
        .lt('updated_at', thirtyDaysAgo);

      if (errorContactos) throw errorContactos;

      // Empresas sin actividad en 30 días
      const { count: empresasInactivas, error: errorEmpresas } = await supabase
        .from('empresas')
        .select('id', { count: 'exact', head: true })
        .lt('updated_at', thirtyDaysAgo);

      if (errorEmpresas) throw errorEmpresas;

      setStats({
        totalInteracciones: interaccionesMes?.length || 0,
        proximasAcciones: pendientes,
        contactosInactivos: contactosInactivos || 0,
        empresasInactivas: empresasInactivas || 0
      });

      // Cargar próximas acciones con detalles
      const { data: acciones, error: errorAcciones } = await supabase
        .from('interacciones')
        .select(`
          *,
          contacto:contactos(nombre, apellidos),
          empresa:empresas(nombre)
        `)
        .not('siguiente_accion', 'is', null)
        .gte('fecha_siguiente_accion', today)
        .order('fecha_siguiente_accion', { ascending: true })
        .limit(5);

      if (errorAcciones) throw errorAcciones;
      setProximasAcciones((acciones || []) as ProximaAccion[]);

      // Cargar interacciones recientes
      const { data: recientes, error: errorRecientes } = await supabase
        .from('interacciones')
        .select(`
          *,
          contacto:contactos(nombre, apellidos),
          empresa:empresas(nombre)
        `)
        .order('fecha', { ascending: false })
        .limit(10);

      if (errorRecientes) throw errorRecientes;
      setInteraccionesRecientes((recientes || []) as ProximaAccion[]);

    } catch (error) {
      toast.error("Error al cargar el dashboard");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-medium">Dashboard</h1>
        <p className="text-muted-foreground mt-1">
          Vista general de tu actividad y próximas acciones
        </p>
      </div>

      {/* Onboarding Widget */}
      <OnboardingWidget />

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Interacciones (30d)</p>
                <p className="text-3xl font-medium mt-2">{stats.totalInteracciones}</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                <Activity className="h-6 w-6 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Próximas Acciones</p>
                <p className="text-3xl font-medium mt-2">{stats.proximasAcciones}</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-yellow-500/10 flex items-center justify-center">
                <Calendar className="h-6 w-6 text-yellow-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Contactos Inactivos</p>
                <p className="text-3xl font-medium mt-2">{stats.contactosInactivos}</p>
                <p className="text-xs text-muted-foreground mt-1">+30 días sin actividad</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-orange-500/10 flex items-center justify-center">
                <Users className="h-6 w-6 text-orange-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Empresas Inactivas</p>
                <p className="text-3xl font-medium mt-2">{stats.empresasInactivas}</p>
                <p className="text-xs text-muted-foreground mt-1">+30 días sin actividad</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-orange-500/10 flex items-center justify-center">
                <Building2 className="h-6 w-6 text-orange-500" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* AI Daily Digest */}
      <DailyDigestCard />

      {/* Widget de Alertas M&A */}
      <AlertsSummaryWidget />

      {/* Task Health Alerts */}
      <TaskHealthAlerts compact onTaskClick={() => navigate('/tareas')} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Próximas Acciones */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-yellow-500" />
              Próximas Acciones
            </CardTitle>
            <CardDescription>
              Acciones de seguimiento pendientes ordenadas por fecha
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8 text-muted-foreground">Cargando...</div>
            ) : proximasAcciones.length === 0 ? (
              <div className="text-center py-8">
                <CheckCircle2 className="h-12 w-12 mx-auto text-green-500 mb-2" />
                <p className="text-muted-foreground">No hay acciones pendientes</p>
              </div>
            ) : (
              <div className="space-y-4">
                {proximasAcciones.map((accion) => {
                  const Icon = iconMap[accion.tipo] || FileText;
                  const colorClass = colorMap[accion.tipo] || "text-gray-500";
                  const isOverdue = accion.fecha_siguiente_accion 
                    ? isPast(new Date(accion.fecha_siguiente_accion)) 
                    : false;
                  
                  return (
                    <div key={accion.id} className="flex items-start gap-3 p-3 rounded-lg border hover:bg-accent/50 transition-colors cursor-pointer"
                      onClick={() => {
                        if (accion.contacto_id) navigate(`/contactos/${accion.contacto_id}`);
                        else if (accion.empresa_id) navigate(`/empresas/${accion.empresa_id}`);
                      }}
                    >
                      <div className={`p-2 rounded-full bg-background border ${colorClass}`}>
                        <Icon className="h-4 w-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1">
                            <p className="font-medium text-sm line-clamp-1">{accion.siguiente_accion}</p>
                            <p className="text-xs text-muted-foreground mt-1">
                              {accion.contacto && `${accion.contacto.nombre} ${accion.contacto.apellidos || ''}`}
                              {accion.empresa && accion.empresa.nombre}
                            </p>
                          </div>
                          {accion.fecha_siguiente_accion && (
                            <Badge variant={isOverdue ? "destructive" : "outline"} className="text-xs whitespace-nowrap">
                              {isOverdue && <AlertCircle className="h-3 w-3 mr-1" />}
                              {format(new Date(accion.fecha_siguiente_accion), "d MMM", { locale: es })}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
                {proximasAcciones.length > 0 && (
                  <Button variant="ghost" className="w-full" onClick={() => navigate("/contactos")}>
                    Ver todas las acciones <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Interacciones Recientes */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-primary" />
              Actividad Reciente
            </CardTitle>
            <CardDescription>
              Últimas interacciones registradas
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8 text-muted-foreground">Cargando...</div>
            ) : interaccionesRecientes.length === 0 ? (
              <div className="text-center py-8">
                <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
                <p className="text-muted-foreground">No hay interacciones registradas</p>
              </div>
            ) : (
              <div className="space-y-3">
                {interaccionesRecientes.map((interaccion) => {
                  const Icon = iconMap[interaccion.tipo] || FileText;
                  const colorClass = colorMap[interaccion.tipo] || "text-gray-500";
                  
                  return (
                    <div key={interaccion.id} className="flex items-start gap-3 p-3 rounded-lg border hover:bg-accent/50 transition-colors cursor-pointer"
                      onClick={() => {
                        if (interaccion.contacto_id) navigate(`/contactos/${interaccion.contacto_id}`);
                        else if (interaccion.empresa_id) navigate(`/empresas/${interaccion.empresa_id}`);
                      }}
                    >
                      <div className={`p-2 rounded-full bg-background border ${colorClass}`}>
                        <Icon className="h-4 w-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1">
                            <p className="font-medium text-sm line-clamp-1">{interaccion.titulo}</p>
                            <p className="text-xs text-muted-foreground mt-1">
                              {interaccion.contacto && `${interaccion.contacto.nombre} ${interaccion.contacto.apellidos || ''}`}
                              {interaccion.empresa && interaccion.empresa.nombre}
                            </p>
                          </div>
                          <div className="flex flex-col items-end gap-1">
                            <Badge variant="outline" className="text-xs capitalize">
                              {interaccion.tipo}
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                              {format(new Date(interaccion.fecha), "d MMM", { locale: es })}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Alertas de Inactividad */}
      {(stats.contactosInactivos > 0 || stats.empresasInactivas > 0) && (
        <Card className="border-orange-200 dark:border-orange-900 bg-orange-50/50 dark:bg-orange-950/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-orange-700 dark:text-orange-400">
              <AlertCircle className="h-5 w-5" />
              Alertas de Inactividad
            </CardTitle>
            <CardDescription>
              Contactos y empresas que requieren atención
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {stats.contactosInactivos > 0 && (
                <div className="flex items-center justify-between p-4 bg-background rounded-lg border">
                  <div className="flex items-center gap-3">
                    <Users className="h-8 w-8 text-orange-500" />
                    <div>
                      <p className="font-medium">{stats.contactosInactivos} Contactos Inactivos</p>
                      <p className="text-sm text-muted-foreground">Sin actividad en más de 30 días</p>
                    </div>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => navigate("/contactos")}>
                    Ver
                  </Button>
                </div>
              )}
              {stats.empresasInactivas > 0 && (
                <div className="flex items-center justify-between p-4 bg-background rounded-lg border">
                  <div className="flex items-center gap-3">
                    <Building2 className="h-8 w-8 text-orange-500" />
                    <div>
                      <p className="font-medium">{stats.empresasInactivas} Empresas Inactivas</p>
                      <p className="text-sm text-muted-foreground">Sin actividad en más de 30 días</p>
                    </div>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => navigate("/empresas")}>
                    Ver
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Accesos Rápidos */}
      <Card>
        <CardHeader>
          <CardTitle>Accesos Rápidos</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Button variant="outline" className="h-auto py-4 flex-col gap-2" onClick={() => navigate("/contactos")}>
              <Users className="h-6 w-6" />
              <span className="text-sm">Contactos</span>
            </Button>
            <Button variant="outline" className="h-auto py-4 flex-col gap-2" onClick={() => navigate("/empresas")}>
              <Building2 className="h-6 w-6" />
              <span className="text-sm">Empresas</span>
            </Button>
            <Button variant="outline" className="h-auto py-4 flex-col gap-2" onClick={() => navigate("/mandatos")}>
              <Briefcase className="h-6 w-6" />
              <span className="text-sm">Mandatos</span>
            </Button>
            <Button variant="outline" className="h-auto py-4 flex-col gap-2" onClick={() => navigate("/tareas")}>
              <CheckCircle2 className="h-6 w-6" />
              <span className="text-sm">Tareas</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
