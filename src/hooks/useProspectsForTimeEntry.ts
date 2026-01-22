import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const PROSPECCION_PROJECT_ID = '00000000-0000-0000-0000-000000000004';

export interface ProspectForTimeEntry {
  id: string;
  company_name: string;
  contact_name: string | null;
  contact_email: string | null;
  sector: string | null;
  match_status: string | null;
}

/**
 * Hook to fetch prospects from admin_leads for time entry in Prospección project.
 * Only enabled when the mandato is the Prospección internal project.
 * Excludes already converted leads.
 */
export function useProspectsForTimeEntry(mandatoId: string | null) {
  const isProspeccionProject = mandatoId === PROSPECCION_PROJECT_ID;

  return useQuery({
    queryKey: ['prospects-for-time-entry', mandatoId],
    queryFn: async (): Promise<ProspectForTimeEntry[]> => {
      // Query admin_leads that are NOT converted
      const { data, error } = await supabase
        .from('admin_leads')
        .select('id, company_name, contact_name, contact_email, sector, match_status')
        .not('match_status', 'eq', 'converted')
        .order('company_name', { ascending: true });

      if (error) throw error;
      return data || [];
    },
    enabled: isProspeccionProject,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}
