import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

/**
 * Hook para suscribirse a cambios en tiempo real de la tabla contactos.
 * Invalida automáticamente las queries cuando hay cambios.
 */
export function useContactosRealtime() {
  const queryClient = useQueryClient();

  useEffect(() => {
    const channel = supabase
      .channel("contactos-realtime")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "contactos",
        },
        (payload) => {
          // Invalidar queries para refrescar datos
          queryClient.invalidateQueries({ queryKey: ["contactos"] });

          // Notificación sutil solo para inserts de otros usuarios
          if (payload.eventType === "INSERT") {
            const newRecord = payload.new as { nombre?: string; apellido?: string };
            const nombre = [newRecord.nombre, newRecord.apellido].filter(Boolean).join(" ");
            
            toast({
              title: "Nuevo contacto",
              description: nombre ? `Se añadió: ${nombre}` : "Se añadió un nuevo contacto",
              duration: 3000,
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);
}
