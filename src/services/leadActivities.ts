import { supabase } from "@/integrations/supabase/client";
import type { Interaccion } from "./interacciones.service";

export interface LeadActivity {
  id: string;
  type: 'interaccion' | 'time_entry';
  activityType: string; // 'llamada' | 'reunion' | 'email' | 'work'
  title: string;
  description?: string;
  date: string;
  durationMinutes?: number;
  result?: string;
  createdBy?: string;
  createdByName?: string;
}

export interface LeadActivitySummary {
  totalHours: number;
  totalInteractions: number;
  lastActivityDate: string | null;
  lastActivityType: string | null;
  daysSinceLastActivity: number | null;
}

// Fetch activities for a lead (from interacciones and time_entries)
export async function fetchLeadActivities(
  leadId: string,
  leadType: 'contact' | 'valuation' | 'collaborator'
): Promise<LeadActivity[]> {
  const activities: LeadActivity[] = [];

  // First, check if this lead exists in mandate_leads
  // Now supports: contact_leads, advisor_valuations (valuation_id), collaborator_applications (admin_lead_id)
  const fieldName = leadType === 'valuation' ? 'valuation_id' : 'admin_lead_id';
  const { data: mandateLead } = await supabase
    .from('mandate_leads')
    .select('id')
    .eq(fieldName, leadId)
    .maybeSingle();

  // Fetch time entries if the lead is in mandate_leads
  if (mandateLead) {
    const { data: timeEntries } = await supabase
      .from('mandato_time_entries')
      .select(`
        id,
        description,
        start_time,
        duration_minutes,
        work_task_type:work_task_types(name),
        user_id
      `)
      .eq('mandate_lead_id', mandateLead.id)
      .order('start_time', { ascending: false });

    if (timeEntries) {
      // Get user names
      const userIds = [...new Set((timeEntries as any[]).map(e => e.user_id).filter(Boolean))];
      const { data: users } = await supabase
        .from('admin_users')
        .select('user_id, full_name')
        .in('user_id', userIds);

      const userMap = new Map(users?.map(u => [u.user_id, u.full_name]) || []);

      activities.push(...(timeEntries as any[]).map(entry => ({
        id: entry.id,
        type: 'time_entry' as const,
        activityType: entry.work_task_type?.name || 'Trabajo',
        title: entry.work_task_type?.name || 'Registro de tiempo',
        description: entry.description || undefined,
        date: entry.start_time,
        durationMinutes: entry.duration_minutes || 0,
        createdBy: entry.user_id || undefined,
        createdByName: entry.user_id ? userMap.get(entry.user_id) || undefined : undefined,
      })));
    }
  }

  // Sort by date descending
  return activities.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

// Get activity summary for a lead
export async function getLeadActivitySummary(
  leadId: string,
  leadType: 'contact' | 'valuation' | 'collaborator'
): Promise<LeadActivitySummary> {
  let totalHours = 0;
  let totalInteractions = 0;
  let lastActivityDate: string | null = null;
  let lastActivityType: string | null = null;

  // Check if this lead exists in mandate_leads
  // Now supports: contact_leads, advisor_valuations (valuation_id), collaborator_applications (admin_lead_id)
  const fieldName = leadType === 'valuation' ? 'valuation_id' : 'admin_lead_id';
  const { data: mandateLead } = await supabase
    .from('mandate_leads')
    .select('id, last_activity_at')
    .eq(fieldName, leadId)
    .maybeSingle();

  if (mandateLead) {
    // Get time entries summary
    const { data: timeStats } = await supabase
      .from('mandato_time_entries')
      .select('duration_minutes, start_time')
      .eq('mandate_lead_id', mandateLead.id)
      .order('start_time', { ascending: false });

    if (timeStats && timeStats.length > 0) {
      const entries = timeStats as any[];
      totalHours = entries.reduce((sum, e) => sum + ((e.duration_minutes || 0) / 60), 0);
      totalInteractions = entries.length;
      lastActivityDate = entries[0].start_time;
      lastActivityType = 'time_entry';
    }

    // Use mandate_leads.last_activity_at if more recent
    if (mandateLead.last_activity_at) {
      if (!lastActivityDate || new Date(mandateLead.last_activity_at) > new Date(lastActivityDate)) {
        lastActivityDate = mandateLead.last_activity_at;
      }
    }
  }

  const daysSinceLastActivity = lastActivityDate
    ? Math.floor((Date.now() - new Date(lastActivityDate).getTime()) / (1000 * 60 * 60 * 24))
    : null;

  return {
    totalHours,
    totalInteractions,
    lastActivityDate,
    lastActivityType,
    daysSinceLastActivity,
  };
}

// Ensure a lead exists in mandate_leads (create if not)
export async function ensureLeadInMandateLeads(
  leadId: string,
  leadType: 'contact' | 'valuation' | 'collaborator',
  mandatoId: string,
  leadData: {
    companyName: string;
    contactName?: string;
    contactEmail?: string;
    sector?: string;
  }
): Promise<string> {
  // Check if already exists using source + source_id (the correct unique identifier)
  // This avoids the FK issue where leadId might not exist in admin_leads
  const { data: existingBySource } = await supabase
    .from('mandate_leads')
    .select('id')
    .eq('source', leadType)
    .eq('source_id', leadId)
    .eq('mandato_id', mandatoId)
    .maybeSingle();

  if (existingBySource) {
    return existingBySource.id;
  }

  // Also check by valuation_id if it's a valuation type (legacy support)
  if (leadType === 'valuation') {
    const { data: existingByValuation } = await supabase
      .from('mandate_leads')
      .select('id')
      .eq('valuation_id', leadId)
      .eq('mandato_id', mandatoId)
      .maybeSingle();

    if (existingByValuation) {
      return existingByValuation.id;
    }
  }

  // Create new mandate_lead entry
  // IMPORTANT: Only set admin_lead_id if the leadId actually exists in admin_leads
  // For contact_leads, company_valuations, collaborator_applications, we use source + source_id
  const insertData: any = {
    mandato_id: mandatoId,
    company_name: leadData.companyName,
    contact_name: leadData.contactName,
    contact_email: leadData.contactEmail,
    sector: leadData.sector,
    stage: 'contactado',
    source: leadType,
    source_id: leadId,
    // DO NOT set admin_lead_id - that FK references admin_leads table
    // and the leadId here comes from contact_leads/company_valuations/collaborator_applications
  };

  // Only set valuation_id for valuation type (if the FK exists for advisor_valuations)
  if (leadType === 'valuation') {
    insertData.valuation_id = leadId;
  }

  const { data, error } = await supabase
    .from('mandate_leads')
    .insert(insertData)
    .select('id')
    .single();

  if (error) throw error;
  return data.id;
}

// Update last_activity_at for a mandate_lead
export async function updateLeadLastActivity(mandateLeadId: string): Promise<void> {
  const { error } = await supabase
    .from('mandate_leads')
    .update({ last_activity_at: new Date().toISOString() })
    .eq('id', mandateLeadId);

  if (error) {
    console.error('Error updating last_activity_at:', error);
  }
}
