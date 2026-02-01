import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { FileText, Target, ListTodo, Clock, Receipt, FilePlus, Megaphone } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { NuevoContactoDrawer } from "@/components/contactos/NuevoContactoDrawer";
import { AsociarContactoDialog } from "@/components/contactos/AsociarContactoDialog";
import { VincularEmpresaDialog } from "@/components/mandatos/VincularEmpresaDialog";
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
import { PropuestasTab } from "@/features/mandatos/tabs/PropuestasTab";
import { TimeTrackingDialog } from "@/components/mandatos/TimeTrackingDialog";
import { TimeEntriesTable } from "@/components/mandatos/TimeEntriesTable";
import { TimeTrackingStats } from "@/components/mandatos/TimeTrackingStats";
import { EditarMandatoDrawer } from "@/components/mandatos/EditarMandatoDrawer";
import { DocumentGeneratorDrawer } from "@/components/documentos/DocumentGeneratorDrawer";
import { MarketingSubTabs } from "@/features/mandatos/components/MarketingSubTabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { fetchTimeEntries, getTimeStats } from "@/services/timeTracking";
import { useChecklistDynamic } from "@/hooks/useChecklistDynamic";
import { CostSummaryCard } from "@/components/mandatos/CostSummaryCard";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { TimeEntry, TimeStats } from "@/types";
import { handleError } from "@/lib/error-handler";
export default function MandatoDetalle() {
  const { id } = useParams();
  const { user, adminUser } = useAuth();
  const [openContactoDrawer, setOpenContactoDrawer] = useState(false);
  const [openAsociarDialog, setOpenAsociarDialog] = useState(false);
  const [vincularEmpresaOpen, setVincularEmpresaOpen] = useState(false);
  const [editarMandatoOpen, setEditarMandatoOpen] = useState(false);
  const [timeEntries, setTimeEntries] = useState<TimeEntry[]>([]);
  const [timeStats, setTimeStats] = useState<TimeStats | null>(null);
  const [timeDialogOpen, setTimeDialogOpen] = useState(false);
  const [timeLoading, setTimeLoading] = useState(false);
  const [documentGeneratorOpen, setDocumentGeneratorOpen] = useState(false);
  
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

  // Obtener progreso del checklist
  const { totalProgress, overdueTasks } = useChecklistDynamic(id || '', mandato?.tipo || 'venta');

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

  const esServicio = mandato.categoria !== 'operacion_ma';
  const checklistLabel = mandato.tipo === "compra" ? "Checklist Buy-Side" : "Checklist Sell-Side";

  return (
    <div className="space-y-4 md:space-y-6">
      <MandatoHeader
        mandato={mandato}
        onEdit={() => setEditarMandatoOpen(true)}
        onDelete={handleEliminar}
        onGenerateDocument={() => setDocumentGeneratorOpen(true)}
      />

      <MandatoKPIs 
        mandato={mandato} 
        checklistProgress={totalProgress}
        overdueTasks={overdueTasks.length}
      />

      <Tabs defaultValue="resumen" className="w-full">
        <TabsList className="w-full overflow-x-auto flex-nowrap justify-start md:justify-center gap-1 h-auto p-1">
          <TabsTrigger value="resumen" className="text-xs md:text-sm px-2 md:px-3 py-1.5 shrink-0">
            <FileText className="w-3.5 h-3.5 md:w-4 md:h-4 mr-1 md:mr-2" />
            <span className="hidden xs:inline">Resumen</span>
          </TabsTrigger>
          {esServicio ? (
            <TabsTrigger value="propuestas" className="text-xs md:text-sm px-2 md:px-3 py-1.5 shrink-0">
              <Receipt className="w-3.5 h-3.5 md:w-4 md:h-4 mr-1 md:mr-2" />
              <span className="hidden xs:inline">Propuestas</span>
            </TabsTrigger>
          ) : (
            <>
              <TabsTrigger value="finanzas" className="text-xs md:text-sm px-2 md:px-3 py-1.5 shrink-0">
                <Target className="w-3.5 h-3.5 md:w-4 md:h-4 mr-1 md:mr-2" />
                <span className="hidden sm:inline">Finanzas</span>
              </TabsTrigger>
              <TabsTrigger value="targets" className="text-xs md:text-sm px-2 md:px-3 py-1.5 shrink-0">
                Targets ({targetsCount})
              </TabsTrigger>
              <TabsTrigger value="checklist" className="text-xs md:text-sm px-2 md:px-3 py-1.5 shrink-0">
                <ListTodo className="w-3.5 h-3.5 md:w-4 md:h-4 mr-1 md:mr-2" />
                <span className="hidden md:inline">{checklistLabel}</span>
                <span className="md:hidden">Check</span>
              </TabsTrigger>
            </>
          )}
          <TabsTrigger value="documentos" className="text-xs md:text-sm px-2 md:px-3 py-1.5 shrink-0">
            <FileText className="w-3.5 h-3.5 md:w-4 md:h-4 mr-1 md:mr-2" />
            <span className="hidden sm:inline">Docs</span> ({documentos.length})
          </TabsTrigger>
          {!esServicio && (
            <TabsTrigger value="marketing" className="text-xs md:text-sm px-2 md:px-3 py-1.5 shrink-0">
              <Megaphone className="w-3.5 h-3.5 md:w-4 md:h-4 mr-1 md:mr-2" />
              <span className="hidden sm:inline">Marketing</span>
            </TabsTrigger>
          )}
          <TabsTrigger value="horas" className="text-xs md:text-sm px-2 md:px-3 py-1.5 shrink-0">
            <Clock className="w-3.5 h-3.5 md:w-4 md:h-4 mr-1 md:mr-2" />
            <span className="hidden sm:inline">Horas</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="resumen">
          <ResumenTab
            mandato={mandato}
            onAddContacto={() => setOpenContactoDrawer(true)}
            onAsociarContacto={() => setOpenAsociarDialog(true)}
            onUpdateEmpresa={async (empresaId, field, value) => {
              const { error } = await supabase
                .from('empresas')
                .update({ [field]: value })
                .eq('id', empresaId);
              
              if (error) {
                toast.error('Error al actualizar');
                throw error;
              }
              
              toast.success('Actualizado');
              refetch();
            }}
            onUpdateEmpresaText={async (empresaId, field, value) => {
              const { error } = await supabase
                .from('empresas')
                .update({ [field]: value })
                .eq('id', empresaId);
              
              if (error) {
                // Detectar error de CIF duplicado (constraint unique)
                if (error.code === '23505' && field === 'cif') {
                  toast.error('Este CIF ya está registrado en otra empresa');
                } else {
                  toast.error('Error al actualizar');
                }
                throw error;
              }
              
              toast.success('Actualizado');
              refetch();
            }}
            onVincularEmpresa={() => setVincularEmpresaOpen(true)}
            onEditMandato={() => setEditarMandatoOpen(true)}
          />
        </TabsContent>

        {esServicio ? (
          <TabsContent value="propuestas">
            <PropuestasTab mandatoId={id!} />
          </TabsContent>
        ) : (
          <>
            <TabsContent value="finanzas">
              <FinanzasTab mandatoId={id!} />
            </TabsContent>

            <TabsContent value="targets">
              <TargetsTab mandato={mandato} onRefresh={refetch} onEditMandato={() => setEditarMandatoOpen(true)} />
            </TabsContent>

            <TabsContent value="checklist">
              <ChecklistTab mandato={mandato} />
            </TabsContent>
          </>
        )}

        <TabsContent value="documentos">
          <DocumentosTab
            mandatoId={id!}
            documentos={documentos}
            onRefresh={refetchDocumentos}
          />
        </TabsContent>

        {!esServicio && (
          <TabsContent value="marketing" className="space-y-6">
            <MarketingSubTabs 
              mandatoId={id!} 
              mandatoNombre={mandato.empresa_principal?.nombre || mandato.codigo}
              onRefresh={refetchDocumentos}
            />
          </TabsContent>
        )}

        <TabsContent value="horas" className="space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-medium">Registro de Horas</h3>
            <Button onClick={() => setTimeDialogOpen(true)}>
              <Clock className="w-4 h-4 mr-2" />
              Registrar Tiempo
            </Button>
          </div>

          {/* Cost Summary Card */}
          <CostSummaryCard mandatoId={id!} />

          {timeStats && <TimeTrackingStats stats={timeStats} />}

          <Card>
            <CardHeader>
              <CardTitle>Entradas de Tiempo</CardTitle>
            </CardHeader>
            <CardContent>
              <TimeEntriesTable
                entries={timeEntries}
                currentUserId={user?.id || ''}
                isAdmin={isAdmin}
                onRefresh={loadTimeEntries}
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <NuevoContactoDrawer
        open={openContactoDrawer}
        onOpenChange={setOpenContactoDrawer}
        onSuccess={refetch}
        mandatoId={id}
      />

      <AsociarContactoDialog
        open={openAsociarDialog}
        onOpenChange={setOpenAsociarDialog}
        mandatoId={id!}
        onSuccess={refetch}
      />

      <TimeTrackingDialog
        open={timeDialogOpen}
        onOpenChange={setTimeDialogOpen}
        mandatoId={id!}
        onSuccess={loadTimeEntries}
      />

      <EditarMandatoDrawer
        open={editarMandatoOpen}
        onOpenChange={setEditarMandatoOpen}
        mandato={mandato}
        onSuccess={refetch}
      />

      <DocumentGeneratorDrawer
        open={documentGeneratorOpen}
        onOpenChange={setDocumentGeneratorOpen}
        mandatoId={id}
        empresaData={{
          nombre: mandato.empresa_principal?.nombre,
          cif: mandato.empresa_principal?.cif,
        }}
        mandatoTipo={mandato.tipo}
      />

      <VincularEmpresaDialog
        open={vincularEmpresaOpen}
        onOpenChange={setVincularEmpresaOpen}
        tipoMandato={mandato.tipo}
        onVincular={async (empresaId) => {
          const { error } = await supabase
            .from('mandatos')
            .update({ empresa_principal_id: empresaId })
            .eq('id', id);
          
          if (error) {
            toast.error('Error al vincular empresa');
            throw error;
          }
          
          toast.success('Empresa vinculada correctamente');
          refetch();
        }}
      />
    </div>
  );
}
