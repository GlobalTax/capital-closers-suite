import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { 
  fetchActiveAlerts, 
  fetchAlertStats,
  generateAlerts,
  markAlertAsRead,
  dismissAlert,
  markAllAlertsAsRead,
  dismissAllReadAlerts
} from "@/services/alerts.service";
import { toast } from "sonner";

export const useActiveAlerts = () => {
  return useQuery({
    queryKey: ['alerts', 'active'],
    queryFn: fetchActiveAlerts,
    staleTime: 2 * 60 * 1000, // 2 minutos
    refetchInterval: 5 * 60 * 1000, // Refrescar cada 5 minutos
  });
};

export const useAlertStats = () => {
  return useQuery({
    queryKey: ['alerts', 'stats'],
    queryFn: fetchAlertStats,
    staleTime: 2 * 60 * 1000,
    refetchInterval: 5 * 60 * 1000,
  });
};

export const useGenerateAlerts = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: generateAlerts,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alerts'] });
      toast.success('Alertas actualizadas');
    },
    onError: () => {
      toast.error('Error al generar alertas');
    },
  });
};

export const useMarkAlertAsRead = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: markAlertAsRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alerts'] });
    },
    onError: () => {
      toast.error('Error al marcar alerta como leída');
    },
  });
};

export const useDismissAlert = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: dismissAlert,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alerts'] });
      toast.success('Alerta descartada');
    },
    onError: () => {
      toast.error('Error al descartar alerta');
    },
  });
};

export const useMarkAllAlertsAsRead = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: markAllAlertsAsRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alerts'] });
      toast.success('Todas las alertas marcadas como leídas');
    },
    onError: () => {
      toast.error('Error al marcar alertas como leídas');
    },
  });
};

export const useDismissAllReadAlerts = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: dismissAllReadAlerts,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alerts'] });
      toast.success('Alertas leídas descartadas');
    },
    onError: () => {
      toast.error('Error al descartar alertas leídas');
    },
  });
};
