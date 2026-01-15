import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface AcquisitionChannel {
  id: string;
  name: string;
  category: string;
  display_order: number | null;
  is_active: boolean | null;
}

export function useAcquisitionChannels() {
  return useQuery({
    queryKey: ['acquisition-channels'],
    queryFn: async (): Promise<AcquisitionChannel[]> => {
      const { data, error } = await supabase
        .from('acquisition_channels')
        .select('id, name, category, display_order, is_active')
        .eq('is_active', true)
        .order('display_order', { ascending: true, nullsFirst: false });

      if (error) throw error;
      return data || [];
    },
    staleTime: 1000 * 60 * 10, // 10 minutos
  });
}
