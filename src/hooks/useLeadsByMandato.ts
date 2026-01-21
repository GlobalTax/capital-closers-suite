import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface MandateLead {
  id: string;
  company_name: string | null;
  contact_name: string | null;
  contact_email: string | null;
  stage: string | null;
  priority: string | null;
}

/**
 * Fetches leads associated with a specific mandato from mandate_leads table
 */
export function useLeadsByMandato(mandatoId: string | null) {
  return useQuery({
    queryKey: ['mandate-leads-by-mandato', mandatoId],
    queryFn: async (): Promise<MandateLead[]> => {
      if (!mandatoId) return [];
      
      const { data, error } = await supabase
        .from('mandate_leads')
        .select(`
          id,
          company_name,
          contact_name,
          contact_email,
          stage,
          priority
        `)
        .eq('mandato_id', mandatoId)
        .not('stage', 'in', '("cerrado_ganado","cerrado_perdido","descartado")')
        .order('company_name');
      
      if (error) {
        console.error('Error fetching leads for mandato:', error);
        throw error;
      }
      
      return data || [];
    },
    enabled: !!mandatoId,
    staleTime: 30000, // 30 seconds
  });
}
