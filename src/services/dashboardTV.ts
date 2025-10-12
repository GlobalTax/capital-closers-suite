import { supabase } from "@/integrations/supabase/client";
import type { LucideIcon } from "lucide-react";
import { 
  Building2, 
  Users, 
  UserPlus, 
  Briefcase, 
  Handshake, 
  Trophy,
  Phone,
  CheckCircle,
  Inbox
} from "lucide-react";

export type LeadType = 'valoracion' | 'contacto' | 'colaborador' | 'mandato';
export type ColorScheme = 'purple' | 'blue' | 'green' | 'orange' | 'red' | 'emerald';

export interface UnifiedLead {
  id: string;
  tipo: LeadType;
  titulo: string;
  subtitulo: string;
  valor?: number;
  fecha: string;
  estado: string;
  prioridad?: 'alta' | 'media' | 'baja';
  colorScheme: ColorScheme;
  icono: LucideIcon;
  diasEnFase?: number;
}

function calcularDiasEnFase(fecha: string): number {
  const fechaInicio = new Date(fecha);
  const ahora = new Date();
  const diff = ahora.getTime() - fechaInicio.getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24));
}

export async function fetchNuevosLeads(): Promise<UnifiedLead[]> {
  const leads: UnifiedLead[] = [];

  // Fetch contact_leads con status 'new'
  const { data: contactLeads } = await supabase
    .from('contact_leads')
    .select('*')
    .eq('status', 'new')
    .eq('is_deleted', false)
    .order('created_at', { ascending: false });

  if (contactLeads) {
    leads.push(...contactLeads.map(lead => ({
      id: lead.id,
      tipo: 'contacto' as LeadType,
      titulo: lead.company || 'Sin empresa',
      subtitulo: lead.email,
      fecha: lead.created_at,
      estado: lead.status,
      colorScheme: 'blue' as ColorScheme,
      icono: Users,
      diasEnFase: calcularDiasEnFase(lead.created_at)
    })));
  }

  // Fetch company_valuations con valuation_status 'started' o 'in_progress'
  const { data: valuations } = await supabase
    .from('company_valuations')
    .select('*')
    .in('valuation_status', ['started', 'in_progress'])
    .eq('is_deleted', false)
    .order('created_at', { ascending: false });

  if (valuations) {
    leads.push(...valuations.map(val => ({
      id: val.id,
      tipo: 'valoracion' as LeadType,
      titulo: val.company_name,
      subtitulo: val.email,
      valor: val.final_valuation || undefined,
      fecha: val.created_at,
      estado: val.valuation_status || 'new',
      colorScheme: 'purple' as ColorScheme,
      icono: Building2,
      diasEnFase: calcularDiasEnFase(val.created_at)
    })));
  }

  // Fetch collaborator_applications con status 'pending'
  const { data: collaborators } = await supabase
    .from('collaborator_applications')
    .select('*')
    .eq('status', 'pending')
    .eq('is_deleted', false)
    .order('created_at', { ascending: false });

  if (collaborators) {
    leads.push(...collaborators.map(collab => ({
      id: collab.id,
      tipo: 'colaborador' as LeadType,
      titulo: collab.full_name,
      subtitulo: collab.email,
      fecha: collab.created_at,
      estado: collab.status,
      colorScheme: 'green' as ColorScheme,
      icono: UserPlus,
      diasEnFase: calcularDiasEnFase(collab.created_at)
    })));
  }

  return leads;
}

export async function fetchLeadsEnContacto(): Promise<UnifiedLead[]> {
  const leads: UnifiedLead[] = [];

  // Contact leads con status 'contacted'
  const { data: contactLeads } = await supabase
    .from('contact_leads')
    .select('*')
    .eq('status', 'contacted')
    .eq('is_deleted', false)
    .order('status_updated_at', { ascending: false });

  if (contactLeads) {
    leads.push(...contactLeads.map(lead => ({
      id: lead.id,
      tipo: 'contacto' as LeadType,
      titulo: lead.company || 'Sin empresa',
      subtitulo: lead.email,
      fecha: lead.status_updated_at || lead.created_at,
      estado: lead.status,
      colorScheme: 'blue' as ColorScheme,
      icono: Phone,
      diasEnFase: calcularDiasEnFase(lead.status_updated_at || lead.created_at)
    })));
  }

  // Valoraciones en progreso (contacted implícitamente)
  const { data: valuations } = await supabase
    .from('company_valuations')
    .select('*')
    .eq('valuation_status', 'in_progress')
    .eq('is_deleted', false)
    .not('email_sent', 'is', null)
    .order('last_activity_at', { ascending: false });

  if (valuations) {
    leads.push(...valuations.map(val => ({
      id: val.id,
      tipo: 'valoracion' as LeadType,
      titulo: val.company_name,
      subtitulo: val.email,
      valor: val.final_valuation || undefined,
      fecha: val.last_activity_at || val.created_at,
      estado: val.valuation_status || 'contacted',
      colorScheme: 'purple' as ColorScheme,
      icono: Phone,
      diasEnFase: calcularDiasEnFase(val.last_activity_at || val.created_at)
    })));
  }

  return leads;
}

