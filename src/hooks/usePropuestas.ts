import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import * as propuestasService from "@/services/propuestas.service";
import type { PropuestaInsert, PropuestaUpdate } from "@/types/propuestas";

export function usePropuestas(mandatoId: string | undefined) {
  return useQuery({
    queryKey: ["propuestas", mandatoId],
    queryFn: () => propuestasService.getPropuestasByMandato(mandatoId!),
    enabled: !!mandatoId,
    staleTime: 5 * 60 * 1000,
  });
}

export function usePropuesta(id: string | undefined) {
  return useQuery({
    queryKey: ["propuesta", id],
    queryFn: () => propuestasService.getPropuestaById(id!),
    enabled: !!id,
  });
}

export function useCreatePropuesta() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: propuestasService.createPropuesta,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["propuestas", data.mandato_id] });
      toast.success("Propuesta creada correctamente");
    },
    onError: () => {
      toast.error("Error al crear la propuesta");
    },
  });
}

export function useUpdatePropuesta() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: PropuestaUpdate }) =>
      propuestasService.updatePropuesta(id, updates),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["propuestas", data.mandato_id] });
      queryClient.invalidateQueries({ queryKey: ["propuesta", data.id] });
      toast.success("Propuesta actualizada");
    },
    onError: () => {
      toast.error("Error al actualizar la propuesta");
    },
  });
}

export function useDeletePropuesta() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, mandatoId }: { id: string; mandatoId: string }) =>
      propuestasService.deletePropuesta(id).then(() => mandatoId),
    onSuccess: (mandatoId) => {
      queryClient.invalidateQueries({ queryKey: ["propuestas", mandatoId] });
      toast.success("Propuesta eliminada");
    },
    onError: () => {
      toast.error("Error al eliminar la propuesta");
    },
  });
}

export function useEnviarPropuesta() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: propuestasService.enviarPropuesta,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["propuestas", data.mandato_id] });
      toast.success("Propuesta enviada correctamente");
    },
    onError: () => {
      toast.error("Error al enviar la propuesta");
    },
  });
}

export function useAceptarPropuesta() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, mandatoId }: { id: string; mandatoId: string }) =>
      propuestasService.aceptarPropuesta(id, mandatoId),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["propuestas", data.mandato_id] });
      queryClient.invalidateQueries({ queryKey: ["mandato", data.mandato_id] });
      toast.success("¡Propuesta aceptada! Honorarios actualizados");
    },
    onError: () => {
      toast.error("Error al aceptar la propuesta");
    },
  });
}

export function useRechazarPropuesta() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, motivo }: { id: string; motivo?: string }) =>
      propuestasService.rechazarPropuesta(id, motivo),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["propuestas", data.mandato_id] });
      toast.success("Propuesta marcada como rechazada");
    },
    onError: () => {
      toast.error("Error al rechazar la propuesta");
    },
  });
}

export function useCrearNuevaVersion() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: propuestasService.crearNuevaVersion,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["propuestas", data.mandato_id] });
      toast.success(`Nueva versión ${data.version} creada`);
    },
    onError: () => {
      toast.error("Error al crear nueva versión");
    },
  });
}

export function useNextVersion(mandatoId: string | undefined) {
  return useQuery({
    queryKey: ["propuestas", mandatoId, "nextVersion"],
    queryFn: () => propuestasService.getNextVersion(mandatoId!),
    enabled: !!mandatoId,
  });
}
