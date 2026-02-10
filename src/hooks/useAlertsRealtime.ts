import { useEffect, useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { MandatoAlert } from "@/types/alerts";

/**
 * Hook para suscribirse a alertas en tiempo real
 * Muestra notificaciones toast y actualiza el cache de React Query
 */
export function useAlertsRealtime() {
  const queryClient = useQueryClient();

  const showBrowserNotification = useCallback((alert: MandatoAlert) => {
    // Solo mostrar notificaciones del navegador para alertas críticas
    if (alert.severity !== 'critical') return;
    
    // Verificar si tenemos permiso
    if (!('Notification' in window)) return;
    
    if (Notification.permission === 'granted') {
      new Notification('⚠️ Alerta Crítica M&A', {
        body: alert.title,
        icon: '/favicon.ico',
        tag: alert.id, // Evitar duplicados
      });
    } else if (Notification.permission !== 'denied') {
      // Pedir permiso
      Notification.requestPermission();
    }
  }, []);

  useEffect(() => {
    const channel = supabase
      .channel('alerts-realtime')
      .on(
        'postgres_changes',
        { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'mandato_alerts' 
        },
        (payload) => {
          const newAlert = payload.new as MandatoAlert;
          
          // Mostrar toast según severidad
          if (newAlert.severity === 'critical') {
            toast.error(newAlert.title, {
              description: newAlert.description,
              duration: 10000,
              action: {
                label: 'Ver',
                onClick: () => {
                  // Use history.pushState + popstate to navigate without full reload
                  window.history.pushState({}, '', `/mandatos/${newAlert.mandato_id}`);
                  window.dispatchEvent(new PopStateEvent('popstate'));
                },
              },
            });
          } else if (newAlert.severity === 'warning') {
            toast.warning(newAlert.title, {
              description: newAlert.description,
              duration: 5000,
            });
          } else {
            toast.info(newAlert.title, {
              duration: 3000,
            });
          }
          
          // Notificación del navegador para críticas
          showBrowserNotification(newAlert);
          
          // Invalidar queries para refrescar datos
          queryClient.invalidateQueries({ queryKey: ['alerts'] });
        }
      )
      .on(
        'postgres_changes',
        { 
          event: 'UPDATE', 
          schema: 'public', 
          table: 'mandato_alerts' 
        },
        () => {
          // Refrescar cuando se marcan como leídas/descartadas
          queryClient.invalidateQueries({ queryKey: ['alerts'] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient, showBrowserNotification]);

  // Función para solicitar permisos de notificación
  const requestNotificationPermission = useCallback(async () => {
    if (!('Notification' in window)) {
      return false;
    }
    
    if (Notification.permission === 'granted') {
      return true;
    }
    
    if (Notification.permission !== 'denied') {
      const permission = await Notification.requestPermission();
      return permission === 'granted';
    }
    
    return false;
  }, []);

  return { requestNotificationPermission };
}
