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
        empresa_principal:empresas(id, nombre, cif)
      `)
      .is('merged_into_contacto_id', null)
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
        empresa_principal:empresas(id, nombre, cif)
      `, { count: 'exact' })
      .is('merged_into_contacto_id', null)
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
        empresa_principal:empresas(id, nombre, cif)
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
        empresa_principal:empresas(id, nombre, cif)
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
        empresa_principal:empresas(id, nombre, cif)
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
    const { data, error } = await supabase
      .rpc('search_contactos_full', { search_query: query })
      .limit(20);
    
    if (error) {
      throw new DatabaseError('Error al buscar contactos', {
        supabaseError: error,
        table: 'contactos',
      });
    }
    
    // Transformar resultado para mantener la estructura esperada
    return (data || []).map((row: any) => ({
      id: row.id,
      nombre: row.nombre,
      apellidos: row.apellidos,
      email: row.email,
      telefono: row.telefono,
      cargo: row.cargo,
      empresa_principal_id: row.empresa_principal_id,
      linkedin: row.linkedin,
      notas: row.notas,
      avatar: row.avatar,
      created_at: row.created_at,
      updated_at: row.updated_at,
      empresa_principal: row.empresa_nombre 
        ? { id: row.empresa_principal_id, nombre: row.empresa_nombre }
        : null
    })) as Contacto[];
  } catch (error) {
    if (error instanceof DatabaseError) throw error;
    throw new DatabaseError('Error inesperado al buscar contactos');
  }
};

/**
 * Busca un contacto por email exacto (normalizado)
 * Retorna el contacto si existe, o null si no se encuentra
 */
export const findContactoByEmail = async (email: string): Promise<Contacto | null> => {
  if (!email) return null;
  
  try {
    const normalizedEmail = normalizeEmail(email);
    const { data, error } = await supabase
      .from('contactos')
      .select(`
        *,
        empresa_principal:empresas(id, nombre, cif)
      `)
      .eq('email', normalizedEmail)
      .maybeSingle();
    
    if (error) {
      throw new DatabaseError('Error al buscar contacto por email', {
        supabaseError: error,
        table: 'contactos',
      });
    }
    
    return data as Contacto | null;
  } catch (error) {
    if (error instanceof DatabaseError) throw error;
    throw new DatabaseError('Error inesperado al buscar contacto por email');
  }
};

/**
 * Asocia un contacto existente a una empresa
 */
export const asociarContactoAEmpresa = async (
  contactoId: string,
  empresaId: string
): Promise<Contacto> => {
  if (!isValidUUID(contactoId)) {
    throw new DatabaseError('ID de contacto inválido', { contactoId });
  }
  if (!isValidUUID(empresaId)) {
    throw new DatabaseError('ID de empresa inválido', { empresaId });
  }
  
  try {
    const { data, error } = await supabase
      .from('contactos')
      .update({ empresa_principal_id: empresaId })
      .eq('id', contactoId)
      .select(`
        *,
        empresa_principal:empresas(id, nombre, cif)
      `)
      .single();
    
    if (error) {
      throw new DatabaseError('Error al asociar contacto a empresa', {
        supabaseError: error,
        table: 'contactos',
        contactoId,
        empresaId,
      });
    }
    
    return data as Contacto;
  } catch (error) {
    if (error instanceof DatabaseError) throw error;
    throw new DatabaseError('Error inesperado al asociar contacto a empresa');
  }
};
