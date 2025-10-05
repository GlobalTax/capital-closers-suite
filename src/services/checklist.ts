import { supabase } from "@/integrations/supabase/client";
import type { MandatoChecklistTask, ChecklistFaseProgress } from "@/types";

export const fetchChecklistTasks = async (mandatoId: string): Promise<MandatoChecklistTask[]> => {
  const { data, error } = await supabase
    .from('mandato_checklist_tasks')
    .select('*')
    .eq('mandato_id', mandatoId)
    .order('fase')
    .order('orden');
  
  if (error) throw error;
  return (data || []) as MandatoChecklistTask[];
};

export const createChecklistTask = async (task: Partial<MandatoChecklistTask>) => {
  const { data, error } = await supabase
    .from('mandato_checklist_tasks')
    .insert(task as any)
    .select()
    .single();
  
  if (error) throw error;
  return data as MandatoChecklistTask;
};

export const updateChecklistTask = async (id: string, updates: Partial<MandatoChecklistTask>) => {
  const { data, error } = await supabase
    .from('mandato_checklist_tasks')
    .update(updates as any)
    .eq('id', id)
    .select()
    .single();
  
  if (error) throw error;
  return data as MandatoChecklistTask;
};

export const deleteChecklistTask = async (id: string) => {
  const { error } = await supabase
    .from('mandato_checklist_tasks')
    .delete()
    .eq('id', id);
  
  if (error) throw error;
};

export const copyTemplateToMandato = async (mandatoId: string) => {
  const { data, error } = await supabase
    .rpc('copy_checklist_template_to_mandato', { p_mandato_id: mandatoId });
  
  if (error) throw error;
  return data;
};

export const calculateFaseProgress = (tasks: MandatoChecklistTask[]): ChecklistFaseProgress[] => {
  const fases = ["1. Preparación", "2. Marketing", "3. Ofertas"] as const;
  
  return fases.map(fase => {
    const tasksInFase = tasks.filter(t => t.fase === fase);
    const total = tasksInFase.length;
    const completadas = tasksInFase.filter(t => t.estado === "✅ Completa").length;
    const enCurso = tasksInFase.filter(t => t.estado === "🔄 En curso").length;
    const pendientes = tasksInFase.filter(t => t.estado === "⏳ Pendiente").length;
    
    return {
      fase,
      total,
      completadas,
      enCurso,
      pendientes,
      porcentaje: total > 0 ? Math.round((completadas / total) * 100) : 0
    };
  });
};
