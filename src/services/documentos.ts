import { supabase } from "@/integrations/supabase/client";
import type { Documento } from "@/types";

export const fetchDocumentos = async (): Promise<Documento[]> => {
  const { data, error } = await supabase
    .from('documentos')
    .select('*')
    .order('created_at', { ascending: false });
  
  if (error) throw error;
  return (data || []) as any;
};

export const getDocumentoById = async (id: string): Promise<Documento | null> => {
  const { data, error} = await supabase
    .from('documentos')
    .select('*')
    .eq('id', id)
    .single();
  
  if (error) throw error;
  return data as any;
};

export const createDocumento = async (documento: Partial<Documento>) => {
  const { data, error } = await supabase
    .from('documentos')
    .insert(documento as any)
    .select()
    .single();
  
  if (error) throw error;
  return data as any;
};

export const deleteDocumento = async (id: string) => {
  const { error } = await supabase
    .from('documentos')
    .delete()
    .eq('id', id);
  
  if (error) throw error;
};
