import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, FileText, Activity, Target, ListTodo, Upload, Plus, Euro, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getMandatoById, updateMandato } from "@/services/mandatos";
import { fetchDocumentos } from "@/services/documentos";
import { fetchTareas } from "@/services/tareas";
import type { Mandato, Documento, Tarea } from "@/types";
import { BadgeStatus } from "@/components/shared/BadgeStatus";
import { MANDATO_ESTADOS } from "@/lib/constants";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useMandatoTransactions } from "@/hooks/useMandatoTransactions";
import { TransactionForm } from "@/components/mandatos/TransactionForm";
import { TransactionTable } from "@/components/mandatos/TransactionTable";
import { CashFlowChart } from "@/components/mandatos/CashFlowChart";
import { FinancialKPICard } from "@/components/mandatos/FinancialKPICard";
import { NuevoTargetDrawer } from "@/components/targets/NuevoTargetDrawer";
import { DocumentUploadZone } from "@/components/documentos/DocumentUploadZone";
import { DocumentList } from "@/components/documentos/DocumentList";
import { MandatoTimeline } from "@/components/mandatos/MandatoTimeline";
import { MandatoTipoEspecifico } from "@/components/mandatos/MandatoTipoEspecifico";
import { InformacionFinancieraEmpresa } from "@/components/mandatos/InformacionFinancieraEmpresa";
import { ContactosClaveCard } from "@/components/mandatos/ContactosClaveCard";
import { EmpresasAsociadasCard } from "@/components/mandatos/EmpresasAsociadasCard";
import { ChecklistMACard } from "@/components/mandatos/ChecklistMACard";
import { TimeTrackingDialog } from "@/components/mandatos/TimeTrackingDialog";
import { TimeEntriesTable } from "@/components/mandatos/TimeEntriesTable";
import { TimeTrackingStats } from "@/components/mandatos/TimeTrackingStats";
import { fetchTimeEntries, getTimeStats } from "@/services/timeTracking";
import { useChecklistTasks } from "@/hooks/useChecklistTasks";
import type { TimeEntry, TimeStats } from "@/types";
import { format } from "date-fns";
import { getPrioridadColor, calcularDuracion } from "@/lib/mandato-utils";
import { supabase } from "@/integrations/supabase/client";

