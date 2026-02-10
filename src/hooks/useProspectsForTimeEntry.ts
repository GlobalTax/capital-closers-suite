import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const PROSPECCION_PROJECT_ID = '00000000-0000-0000-0000-000000000004';

export interface ProspectForTimeEntry {
  id: string;
  company_name: string;
  contact_name: string | null;
  contact_email: string | null;
  sector: string | null;
  source_table: 'contact_leads' | 'company_valuations' | 'collaborator_applications';
}

/**
 * Hook to fetch prospects for time entry in "Prospección Formulario" project.
 * Only enabled when the mandato is the Prospección internal project.
 * 
 * Uses the same 3 tables as /gestion-leads (inbound leads from forms):
 * - contact_leads: Contact form submissions
 * - advisor_valuations: Company valuation requests
 * - collaborator_applications: Collaborator applications
 */
export function useProspectsForTimeEntry(mandatoId: string | null) {
  const isProspeccionProject = mandatoId === PROSPECCION_PROJECT_ID;

  return useQuery({
    queryKey: ['prospects-for-time-entry', mandatoId],
    queryFn: async (): Promise<ProspectForTimeEntry[]> => {
      // Query the same 3 tables used in /gestion-leads (with is_deleted filter)
      const [contactLeads, companyValuations, collaboratorApps] = await Promise.all([
        supabase
          .from('contact_leads')
          .select('id, company, full_name, email, sectors_of_interest')
          .eq('is_deleted', false)
          .limit(500),
        supabase
          .from('company_valuations')
          .select('id, company_name, contact_name, email, industry')
          .eq('is_deleted', false)
          .limit(500),
        supabase
          .from('collaborator_applications')
          .select('id, company, full_name, email, profession')
          .eq('is_deleted', false)
          .limit(500),
      ]);

      // Normalize and combine all results
      const allProspects: ProspectForTimeEntry[] = [
        // Contact leads
        ...(contactLeads.data || []).map(p => ({
          id: p.id,
          company_name: p.company || 'Sin nombre',
          contact_name: p.full_name,
          contact_email: p.email,
          sector: p.sectors_of_interest,
          source_table: 'contact_leads' as const
        })),
        // Company valuations (valoración de empresas)
        ...(companyValuations.data || []).map(p => ({
          id: p.id,
          company_name: p.company_name || 'Sin nombre',
          contact_name: p.contact_name,
          contact_email: p.email,
          sector: p.industry,
          source_table: 'company_valuations' as const
        })),
        // Collaborator applications
        ...(collaboratorApps.data || []).map(p => ({
          id: p.id,
          company_name: p.company || 'Sin nombre',
          contact_name: p.full_name,
          contact_email: p.email,
          sector: p.profession,
          source_table: 'collaborator_applications' as const
        })),
      ];

      // Sort alphabetically by company name
      return allProspects.sort((a, b) => 
        (a.company_name || '').localeCompare(b.company_name || '')
      );
    },
    enabled: isProspeccionProject,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}
