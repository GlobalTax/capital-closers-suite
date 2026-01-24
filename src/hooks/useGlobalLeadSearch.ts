import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const PROSPECCION_PROJECT_ID = '00000000-0000-0000-0000-000000000004';

export type LeadSource = 'contact_lead' | 'company_valuation' | 'collaborator' | 'mandate_lead';

export interface GlobalLead {
  id: string;
  companyName: string;
  contactName: string | null;
  contactEmail: string | null;
  sector: string | null;
  source: LeadSource;
  sourceTable: string;
  mandatoId: string | null;
  mandatoName: string | null;
}

async function fetchAllLeads(): Promise<GlobalLead[]> {
  const allLeads: GlobalLead[] = [];

  // Fetch contact leads
  const { data: contactLeads } = await supabase
    .from('contact_leads')
    .select('id, company, full_name, email, sectors_of_interest')
    .eq('is_deleted', false);

  if (contactLeads) {
    for (const l of contactLeads) {
      allLeads.push({
        id: l.id,
        companyName: l.company || 'Sin nombre',
        contactName: l.full_name,
        contactEmail: l.email,
        sector: l.sectors_of_interest,
        source: 'contact_lead',
        sourceTable: 'contact_leads',
        mandatoId: PROSPECCION_PROJECT_ID,
        mandatoName: 'Prospección Comercial',
      });
    }
  }

  // Fetch company valuations
  const { data: companyValuations } = await supabase
    .from('company_valuations')
    .select('id, company_name, contact_name, email, industry')
    .eq('is_deleted', false);

  if (companyValuations) {
    for (const l of companyValuations) {
      allLeads.push({
        id: l.id,
        companyName: l.company_name || 'Sin nombre',
        contactName: l.contact_name,
        contactEmail: l.email,
        sector: l.industry,
        source: 'company_valuation',
        sourceTable: 'company_valuations',
        mandatoId: PROSPECCION_PROJECT_ID,
        mandatoName: 'Prospección Comercial',
      });
    }
  }

  // Fetch collaborator applications
  const { data: collaboratorApps } = await supabase
    .from('collaborator_applications')
    .select('id, company, full_name, email, profession')
    .eq('is_deleted', false);

  if (collaboratorApps) {
    for (const l of collaboratorApps) {
      allLeads.push({
        id: l.id,
        companyName: l.company || 'Sin nombre',
        contactName: l.full_name,
        contactEmail: l.email,
        sector: l.profession,
        source: 'collaborator',
        sourceTable: 'collaborator_applications',
        mandatoId: PROSPECCION_PROJECT_ID,
        mandatoName: 'Prospección Comercial',
      });
    }
  }

  // Fetch mandate leads using raw query to avoid type depth issues
  const { data: mandateLeads } = await supabase
    .from('mandate_leads' as any)
    .select('id, company_name, contact_name, contact_email, mandato_id')
    .eq('is_active', true);

  if (mandateLeads) {
    for (const l of mandateLeads as any[]) {
      allLeads.push({
        id: l.id,
        companyName: l.company_name || 'Sin nombre',
        contactName: l.contact_name,
        contactEmail: l.contact_email,
        sector: null,
        source: 'mandate_lead',
        sourceTable: 'mandate_leads',
        mandatoId: l.mandato_id,
        mandatoName: null,
      });
    }
  }

  // Sort alphabetically
  return allLeads.sort((a, b) => a.companyName.localeCompare(b.companyName));
}

export function useGlobalLeadSearch(searchTerm: string) {
  const { data: allLeads = [], isLoading, error } = useQuery({
    queryKey: ['global-leads-search'],
    queryFn: fetchAllLeads,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const filteredLeads = useMemo(() => {
    if (!searchTerm || searchTerm.length < 2) return [];
    
    const term = searchTerm.toLowerCase();
    return allLeads
      .filter(lead => 
        lead.companyName.toLowerCase().includes(term) ||
        (lead.contactName?.toLowerCase().includes(term)) ||
        (lead.contactEmail?.toLowerCase().includes(term))
      )
      .slice(0, 20); // Limit results
  }, [allLeads, searchTerm]);

  return {
    leads: filteredLeads,
    isLoading,
    error,
    totalCount: allLeads.length,
  };
}

export function getSourceLabel(source: LeadSource): string {
  switch (source) {
    case 'contact_lead': return 'Contacto';
    case 'company_valuation': return 'Valoración';
    case 'collaborator': return 'Colaborador';
    case 'mandate_lead': return 'Mandato';
  }
}

export function getSourceColor(source: LeadSource): string {
  switch (source) {
    case 'contact_lead': return 'bg-blue-100 text-blue-700';
    case 'company_valuation': return 'bg-green-100 text-green-700';
    case 'collaborator': return 'bg-purple-100 text-purple-700';
    case 'mandate_lead': return 'bg-orange-100 text-orange-700';
  }
}
