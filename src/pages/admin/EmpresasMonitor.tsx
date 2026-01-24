import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Building2, TrendingUp, AlertTriangle, Clock, Database } from "lucide-react";
import { format, subDays, startOfDay } from "date-fns";
import { es } from "date-fns/locale";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend
} from "recharts";

interface DailyStats {
  fecha: string;
  total: number;
  source: string;
}

interface SourceBreakdown {
  source: string;
  count: number;
}

const SOURCE_COLORS: Record<string, string> = {
  'manual': '#3b82f6',
  'sync-leads': '#10b981',
  'sync-operations': '#f59e0b',
  'sync-brevo': '#8b5cf6',
  'import-csv': '#ec4899',
  'ai-import': '#06b6d4',
  'enrichment': '#84cc16'
};

const SOURCE_LABELS: Record<string, string> = {
  'manual': 'Manual',
  'sync-leads': 'Sync Leads',
  'sync-operations': 'Sync Operations',
  'sync-brevo': 'Sync Brevo',
  'import-csv': 'Import CSV',
  'ai-import': 'AI Import',
  'enrichment': 'Enrichment'
};

export default function EmpresasMonitor() {
  // Total companies count
  const { data: totalEmpresas } = useQuery({
    queryKey: ['empresas-monitor', 'total'],
    queryFn: async () => {
      const { count, error } = await supabase
        .from('empresas')
        .select('*', { count: 'exact', head: true });
      
      if (error) throw error;
      return count || 0;
    }
  });

  // Companies created today
  const { data: todayCount } = useQuery({
    queryKey: ['empresas-monitor', 'today'],
    queryFn: async () => {
      const today = startOfDay(new Date()).toISOString();
      const { count, error } = await supabase
        .from('empresas')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', today);
      
      if (error) throw error;
      return count || 0;
    }
  });

  // Daily stats for last 30 days
  const { data: dailyStats } = useQuery({
    queryKey: ['empresas-monitor', 'daily'],
    queryFn: async () => {
      const thirtyDaysAgo = subDays(new Date(), 30).toISOString();
      const { data, error } = await supabase
        .from('empresas')
        .select('created_at, source')
        .gte('created_at', thirtyDaysAgo)
        .order('created_at', { ascending: true });
      
      if (error) throw error;

      // Group by date
      const grouped = data?.reduce((acc, emp) => {
        const date = format(new Date(emp.created_at!), 'yyyy-MM-dd');
        if (!acc[date]) acc[date] = 0;
        acc[date]++;
        return acc;
      }, {} as Record<string, number>) || {};

      // Fill missing dates
      const result = [];
      for (let i = 29; i >= 0; i--) {
        const date = format(subDays(new Date(), i), 'yyyy-MM-dd');
        result.push({
          fecha: format(subDays(new Date(), i), 'dd MMM', { locale: es }),
          total: grouped[date] || 0
        });
      }

      return result;
    }
  });

  // Source breakdown
  const { data: sourceBreakdown } = useQuery({
    queryKey: ['empresas-monitor', 'sources'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('empresas')
        .select('source');
      
      if (error) throw error;

      const counts = data?.reduce((acc, emp) => {
        const source = emp.source || 'manual';
        acc[source] = (acc[source] || 0) + 1;
        return acc;
      }, {} as Record<string, number>) || {};

      return Object.entries(counts)
        .map(([source, count]) => ({ 
          source, 
          count,
          name: SOURCE_LABELS[source] || source
        }))
        .sort((a, b) => b.count - a.count);
    }
  });

  // Last 20 companies
  const { data: recentEmpresas } = useQuery({
    queryKey: ['empresas-monitor', 'recent'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('empresas')
        .select('id, nombre, source, created_at, sector')
        .order('created_at', { ascending: false })
        .limit(20);
      
      if (error) throw error;
      return data;
    }
  });

  // Alert: more than 50 companies created in last hour
  const { data: lastHourCount } = useQuery({
    queryKey: ['empresas-monitor', 'last-hour'],
    queryFn: async () => {
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
      const { count, error } = await supabase
        .from('empresas')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', oneHourAgo);
      
      if (error) throw error;
      return count || 0;
    },
    refetchInterval: 60000 // Refresh every minute
  });

  const hasAlert = (lastHourCount || 0) > 50;

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Monitor de Empresas</h1>
        <p className="text-muted-foreground">
          Visualiza el crecimiento y origen de las empresas en el CRM
        </p>
      </div>

      {/* Alert banner */}
      {hasAlert && (
        <Card className="border-destructive bg-destructive/10">
          <CardContent className="flex items-center gap-3 py-4">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            <div>
              <p className="font-medium text-destructive">Actividad inusual detectada</p>
              <p className="text-sm text-muted-foreground">
                Se han creado {lastHourCount} empresas en la última hora. Revisa las sincronizaciones.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stats cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Empresas</CardTitle>
            <Database className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalEmpresas?.toLocaleString()}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Creadas Hoy</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{todayCount}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Última Hora</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${hasAlert ? 'text-destructive' : ''}`}>
              {lastHourCount}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Fuentes Activas</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{sourceBreakdown?.length || 0}</div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Empresas Creadas (últimos 30 días)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={dailyStats}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis 
                    dataKey="fecha" 
                    tick={{ fontSize: 12 }}
                    className="text-muted-foreground"
                  />
                  <YAxis tick={{ fontSize: 12 }} className="text-muted-foreground" />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="total" 
                    stroke="hsl(var(--primary))" 
                    fill="hsl(var(--primary) / 0.2)"
                    name="Empresas"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Distribución por Fuente</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={sourceBreakdown}
                    dataKey="count"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    label={({ name, percent }) => 
                      `${name} (${(percent * 100).toFixed(0)}%)`
                    }
                    labelLine={false}
                  >
                    {sourceBreakdown?.map((entry, index) => (
                      <Cell 
                        key={entry.source} 
                        fill={SOURCE_COLORS[entry.source] || `hsl(${index * 45}, 70%, 50%)`}
                      />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent companies table */}
      <Card>
        <CardHeader>
          <CardTitle>Últimas Empresas Creadas</CardTitle>
          <CardDescription>Las 20 empresas más recientes</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {recentEmpresas?.map((empresa) => (
              <div 
                key={empresa.id}
                className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
              >
                <div className="flex items-center gap-3">
                  <Building2 className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="font-medium">{empresa.nombre}</p>
                    <p className="text-sm text-muted-foreground">{empresa.sector || 'Sin sector'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Badge 
                    variant="outline"
                    style={{ 
                      borderColor: SOURCE_COLORS[empresa.source || 'manual'],
                      color: SOURCE_COLORS[empresa.source || 'manual']
                    }}
                  >
                    {SOURCE_LABELS[empresa.source || 'manual'] || empresa.source}
                  </Badge>
                  <span className="text-sm text-muted-foreground">
                    {format(new Date(empresa.created_at!), 'dd/MM HH:mm', { locale: es })}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
