import { supabase } from "@/integrations/supabase/client";

export interface Interaccion {
  id: string;
  contacto_id?: string;
  empresa_id?: string;
  mandato_id?: string;
  tipo: 'llamada' | 'email' | 'reunion' | 'nota' | 'whatsapp' | 'linkedin' | 'visita';
  titulo: string;
  descripcion?: string;
  fecha: string;
  duracion_minutos?: number;
  resultado?: 'positivo' | 'neutral' | 'negativo' | 'pendiente_seguimiento';
  siguiente_accion?: string;
  fecha_siguiente_accion?: string;
  documentos_adjuntos?: any[];
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export const fetchInteraccionesByContacto = async (contactoId: string): Promise<Interaccion[]> => {
  const { data, error } = await supabase
    .from('interacciones')
    .select('*')
    .eq('contacto_id', contactoId)
    .order('fecha', { ascending: false });
  
  if (error) throw error;
  return (data || []) as Interaccion[];
};

export const fetchInteraccionesByEmpresa = async (empresaId: string): Promise<Interaccion[]> => {
  const { data, error } = await supabase
    .from('interacciones')
    .select('*')
    .eq('empresa_id', empresaId)
    .order('fecha', { ascending: false });
  
  if (error) throw error;
  return (data || []) as Interaccion[];
};

export const fetchInteraccionesByMandato = async (mandatoId: string): Promise<Interaccion[]> => {
  const { data, error } = await supabase
    .from('interacciones')
    .select('*')
    .eq('mandato_id', mandatoId)
    .order('fecha', { ascending: false });
  
  if (error) throw error;
  return (data || []) as Interaccion[];
};

export const createInteraccion = async (interaccion: Partial<Interaccion>) => {
  // Obtener usuario actual si no viene en el payload (requerido por RLS)
  let created_by = interaccion.created_by;
  if (!created_by) {
    const { data: { user } } = await supabase.auth.getUser();
    created_by = user?.id;
  }

  const { data, error } = await supabase
    .from('interacciones')
    .insert({ ...interaccion, created_by } as any)
    .select()
    .single();
  
  if (error) throw error;
  return data as Interaccion;
};

export const updateInteraccion = async (id: string, interaccion: Partial<Interaccion>) => {
  const { data, error } = await supabase
    .from('interacciones')
    .update(interaccion)
    .eq('id', id)
    .select()
    .single();
  
  if (error) throw error;
  return data;
};

export const deleteInteraccion = async (id: string) => {
  const { error } = await supabase
    .from('interacciones')
    .delete()
    .eq('id', id);
  
  if (error) throw error;
};

export const getInteraccionesRecientes = async (limit = 10): Promise<Interaccion[]> => {
  const { data, error } = await supabase
    .from('interacciones')
    .select('*')
    .order('fecha', { ascending: false })
    .limit(limit);
  
  if (error) throw error;
  return (data || []) as Interaccion[];
};

export const getProximasAcciones = async (): Promise<Interaccion[]> => {
  const { data, error } = await supabase
    .from('interacciones')
    .select('*')
    .not('fecha_siguiente_accion', 'is', null)
    .gte('fecha_siguiente_accion', new Date().toISOString().split('T')[0])
    .order('fecha_siguiente_accion', { ascending: true });
  
  if (error) throw error;
  return (data || []) as Interaccion[];
};

export const getLastInteraccionByContacto = async (contactoId: string): Promise<Interaccion | null> => {
  const { data, error } = await supabase
    .from('interacciones')
    .select('*')
    .eq('contacto_id', contactoId)
    .order('fecha', { ascending: false })
    .limit(1)
    .maybeSingle();
  
  if (error) throw error;
  return data as Interaccion | null;
};

export const getContactosByEmpresa = async (empresaId: string): Promise<any[]> => {
  const { data, error } = await supabase
    .from('contactos')
    .select('*')
    .eq('empresa_principal_id', empresaId)
    .is('merged_into_contacto_id', null)
    .order('nombre', { ascending: true });
  
  if (error) throw error;
  return data || [];
};
