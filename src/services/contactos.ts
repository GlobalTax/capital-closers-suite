import { supabase } from "@/integrations/supabase/client";
import type { Contacto } from "@/types";
import { DatabaseError } from "@/lib/error-handler";
import { isValidUUID } from "@/lib/validation/regex";
import { normalizeEmail, normalizePhone } from "@/lib/validation/validators";
import type { PaginatedResult } from "@/types/pagination";
import { calculatePagination, DEFAULT_PAGE_SIZE } from "@/types/pagination";

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

/**
 * Obtener contactos con paginación server-side
 */
export const fetchContactosPaginated = async (
  page: number = 1,
  pageSize: number = DEFAULT_PAGE_SIZE
): Promise<PaginatedResult<Contacto>> => {
  try {
    const offset = (page - 1) * pageSize;
    
    const { data, error, count } = await supabase
      .from('contactos')
      .select(`
        *,
        empresa_principal:empresas(*)
      `, { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + pageSize - 1);
    
    if (error) {
      throw new DatabaseError('Error al obtener contactos paginados', {
        supabaseError: error,
        table: 'contactos',
      });
    }
    
    return {
      data: (data || []) as Contacto[],
      ...calculatePagination(count || 0, page, pageSize),
    };
  } catch (error) {
    if (error instanceof DatabaseError) throw error;
    throw new DatabaseError('Error inesperado al obtener contactos paginados');
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
    // Normalizar email y teléfono antes de insertar
    const normalizedData = {
      ...contacto,
      ...(contacto.email && { email: normalizeEmail(contacto.email) }),
      ...(contacto.telefono && { telefono: normalizePhone(contacto.telefono) }),
    };

    const { data, error } = await supabase
      .from('contactos')
      .insert(normalizedData as any)
      .select(`
        *,
        empresa_principal:empresas(*)
      `)
      .single();
    
    if (error) {
      // Detectar error de email duplicado
      if (error.code === '23505' && error.message?.includes('email')) {
        throw new DatabaseError('Ya existe un contacto con este email', {
          supabaseError: error,
          table: 'contactos',
          isDuplicate: true,
          duplicateField: 'email',
        });
      }
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
    // Normalizar email y teléfono antes de actualizar
    const normalizedData = {
      ...contacto,
      ...(contacto.email !== undefined && { 
        email: contacto.email ? normalizeEmail(contacto.email) : null 
      }),
      ...(contacto.telefono !== undefined && { 
        telefono: contacto.telefono ? normalizePhone(contacto.telefono) : null 
      }),
    };

    const { data, error } = await supabase
      .from('contactos')
      .update(normalizedData)
      .eq('id', id)
      .select(`
        *,
        empresa_principal:empresas(*)
      `)
      .single();
    
    if (error) {
      // Detectar error de email duplicado
      if (error.code === '23505' && error.message?.includes('email')) {
        throw new DatabaseError('Ya existe otro contacto con este email', {
          supabaseError: error,
          table: 'contactos',
          id,
          isDuplicate: true,
          duplicateField: 'email',
        });
      }
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

export const getContactoMandatos = async (contactoId: string): Promise<any[]> => {
  if (!contactoId || !isValidUUID(contactoId)) {
    throw new DatabaseError('ID de contacto inválido', { contactoId });
  }
  
  try {
    const { data, error } = await supabase
      .from('mandato_contactos')
      .select(`
        *,
        mandato:mandatos(*, empresa_principal:empresas(*))
      `)
      .eq('contacto_id', contactoId);
    
    if (error) throw new DatabaseError('Error al obtener mandatos del contacto', { supabaseError: error });
    return data || [];
  } catch (error) {
    if (error instanceof DatabaseError) throw error;
    throw new DatabaseError('Error inesperado al obtener mandatos');
  }
};

export const searchContactos = async (query: string): Promise<Contacto[]> => {
  try {
    const searchTerm = `%${query.toLowerCase()}%`;
    
    const { data, error } = await supabase
      .from('contactos')
      .select(`
        *,
        empresa_principal:empresas(*)
      `)
      .or(`nombre.ilike.${searchTerm},apellidos.ilike.${searchTerm},email.ilike.${searchTerm}`)
      .order('nombre', { ascending: true })
      .limit(20);
    
    if (error) {
      throw new DatabaseError('Error al buscar contactos', {
        supabaseError: error,
        table: 'contactos',
      });
    }
    
    return (data || []) as Contacto[];
  } catch (error) {
    if (error instanceof DatabaseError) throw error;
    throw new DatabaseError('Error inesperado al buscar contactos');
  }
};
