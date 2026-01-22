import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const PROSPECCION_PROJECT_ID = '00000000-0000-0000-0000-000000000004';

export interface ProspectForTimeEntry {
  id: string;
  company_name: string;
  contact_name: string | null;
  contact_email: string | null;
  sector: string | null;
  source_table: string;
}

/**
 * Hook to fetch prospects from ALL lead tables for time entry in Prospección project.
 * Only enabled when the mandato is the Prospección internal project.
 * Combines admin_leads, contact_leads, sell_leads, investor_leads, and general_contact_leads.
 */
export function useProspectsForTimeEntry(mandatoId: string | null) {
  const isProspeccionProject = mandatoId === PROSPECCION_PROJECT_ID;

  return useQuery({
    queryKey: ['prospects-for-time-entry', mandatoId],
    queryFn: async (): Promise<ProspectForTimeEntry[]> => {
      // Query all lead tables in parallel with their specific column names
      const [adminLeads, contactLeads, sellLeads, investorLeads, generalContactLeads] = await Promise.all([
        supabase
          .from('admin_leads')
          .select('id, company_name, contact_name, contact_email, sector')
          .not('match_status', 'eq', 'converted'),
        supabase
          .from('contact_leads')
          .select('id, company, full_name, email, sectors_of_interest'),
        supabase
          .from('sell_leads')
          .select('id, company, full_name, email, sector'),
        supabase
          .from('investor_leads')
          .select('id, company, full_name, email, investment_range'),
        supabase
          .from('general_contact_leads')
          .select('id, company, full_name, email, page_origin'),
      ]);

      // Normalize and combine all results
      const allProspects: ProspectForTimeEntry[] = [
        // Admin leads (already has correct column names)
        ...(adminLeads.data || []).map(p => ({
          id: p.id,
          company_name: p.company_name || 'Sin nombre',
          contact_name: p.contact_name,
          contact_email: p.contact_email,
          sector: p.sector,
          source_table: 'admin_leads'
        })),
        // Contact leads (different column names)
        ...(contactLeads.data || []).map(p => ({
          id: p.id,
          company_name: p.company || 'Sin nombre',
          contact_name: p.full_name,
          contact_email: p.email,
          sector: p.sectors_of_interest,
          source_table: 'contact_leads'
        })),
        // Sell leads (uses company/full_name)
        ...(sellLeads.data || []).map(p => ({
          id: p.id,
          company_name: p.company || 'Sin nombre',
          contact_name: p.full_name,
          contact_email: p.email,
          sector: p.sector,
          source_table: 'sell_leads'
        })),
        // Investor leads
        ...(investorLeads.data || []).map(p => ({
          id: p.id,
          company_name: p.company || 'Sin nombre',
          contact_name: p.full_name,
          contact_email: p.email,
          sector: p.investment_range,
          source_table: 'investor_leads'
        })),
        // General contact leads
        ...(generalContactLeads.data || []).map(p => ({
          id: p.id,
          company_name: p.company || 'Sin nombre',
          contact_name: p.full_name,
          contact_email: p.email,
          sector: p.page_origin,
          source_table: 'general_contact_leads'
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
