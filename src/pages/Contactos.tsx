import { useState, useEffect, useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { PageHeader } from "@/components/shared/PageHeader";
import { DataTableEnhanced } from "@/components/shared/DataTableEnhanced";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import type { Contacto } from "@/types";
import { toast } from "sonner";
import { NuevoContactoDrawer } from "@/components/contactos/NuevoContactoDrawer";
import { AIImportDrawer } from "@/components/importacion/AIImportDrawer";
import { Mail, MessageCircle, Linkedin, Users, UserCheck, UserPlus, TrendingUp, Activity, Sparkles, Clock, AlertCircle, UserX } from "lucide-react";
import { format, isAfter, subDays } from "date-fns";
import { es } from "date-fns/locale";
import { useContactosPaginated } from "@/hooks/queries/useContactos";
import { useContactosRealtime } from "@/hooks/useContactosRealtime";
import { handleError } from "@/lib/error-handler";
import { PageSkeleton } from "@/components/shared/LoadingStates";
import { DEFAULT_PAGE_SIZE } from "@/types/pagination";
import { formatPhoneForWhatsApp } from "@/lib/validation/validators";
import { cn } from "@/lib/utils";

type FiltroAccion = 'todos' | 'pendientes' | 'vencidas' | 'sin_actividad';

interface InteraccionData {
  total: number;
  pendientes: number;
  vencidas: number;
  ultimaFecha: string | null;
  proximaAccion: {
    texto: string;
    fecha: string;
    esVencida: boolean;
  } | null;
}

export default function Contactos() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const page = parseInt(searchParams.get('page') || '1', 10);
  
  const { data: result, isLoading, refetch } = useContactosPaginated(page, DEFAULT_PAGE_SIZE);
  useContactosRealtime(); // Suscripción a cambios en tiempo real
  
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [aiImportOpen, setAiImportOpen] = useState(false);
  const [interaccionesCounts, setInteraccionesCounts] = useState<Record<string, InteraccionData>>({});
  const [filtroAccion, setFiltroAccion] = useState<FiltroAccion>('todos');

  const contactos = result?.data || [];

  const handlePageChange = (newPage: number) => {
    setSearchParams({ page: newPage.toString() });
  };

  useEffect(() => {
    cargarInteracciones();
  }, [contactos]);

  const cargarInteracciones = async () => {
    if (contactos.length === 0) return;
    
    try {
      const today = new Date().toISOString().split('T')[0]; // Formato YYYY-MM-DD
      const thirtyDaysAgo = subDays(new Date(), 30).toISOString();
      const contactoIds = contactos.map(c => c.id);
      
      // Query 1: Contadores del último mes
      const { data: interaccionesRecientes, error: err1 } = await supabase
        .from('interacciones')
        .select('contacto_id, siguiente_accion, fecha_siguiente_accion')
        .in('contacto_id', contactoIds)
        .gte('fecha', thirtyDaysAgo);
      
      // Query 2: Última interacción por contacto (todas las fechas)
      const { data: ultimasInteracciones, error: err2 } = await supabase
        .from('interacciones')
        .select('contacto_id, fecha')
        .in('contacto_id', contactoIds)
        .order('fecha', { ascending: false });
      
      // Query 3: Próximas acciones por contacto
      const { data: proximasAcciones, error: err3 } = await supabase
        .from('interacciones')
        .select('contacto_id, siguiente_accion, fecha_siguiente_accion')
        .in('contacto_id', contactoIds)
        .not('siguiente_accion', 'is', null)
        .not('fecha_siguiente_accion', 'is', null)
        .order('fecha_siguiente_accion', { ascending: true });
      
      if (err1) throw err1;
      if (err2) throw err2;
      if (err3) throw err3;
      
      // Obtener última fecha por contacto
      const ultimasPorContacto: Record<string, string> = {};
      ultimasInteracciones?.forEach((int) => {
        if (int.contacto_id && !ultimasPorContacto[int.contacto_id]) {
          ultimasPorContacto[int.contacto_id] = int.fecha;
        }
      });
      
      // Encontrar la próxima acción más cercana por contacto
      const proximasPorContacto: Record<string, { texto: string; fecha: string; esVencida: boolean }> = {};
      proximasAcciones?.forEach((int) => {
        if (int.contacto_id && !proximasPorContacto[int.contacto_id]) {
          const esVencida = int.fecha_siguiente_accion! < today;
          proximasPorContacto[int.contacto_id] = {
            texto: int.siguiente_accion!,
            fecha: int.fecha_siguiente_accion!,
            esVencida
          };
        }
      });
      
      // Inicializar todos los contactos
      const counts: Record<string, InteraccionData> = {};
      contactoIds.forEach(contactoId => {
        counts[contactoId] = { 
          total: 0, 
          pendientes: 0, 
          vencidas: 0,
          ultimaFecha: ultimasPorContacto[contactoId] || null,
          proximaAccion: proximasPorContacto[contactoId] || null
        };
      });
      
      // Contar interacciones recientes y clasificar pendientes/vencidas
      interaccionesRecientes?.forEach((int) => {
        if (int.contacto_id && counts[int.contacto_id]) {
          counts[int.contacto_id].total++;
          
          if (int.siguiente_accion && int.fecha_siguiente_accion) {
            if (int.fecha_siguiente_accion >= today) {
              counts[int.contacto_id].pendientes++;
            } else {
              counts[int.contacto_id].vencidas++;
            }
          }
        }
      });
      
      setInteraccionesCounts(counts);
    } catch (error) {
      handleError(error, 'Carga de interacciones');
    }
  };

  // Filtrar contactos según el filtro de acción seleccionado
  const contactosFiltrados = useMemo(() => {
    if (filtroAccion === 'todos') return contactos;
    
    return contactos.filter(c => {
      const data = interaccionesCounts[c.id];
      
      switch (filtroAccion) {
        case 'pendientes':
          return data?.proximaAccion && !data.proximaAccion.esVencida;
        case 'vencidas':
          return data?.proximaAccion?.esVencida;
        case 'sin_actividad':
          return !data?.ultimaFecha;
        default:
          return true;
      }
    });
  }, [contactos, interaccionesCounts, filtroAccion]);

  // Contadores para los filtros
  const filtroContadores = useMemo(() => {
    return {
      todos: contactos.length,
      pendientes: contactos.filter(c => interaccionesCounts[c.id]?.proximaAccion && !interaccionesCounts[c.id]?.proximaAccion?.esVencida).length,
      vencidas: contactos.filter(c => interaccionesCounts[c.id]?.proximaAccion?.esVencida).length,
      sin_actividad: contactos.filter(c => !interaccionesCounts[c.id]?.ultimaFecha).length
    };
  }, [contactos, interaccionesCounts]);

  // KPIs basados en count del servidor
  const kpis = useMemo(() => {
    const total = result?.count || 0;
    const activos = contactos.filter(c => 
      c.updated_at && isAfter(new Date(c.updated_at), subDays(new Date(), 30))
    ).length;
    const nuevos = contactos.filter(c => 
      c.created_at && isAfter(new Date(c.created_at), subDays(new Date(), 30))
    ).length;
    
    return { total, activos, nuevos };
  }, [result, contactos]);

  const columns = [
    {
      key: "nombre",
      label: "Contacto",
      sortable: true,
      filterable: true,
      render: (_value: string, row: Contacto) => (
        <div className="flex items-center gap-3">
          <Avatar className="w-8 h-8">
            <AvatarFallback className="bg-primary/10 text-primary text-xs">
              {row.nombre.split(" ").map((n) => n[0]).join("")}
            </AvatarFallback>
          </Avatar>
          <div>
            <p className="font-medium">{row.nombre} {row.apellidos || ""}</p>
            {row.cargo && <p className="text-xs text-muted-foreground">{row.cargo}</p>}
          </div>
        </div>
      ),
    },
    { 
      key: "empresa_principal", 
      label: "Empresa", 
      sortable: true, 
      filterable: true,
      render: (_value: any, row: Contacto) => (
        <div>
          {row.empresa_principal?.nombre || <span className="text-muted-foreground">-</span>}
        </div>
      )
    },
    { 
      key: "email", 
      label: "Email", 
      filterable: true,
      render: (value: string) => (
        <span className="text-sm">{value}</span>
      )
    },
    { 
      key: "telefono", 
      label: "Teléfono",
      render: (value: string) => value || <span className="text-muted-foreground">-</span>
    },
    {
      key: "ultima_actividad",
      label: "Última Actividad",
      sortable: false,
      render: (_value: string, row: Contacto) => {
        const interaccionesData = interaccionesCounts[row.id];
        const ultimaFecha = interaccionesData?.ultimaFecha;
        
        if (!ultimaFecha) {
          return <span className="text-muted-foreground text-sm">Sin actividad</span>;
        }
        
        const fechaInteraccion = new Date(ultimaFecha);
        const isRecent = isAfter(fechaInteraccion, subDays(new Date(), 7));
        
        return (
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <span className="text-sm">
                {format(fechaInteraccion, "d MMM yyyy", { locale: es })}
              </span>
              {isRecent && (
                <Badge variant="secondary" className="text-xs bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                  Reciente
                </Badge>
              )}
            </div>
            {interaccionesData && interaccionesData.total > 0 && (
              <Badge variant="outline" className="text-xs flex items-center gap-1 w-fit">
                <Activity className="h-3 w-3" />
                {interaccionesData.total} (30d)
              </Badge>
            )}
          </div>
        );
      }
    },
    {
      key: "proxima_accion",
      label: "Próxima Acción",
      sortable: false,
      render: (_value: string, row: Contacto) => {
        const data = interaccionesCounts[row.id];
        const proxima = data?.proximaAccion;
        
        if (!proxima) {
          return <span className="text-muted-foreground text-sm">—</span>;
        }
        
        return (
          <div className="flex flex-col gap-1 max-w-[200px]">
            <div className="flex items-center gap-2">
              <span className="text-sm">
                {format(new Date(proxima.fecha), "d MMM", { locale: es })}
              </span>
              {proxima.esVencida ? (
                <Badge variant="destructive" className="text-xs">
                  Vencida
                </Badge>
              ) : (
                <Badge variant="secondary" className="text-xs bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
                  Pendiente
                </Badge>
              )}
            </div>
            <p className="text-xs text-muted-foreground truncate" title={proxima.texto}>
              {proxima.texto}
            </p>
          </div>
        );
      }
    },
    {
      key: "actions",
      label: "Acciones",
      render: (_value: any, row: Contacto) => (
        <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
          {row.email && (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              asChild
            >
              <a href={`mailto:${row.email}`} title="Enviar email">
                <Mail className="h-4 w-4" />
              </a>
            </Button>
          )}
          {row.telefono && (() => {
            const waData = formatPhoneForWhatsApp(row.telefono);
            if (!waData) return null;
            return (
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                asChild
              >
                <a 
                  href={`https://wa.me/${waData.number}`} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  title={waData.hasCountryCode ? "WhatsApp" : "WhatsApp (verificar prefijo país)"}
                >
                  <MessageCircle className={`h-4 w-4 ${!waData.hasCountryCode ? "text-yellow-500" : ""}`} />
                </a>
              </Button>
            );
          })()}
          {row.linkedin && (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              asChild
            >
              <a href={row.linkedin} target="_blank" rel="noopener noreferrer" title="LinkedIn">
                <Linkedin className="h-4 w-4" />
              </a>
            </Button>
          )}
        </div>
      )
    }
  ];

  const filtroButtons = [
    { key: 'todos' as FiltroAccion, label: 'Todos', icon: Users },
    { key: 'pendientes' as FiltroAccion, label: 'Pendientes', icon: Clock, activeClass: 'bg-blue-600 hover:bg-blue-700' },
    { key: 'vencidas' as FiltroAccion, label: 'Vencidas', icon: AlertCircle, activeClass: 'bg-destructive hover:bg-destructive/90' },
    { key: 'sin_actividad' as FiltroAccion, label: 'Sin actividad', icon: UserX }
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Contactos"
        description="Gestiona tus contactos profesionales"
        actionLabel="Nuevo Contacto"
        onAction={() => setDrawerOpen(true)}
        extraActions={
          <Button variant="outline" onClick={() => setAiImportOpen(true)}>
            <Sparkles className="h-4 w-4 mr-2" />
            Importar con IA
          </Button>
        }
      />

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Contactos</p>
                <p className="text-3xl font-medium mt-2">{kpis.total}</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                <Users className="h-6 w-6 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Activos (30 días)</p>
                <p className="text-3xl font-medium mt-2">{kpis.activos}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  en página actual
                </p>
              </div>
              <div className="h-12 w-12 rounded-full bg-secondary/10 flex items-center justify-center">
                <UserCheck className="h-6 w-6 text-secondary-foreground" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Nuevos (30 días)</p>
                <p className="text-3xl font-medium mt-2">{kpis.nuevos}</p>
                <div className="flex items-center gap-1 mt-1">
                  <TrendingUp className="h-3 w-3 text-green-500" />
                  <p className="text-xs text-green-500">en página actual</p>
                </div>
              </div>
              <div className="h-12 w-12 rounded-full bg-green-500/10 flex items-center justify-center">
                <UserPlus className="h-6 w-6 text-green-500" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtros rápidos de acciones */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-sm text-muted-foreground mr-2">Filtrar por:</span>
        {filtroButtons.map(({ key, label, icon: Icon, activeClass }) => {
          const isActive = filtroAccion === key;
          const count = filtroContadores[key];
          
          return (
            <Button
              key={key}
              variant={isActive ? "default" : "outline"}
              size="sm"
              onClick={() => setFiltroAccion(key)}
              className={cn(
                isActive && activeClass,
                !isActive && key === 'pendientes' && "text-blue-600 border-blue-200 hover:bg-blue-50 dark:text-blue-400 dark:border-blue-800 dark:hover:bg-blue-950",
                !isActive && key === 'vencidas' && "text-destructive border-destructive/30 hover:bg-destructive/10"
              )}
            >
              <Icon className="h-4 w-4 mr-1" />
              {label}
              <Badge 
                variant="secondary" 
                className={cn(
                  "ml-2 px-1.5 py-0 text-xs",
                  isActive && "bg-white/20 text-white"
                )}
              >
                {count}
              </Badge>
            </Button>
          );
        })}
      </div>

      <DataTableEnhanced
        columns={columns}
        data={contactosFiltrados}
        loading={isLoading}
        onRowClick={(row) => navigate(`/contactos/${row.id}`)}
        pageSize={DEFAULT_PAGE_SIZE}
        serverPagination={{
          currentPage: page,
          totalPages: result?.totalPages || 1,
          totalCount: result?.count || 0,
          onPageChange: handlePageChange,
        }}
      />

      <NuevoContactoDrawer
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        onSuccess={refetch}
      />

      <AIImportDrawer
        open={aiImportOpen}
        onOpenChange={setAiImportOpen}
        defaultMode="contacto"
        onSuccess={() => refetch()}
      />
    </div>
  );
}
