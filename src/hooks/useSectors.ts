import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface Sector {
  id: string;
  name_es: string;
  slug: string;
  is_active: boolean;
}

/**
 * Hook para obtener sectores del CR Directory
 * Estos sectores son la fuente única de verdad para clasificación de empresas e inversores
 */
export function useSectors() {
  return useQuery({
    queryKey: ['sectors'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('sectors')
        .select('id, name_es, slug, is_active')
        .eq('is_active', true)
        .order('name_es');

      if (error) throw error;
      return (data || []) as Sector[];
    },
    staleTime: 30 * 60 * 1000, // 30 min cache - sectors rarely change
  });
}

/**
 * Hook para obtener opciones de sector formateadas para selects
 */
export function useSectorOptions() {
  const { data: sectors, isLoading, error } = useSectors();

  const options = (sectors || []).map(s => ({
    value: s.name_es,
    label: s.name_es,
  }));

  // Add fallback "Otros" if not present
  if (options.length > 0 && !options.find(o => o.value === 'Otros')) {
    options.push({ value: 'Otros', label: 'Otros' });
  }

  return { options, isLoading, error };
}
