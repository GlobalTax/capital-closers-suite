import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, FileText, Activity, Target, ListTodo, Upload, Plus, Euro } from "lucide-react";
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
import { getMandatoById, fetchActividades, fetchDocumentos, fetchTareas, updateMandato } from "@/services/api";
import type { Mandato, Actividad, Documento, Tarea } from "@/types";
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

export default function MandatoDetalle() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [mandato, setMandato] = useState<Mandato | null>(null);
  const [actividades, setActividades] = useState<Actividad[]>([]);
  const [documentos, setDocumentos] = useState<Documento[]>([]);
  const [tareas, setTareas] = useState<Tarea[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingEstado, setUpdatingEstado] = useState(false);
  const [transactionSheetOpen, setTransactionSheetOpen] = useState(false);
  const [openTargetDrawer, setOpenTargetDrawer] = useState(false);
  const [transactionFilters, setTransactionFilters] = useState<{
    dateRange: "7d" | "30d" | "all";
  }>({ dateRange: "all" });

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
      const [mandatoData, actividadesData, documentosData, tareasData] = await Promise.all([
        getMandatoById(id),
        fetchActividades(id),
        fetchDocumentos(),
        fetchTareas(),
      ]);

      setMandato(mandatoData);
      setActividades(actividadesData);
      setDocumentos(documentosData.filter((d) => d.mandatoId === id));
      setTareas(tareasData.filter((t) => t.mandatoId === id));
    } catch (error) {
      console.error("Error cargando mandato:", error);
      toast.error("Error al cargar los datos del mandato");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarMandato();
  }, [id]);

  const handleEstadoChange = async (nuevoEstado: string) => {
    if (!mandato || !id) return;

    setUpdatingEstado(true);
    try {
      const response = await updateMandato(id, { estado: nuevoEstado as any });
      setMandato({ ...mandato, estado: nuevoEstado as any });
      toast.success(response.message || "Estado actualizado correctamente");
      
      // Mostrar info sobre tareas completadas
      if (response.metadata?.tareasCompletadas > 0) {
        toast.info(
          `📋 ${response.metadata.tareasCompletadas} tarea${
            response.metadata.tareasCompletadas !== 1 ? "s" : ""
          } marcada${response.metadata.tareasCompletadas !== 1 ? "s" : ""} como completada${
            response.metadata.tareasCompletadas !== 1 ? "s" : ""
          }`
        );
      }
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

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate("/mandatos")}>
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-semibold">
              {mandato.cliente} - {mandato.tipo === "venta" ? "Venta" : "Compra"}
            </h1>
            <Badge variant={mandato.tipo === "venta" ? "default" : "secondary"}>
              {mandato.tipo === "venta" ? "Venta" : "Compra"}
            </Badge>
          </div>
          <p className="text-muted-foreground mt-1">
            {mandato.empresa} • ID: {mandato.id}
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
          onClick={() => toast.info("Subir Documento - Disponible próximamente")}
        >
          <Upload className="w-4 h-4 mr-2" />
          Subir Documento
        </Button>
      </div>

      <Tabs defaultValue="resumen" className="w-full">
        <TabsList>
          <TabsTrigger value="resumen">Resumen</TabsTrigger>
          <TabsTrigger value="finanzas">
            <Euro className="w-4 h-4 mr-2" />
            Finanzas ({totals.transaccionesCount})
          </TabsTrigger>
          <TabsTrigger value="targets">Targets ({mandato.targetsCount || 0})</TabsTrigger>
          <TabsTrigger value="tareas">Tareas ({tareas.length})</TabsTrigger>
          <TabsTrigger value="documentos">Documentos ({documentos.length})</TabsTrigger>
          <TabsTrigger value="cronologia">Cronología ({actividades.length})</TabsTrigger>
        </TabsList>

        {/* Tab Resumen */}
        <TabsContent value="resumen" className="space-y-4">
          {/* KPIs */}
          <div className="grid grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Valor Estimado
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-semibold">{mandato.valor}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Targets
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-semibold">{mandato.targetsCount || 0}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Tareas Abiertas
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-semibold">{mandato.tareasAbiertas || 0}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Documentos
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-semibold">{mandato.documentosCount || 0}</p>
              </CardContent>
            </Card>
          </div>

          {/* Información General */}
          <Card>
            <CardHeader>
              <CardTitle>Detalles del Mandato</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Cliente</p>
                <p className="font-medium">{mandato.cliente}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Empresa</p>
                <p className="font-medium">{mandato.empresa}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Tipo</p>
                <p className="font-medium capitalize">{mandato.tipo}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Valor Estimado</p>
                <p className="font-medium">{mandato.valor}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Fecha Inicio</p>
                <p className="font-medium">{mandato.fecha}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Última Actualización</p>
                <p className="font-medium">{mandato.ultimaActualizacion || "N/A"}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Responsable</p>
                <p className="font-medium">{mandato.responsable || "No asignado"}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Sector</p>
                <p className="font-medium">{mandato.sector || "N/A"}</p>
              </div>
              {mandato.descripcion && (
                <div className="col-span-2">
                  <p className="text-sm text-muted-foreground">Descripción</p>
                  <p className="font-medium">{mandato.descripcion}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Mini Timeline */}
          <Card>
            <CardHeader>
              <CardTitle>Actividad Reciente</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {actividades.slice(0, 5).map((actividad) => (
                  <div key={actividad.id} className="flex gap-3 pb-3 border-b last:border-0">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <Activity className="w-4 h-4 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm">{actividad.titulo}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {actividad.usuario} • {new Date(actividad.fecha).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                ))}
                {actividades.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No hay actividad reciente
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
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
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Empresas Target</CardTitle>
              <Button size="sm" onClick={() => setOpenTargetDrawer(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Añadir Target
              </Button>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground text-center py-8">
                Funcionalidad de targets disponible próximamente
              </p>
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
                  <div
                    key={tarea.id}
                    className="flex items-center justify-between p-3 border rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={cn(
                          "w-2 h-2 rounded-full",
                          tarea.estado === "completada" && "bg-green-500",
                          tarea.estado === "en-progreso" && "bg-yellow-500",
                          tarea.estado === "pendiente" && "bg-gray-400"
                        )}
                      />
                      <div>
                        <p className="font-medium text-sm">{tarea.titulo}</p>
                        <p className="text-xs text-muted-foreground">
                          {tarea.asignado} • {tarea.fechaVencimiento}
                        </p>
                      </div>
                    </div>
                    <Badge
                      variant={
                        tarea.prioridad === "alta"
                          ? "destructive"
                          : tarea.prioridad === "media"
                          ? "default"
                          : "secondary"
                      }
                    >
                      {tarea.prioridad}
                    </Badge>
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
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Documentos Asociados</CardTitle>
              <Button size="sm" onClick={() => toast.info("Disponible próximamente")}>
                <Upload className="w-4 h-4 mr-2" />
                Subir Documento
              </Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {documentos.map((doc) => (
                  <div
                    key={doc.id}
                    className="flex items-center justify-between p-3 border rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <FileText className="w-4 h-4 text-muted-foreground" />
                      <div>
                        <p className="font-medium text-sm">{doc.nombre}</p>
                        <p className="text-xs text-muted-foreground">
                          {doc.tamano} • {doc.fecha}
                        </p>
                      </div>
                    </div>
                    <Badge variant="outline">{doc.tipo}</Badge>
                  </div>
                ))}
                {documentos.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-8">
                    No hay documentos asociados a este mandato
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab Cronología */}
        <TabsContent value="cronologia">
          <Card>
            <CardHeader>
              <CardTitle>Timeline de Actividad</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {actividades.map((actividad) => (
                  <div key={actividad.id} className="flex gap-4">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <Activity className="w-4 h-4 text-primary" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-sm">{actividad.titulo}</p>
                      {actividad.descripcion && (
                        <p className="text-sm text-muted-foreground mt-1">
                          {actividad.descripcion}
                        </p>
                      )}
                      <p className="text-xs text-muted-foreground mt-2">
                        {actividad.usuario} • {new Date(actividad.fecha).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                ))}
                {actividades.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-8">
                    No hay actividad registrada
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <NuevoTargetDrawer
        open={openTargetDrawer}
        onOpenChange={setOpenTargetDrawer}
        mandatoId={id}
        onSuccess={() => {
          cargarMandato();
          toast.success("Target añadido al mandato");
        }}
      />
    </div>
  );
}
