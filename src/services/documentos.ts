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

// Documentos compartidos con contactos
export const getContactoDocumentos = async (contactoId: string) => {
  const { data, error } = await supabase
    .from('contacto_documentos')
    .select(`
      *,
      documento:documentos(*)
    `)
    .eq('contacto_id', contactoId)
    .order('fecha_compartido', { ascending: false });
  
  if (error) throw error;
  return data || [];
};

export const vincularDocumentoContacto = async (contactoId: string, documentoId: string, notas?: string) => {
  const { data, error } = await supabase
    .from('contacto_documentos')
    .insert({ contacto_id: contactoId, documento_id: documentoId, notas })
    .select()
    .single();
  
  if (error) throw error;
  return data;
};

export const desvincularDocumentoContacto = async (contactoId: string, documentoId: string) => {
  const { error } = await supabase
    .from('contacto_documentos')
    .delete()
    .eq('contacto_id', contactoId)
    .eq('documento_id', documentoId);
  
  if (error) throw error;
};

// Documentos compartidos con empresas
export const getEmpresaDocumentos = async (empresaId: string) => {
  const { data, error } = await supabase
    .from('empresa_documentos')
    .select(`
      *,
      documento:documentos(*)
    `)
    .eq('empresa_id', empresaId)
    .order('fecha_compartido', { ascending: false });
  
  if (error) throw error;
  return data || [];
};

export const vincularDocumentoEmpresa = async (empresaId: string, documentoId: string, notas?: string) => {
  const { data, error } = await supabase
    .from('empresa_documentos')
    .insert({ empresa_id: empresaId, documento_id: documentoId, notas })
    .select()
    .single();
  
  if (error) throw error;
  return data;
};

export const desvincularDocumentoEmpresa = async (empresaId: string, documentoId: string) => {
  const { error } = await supabase
    .from('empresa_documentos')
    .delete()
    .eq('empresa_id', empresaId)
    .eq('documento_id', documentoId);
  
  if (error) throw error;
};
