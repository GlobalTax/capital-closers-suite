import { supabase } from "@/integrations/supabase/client";
import type { Mandato, MandatoContacto, MandatoEmpresa, ContactoRol, EmpresaRol } from "@/types";

export const fetchMandatos = async (): Promise<Mandato[]> => {
  const { data, error } = await supabase
    .from('mandatos')
    .select(`
      *,
      empresa_principal:empresas(*),
      contactos:mandato_contactos(*, contacto:contactos(*, empresa_principal:empresas(*))),
      empresas:mandato_empresas(*, empresa:empresas(*))
    `)
    .order('created_at', { ascending: false });
  
  if (error) throw error;
  return data || [];
};

export const getMandatoById = async (id: string): Promise<Mandato | null> => {
  const { data, error } = await supabase
    .from('mandatos')
    .select(`
      *,
      empresa_principal:empresas(*),
      contactos:mandato_contactos(*, contacto:contactos(*, empresa_principal:empresas(*))),
      empresas:mandato_empresas(*, empresa:empresas(*))
    `)
    .eq('id', id)
    .single();
  
  if (error) throw error;
  return data;
};

export const createMandato = async (mandato: Partial<Mandato>) => {
  const { data, error } = await supabase
    .from('mandatos')
    .insert(mandato)
    .select(`
      *,
      empresa_principal:empresas(*),
      contactos:mandato_contactos(*, contacto:contactos(*)),
      empresas:mandato_empresas(*, empresa:empresas(*))
    `)
    .single();
  
  if (error) throw error;
  return data;
};

export const updateMandato = async (id: string, mandato: Partial<Mandato>) => {
  const { data, error } = await supabase
    .from('mandatos')
    .update(mandato)
    .eq('id', id)
    .select(`
      *,
      empresa_principal:empresas(*),
      contactos:mandato_contactos(*, contacto:contactos(*)),
      empresas:mandato_empresas(*, empresa:empresas(*))
    `)
    .single();
  
  if (error) throw error;
  return data;
};

export const deleteMandato = async (id: string) => {
  const { error } = await supabase
    .from('mandatos')
    .delete()
    .eq('id', id);
  
  if (error) throw error;
};

// ============================================
// RELACIONES MANDATO-CONTACTO
// ============================================

export const addContactoToMandato = async (
  mandatoId: string,
  contactoId: string,
  rol: ContactoRol,
  notas?: string
): Promise<MandatoContacto> => {
  const { data, error } = await supabase
    .from('mandato_contactos')
    .insert({ 
      mandato_id: mandatoId, 
      contacto_id: contactoId, 
      rol, 
      notas 
    })
    .select('*, contacto:contactos(*, empresa_principal:empresas(*))')
    .single();
  
  if (error) throw error;
  return data;
};

export const removeContactoFromMandato = async (id: string) => {
  const { error } = await supabase
    .from('mandato_contactos')
    .delete()
    .eq('id', id);
  
  if (error) throw error;
};

export const updateMandatoContacto = async (id: string, updates: Partial<MandatoContacto>) => {
  const { data, error } = await supabase
    .from('mandato_contactos')
    .update(updates)
    .eq('id', id)
    .select('*, contacto:contactos(*, empresa_principal:empresas(*))')
    .single();
  
  if (error) throw error;
  return data;
};

// ============================================
// RELACIONES MANDATO-EMPRESA
// ============================================

export const addEmpresaToMandato = async (
  mandatoId: string,
  empresaId: string,
  rol: EmpresaRol,
  notas?: string
): Promise<MandatoEmpresa> => {
  const { data, error } = await supabase
    .from('mandato_empresas')
    .insert({ 
      mandato_id: mandatoId, 
      empresa_id: empresaId, 
      rol, 
      notas 
    })
    .select('*, empresa:empresas(*)')
    .single();
  
  if (error) throw error;
  return data;
};

export const removeEmpresaFromMandato = async (id: string) => {
  const { error } = await supabase
    .from('mandato_empresas')
    .delete()
    .eq('id', id);
  
  if (error) throw error;
};

export const updateMandatoEmpresa = async (id: string, updates: Partial<MandatoEmpresa>) => {
  const { data, error } = await supabase
    .from('mandato_empresas')
    .update(updates)
    .eq('id', id)
    .select('*, empresa:empresas(*)')
    .single();
  
  if (error) throw error;
  return data;
};
