import { supabase } from "@/integrations/supabase/client";
import type { Mandato, MandatoContacto, MandatoEmpresa, ContactoRol, EmpresaRol } from "@/types";
import { DatabaseError } from "@/lib/error-handler";
import { isValidUUID } from "@/lib/validation/regex";

export const fetchMandatos = async (): Promise<Mandato[]> => {
  try {
    const { data, error } = await supabase
      .from('mandatos')
      .select(`
        *,
        empresa_principal:empresas(*),
        contactos:mandato_contactos(*, contacto:contactos(*, empresa_principal:empresas(*))),
        empresas:mandato_empresas(*, empresa:empresas(*))
      `)
      .or('categoria.is.null,categoria.eq.operacion_ma')
      .order('created_at', { ascending: false });
    
    if (error) {
      throw new DatabaseError('Error al obtener mandatos', {
        supabaseError: error,
        table: 'mandatos',
      });
    }
    
    return (data || []) as Mandato[];
  } catch (error) {
    if (error instanceof DatabaseError) throw error;
    throw new DatabaseError('Error inesperado al obtener mandatos');
  }
};

export const fetchServicios = async (): Promise<Mandato[]> => {
  try {
    const { data, error } = await supabase
      .from('mandatos')
      .select(`
        *,
        empresa_principal:empresas(*),
        contactos:mandato_contactos(*, contacto:contactos(*, empresa_principal:empresas(*))),
        empresas:mandato_empresas(*, empresa:empresas(*))
      `)
      .in('categoria', ['due_diligence', 'spa_legal', 'valoracion', 'asesoria'])
      .order('created_at', { ascending: false });
    
    if (error) {
      throw new DatabaseError('Error al obtener servicios', {
        supabaseError: error,
        table: 'mandatos',
      });
    }
    
    return (data || []) as Mandato[];
  } catch (error) {
    if (error instanceof DatabaseError) throw error;
    throw new DatabaseError('Error inesperado al obtener servicios');
  }
};

export const getMandatoById = async (id: string): Promise<Mandato | null> => {
  if (!id || !isValidUUID(id)) {
    throw new DatabaseError('ID de mandato inválido', { id });
  }
  
  try {
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
    
    if (error) {
      throw new DatabaseError('Error al obtener mandato', {
        supabaseError: error,
        table: 'mandatos',
        id,
      });
    }
    
    return data as Mandato;
  } catch (error) {
    if (error instanceof DatabaseError) throw error;
    throw new DatabaseError('Error inesperado al obtener mandato');
  }
};

export const createMandato = async (mandato: Partial<Mandato>) => {
  try {
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
    
    if (error) {
      throw new DatabaseError('Error al crear mandato', {
        supabaseError: error,
        table: 'mandatos',
      });
    }
    
    return data as Mandato;
  } catch (error) {
    if (error instanceof DatabaseError) throw error;
    throw new DatabaseError('Error inesperado al crear mandato');
  }
};

export const updateMandato = async (id: string, mandato: Partial<Mandato>) => {
  if (!id || !isValidUUID(id)) {
    throw new DatabaseError('ID de mandato inválido', { id });
  }
  
  try {
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
    
    if (error) {
      throw new DatabaseError('Error al actualizar mandato', {
        supabaseError: error,
        table: 'mandatos',
        id,
      });
    }
    
    return data as Mandato;
  } catch (error) {
    if (error instanceof DatabaseError) throw error;
    throw new DatabaseError('Error inesperado al actualizar mandato');
  }
};

export const deleteMandato = async (id: string) => {
  if (!id || !isValidUUID(id)) {
    throw new DatabaseError('ID de mandato inválido', { id });
  }
  
  try {
    const { error } = await supabase
      .from('mandatos')
      .delete()
      .eq('id', id);
    
    if (error) {
      throw new DatabaseError('Error al eliminar mandato', {
        supabaseError: error,
        table: 'mandatos',
        id,
      });
    }
  } catch (error) {
    if (error instanceof DatabaseError) throw error;
    throw new DatabaseError('Error inesperado al eliminar mandato');
  }
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
  if (!mandatoId || !isValidUUID(mandatoId)) {
    throw new DatabaseError('ID de mandato inválido', { mandatoId });
  }
  if (!contactoId || !isValidUUID(contactoId)) {
    throw new DatabaseError('ID de contacto inválido', { contactoId });
  }
  
  try {
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
    
    if (error) {
      throw new DatabaseError('Error al vincular contacto al mandato', {
        supabaseError: error,
        table: 'mandato_contactos',
      });
    }
    
    return data as MandatoContacto;
  } catch (error) {
    if (error instanceof DatabaseError) throw error;
    throw new DatabaseError('Error inesperado al vincular contacto');
  }
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
  return data as any;
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

// ============================================
// CONSULTAS ESPECIALES
// ============================================

export const getMandatosByContacto = async (contactoId: string): Promise<Mandato[]> => {
  const { data, error } = await supabase
    .from('mandato_contactos')
    .select(`
      mandato:mandatos(
        *,
        empresa_principal:empresas(*),
        contactos:mandato_contactos(*, contacto:contactos(*, empresa_principal:empresas(*))),
        empresas:mandato_empresas(*, empresa:empresas(*))
      )
    `)
    .eq('contacto_id', contactoId);
  
  if (error) throw error;
  return (data || []).map((mc: any) => mc.mandato).filter(Boolean) as Mandato[];
};
