import { QueryClient } from "@tanstack/react-query";
import { handleError } from "./error-handler";

/**
 * Configuración centralizada del QueryClient con cache inteligente
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Cache por 5 minutos - datos frescos para mayoría de casos
      staleTime: 5 * 60 * 1000,

      // Mantener en cache 10 minutos después de volverse stale
      gcTime: 10 * 60 * 1000, // Antes era cacheTime en v4

      // Refetch en background cuando ventana recupera foco
      refetchOnWindowFocus: true,

      // Refetch cuando se reconecta la red
      refetchOnReconnect: true,

      // Retry 1 vez en caso de error (evita múltiples requests fallidos)
      retry: 1,

      // Delay exponencial entre retries: 1s, 2s, 4s...
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),

      // No refetch automático en mount si data es fresca
      refetchOnMount: true,

      // Throw errors para que los componentes los manejen
      throwOnError: (error: any) => {
        // Solo throw para errores críticos
        return error?.severity === 'critical';
      },
    },
    mutations: {
      // Retry mutations críticas 1 vez
      retry: 1,

      // Throw errors para mutations críticas
      throwOnError: (error: any) => {
        return error?.severity === 'critical';
      },
    },
  },
});

// Logger personalizado para desarrollo - manejado en cada hook individual

/**
 * Invalidar queries relacionadas con una entidad
 * Útil para mantener sincronizados datos relacionados
 */
export function invalidateRelatedQueries(entityType: string, entityId?: string) {
  // Invalidar lista general
  queryClient.invalidateQueries({ 
    queryKey: [entityType],
    refetchType: 'active'
  });
  
  // Invalidar entidad específica si hay ID
  if (entityId) {
    queryClient.invalidateQueries({ 
      queryKey: [entityType, entityId],
      refetchType: 'active'
    });
  }
}

/**
 * Prefetch de datos relacionados
 * Útil para mejorar UX cargando datos anticipadamente
 */
export function prefetchEntity<T>(
  queryKey: unknown[],
  queryFn: () => Promise<T>,
  staleTime = 60 * 1000 // 1 minuto por defecto
) {
  queryClient.prefetchQuery({
    queryKey,
    queryFn,
    staleTime,
  });
}

/**
 * Limpiar cache de queries inactivas
 * Útil para liberar memoria
 */
export function clearInactiveQueries() {
  queryClient.clear();
}
