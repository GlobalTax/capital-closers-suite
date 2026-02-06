import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { DatabaseError } from "@/lib/error-handler";
import type { MandatoAlert } from "@/types/alerts";

const fetchDismissedAlerts = async (): Promise<MandatoAlert[]> => {
  const { data, error } = await supabase
    .from('mandato_alerts')
    .select('*')
    .eq('is_dismissed', true)
    .order('updated_at', { ascending: false })
    .limit(100);

  if (error) {
    throw new DatabaseError('Error al obtener historial de alertas', { supabaseError: error });
  }

  return (data || []) as MandatoAlert[];
};

export const useDismissedAlerts = (enabled: boolean) => {
  return useQuery({
    queryKey: ['alerts', 'dismissed'],
    queryFn: fetchDismissedAlerts,
    enabled,
    staleTime: 2 * 60 * 1000,
  });
};