export async function fetchLeadsCalificados(): Promise<UnifiedLead[]> {
  const leads: UnifiedLead[] = [];

  // Contact leads calificados
  const { data: contactLeads } = await supabase
    .from('contact_leads')
    .select('*')
    .eq('status', 'qualified')
    .eq('is_deleted', false)
    .order('status_updated_at', { ascending: false });

  if (contactLeads) {
    leads.push(...contactLeads.map(lead => ({
      id: lead.id,
      tipo: 'contacto' as LeadType,
      titulo: lead.company || 'Sin empresa',
      subtitulo: lead.email,
      fecha: lead.status_updated_at || lead.created_at,
      estado: lead.status,
      colorScheme: 'blue' as ColorScheme,
      icono: CheckCircle,
      diasEnFase: calcularDiasEnFase(lead.status_updated_at || lead.created_at)
    })));
  }

  // Valoraciones completadas (calificadas)
  const { data: valuations } = await supabase
    .from('company_valuations')
    .select('*')
    .eq('valuation_status', 'completed')
    .eq('is_deleted', false)
    .order('last_activity_at', { ascending: false })
    .limit(20);

  if (valuations) {
    leads.push(...valuations.map(val => ({
      id: val.id,
      tipo: 'valoracion' as LeadType,
      titulo: val.company_name,
      subtitulo: val.email,
      valor: val.final_valuation || undefined,
      fecha: val.last_activity_at || val.created_at,
      estado: 'qualified',
      colorScheme: 'purple' as ColorScheme,
      icono: CheckCircle,
      diasEnFase: calcularDiasEnFase(val.last_activity_at || val.created_at)
    })));
  }

  return leads;
}

export async function fetchMandatosActivos(): Promise<UnifiedLead[]> {
  const { data: mandatos } = await supabase
    .from('mandatos')
    .select(`
      *,
      empresas:empresa_principal_id (
        razon_social
      )
    `)
    .in('estado', ['prospecto', 'activo'])
    .order('created_at', { ascending: false })
    .limit(30);

  if (!mandatos) return [];

  return mandatos.map(mandato => ({
    id: mandato.id,
    tipo: 'mandato' as LeadType,
    titulo: (mandato.empresas as any)?.razon_social || 'Sin nombre',
    subtitulo: mandato.tipo || 'Mandato',
    valor: mandato.valor || undefined,
    fecha: mandato.created_at || new Date().toISOString(),
    estado: mandato.estado,
    colorScheme: 'orange' as ColorScheme,
    icono: Briefcase,
    diasEnFase: calcularDiasEnFase(mandato.created_at || new Date().toISOString())
  }));
}

export async function fetchMandatosEnNegociacion(): Promise<UnifiedLead[]> {
  const { data: mandatos } = await supabase
    .from('mandatos')
    .select(`
      *,
      empresas:empresa_principal_id (
        razon_social
      )
    `)
    .eq('estado', 'en_negociacion')
    .order('updated_at', { ascending: false })
    .limit(30);

  if (!mandatos) return [];

  return mandatos.map(mandato => ({
    id: mandato.id,
    tipo: 'mandato' as LeadType,
    titulo: (mandato.empresas as any)?.razon_social || 'Sin nombre',
    subtitulo: mandato.tipo || 'Mandato',
    valor: mandato.valor || undefined,
    fecha: mandato.updated_at || mandato.created_at || new Date().toISOString(),
    estado: mandato.estado,
    colorScheme: 'orange' as ColorScheme,
    icono: Handshake,
    diasEnFase: calcularDiasEnFase(mandato.updated_at || mandato.created_at || new Date().toISOString())
  }));
}

export async function fetchMandatosCerrados(): Promise<UnifiedLead[]> {
  const hace90Dias = new Date();
  hace90Dias.setDate(hace90Dias.getDate() - 90);

  const { data: mandatos } = await supabase
    .from('mandatos')
    .select(`
      *,
      empresas:empresa_principal_id (
        razon_social
      )
    `)
    .eq('estado', 'cerrado')
    .gte('updated_at', hace90Dias.toISOString())
    .order('updated_at', { ascending: false })
    .limit(30);

  if (!mandatos) return [];

  return mandatos.map(mandato => ({
    id: mandato.id,
    tipo: 'mandato' as LeadType,
    titulo: (mandato.empresas as any)?.razon_social || 'Sin nombre',
    subtitulo: mandato.tipo || 'Mandato',
    valor: mandato.valor || undefined,
    fecha: mandato.updated_at || mandato.created_at || new Date().toISOString(),
    estado: mandato.estado,
    colorScheme: 'emerald' as ColorScheme,
    icono: Trophy,
    diasEnFase: calcularDiasEnFase(mandato.updated_at || mandato.created_at || new Date().toISOString())
  }));
}

export async function updateLeadStatus(
  leadId: string,
  leadType: 'contact' | 'valuation' | 'collaborator',
  newStatus: string
): Promise<void> {
  const table = leadType === 'contact' 
    ? 'contact_leads' 
    : leadType === 'valuation' 
    ? 'company_valuations'
    : 'collaborator_applications';

  const updateData: any = {
    status_updated_at: new Date().toISOString()
  };

  if (leadType === 'valuation') {
    updateData.valuation_status = newStatus;
  } else {
    updateData.status = newStatus;
  }

  const { error } = await supabase
    .from(table)
    .update(updateData)
    .eq('id', leadId);

  if (error) throw error;
}
