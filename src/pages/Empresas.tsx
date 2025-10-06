import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { PageHeader } from "@/components/shared/PageHeader";
import { DataTableEnhanced } from "@/components/shared/DataTableEnhanced";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { NuevoEmpresaDrawer } from "@/components/empresas/NuevoEmpresaDrawer";
import { fetchEmpresas } from "@/services/empresas";
import { supabase } from "@/integrations/supabase/client";
import type { Empresa } from "@/types";
import { toast } from "sonner";
import { Building2, Target, TrendingUp, Activity, Globe, Mail, Linkedin, Briefcase } from "lucide-react";
import { format, isAfter, subDays } from "date-fns";
import { es } from "date-fns/locale";

export default function Empresas() {
  const navigate = useNavigate();
  const [empresas, setEmpresas] = useState<Empresa[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtroTarget, setFiltroTarget] = useState<boolean | undefined>(undefined);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [interaccionesCounts, setInteraccionesCounts] = useState<Record<string, { total: number; pendientes: number }>>({});

  // KPIs calculados
  const kpis = useMemo(() => {
    const total = empresas.length;
    const targets = empresas.filter(e => e.es_target).length;
    const facturacionPromedio = empresas.length > 0 
      ? empresas.reduce((sum, e) => sum + (e.facturacion || 0), 0) / empresas.length 
      : 0;
    
    return {
      total,
      targets,
      targetPercentage: total > 0 ? ((targets / total) * 100).toFixed(0) : 0,
      facturacionPromedio,
    };
  }, [empresas]);

  useEffect(() => {
    cargarEmpresas();
  }, [filtroTarget]);

  const cargarEmpresas = async () => {
    setLoading(true);
    try {
      const data = await fetchEmpresas(filtroTarget);
      setEmpresas(data);
      
      // Cargar contadores de interacciones del último mes
      const thirtyDaysAgo = subDays(new Date(), 30).toISOString();
      const { data: interacciones } = await supabase
        .from('interacciones')
        .select('empresa_id, siguiente_accion, fecha_siguiente_accion')
        .gte('fecha', thirtyDaysAgo);
      
      if (interacciones) {
        const counts: Record<string, { total: number; pendientes: number }> = {};
        interacciones.forEach((int) => {
          if (int.empresa_id) {
            if (!counts[int.empresa_id]) {
              counts[int.empresa_id] = { total: 0, pendientes: 0 };
            }
            counts[int.empresa_id].total++;
            if (int.siguiente_accion && int.fecha_siguiente_accion) {
              counts[int.empresa_id].pendientes++;
            }
          }
        });
        setInteraccionesCounts(counts);
      }
    } catch (error) {
      console.error("Error cargando empresas:", error);
      toast.error("Error al cargar las empresas");
    } finally {
      setLoading(false);
    }
  };

  const handleEmpresaCreada = () => {
    cargarEmpresas();
    setDrawerOpen(false);
  };

  const columns = [
    {
      key: "nombre",
      label: "Empresa",
      sortable: true,
      filterable: true,
      render: (value: string, row: Empresa) => (
        <div>
          <p className="font-medium">{value}</p>
          <div className="flex items-center gap-2 mt-1">
            {row.es_target && (
              <Badge variant="outline" className="text-xs">🎯 Target</Badge>
            )}
            {row.sector && (
              <span className="text-xs text-muted-foreground">{row.sector}</span>
            )}
          </div>
        </div>
      ),
    },
    { 
      key: "ubicacion", 
      label: "Ubicación",
      render: (value: string) => <span className="text-sm">{value || "-"}</span>
    },
    {
      key: "facturacion",
      label: "Facturación",
      sortable: true,
      render: (value: number) => value ? `€${(value / 1000000).toFixed(1)}M` : "-"
    },
    {
      key: "empleados",
      label: "Empleados",
      sortable: true,
      render: (value: number) => value || "-"
    },
    {
      key: "updated_at",
      label: "Última Actividad",
      sortable: true,
      render: (value: string, row: Empresa) => {
        if (!value) return "-";
        const date = new Date(value);
        const isRecent = isAfter(date, subDays(new Date(), 7));
        const interaccionesData = interaccionesCounts[row.id];
        
        return (
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <span className="text-sm">{format(date, "dd MMM", { locale: es })}</span>
              {isRecent && <Badge variant="secondary" className="text-xs">Reciente</Badge>}
            </div>
            {interaccionesData && interaccionesData.total > 0 && (
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-xs flex items-center gap-1">
                  <Activity className="h-3 w-3" />
                  {interaccionesData.total} interacción{interaccionesData.total !== 1 ? 'es' : ''} (30d)
                </Badge>
                {interaccionesData.pendientes > 0 && (
                  <Badge className="bg-yellow-500 hover:bg-yellow-600 text-white text-xs">
                    ⏰ {interaccionesData.pendientes} pendiente{interaccionesData.pendientes !== 1 ? 's' : ''}
                  </Badge>
                )}
              </div>
            )}
          </div>
        );
      }
    },
    {
      key: "nivel_interes",
      label: "Interés",
      render: (value: string, row: Empresa) => {
        if (!row.es_target || !value) return "-";
        const colors: Record<string, string> = {
          Alto: "destructive",
          Medio: "default",
          Bajo: "secondary"
        };
        return <Badge variant={colors[value] as any}>{value}</Badge>;
      }
    },
    {
      key: "id",
      label: "Acciones",
      render: (_: any, row: Empresa) => (
        <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
          {row.sitio_web && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => window.open(row.sitio_web, "_blank")}
              title="Visitar web"
            >
              <Globe className="h-4 w-4" />
            </Button>
          )}
        </div>
      )
    },
  ];

  return (
    <div>
      <PageHeader
        title="Empresas"
        description="Base de datos de empresas y targets potenciales"
        actionLabel="Nueva Empresa"
        onAction={() => setDrawerOpen(true)}
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Empresas</p>
                <p className="text-2xl font-bold">{kpis.total}</p>
              </div>
              <Building2 className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Targets</p>
                <p className="text-2xl font-bold">{kpis.targets}</p>
                <p className="text-xs text-muted-foreground">{kpis.targetPercentage}% del total</p>
              </div>
              <Target className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Facturación Media</p>
                <p className="text-2xl font-bold">€{(kpis.facturacionPromedio / 1000000).toFixed(1)}M</p>
              </div>
              <TrendingUp className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Empresas Activas</p>
                <p className="text-2xl font-bold">{empresas.filter(e => !e.es_target || (e.estado_target && e.estado_target !== 'rechazada')).length}</p>
              </div>
              <Activity className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
      </div>
      
      <div className="mb-4 flex gap-2">
        <Badge 
          variant={filtroTarget === undefined ? "default" : "outline"}
          className="cursor-pointer"
          onClick={() => setFiltroTarget(undefined)}
        >
          Todas
        </Badge>
        <Badge 
          variant={filtroTarget === true ? "default" : "outline"}
          className="cursor-pointer"
          onClick={() => setFiltroTarget(true)}
        >
          Targets
        </Badge>
        <Badge 
          variant={filtroTarget === false ? "default" : "outline"}
          className="cursor-pointer"
          onClick={() => setFiltroTarget(false)}
        >
          No Targets
        </Badge>
      </div>

      <DataTableEnhanced
        columns={columns}
        data={empresas}
        loading={loading}
        onRowClick={(row) => navigate(`/empresas/${row.id}`)}
        pageSize={10}
      />

      <NuevoEmpresaDrawer
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        onEmpresaCreada={handleEmpresaCreada}
      />
    </div>
  );
}
