import { useState } from "react";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { 
  BarChart3, TrendingUp, Briefcase, Target, Clock, DollarSign, 
  CalendarCheck, AlertTriangle, Download, RefreshCw, FileText,
  ArrowUpRight, ArrowDownRight, Activity, Trophy, XCircle
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useInactiveMandatos } from "@/hooks/useMandatoActivity";
import { useReportData } from "@/hooks/useReportData";
import { useWinLossMetrics } from "@/hooks/useWinLossMetrics";
import { useTopMandatosByCost, useTotalCostMetrics } from "@/hooks/useMandatoCosts";
import { 
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, LineChart, Line, Legend, AreaChart, Area
} from "recharts";
import { SyncFromBrevoCard } from "@/components/sync/SyncFromBrevoCard";
import { SyncLeadsCard } from "@/components/sync/SyncLeadsCard";
import { SyncDealsFromBrevoCard } from "@/components/sync/SyncDealsFromBrevoCard";
import { AgingAlertsBanner } from "@/components/alerts/AgingAlertsBanner";

const COLORS = ['#3b82f6', '#8b5cf6', '#f59e0b', '#ef4444', '#22c55e', '#06b6d4', '#ec4899', '#84cc16'];

const iconMap: Record<string, React.ElementType> = {
  TrendingUp, Scale: TrendingUp, Briefcase, Target, Clock, DollarSign, CalendarCheck, AlertTriangle
};

