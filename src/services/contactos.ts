import { supabase } from "@/integrations/supabase/client";
import type { Contacto } from "@/types";
import { DatabaseError } from "@/lib/error-handler";
import { isValidUUID } from "@/lib/validation/regex";

export const fetchContactos = async (): Promise<Contacto[]> => {
  try {
    const { data, error } = await supabase
      .from('contactos')
      .select(`
        *,
        empresa_principal:empresas(*)
      `)
      .order('created_at', { ascending: false });
    
    if (error) {
      throw new DatabaseError('Error al obtener contactos', {
        supabaseError: error,
        table: 'contactos',
      });
    }
    
    return (data || []) as Contacto[];
  } catch (error) {
    if (error instanceof DatabaseError) throw error;
    throw new DatabaseError('Error inesperado al obtener contactos');
  }
};

export const getContactoById = async (id: string): Promise<Contacto | null> => {
  if (!id || !isValidUUID(id)) {
    throw new DatabaseError('ID de contacto inválido', { id });
  }
  
  try {
    const { data, error } = await supabase
      .from('contactos')
      .select(`
        *,
        empresa_principal:empresas(*)
      `)
      .eq('id', id)
      .single();
    
    if (error) {
      throw new DatabaseError('Error al obtener contacto', {
        supabaseError: error,
        table: 'contactos',
        id,
      });
    }
    
    return data as Contacto;
  } catch (error) {
    if (error instanceof DatabaseError) throw error;
    throw new DatabaseError('Error inesperado al obtener contacto');
  }
};

export const createContacto = async (contacto: Partial<Contacto>) => {
  try {
    const { data, error } = await supabase
      .from('contactos')
      .insert(contacto as any)
      .select(`
        *,
        empresa_principal:empresas(*)
      `)
      .single();
    
    if (error) {
      throw new DatabaseError('Error al crear contacto', {
        supabaseError: error,
        table: 'contactos',
      });
    }
    
    return data as Contacto;
  } catch (error) {
    if (error instanceof DatabaseError) throw error;
    throw new DatabaseError('Error inesperado al crear contacto');
  }
};

export const updateContacto = async (id: string, contacto: Partial<Contacto>) => {
  if (!id || !isValidUUID(id)) {
    throw new DatabaseError('ID de contacto inválido', { id });
  }
  
  try {
    const { data, error } = await supabase
      .from('contactos')
      .update(contacto)
      .eq('id', id)
      .select(`
        *,
        empresa_principal:empresas(*)
      `)
      .single();
    
    if (error) {
      throw new DatabaseError('Error al actualizar contacto', {
        supabaseError: error,
        table: 'contactos',
        id,
      });
    }
    
    return data as Contacto;
  } catch (error) {
    if (error instanceof DatabaseError) throw error;
    throw new DatabaseError('Error inesperado al actualizar contacto');
  }
};

export const deleteContacto = async (id: string) => {
  if (!id || !isValidUUID(id)) {
    throw new DatabaseError('ID de contacto inválido', { id });
  }
  
  try {
    const { error } = await supabase
      .from('contactos')
      .delete()
      .eq('id', id);
    
    if (error) {
      throw new DatabaseError('Error al eliminar contacto', {
        supabaseError: error,
        table: 'contactos',
        id,
      });
    }
  } catch (error) {
    if (error instanceof DatabaseError) throw error;
    throw new DatabaseError('Error inesperado al eliminar contacto');
  }
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
