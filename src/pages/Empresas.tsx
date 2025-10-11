import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { PageHeader } from "@/components/shared/PageHeader";
import { DataTableEnhanced } from "@/components/shared/DataTableEnhanced";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { NuevoEmpresaDrawer } from "@/components/empresas/NuevoEmpresaDrawer";
import { useEmpresas } from "@/hooks/queries/useEmpresas";
import { supabase } from "@/integrations/supabase/client";
import type { Empresa } from "@/types";
import { Building2, Star, TrendingUp, Activity, Globe } from "lucide-react";
import { format, isAfter, subDays } from "date-fns";
import { es } from "date-fns/locale";
import { Skeleton } from "@/components/ui/skeleton";

export default function Empresas() {
  const navigate = useNavigate();
  const { data: empresas = [], isLoading } = useEmpresas();
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

  const empresasFiltradas = useMemo(() => {
    if (filtroTarget === undefined) return empresas;
    return empresas.filter(e => e.es_target === filtroTarget);
  }, [empresas, filtroTarget]);

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
              <Badge variant="outline" className="text-xs">⭐ Prioritaria</Badge>
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
        const colors: Record<string, any> = {
          Alto: "destructive",
          Medio: "default",
          Bajo: "secondary"
        };
        return <Badge variant={colors[value]}>{value}</Badge>;
      }
    },
    {
      key: "id",
      label: "Acciones",
      render: (_: string, row: Empresa) => (
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

  if (isLoading) {
    return (
      <div>
        <PageHeader title="Empresas" description="Base de datos de empresas de interés" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          {[1, 2, 3, 4].map(i => (
            <Card key={i}>
              <CardContent className="pt-6">
                <Skeleton className="h-20 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="Empresas"
        description="Base de datos de empresas de interés"
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
                <p className="text-sm font-medium text-muted-foreground">Prioritarias</p>
                <p className="text-2xl font-bold">{kpis.targets}</p>
                <p className="text-xs text-muted-foreground">{kpis.targetPercentage}% del total</p>
              </div>
              <Star className="h-8 w-8 text-primary" />
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
          Prioritarias
        </Badge>
        <Badge 
          variant={filtroTarget === false ? "default" : "outline"}
          className="cursor-pointer"
          onClick={() => setFiltroTarget(false)}
        >
          Otras
        </Badge>
      </div>

      <DataTableEnhanced
        columns={columns}
        data={empresasFiltradas}
        loading={isLoading}
        onRowClick={(row) => navigate(`/empresas/${row.id}`)}
        pageSize={10}
      />

      <NuevoEmpresaDrawer
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        onEmpresaCreada={() => setDrawerOpen(false)}
      />
    </div>
  );
}
