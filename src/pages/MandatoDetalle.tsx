import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { FileText, Target, ListTodo, Clock, Building2, DollarSign, BarChart3 } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { NuevoContactoDrawer } from "@/components/contactos/NuevoContactoDrawer";
import { useMandatoDetalle } from "@/hooks/useMandatoDetalle";
import { useAuth } from "@/hooks/useAuth";
import { PageSkeleton } from "@/components/shared/LoadingStates";
import { MandatoHeader } from "@/features/mandatos/components/MandatoHeader";
import { MandatoKPIs } from "@/features/mandatos/components/MandatoKPIs";
import { ResumenTab } from "@/features/mandatos/tabs/ResumenTab";
import { FinanzasTab } from "@/features/mandatos/tabs/FinanzasTab";
import { TargetsTab } from "@/features/mandatos/tabs/TargetsTab";
import { ChecklistTab } from "@/features/mandatos/tabs/ChecklistTab";
import { DocumentosTab } from "@/features/mandatos/tabs/DocumentosTab";
import { TimeTrackingDialog } from "@/components/mandatos/TimeTrackingDialog";
import { TimeEntriesTable } from "@/components/mandatos/TimeEntriesTable";
import { TimeTrackingStats } from "@/components/mandatos/TimeTrackingStats";
import { MandatoActionsPanel } from "@/components/mandatos/MandatoActionsPanel";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { fetchTimeEntries, getTimeStats } from "@/services/timeTracking";
import type { TimeEntry, TimeStats } from "@/types";
import { handleError } from "@/lib/error-handler";

export default function MandatoDetalle() {
  const { id } = useParams();
  const { user, adminUser } = useAuth();
  const [openContactoDrawer, setOpenContactoDrawer] = useState(false);
  const [timeEntries, setTimeEntries] = useState<TimeEntry[]>([]);
  const [timeStats, setTimeStats] = useState<TimeStats | null>(null);
  const [timeDialogOpen, setTimeDialogOpen] = useState(false);
  const [timeLoading, setTimeLoading] = useState(false);
  
  const isAdmin = adminUser?.role === 'super_admin' || adminUser?.role === 'admin';

  const {
    mandato,
    documentos,
    tareas,
    loading,
    refetch,
    handleEliminar,
    refetchDocumentos,
    targetsCount,
    tareasPendientes,
  } = useMandatoDetalle(id);

  useEffect(() => {
    loadTimeEntries();
  }, [id]);

  const loadTimeEntries = async () => {
    if (!id) return;
    setTimeLoading(true);
    try {
      const entries = await fetchTimeEntries(id);
      const stats = await getTimeStats(id);
      setTimeEntries(entries);
      setTimeStats(stats);
    } catch (error) {
      handleError(error, 'Carga de horas');
    } finally {
      setTimeLoading(false);
    }
  };

  if (loading) return <PageSkeleton />;
  if (!mandato) return <div>Mandato no encontrado</div>;

  return (
    <div className="p-6">
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-3 space-y-6">
          <MandatoHeader mandato={mandato} onDelete={handleEliminar} />
          <MandatoKPIs mandato={mandato} />

          <Tabs defaultValue="resumen" className="w-full">
            <TabsList className="bg-muted/50 p-1">
              <TabsTrigger value="resumen" className="data-[state=active]:bg-background data-[state=active]:border-b-2 data-[state=active]:border-purple-600 rounded-b-none">
                <BarChart3 className="w-5 h-5 mr-2" />
                Resumen
              </TabsTrigger>
              <TabsTrigger value="finanzas" className="data-[state=active]:bg-background data-[state=active]:border-b-2 data-[state=active]:border-green-600 rounded-b-none">
                <DollarSign className="w-5 h-5 mr-2" />
                Finanzas
              </TabsTrigger>
              <TabsTrigger value="targets" className="data-[state=active]:bg-background data-[state=active]:border-b-2 data-[state=active]:border-blue-600 rounded-b-none">
                <Building2 className="w-5 h-5 mr-2" />
                Empresas
                {targetsCount > 0 && <Badge variant="secondary" className="ml-2">{targetsCount}</Badge>}
              </TabsTrigger>
              {mandato.tipo === "compra" && (
                <TabsTrigger value="checklist" className="data-[state=active]:bg-background data-[state=active]:border-b-2 data-[state=active]:border-orange-600 rounded-b-none">
                  <ListTodo className="w-5 h-5 mr-2" />
                  Checklist
                </TabsTrigger>
              )}
              <TabsTrigger value="documentos" className="data-[state=active]:bg-background data-[state=active]:border-b-2 data-[state=active]:border-gray-600 rounded-b-none">
                <FileText className="w-5 h-5 mr-2" />
                Documentos
                {documentos.length > 0 && <Badge variant="secondary" className="ml-2">{documentos.length}</Badge>}
              </TabsTrigger>
              <TabsTrigger value="horas" className="data-[state=active]:bg-background data-[state=active]:border-b-2 data-[state=active]:border-blue-600 rounded-b-none">
                <Clock className="w-5 h-5 mr-2" />
                Horas
              </TabsTrigger>
            </TabsList>

            <TabsContent value="resumen">
              <ResumenTab mandato={mandato} onAddContacto={() => setOpenContactoDrawer(true)} />
            </TabsContent>

            <TabsContent value="finanzas">
              <FinanzasTab mandatoId={id!} />
            </TabsContent>

            <TabsContent value="targets">
              <TargetsTab mandato={mandato} onRefresh={refetch} />
            </TabsContent>

            {mandato.tipo === "compra" && (
              <TabsContent value="checklist">
                <ChecklistTab mandato={mandato} />
              </TabsContent>
            )}

            <TabsContent value="documentos">
              <DocumentosTab mandatoId={id!} documentos={documentos} onRefresh={refetchDocumentos} />
            </TabsContent>

            <TabsContent value="horas" className="space-y-6">
              <div className="flex justify-end">
                <Button onClick={() => setTimeDialogOpen(true)} className="bg-purple-600 hover:bg-purple-700">
                  <Clock className="w-4 h-4 mr-2" />
                  Registrar Tiempo
                </Button>
              </div>
              {timeStats && <TimeTrackingStats stats={timeStats} />}
              <Card>
                <CardHeader>
                  <CardTitle>Entradas de Tiempo</CardTitle>
                </CardHeader>
                <CardContent>
                  <TimeEntriesTable entries={timeEntries} currentUserId={user?.id || ''} isAdmin={isAdmin} onRefresh={loadTimeEntries} />
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        <div className="lg:col-span-1">
          <MandatoActionsPanel
            onRegistrarTiempo={() => setTimeDialogOpen(true)}
            onCrearTarea={() => {}}
            onSubirDocumento={() => {}}
            onAñadirEmpresa={() => {}}
            onProgramarReunion={() => {}}
            onVerTimeline={() => {}}
            onEditar={() => {}}
            onEliminar={handleEliminar}
          />
        </div>
      </div>

      <NuevoContactoDrawer open={openContactoDrawer} onOpenChange={setOpenContactoDrawer} onSuccess={refetch} mandatoId={id} />
      <TimeTrackingDialog open={timeDialogOpen} onOpenChange={setTimeDialogOpen} mandatoId={id!} onSuccess={loadTimeEntries} />
    </div>
  );
}
