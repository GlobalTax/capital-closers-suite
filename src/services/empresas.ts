import { supabase } from "@/integrations/supabase/client";
import type { Empresa } from "@/types";

export const fetchEmpresas = async (esTarget?: boolean): Promise<Empresa[]> => {
  let query = supabase
    .from('empresas')
    .select('*')
    .order('created_at', { ascending: false });
  
  if (esTarget !== undefined) {
    query = query.eq('es_target', esTarget);
  }
  
  const { data, error } = await query;
  if (error) throw error;
  return data || [];
};

export const getEmpresaById = async (id: string): Promise<Empresa | null> => {
  const { data, error } = await supabase
    .from('empresas')
    .select('*')
    .eq('id', id)
    .single();
  
  if (error) throw error;
  return data;
};

export const createEmpresa = async (empresa: Partial<Empresa>) => {
  const { data, error } = await supabase
    .from('empresas')
    .insert(empresa)
    .select()
    .single();
  
  if (error) throw error;
  return data;
};

export const updateEmpresa = async (id: string, empresa: Partial<Empresa>) => {
  const { data, error } = await supabase
    .from('empresas')
    .update(empresa)
    .eq('id', id)
    .select()
    .single();
  
  if (error) throw error;
  return data;
};

export const deleteEmpresa = async (id: string) => {
  const { error } = await supabase
    .from('empresas')
    .delete()
    .eq('id', id);
  
  if (error) throw error;
};
