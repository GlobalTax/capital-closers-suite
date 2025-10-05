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
  return data || [];
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
  return data;
};

export const createContacto = async (contacto: Partial<Contacto>) => {
  const { data, error } = await supabase
    .from('contactos')
    .insert(contacto)
    .select(`
      *,
      empresa_principal:empresas(*)
    `)
    .single();
  
  if (error) throw error;
  return data;
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
