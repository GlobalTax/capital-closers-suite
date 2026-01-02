import { useState } from "react";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  BarChart3, TrendingUp, Briefcase, Target, Clock, DollarSign, 
  CalendarCheck, AlertTriangle, Download, RefreshCw, FileText,
  ArrowUpRight, ArrowDownRight
} from "lucide-react";
import { useReportData } from "@/hooks/useReportData";
import { 
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, LineChart, Line, Legend, AreaChart, Area
} from "recharts";
import { SyncFromBrevoCard } from "@/components/sync/SyncFromBrevoCard";
import { SyncLeadsCard } from "@/components/sync/SyncLeadsCard";
import { AgingAlertsBanner } from "@/components/alerts/AgingAlertsBanner";

const COLORS = ['#3b82f6', '#8b5cf6', '#f59e0b', '#ef4444', '#22c55e', '#06b6d4', '#ec4899', '#84cc16'];

const iconMap: Record<string, React.ElementType> = {
  TrendingUp, Scale: TrendingUp, Briefcase, Target, Clock, DollarSign, CalendarCheck, AlertTriangle
};

export default function Reportes() {
  const { kpis, pipelineMetrics, timeMetrics, comparisonMetrics, alertMetrics, loading, refetch, filters, setFilters } = useReportData();
  const [activeTab, setActiveTab] = useState("pipeline");

  const handleExportPDF = async () => {
    const { default: html2canvas } = await import('html2canvas');
    const { default: jsPDF } = await import('jspdf');
    
    const element = document.getElementById('report-content');
    if (!element) return;
    
    const canvas = await html2canvas(element, { scale: 2 });
    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF('l', 'mm', 'a4');
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
    pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
    pdf.save(`reporte-${new Date().toISOString().split('T')[0]}.pdf`);
  };

  if (loading) {
    return (
      <div>
        <PageHeader title="Reportes M&A" description="Dashboard ejecutivo y análisis avanzado" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {[1,2,3,4,5,6,7,8].map(i => <Skeleton key={i} className="h-28" />)}
        </div>
      </div>
    );
  }

  return (
    <div>
      <PageHeader 
        title="Reportes M&A" 
        description="Dashboard ejecutivo y análisis avanzado"
        icon={<BarChart3 className="w-6 h-6" />}
      />

      {/* Filters */}
      <div className="flex items-center gap-4 mb-6">
        <Select 
          value={filters.tipoMandato} 
          onValueChange={(v) => setFilters({ ...filters, tipoMandato: v as any })}
        >
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Tipo" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos</SelectItem>
            <SelectItem value="compra">Compra</SelectItem>
            <SelectItem value="venta">Venta</SelectItem>
          </SelectContent>
        </Select>
        <Button variant="outline" size="sm" onClick={refetch}>
          <RefreshCw className="w-4 h-4 mr-2" /> Actualizar
        </Button>
        <Button variant="outline" size="sm" onClick={handleExportPDF}>
          <Download className="w-4 h-4 mr-2" /> Exportar PDF
        </Button>
      </div>

      <div id="report-content" className="space-y-6">
        {/* KPIs */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {kpis.map((kpi) => {
            const Icon = iconMap[kpi.icon] || FileText;
            return (
              <Card key={kpi.id}>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">{kpi.title}</CardTitle>
                  <Icon className={`w-5 h-5 ${kpi.color}`} />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{kpi.value}</div>
                  <p className="text-xs text-muted-foreground">{kpi.description}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <AgingAlertsBanner variant="compact" showDismiss={false} />

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="pipeline">Pipeline</TabsTrigger>
            <TabsTrigger value="tiempo">Tiempo</TabsTrigger>
            <TabsTrigger value="comparacion">Compra vs Venta</TabsTrigger>
            <TabsTrigger value="alertas">Alertas</TabsTrigger>
            <TabsTrigger value="integraciones">Integraciones</TabsTrigger>
          </TabsList>

          <TabsContent value="pipeline" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <Card>
                <CardHeader><CardTitle>Valor por Etapa</CardTitle></CardHeader>
                <CardContent className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={pipelineMetrics} layout="vertical">
                      <XAxis type="number" tickFormatter={(v) => `€${(v/1000000).toFixed(1)}M`} />
                      <YAxis type="category" dataKey="stage_name" width={100} />
                      <Tooltip formatter={(v: number) => `€${(v/1000000).toFixed(2)}M`} />
                      <Bar dataKey="total_value" fill="#3b82f6" radius={4} />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
              <Card>
                <CardHeader><CardTitle>Deals por Etapa</CardTitle></CardHeader>
                <CardContent className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={pipelineMetrics} dataKey="deal_count" nameKey="stage_name" cx="50%" cy="50%" outerRadius={100} label>
                        {pipelineMetrics.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="tiempo" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <Card>
                <CardHeader><CardTitle>Horas por Semana</CardTitle></CardHeader>
                <CardContent className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={timeMetrics?.hoursByWeek || []}>
                      <XAxis dataKey="week" />
                      <YAxis />
                      <Tooltip />
                      <Area type="monotone" dataKey="hours" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.3} name="Total" />
                      <Area type="monotone" dataKey="billable" stroke="#22c55e" fill="#22c55e" fillOpacity={0.3} name="Facturable" />
                      <Legend />
                    </AreaChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
              <Card>
                <CardHeader><CardTitle>Horas por Tipo</CardTitle></CardHeader>
                <CardContent className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={timeMetrics?.hoursByType || []} dataKey="hours" nameKey="type" cx="50%" cy="50%" outerRadius={100} label>
                        {(timeMetrics?.hoursByType || []).map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="comparacion" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader><CardTitle className="flex items-center gap-2"><ArrowUpRight className="text-green-500" /> Compra</CardTitle></CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex justify-between"><span>Deals:</span><Badge>{comparisonMetrics?.compra.count || 0}</Badge></div>
                  <div className="flex justify-between"><span>Valor Total:</span><span className="font-bold">€{((comparisonMetrics?.compra.totalValue || 0)/1000000).toFixed(1)}M</span></div>
                  <div className="flex justify-between"><span>Conversión:</span><span>{comparisonMetrics?.compra.conversionRate || 0}%</span></div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader><CardTitle className="flex items-center gap-2"><ArrowDownRight className="text-blue-500" /> Venta</CardTitle></CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex justify-between"><span>Deals:</span><Badge>{comparisonMetrics?.venta.count || 0}</Badge></div>
                  <div className="flex justify-between"><span>Valor Total:</span><span className="font-bold">€{((comparisonMetrics?.venta.totalValue || 0)/1000000).toFixed(1)}M</span></div>
                  <div className="flex justify-between"><span>Conversión:</span><span>{comparisonMetrics?.venta.conversionRate || 0}%</span></div>
                </CardContent>
              </Card>
            </div>
            <Card>
              <CardHeader><CardTitle>Por Sector</CardTitle></CardHeader>
              <CardContent className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={comparisonMetrics?.bySector || []}>
                    <XAxis dataKey="sector" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="compra" fill="#22c55e" name="Compra" />
                    <Bar dataKey="venta" fill="#3b82f6" name="Venta" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="alertas" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader><CardTitle className="flex items-center gap-2"><AlertTriangle className="text-red-500" /> Deals Estancados</CardTitle></CardHeader>
                <CardContent>
                  {alertMetrics?.stuckDeals.length ? (
                    <div className="space-y-2">
                      {alertMetrics.stuckDeals.slice(0,5).map(d => (
                        <div key={d.id} className="flex justify-between items-center p-2 bg-muted rounded">
                          <span className="truncate">{d.nombre}</span>
                          <Badge variant="destructive">{d.daysInStage} días</Badge>
                        </div>
                      ))}
                    </div>
                  ) : <p className="text-muted-foreground">Sin deals estancados</p>}
                </CardContent>
              </Card>
              <Card>
                <CardHeader><CardTitle className="flex items-center gap-2"><CalendarCheck className="text-cyan-500" /> Próximos Cierres</CardTitle></CardHeader>
                <CardContent>
                  {alertMetrics?.upcomingClosings.length ? (
                    <div className="space-y-2">
                      {alertMetrics.upcomingClosings.slice(0,5).map(d => (
                        <div key={d.id} className="flex justify-between items-center p-2 bg-muted rounded">
                          <span className="truncate">{d.nombre}</span>
                          <Badge variant="outline">{d.daysUntilClose} días</Badge>
                        </div>
                      ))}
                    </div>
                  ) : <p className="text-muted-foreground">Sin cierres próximos</p>}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="integraciones" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <SyncLeadsCard />
              <SyncFromBrevoCard />
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