export default function Reportes() {
  const navigate = useNavigate();
  const { kpis, pipelineMetrics, timeMetrics, comparisonMetrics, alertMetrics, loading, refetch, filters, setFilters } = useReportData();
  const { inactiveMandatos, count: inactiveCount } = useInactiveMandatos(14);
  const { data: winLossMetrics, isLoading: winLossLoading } = useWinLossMetrics();
  const { data: topMandatosByCost, isLoading: costLoading } = useTopMandatosByCost(10);
  const { data: costMetrics } = useTotalCostMetrics();
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
        <PageHeader title="Reportes M&A" description="Dashboard ejecutivo y análisis" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-4 md:mb-6">
          {[1,2,3,4,5,6,7,8].map(i => <Skeleton key={i} className="h-24 md:h-28" />)}
        </div>
      </div>
    );
  }

  return (
    <div>
      <PageHeader 
        title="Reportes M&A" 
        description="Dashboard ejecutivo y análisis"
        icon={<BarChart3 className="w-5 h-5 md:w-6 md:h-6" />}
      />

      {/* Filters - responsive */}
      <div className="flex flex-wrap items-center gap-2 md:gap-4 mb-4 md:mb-6">
        <Select 
          value={filters.tipoMandato} 
          onValueChange={(v) => setFilters({ ...filters, tipoMandato: v as any })}
        >
          <SelectTrigger className="w-28 md:w-40 h-8 md:h-9 text-sm">
            <SelectValue placeholder="Tipo" />
          </SelectTrigger>
          <SelectContent className="bg-background">
            <SelectItem value="todos">Todos</SelectItem>
            <SelectItem value="compra">Compra</SelectItem>
            <SelectItem value="venta">Venta</SelectItem>
          </SelectContent>
        </Select>
        <Button variant="outline" size="sm" onClick={refetch} className="h-8 px-2 md:px-3">
          <RefreshCw className="w-4 h-4" />
          <span className="hidden sm:inline ml-1.5">Actualizar</span>
        </Button>
        <Button variant="outline" size="sm" onClick={handleExportPDF} className="h-8 px-2 md:px-3">
          <Download className="w-4 h-4" />
          <span className="hidden sm:inline ml-1.5">PDF</span>
        </Button>
      </div>

      <div id="report-content" className="space-y-4 md:space-y-6">
        {/* KPIs */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
          {kpis.map((kpi) => {
            const Icon = iconMap[kpi.icon] || FileText;
            return (
              <Card key={kpi.id}>
                <CardHeader className="flex flex-row items-center justify-between p-3 md:p-4 pb-1 md:pb-2">
                  <CardTitle className="text-xs md:text-sm font-medium text-muted-foreground">{kpi.title}</CardTitle>
                  <Icon className={`w-4 h-4 md:w-5 md:h-5 ${kpi.color}`} />
                </CardHeader>
                <CardContent className="p-3 md:p-4 pt-0">
                  <div className="text-xl md:text-2xl font-medium">{kpi.value}</div>
                  <p className="text-[10px] md:text-xs text-muted-foreground">{kpi.description}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <AgingAlertsBanner variant="compact" showDismiss={false} />

        {/* Tabs - scrollable on mobile */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="w-full overflow-x-auto flex-nowrap justify-start h-auto p-1 gap-1">
            <TabsTrigger value="pipeline" className="text-xs md:text-sm px-2 md:px-3 py-1.5 shrink-0">Pipeline</TabsTrigger>
            <TabsTrigger value="winloss" className="text-xs md:text-sm px-2 md:px-3 py-1.5 shrink-0">Win/Loss</TabsTrigger>
            <TabsTrigger value="tiempo" className="text-xs md:text-sm px-2 md:px-3 py-1.5 shrink-0">Tiempo</TabsTrigger>
            <TabsTrigger value="comparacion" className="text-xs md:text-sm px-2 md:px-3 py-1.5 shrink-0">Compra vs Venta</TabsTrigger>
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

          {/* Win/Loss Tab */}
          <TabsContent value="winloss" className="space-y-4">
            {winLossLoading ? (
              <div className="grid grid-cols-4 gap-4">
                {[1,2,3,4].map(i => <Skeleton key={i} className="h-28" />)}
              </div>
            ) : winLossMetrics ? (
              <>
                {/* Win/Loss KPI Cards */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                      <CardTitle className="text-sm font-medium text-muted-foreground">Win Rate</CardTitle>
                      <Trophy className="w-5 h-5 text-green-500" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-medium text-green-600">{winLossMetrics.winRate}%</div>
                      <p className="text-xs text-muted-foreground">De {winLossMetrics.totalClosed} cerrados</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                      <CardTitle className="text-sm font-medium text-muted-foreground">Ganados</CardTitle>
                      <Trophy className="w-5 h-5 text-green-500" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-medium">{winLossMetrics.wonCount}</div>
                      <p className="text-xs text-muted-foreground">€{(winLossMetrics.totalWonValue/1000000).toFixed(1)}M total</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                      <CardTitle className="text-sm font-medium text-muted-foreground">Perdidos</CardTitle>
                      <XCircle className="w-5 h-5 text-destructive" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-medium text-destructive">{winLossMetrics.lostCount}</div>
                      <p className="text-xs text-muted-foreground">{winLossMetrics.lossesByReason.length} razones distintas</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                      <CardTitle className="text-sm font-medium text-muted-foreground">Cancelados</CardTitle>
                      <AlertTriangle className="w-5 h-5 text-orange-500" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-medium text-orange-600">{winLossMetrics.cancelledCount}</div>
                      <p className="text-xs text-muted-foreground">Mandatos cancelados</p>
                    </CardContent>
                  </Card>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {/* Losses by Reason Chart */}
                  <Card>
                    <CardHeader><CardTitle>Pérdidas por Razón</CardTitle></CardHeader>
                    <CardContent className="h-72">
                      {winLossMetrics.lossesByReason.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={winLossMetrics.lossesByReason} layout="vertical">
                            <XAxis type="number" />
                            <YAxis type="category" dataKey="label" width={180} tick={{ fontSize: 12 }} />
                            <Tooltip formatter={(v: number) => [`${v} deals`, 'Cantidad']} />
                            <Bar dataKey="count" fill="#ef4444" radius={4} />
                          </BarChart>
                        </ResponsiveContainer>
                      ) : (
                        <div className="flex items-center justify-center h-full text-muted-foreground">
                          Sin datos de pérdidas registradas
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* Losses by Stage Chart */}
                  <Card>
                    <CardHeader><CardTitle>Pérdidas por Etapa del Pipeline</CardTitle></CardHeader>
                    <CardContent className="h-72">
                      {winLossMetrics.lossesByStage.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={winLossMetrics.lossesByStage}>
                            <XAxis dataKey="stage_label" />
                            <YAxis />
                            <Tooltip formatter={(v: number) => [`${v} deals`, 'Perdidos']} />
                            <Bar dataKey="count" fill="#f59e0b" radius={4} />
                          </BarChart>
                        </ResponsiveContainer>
                      ) : (
                        <div className="flex items-center justify-center h-full text-muted-foreground">
                          Sin datos de pérdidas por etapa
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>

                {/* Win Rate by Type Table */}
                <Card>
                  <CardHeader><CardTitle>Win Rate por Tipo de Mandato</CardTitle></CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Tipo</TableHead>
                          <TableHead className="text-right">Ganados</TableHead>
                          <TableHead className="text-right">Perdidos</TableHead>
                          <TableHead className="text-right">Cancelados</TableHead>
                          <TableHead className="text-right">Win Rate</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {winLossMetrics.byType.map((row) => (
                          <TableRow key={row.tipo}>
                            <TableCell className="font-medium capitalize">{row.tipo}</TableCell>
                            <TableCell className="text-right text-green-600">{row.won}</TableCell>
                            <TableCell className="text-right text-destructive">{row.lost}</TableCell>
                            <TableCell className="text-right text-orange-600">{row.cancelled}</TableCell>
                            <TableCell className="text-right">
                              <Badge variant={row.winRate >= 50 ? "default" : "secondary"}>
                                {row.winRate}%
                              </Badge>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              </>
            ) : (
              <Card>
                <CardContent className="py-8 text-center text-muted-foreground">
                  No hay datos de Win/Loss disponibles
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="tiempo" className="space-y-4">
            {/* Cost KPI Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Coste Total</CardTitle>
                  <DollarSign className="w-5 h-5 text-primary" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-medium">€{(costMetrics?.totalCost || 0).toLocaleString()}</div>
                  <p className="text-xs text-muted-foreground">{costMetrics?.mandatosWithCost || 0} mandatos con coste</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Horas Totales</CardTitle>
                  <Clock className="w-5 h-5 text-blue-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-medium">{costMetrics?.totalHours || 0}h</div>
                  <p className="text-xs text-muted-foreground">Registradas en el sistema</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Billable Rate</CardTitle>
                  <TrendingUp className="w-5 h-5 text-green-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-medium text-green-600">{costMetrics?.avgBillableRate || 0}%</div>
                  <p className="text-xs text-muted-foreground">Promedio facturable</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Coste/Hora Medio</CardTitle>
                  <DollarSign className="w-5 h-5 text-orange-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-medium">
                    €{costMetrics?.totalHours ? Math.round(costMetrics.totalCost / costMetrics.totalHours) : 0}
                  </div>
                  <p className="text-xs text-muted-foreground">Tarifa media aplicada</p>
                </CardContent>
              </Card>
            </div>

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

            {/* Top 10 Mandatos by Cost */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="w-5 h-5" />
                  Top 10 Mandatos por Coste de Ejecución
                </CardTitle>
              </CardHeader>
              <CardContent>
                {costLoading ? (
                  <div className="space-y-2">
                    {[1,2,3].map(i => <Skeleton key={i} className="h-12" />)}
                  </div>
                ) : topMandatosByCost?.length ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Mandato</TableHead>
                        <TableHead className="text-right">Horas</TableHead>
                        <TableHead className="text-right">€ Coste</TableHead>
                        <TableHead className="text-right">% Billable</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {topMandatosByCost.map((m) => (
                        <TableRow 
                          key={m.mandatoId} 
                          className="cursor-pointer hover:bg-muted/50"
                          onClick={() => navigate(`/mandatos/${m.mandatoId}`)}
                        >
                          <TableCell className="font-medium">
                            {m.empresaNombre || m.descripcion || 'Sin nombre'}
                          </TableCell>
                          <TableCell className="text-right">{m.totalHours}h</TableCell>
                          <TableCell className="text-right font-medium">
                            €{m.totalCost.toLocaleString()}
                          </TableCell>
                          <TableCell className="text-right">
                            <Badge variant={m.billablePercentage >= 80 ? "default" : "secondary"}>
                              {m.billablePercentage}%
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <p className="text-muted-foreground text-center py-4">
                    Sin datos de coste disponibles
                  </p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="comparacion" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader><CardTitle className="flex items-center gap-2"><ArrowUpRight className="text-green-500" /> Compra</CardTitle></CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex justify-between"><span>Deals:</span><Badge>{comparisonMetrics?.compra.count || 0}</Badge></div>
                  <div className="flex justify-between"><span>Valor Total:</span><span className="font-medium">€{((comparisonMetrics?.compra.totalValue || 0)/1000000).toFixed(1)}M</span></div>
                  <div className="flex justify-between"><span>Conversión:</span><span>{comparisonMetrics?.compra.conversionRate || 0}%</span></div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader><CardTitle className="flex items-center gap-2"><ArrowDownRight className="text-blue-500" /> Venta</CardTitle></CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex justify-between"><span>Deals:</span><Badge>{comparisonMetrics?.venta.count || 0}</Badge></div>
                  <div className="flex justify-between"><span>Valor Total:</span><span className="font-medium">€{((comparisonMetrics?.venta.totalValue || 0)/1000000).toFixed(1)}M</span></div>
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
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardHeader><CardTitle className="flex items-center gap-2"><AlertTriangle className="text-red-500" /> Deals Estancados</CardTitle></CardHeader>
                <CardContent>
                  {alertMetrics?.stuckDeals.length ? (
                    <div className="space-y-2">
                      {alertMetrics.stuckDeals.slice(0,5).map(d => (
                        <div 
                          key={d.id} 
                          className="flex justify-between items-center p-2 bg-muted rounded cursor-pointer hover:bg-muted/80"
                          onClick={() => navigate(`/mandatos/${d.id}`)}
                        >
                          <span className="truncate">{d.nombre}</span>
                          <Badge variant="destructive">{d.daysInStage} días</Badge>
                        </div>
                      ))}
                    </div>
                  ) : <p className="text-muted-foreground">Sin deals estancados</p>}
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Activity className="text-orange-500" /> 
                    Sin Actividad (+14 días)
                    {inactiveCount > 0 && <Badge variant="destructive">{inactiveCount}</Badge>}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {inactiveMandatos.length ? (
                    <div className="space-y-2">
                      {inactiveMandatos.slice(0, 5).map(m => (
                        <div 
                          key={m.id} 
                          className="flex justify-between items-center p-2 bg-muted rounded cursor-pointer hover:bg-muted/80"
                          onClick={() => navigate(`/mandatos/${m.id}`)}
                        >
                          <span className="truncate">{m.empresa_principal?.nombre || m.descripcion || 'Sin nombre'}</span>
                          <Badge variant="outline">{m.dias_sin_actividad}d</Badge>
                        </div>
                      ))}
                    </div>
                  ) : <p className="text-muted-foreground">Todos los mandatos tienen actividad reciente</p>}
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader><CardTitle className="flex items-center gap-2"><CalendarCheck className="text-cyan-500" /> Próximos Cierres</CardTitle></CardHeader>
                <CardContent>
                  {alertMetrics?.upcomingClosings.length ? (
                    <div className="space-y-2">
                      {alertMetrics.upcomingClosings.slice(0,5).map(d => (
                        <div 
                          key={d.id} 
                          className="flex justify-between items-center p-2 bg-muted rounded cursor-pointer hover:bg-muted/80"
                          onClick={() => navigate(`/mandatos/${d.id}`)}
                        >
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <SyncLeadsCard />
              <SyncFromBrevoCard />
              <SyncDealsFromBrevoCard />
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
