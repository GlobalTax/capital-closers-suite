import { supabase } from "@/integrations/supabase/client";
import type { Contacto } from "@/types";

export const fetchContactos = async (): Promise<Contacto[]> => {
  const { data, error } = await supabase
    .from('contactos')
    .select(`
      *,
      empresa_principal:empresas(*)
    `)
    .order('created_at', { ascending: false });
  
  if (error) throw error;
  return (data || []) as any;
};

export const getContactoById = async (id: string): Promise<Contacto | null> => {
  const { data, error } = await supabase
    .from('contactos')
    .select(`
      *,
      empresa_principal:empresas(*)
    `)
    .eq('id', id)
    .single();
  
  if (error) throw error;
  return data as any;
};

export const createContacto = async (contacto: Partial<Contacto>) => {
  const { data, error } = await supabase
    .from('contactos')
    .insert(contacto as any)
    .select(`
      *,
      empresa_principal:empresas(*)
    `)
    .single();
  
  if (error) throw error;
  return data as any;
};

export const updateContacto = async (id: string, contacto: Partial<Contacto>) => {
  const { data, error } = await supabase
    .from('contactos')
    .update(contacto)
    .eq('id', id)
    .select(`
      *,
      empresa_principal:empresas(*)
    `)
    .single();
  
  if (error) throw error;
  return data;
};

export const deleteContacto = async (id: string) => {
  const { error } = await supabase
    .from('contactos')
    .delete()
    .eq('id', id);
  
  if (error) throw error;
};

export const getContactoMandatos = async (contactoId: string) => {
  const { data, error } = await supabase
    .from('mandato_contactos')
    .select(`
      *,
      mandato:mandatos(
        *,
        empresa_principal:empresas(*)
      )
    `)
    .eq('contacto_id', contactoId);
  
  if (error) throw error;
  return (data || []).map((mc: any) => mc.mandato);
};