export default function MandatoDetalle() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [mandato, setMandato] = useState<Mandato | null>(null);
  const [documentos, setDocumentos] = useState<Documento[]>([]);
  const [tareas, setTareas] = useState<Tarea[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingEstado, setUpdatingEstado] = useState(false);
  const [transactionSheetOpen, setTransactionSheetOpen] = useState(false);
  const [openTargetDrawer, setOpenTargetDrawer] = useState(false);
  const [showUploadZone, setShowUploadZone] = useState(false);
  const [transactionFilters, setTransactionFilters] = useState<{
    dateRange: "7d" | "30d" | "all";
  }>({ dateRange: "all" });
  
  // Time tracking states
  const [timeEntries, setTimeEntries] = useState<TimeEntry[]>([]);
  const [timeStats, setTimeStats] = useState<TimeStats | null>(null);
  const [timeDialogOpen, setTimeDialogOpen] = useState(false);
  const [timeLoading, setTimeLoading] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string>("");
  const [isAdmin, setIsAdmin] = useState(false);
  
  const { tasks: checklistTasks } = useChecklistTasks(id);

  const {
    transactions,
    totals,
    isLoading: transactionsLoading,
    createTransaction,
    deleteTransaction,
    isCreating,
  } = useMandatoTransactions(id || "", transactionFilters);

  const cargarMandato = async () => {
    if (!id) return;

    setLoading(true);
    try {
      const [mandatoData, documentosData, tareasData] = await Promise.all([
        getMandatoById(id),
        fetchDocumentos(),
        fetchTareas(),
      ]);

      setMandato(mandatoData);
      setDocumentos(documentosData.filter((d) => d.mandato_id === id));
      setTareas(tareasData.filter((t) => t.mandato_id === id));
    } catch (error) {
      console.error("Error cargando mandato:", error);
      toast.error("Error al cargar los datos del mandato");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarMandato();
    loadTimeData();
    loadCurrentUser();
  }, [id]);
  
  const loadCurrentUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      setCurrentUserId(user.id);
      
      // Check if user is admin
      const { data: adminData } = await supabase
        .from('admin_users')
        .select('role')
        .eq('user_id', user.id)
        .single();
      
      setIsAdmin(adminData?.role === 'super_admin' || adminData?.role === 'admin');
    }
  };
  
  const loadTimeData = async () => {
    if (!id) return;
    
    setTimeLoading(true);
    try {
      const [entries, stats] = await Promise.all([
        fetchTimeEntries(id),
        getTimeStats(id)
      ]);
      setTimeEntries(entries);
      setTimeStats(stats);
    } catch (error) {
      console.error("Error loading time data:", error);
    } finally {
      setTimeLoading(false);
    }
  };

  const handleEstadoChange = async (nuevoEstado: string) => {
    if (!mandato || !id) return;

    setUpdatingEstado(true);
    try {
      await updateMandato(id, { estado: nuevoEstado as any });
      setMandato({ ...mandato, estado: nuevoEstado as any });
      toast.success("Estado actualizado correctamente");
    } catch (error) {
      console.error("Error actualizando estado:", error);
      toast.error("Error al actualizar el estado");
    } finally {
      setUpdatingEstado(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (!mandato) {
    return <div>Mandato no encontrado</div>;
  }

  const tareasAbiertas = tareas.filter((t) => t.estado !== "completada");
  const targetsCount = mandato.empresas?.length || 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate("/mandatos")}>
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-semibold">
              {mandato.empresa_principal?.nombre || "Sin cliente"} - {mandato.tipo === "venta" ? "Venta" : "Compra"}
            </h1>
            <Badge variant={mandato.tipo === "venta" ? "default" : "secondary"}>
              {mandato.tipo === "venta" ? "Venta" : "Compra"}
            </Badge>
          </div>
          <p className="text-muted-foreground mt-1">
            ID: {mandato.id}
          </p>
        </div>
        <Select
          value={mandato.estado}
          onValueChange={handleEstadoChange}
          disabled={updatingEstado}
        >
          <SelectTrigger className="w-[200px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-background">
            {MANDATO_ESTADOS.map((estado) => (
              <SelectItem key={estado} value={estado}>
                <BadgeStatus status={estado as any} type="mandato" />
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Botones de Acción */}
      <div className="flex gap-2">
        <Button
          variant="outline"
          onClick={() => setOpenTargetDrawer(true)}
        >
          <Target className="w-4 h-4 mr-2" />
          Añadir Target
        </Button>
        <Button
          variant="outline"
          onClick={() => toast.info("Nueva Tarea - Disponible próximamente")}
        >
          <ListTodo className="w-4 h-4 mr-2" />
          Nueva Tarea
        </Button>
        <Button
          variant="outline"
          onClick={() => setShowUploadZone(!showUploadZone)}
        >
          <Upload className="w-4 h-4 mr-2" />
          {showUploadZone ? "Ocultar" : "Subir Documento"}
        </Button>
      </div>

      <Tabs defaultValue="resumen" className="w-full">
        <TabsList>
          <TabsTrigger value="resumen">Resumen</TabsTrigger>
          <TabsTrigger value="finanzas">
            <Euro className="w-4 h-4 mr-2" />
            Finanzas ({totals.transaccionesCount})
          </TabsTrigger>
          <TabsTrigger value="targets">Targets ({targetsCount})</TabsTrigger>
          {mandato.tipo === "compra" && (
            <TabsTrigger value="checklist">
              <ListTodo className="w-4 h-4 mr-2" />
              Checklist M&A
            </TabsTrigger>
          )}
          <TabsTrigger value="tareas">Tareas ({tareas.length})</TabsTrigger>
          <TabsTrigger value="documentos">Documentos ({documentos.length})</TabsTrigger>
        </TabsList>

        {/* Tab Resumen */}
        <TabsContent value="resumen" className="space-y-6">
          {/* KPIs */}
          <div className="grid grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Valor Estimado
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-semibold">{mandato.valor?.toLocaleString('es-ES') || 0} €</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Contactos
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-semibold">{mandato.contactos?.length || 0}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Tareas Abiertas
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-semibold">{tareasAbiertas.length}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Documentos
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-semibold">{documentos.length}</p>
              </CardContent>
            </Card>
          </div>

          {/* Timeline del Mandato */}
          <MandatoTimeline 
            fechaInicio={mandato.fecha_inicio}
            fechaCierre={mandato.fecha_cierre}
            estado={mandato.estado}
          />

          {/* Información Tipo-Específica */}
          <MandatoTipoEspecifico mandato={mandato} />

          {/* Información General */}
          <Card>
            <CardHeader>
              <CardTitle>Detalles del Mandato</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Cliente</p>
                <p className="font-medium">{mandato.empresa_principal?.nombre || "Sin asignar"}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Sector</p>
                <p className="font-medium">{mandato.empresa_principal?.sector || "-"}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Ubicación</p>
                <p className="font-medium">{mandato.empresa_principal?.ubicacion || "-"}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Tipo</p>
                <p className="font-medium capitalize">{mandato.tipo}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Valor Estimado</p>
                <p className="font-medium">{mandato.valor?.toLocaleString('es-ES') || 0} €</p>
              </div>
              {mandato.prioridad && (
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Prioridad</p>
                  <Badge className={getPrioridadColor(mandato.prioridad)}>
                    {mandato.prioridad}
                  </Badge>
                </div>
              )}
              {mandato.fecha_inicio && (
                <div>
                  <p className="text-sm text-muted-foreground">Fecha Inicio</p>
                  <p className="font-medium">{format(new Date(mandato.fecha_inicio), 'dd/MM/yyyy')}</p>
                </div>
              )}
              {mandato.fecha_cierre && (
                <div>
                  <p className="text-sm text-muted-foreground">Fecha Cierre Objetivo</p>
                  <p className="font-medium">{format(new Date(mandato.fecha_cierre), 'dd/MM/yyyy')}</p>
                </div>
              )}
              <div>
                <p className="text-sm text-muted-foreground">Fecha Creación</p>
                <p className="font-medium">{format(new Date(mandato.created_at), 'dd/MM/yyyy')}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Estado</p>
                <BadgeStatus status={mandato.estado} type="mandato" />
              </div>
              {mandato.descripcion && (
                <div className="col-span-full">
                  <p className="text-sm text-muted-foreground">Descripción</p>
                  <p className="font-medium">{mandato.descripcion}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Información Financiera de la Empresa */}
          <InformacionFinancieraEmpresa 
            empresa={mandato.empresa_principal}
            loading={loading}
          />

          {/* Contactos Clave */}
          <ContactosClaveCard
            contactos={mandato.contactos || []}
            onAddContacto={() => toast.info("Añadir contacto - Disponible próximamente")}
            loading={loading}
          />
        </TabsContent>

        {/* Tab Finanzas */}
        <TabsContent value="finanzas" className="space-y-4">
          {/* KPI Cards */}
          <div className="grid grid-cols-4 gap-4">
            <FinancialKPICard
              title="Total Ingresos"
              value={totals.totalIngresos}
              variant="income"
              loading={transactionsLoading}
            />
            <FinancialKPICard
              title="Total Gastos"
              value={totals.totalGastos}
              variant="expense"
              loading={transactionsLoading}
            />
            <FinancialKPICard
              title="Balance Neto"
              value={totals.balanceNeto}
              variant="balance"
              loading={transactionsLoading}
            />
            <FinancialKPICard
              title="Nº Transacciones"
              value={totals.transaccionesCount}
              variant="count"
              currency=""
              loading={transactionsLoading}
            />
          </div>

          {/* Cash Flow Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Evolución de Cash Flow</CardTitle>
            </CardHeader>
            <CardContent>
              <CashFlowChart transactions={transactions} />
            </CardContent>
          </Card>

          {/* Transactions Table with Filters */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Historial de Transacciones</CardTitle>
              <div className="flex gap-2">
                <Select
                  value={transactionFilters.dateRange}
                  onValueChange={(value: "7d" | "30d" | "all") =>
                    setTransactionFilters({ ...transactionFilters, dateRange: value })
                  }
                >
                  <SelectTrigger className="w-[180px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-background">
                    <SelectItem value="7d">Últimos 7 días</SelectItem>
                    <SelectItem value="30d">Últimos 30 días</SelectItem>
                    <SelectItem value="all">Todo</SelectItem>
                  </SelectContent>
                </Select>
                <Sheet open={transactionSheetOpen} onOpenChange={setTransactionSheetOpen}>
                  <SheetTrigger asChild>
                    <Button>
                      <Plus className="w-4 h-4 mr-2" />
                      Nueva Transacción
                    </Button>
                  </SheetTrigger>
                  <SheetContent className="overflow-y-auto">
                    <SheetHeader>
                      <SheetTitle>Nueva Transacción Financiera</SheetTitle>
                    </SheetHeader>
                    <div className="mt-6">
                      <TransactionForm
                        mandatoId={id || ""}
                        onSubmit={async (data) => {
                          await createTransaction({
                            ...data,
                            transaction_date: data.transaction_date.toISOString().split("T")[0],
                          } as any);
                          setTransactionSheetOpen(false);
                        }}
                        onCancel={() => setTransactionSheetOpen(false)}
                        loading={isCreating}
                      />
                    </div>
                  </SheetContent>
                </Sheet>
              </div>
            </CardHeader>
            <CardContent>
              <TransactionTable
                transactions={transactions}
                onDelete={deleteTransaction}
                loading={transactionsLoading}
              />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab Targets */}
        <TabsContent value="targets">
          <EmpresasAsociadasCard
            empresas={mandato.empresas || []}
            onAddEmpresa={() => setOpenTargetDrawer(true)}
            loading={loading}
          />
        </TabsContent>

        {/* Tab Checklist M&A */}
        {mandato.tipo === "compra" && (
          <TabsContent value="checklist">
            <ChecklistMACard
              mandatoId={id || ""}
              mandatoTipo={mandato.tipo}
              loading={loading}
            />
          </TabsContent>
        )}

        {/* Tab Time Tracking */}
        <TabsContent value="time" className="space-y-6">
          {timeStats && <TimeTrackingStats stats={timeStats} />}
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Registros de Tiempo</CardTitle>
              <Button onClick={() => setTimeDialogOpen(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Registrar Tiempo
              </Button>
            </CardHeader>
            <CardContent>
              {timeLoading ? (
                <p className="text-center text-muted-foreground py-8">
                  Cargando registros...
                </p>
              ) : (
                <TimeEntriesTable
                  entries={timeEntries}
                  currentUserId={currentUserId}
                  isAdmin={isAdmin}
                  onRefresh={loadTimeData}
                />
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab Tareas */}
        <TabsContent value="tareas">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Tareas del Mandato</CardTitle>
              <Button size="sm" onClick={() => toast.info("Disponible próximamente")}>
                <Plus className="w-4 h-4 mr-2" />
                Nueva Tarea
              </Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {tareas.map((tarea) => (
                  <div key={tarea.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex-1">
                      <p className="font-medium">{tarea.titulo}</p>
                      <p className="text-sm text-muted-foreground">
                        {tarea.asignado_a && `Asignado a: ${tarea.asignado_a}`} • 
                        Vence: {tarea.fecha_vencimiento}
                      </p>
                    </div>
                    <BadgeStatus status={tarea.estado} type="tarea" />
                  </div>
                ))}
                {tareas.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-8">
                    No hay tareas asociadas a este mandato
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab Documentos */}
        <TabsContent value="documentos">
          <Card>
            <CardHeader>
              <CardTitle>Documentos del Mandato</CardTitle>
            </CardHeader>
            <CardContent>
              {showUploadZone && (
                <div className="mb-4">
                  <DocumentUploadZone
                    mandatoId={id || ""}
                    onSuccess={cargarMandato}
                  />
                </div>
              )}
              <DocumentList
                mandatoId={id || ""}
                onUpdate={cargarMandato}
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <NuevoTargetDrawer
        open={openTargetDrawer}
        onOpenChange={setOpenTargetDrawer}
        onSuccess={cargarMandato}
      />
      
      <TimeTrackingDialog
        open={timeDialogOpen}
        onOpenChange={setTimeDialogOpen}
        mandatoId={id || ""}
        tasks={checklistTasks}
        onSuccess={loadTimeData}
      />
    </div>
  );
}
