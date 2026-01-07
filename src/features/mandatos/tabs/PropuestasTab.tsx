import { useState } from "react";
import { PropuestasTable } from "@/components/propuestas/PropuestasTable";
import { NuevaPropuestaDrawer } from "@/components/propuestas/NuevaPropuestaDrawer";
import { PropuestaDetailCard } from "@/components/propuestas/PropuestaDetailCard";
import { PropuestaTimeline } from "@/components/propuestas/PropuestaTimeline";
import { RechazarPropuestaDialog } from "@/components/propuestas/RechazarPropuestaDialog";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { Skeleton } from "@/components/ui/skeleton";
import {
  usePropuestas,
  useCreatePropuesta,
  useUpdatePropuesta,
  useDeletePropuesta,
  useEnviarPropuesta,
  useAceptarPropuesta,
  useRechazarPropuesta,
  useCrearNuevaVersion,
  useNextVersion,
} from "@/hooks/usePropuestas";
import type { PropuestaHonorarios } from "@/types/propuestas";

interface PropuestasTabProps {
  mandatoId: string;
}

export function PropuestasTab({ mandatoId }: PropuestasTabProps) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedPropuesta, setSelectedPropuesta] = useState<PropuestaHonorarios | null>(null);
  const [editingPropuesta, setEditingPropuesta] = useState<PropuestaHonorarios | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [propuestaToDelete, setPropuestaToDelete] = useState<PropuestaHonorarios | null>(null);
  const [rechazarDialogOpen, setRechazarDialogOpen] = useState(false);
  const [propuestaToRechazar, setPropuestaToRechazar] = useState<PropuestaHonorarios | null>(null);

  const { data: propuestas, isLoading } = usePropuestas(mandatoId);
  const { data: nextVersion } = useNextVersion(mandatoId);

  const createMutation = useCreatePropuesta();
  const updateMutation = useUpdatePropuesta();
  const deleteMutation = useDeletePropuesta();
  const enviarMutation = useEnviarPropuesta();
  const aceptarMutation = useAceptarPropuesta();
  const rechazarMutation = useRechazarPropuesta();
  const nuevaVersionMutation = useCrearNuevaVersion();

  const handleNew = () => {
    setEditingPropuesta(null);
    setDrawerOpen(true);
  };

  const handleEdit = (propuesta: PropuestaHonorarios) => {
    setEditingPropuesta(propuesta);
    setDrawerOpen(true);
  };

  const handleView = (propuesta: PropuestaHonorarios) => {
    setSelectedPropuesta(propuesta);
  };

  const handleSave = async (data: Partial<PropuestaHonorarios>, enviar: boolean) => {
    if (editingPropuesta) {
      await updateMutation.mutateAsync({ id: editingPropuesta.id, updates: data });
      if (enviar) {
        await enviarMutation.mutateAsync(editingPropuesta.id);
      }
    } else {
      const created = await createMutation.mutateAsync({
        ...data,
        mandato_id: mandatoId,
        version: nextVersion || 1,
        estado: enviar ? 'enviada' : 'borrador',
        titulo: data.titulo || '',
        importe_total: data.importe_total || 0,
        desglose: data.desglose || [],
        fecha_emision: enviar ? new Date().toISOString().split('T')[0] : undefined,
      });
      setSelectedPropuesta(created);
    }
    setDrawerOpen(false);
    setEditingPropuesta(null);
  };

  const handleDelete = (propuesta: PropuestaHonorarios) => {
    setPropuestaToDelete(propuesta);
    setDeleteConfirmOpen(true);
  };

  const confirmDelete = async () => {
    if (propuestaToDelete) {
      await deleteMutation.mutateAsync({ id: propuestaToDelete.id, mandatoId });
      if (selectedPropuesta?.id === propuestaToDelete.id) {
        setSelectedPropuesta(null);
      }
    }
    setDeleteConfirmOpen(false);
    setPropuestaToDelete(null);
  };

  const handleEnviar = async (propuesta: PropuestaHonorarios) => {
    await enviarMutation.mutateAsync(propuesta.id);
  };

  const handleAceptar = async (propuesta: PropuestaHonorarios) => {
    await aceptarMutation.mutateAsync({ id: propuesta.id, mandatoId });
  };

  const handleRechazar = (propuesta: PropuestaHonorarios) => {
    setPropuestaToRechazar(propuesta);
    setRechazarDialogOpen(true);
  };

  const confirmRechazar = async (motivo: string) => {
    if (propuestaToRechazar) {
      await rechazarMutation.mutateAsync({ id: propuestaToRechazar.id, motivo });
    }
    setRechazarDialogOpen(false);
    setPropuestaToRechazar(null);
  };

  const handleNuevaVersion = async (propuesta: PropuestaHonorarios) => {
    const newPropuesta = await nuevaVersionMutation.mutateAsync(propuesta);
    setSelectedPropuesta(newPropuesta);
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  const sortedPropuestas = propuestas || [];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Left: Table or Timeline */}
      <div className="lg:col-span-2">
        <PropuestasTable
          propuestas={sortedPropuestas}
          onNew={handleNew}
          onView={handleView}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onEnviar={handleEnviar}
          onAceptar={handleAceptar}
          onRechazar={handleRechazar}
          onNuevaVersion={handleNuevaVersion}
        />
      </div>

      {/* Right: Detail or Timeline */}
      <div className="space-y-4">
        {selectedPropuesta ? (
          <PropuestaDetailCard
            propuesta={selectedPropuesta}
            onAceptar={selectedPropuesta.estado === 'enviada' ? () => handleAceptar(selectedPropuesta) : undefined}
            onRechazar={selectedPropuesta.estado === 'enviada' ? () => handleRechazar(selectedPropuesta) : undefined}
            onNuevaVersion={selectedPropuesta.estado === 'rechazada' ? () => handleNuevaVersion(selectedPropuesta) : undefined}
            isLoading={aceptarMutation.isPending || rechazarMutation.isPending || nuevaVersionMutation.isPending}
          />
        ) : sortedPropuestas.length > 0 ? (
          <div>
            <h3 className="font-medium mb-3">Historial de versiones</h3>
            <PropuestaTimeline
              propuestas={sortedPropuestas}
              onSelect={handleView}
              selectedId={selectedPropuesta?.id}
            />
          </div>
        ) : null}
      </div>

      {/* Drawer */}
      <NuevaPropuestaDrawer
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        propuesta={editingPropuesta}
        version={editingPropuesta?.version || nextVersion || 1}
        onSave={handleSave}
        isLoading={createMutation.isPending || updateMutation.isPending || enviarMutation.isPending}
      />

      {/* Delete confirmation */}
      <ConfirmDialog
        open={deleteConfirmOpen}
        onOpenChange={setDeleteConfirmOpen}
        title="Eliminar propuesta"
        description="¿Estás seguro de eliminar esta propuesta? Esta acción no se puede deshacer."
        confirmText="Eliminar"
        onConfirm={confirmDelete}
        variant="destructive"
      />

      {/* Rechazar dialog */}
      <RechazarPropuestaDialog
        open={rechazarDialogOpen}
        onOpenChange={setRechazarDialogOpen}
        onConfirm={confirmRechazar}
      />
    </div>
  );
}
