import { supabase } from "@/integrations/supabase/client";
import type { Tarea } from "@/types";

export const fetchTareas = async (): Promise<Tarea[]> => {
  const { data, error } = await supabase
    .from('tareas')
    .select('*')
    .order('created_at', { ascending: false });
  
  if (error) throw error;
  return (data || []) as any;
};

export const getTareaById = async (id: string): Promise<Tarea | null> => {
  const { data, error } = await supabase
    .from('tareas')
    .select('*')
    .eq('id', id)
    .single();
  
  if (error) throw error;
  return data as any;
};

export const createTarea = async (tarea: Partial<Tarea>) => {
  const { data, error } = await supabase
    .from('tareas')
    .insert(tarea as any)
    .select()
    .single();
  
  if (error) throw error;
  return data;
};

export const updateTarea = async (id: string, tarea: Partial<Tarea>) => {
  const { data, error } = await supabase
    .from('tareas')
    .update(tarea as any)
    .eq('id', id)
    .select()
    .single();
  
  if (error) throw error;
  return data;
};

export const deleteTarea = async (id: string) => {
  const { error } = await supabase
    .from('tareas')
    .delete()
    .eq('id', id);
  
  if (error) throw error;
};
