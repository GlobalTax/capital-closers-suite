import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar, Legend } from "recharts";
import { Send, CheckCircle, XCircle, TrendingUp, Clock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface EmailMetrics {
  total_sent: number;
  total_failed: number;
  total_pending: number;
  total_cancelled: number;
  avg_attempts: number;
  by_type: Record<string, number>;
  by_status: Record<string, number>;
  by_hour: Array<{
    hour: string;
    sent: number;
    failed: number;
    pending: number;
  }>;
  period: string;
  generated_at: string;
}

async function fetchEmailMetrics(period: string): Promise<EmailMetrics> {
  const { data, error } = await supabase.rpc("get_email_metrics", { p_period: period });
  if (error) throw error;
  return data as unknown as EmailMetrics;
}

const COLORS = ["#10b981", "#f59e0b", "#6366f1", "#ef4444", "#8b5cf6", "#06b6d4"];

export function MetricsTab() {
  const [period, setPeriod] = useState("24h");

  const { data: metrics, isLoading } = useQuery({
    queryKey: ["email-metrics", period],
    queryFn: () => fetchEmailMetrics(period),
    staleTime: 60000,
    refetchInterval: 60000,
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="pt-4">
                <Skeleton className="h-20" />
              </CardContent>
            </Card>
          ))}
        </div>
        <Card>
          <CardContent className="pt-4">
            <Skeleton className="h-[300px]" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!metrics) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-muted-foreground">
          No hay datos de métricas disponibles
        </CardContent>
      </Card>
    );
  }

  const total = metrics.total_sent + metrics.total_failed + metrics.total_pending + metrics.total_cancelled;
  const successRate = total > 0 ? ((metrics.total_sent / total) * 100).toFixed(1) : "0";

  // Prepare data for charts
  const typeData = Object.entries(metrics.by_type || {}).map(([name, value]) => ({
    name,
    value,
  }));

  const statusData = Object.entries(metrics.by_status || {}).map(([name, value]) => ({
    name: name === "sent" ? "Enviados" : name === "failed" ? "Fallidos" : name === "pending" ? "Pendientes" : name === "cancelled" ? "Cancelados" : name,
    value,
  }));

  const hourlyData = (metrics.by_hour || []).map((h) => ({
    ...h,
    hour: format(new Date(h.hour), "HH:mm", { locale: es }),
  }));

  return (
    <div className="space-y-6">
      {/* Period Selector */}
      <div className="flex justify-end">
        <Select value={period} onValueChange={setPeriod}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="1h">Última hora</SelectItem>
            <SelectItem value="24h">Últimas 24h</SelectItem>
            <SelectItem value="7d">Última semana</SelectItem>
            <SelectItem value="30d">Último mes</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Enviados</p>
                <p className="text-2xl font-bold text-emerald-600">{metrics.total_sent.toLocaleString()}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-emerald-500/50" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Fallidos</p>
                <p className="text-2xl font-bold text-destructive">{metrics.total_failed.toLocaleString()}</p>
              </div>
              <XCircle className="h-8 w-8 text-destructive/50" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Pendientes</p>
                <p className="text-2xl font-bold text-amber-600">{metrics.total_pending.toLocaleString()}</p>
              </div>
              <Clock className="h-8 w-8 text-amber-500/50" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Tasa de éxito</p>
                <p className="text-2xl font-bold text-primary">{successRate}%</p>
              </div>
              <TrendingUp className="h-8 w-8 text-primary/50" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Hourly Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Envíos por Hora</CardTitle>
            <CardDescription>Distribución temporal de envíos</CardDescription>
          </CardHeader>
          <CardContent>
            {hourlyData.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <AreaChart data={hourlyData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="hour" className="text-xs" />
                  <YAxis className="text-xs" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--popover))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "var(--radius)",
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="sent"
                    stackId="1"
                    stroke="#10b981"
                    fill="#10b981"
                    fillOpacity={0.6}
                    name="Enviados"
                  />
                  <Area
                    type="monotone"
                    dataKey="failed"
                    stackId="1"
                    stroke="#ef4444"
                    fill="#ef4444"
                    fillOpacity={0.6}
                    name="Fallidos"
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[250px] flex items-center justify-center text-muted-foreground">
                No hay datos para el período seleccionado
              </div>
            )}
          </CardContent>
        </Card>

        {/* Distribution by Type */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Distribución por Tipo</CardTitle>
            <CardDescription>Categorías de emails enviados</CardDescription>
          </CardHeader>
          <CardContent>
            {typeData.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={typeData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {typeData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[250px] flex items-center justify-center text-muted-foreground">
                No hay datos para el período seleccionado
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Status Bar Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Distribución por Estado</CardTitle>
          <CardDescription>Resumen de estados de la cola</CardDescription>
        </CardHeader>
        <CardContent>
          {statusData.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={statusData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis type="number" className="text-xs" />
                <YAxis dataKey="name" type="category" className="text-xs" width={100} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--popover))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "var(--radius)",
                  }}
                />
                <Bar dataKey="value" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[200px] flex items-center justify-center text-muted-foreground">
              No hay datos para el período seleccionado
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
