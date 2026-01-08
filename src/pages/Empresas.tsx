import { useState, useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { PageHeader } from "@/components/shared/PageHeader";
import { DataTableEnhanced } from "@/components/shared/DataTableEnhanced";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { NuevoEmpresaDrawer } from "@/components/empresas/NuevoEmpresaDrawer";
import { AIImportDrawer } from "@/components/importacion/AIImportDrawer";
import { useEmpresasPaginated } from "@/hooks/queries/useEmpresas";
import { useEmpresasRealtime } from "@/hooks/useEmpresasRealtime";
import type { Empresa } from "@/types";
import { Building2, Star, TrendingUp, Activity, Globe, Sparkles } from "lucide-react";
import { format, isAfter, subDays } from "date-fns";
import { es } from "date-fns/locale";
import { Skeleton } from "@/components/ui/skeleton";
import { DEFAULT_PAGE_SIZE } from "@/types/pagination";

export default function Empresas() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const page = parseInt(searchParams.get('page') || '1', 10);
  
  const [filtroTarget, setFiltroTarget] = useState<boolean | undefined>(undefined);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [aiImportOpen, setAiImportOpen] = useState(false);
  const [interaccionesCounts, setInteraccionesCounts] = useState<Record<string, { total: number; pendientes: number }>>({});
  
  const { data: result, isLoading } = useEmpresasPaginated(page, DEFAULT_PAGE_SIZE, filtroTarget);
  useEmpresasRealtime();

  const empresas = result?.data || [];

  const handlePageChange = (newPage: number) => {
    setSearchParams({ page: newPage.toString() });
  };

  // KPIs basados en count del servidor
  const kpis = useMemo(() => {
    const total = result?.count || 0;
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
  }, [result, empresas]);

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

  if (isLoading && !result) {
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
        extraActions={
          <Button variant="outline" onClick={() => setAiImportOpen(true)}>
            <Sparkles className="h-4 w-4 mr-2" />
            Importar con IA
          </Button>
        }
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Empresas</p>
                <p className="text-2xl font-medium">{kpis.total}</p>
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
                <p className="text-2xl font-medium">{kpis.targets}</p>
                <p className="text-xs text-muted-foreground">en página actual</p>
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
                <p className="text-2xl font-medium">€{(kpis.facturacionPromedio / 1000000).toFixed(1)}M</p>
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
                <p className="text-2xl font-medium">{empresas.filter(e => !e.es_target || (e.estado_target && e.estado_target !== 'rechazada')).length}</p>
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
          onClick={() => { setFiltroTarget(undefined); setSearchParams({ page: '1' }); }}
        >
          Todas
        </Badge>
        <Badge 
          variant={filtroTarget === true ? "default" : "outline"}
          className="cursor-pointer"
          onClick={() => { setFiltroTarget(true); setSearchParams({ page: '1' }); }}
        >
          Prioritarias
        </Badge>
        <Badge 
          variant={filtroTarget === false ? "default" : "outline"}
          className="cursor-pointer"
          onClick={() => { setFiltroTarget(false); setSearchParams({ page: '1' }); }}
        >
          Otras
        </Badge>
      </div>

      <DataTableEnhanced
        columns={columns}
        data={empresas}
        loading={isLoading}
        onRowClick={(row) => navigate(`/empresas/${row.id}`)}
        pageSize={DEFAULT_PAGE_SIZE}
        serverPagination={{
          currentPage: page,
          totalPages: result?.totalPages || 1,
          totalCount: result?.count || 0,
          onPageChange: handlePageChange,
        }}
      />

      <NuevoEmpresaDrawer
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        onEmpresaCreada={() => setDrawerOpen(false)}
      />

      <AIImportDrawer
        open={aiImportOpen}
        onOpenChange={setAiImportOpen}
        defaultMode="empresa"
        onSuccess={() => {}}
      />
    </div>
  );
}
