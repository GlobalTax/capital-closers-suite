import { supabase } from "@/integrations/supabase/client";
import { DatabaseError } from "@/lib/error-handler";
import type { 
  MandatoChecklistTask, 
  ChecklistFaseProgress, 
  ChecklistFaseConfig,
  ChecklistTemplate,
  OverdueTask 
} from "@/types";

// Fetch dynamic phases by operation type
export async function fetchFasesByType(tipo: 'compra' | 'venta'): Promise<ChecklistFaseConfig[]> {
  const { data, error } = await supabase
    .from('checklist_fases')
    .select('*')
    .or(`tipo_operacion.eq.${tipo},tipo_operacion.eq.ambos`)
    .eq('activo', true)
    .order('orden');

  if (error) {
    throw new DatabaseError('Error obteniendo fases del checklist', { code: error.code });
  }

  return (data || []).map(row => ({
    id: row.id,
    nombre: row.nombre,
    tipo_operacion: row.tipo_operacion as 'compra' | 'venta' | 'ambos',
    orden: row.orden,
    color: row.color || '#6366f1',
    descripcion: row.descripcion || undefined,
    activo: row.activo ?? true,
  }));
}

// Fetch templates by operation type
export async function fetchTemplatesByType(tipo: 'compra' | 'venta'): Promise<ChecklistTemplate[]> {
  const { data, error } = await supabase
    .from('mandato_checklist_templates')
    .select('*')
    .eq('tipo_operacion', tipo)
    .eq('activo', true)
    .order('fase')
    .order('orden');

  if (error) {
    throw new DatabaseError('Error obteniendo templates', { code: error.code });
  }

  return (data || []).map(row => ({
    id: row.id,
    fase: row.fase || '',
    tarea: row.tarea || '',
    descripcion: row.descripcion || undefined,
    responsable: row.responsable || undefined,
    sistema: row.sistema || undefined,
    orden: row.orden || 0,
    tipo_operacion: (row.tipo_operacion as 'compra' | 'venta') || 'venta',
    duracion_estimada_dias: row.duracion_estimada_dias ?? undefined,
    es_critica: row.es_critica ?? false,
    dependencias: row.dependencias || [],
    activo: row.activo ?? true,
  }));
}

// Copy template to mandato by type
export async function copyTemplateByType(mandatoId: string, tipo: 'compra' | 'venta'): Promise<number> {
  const { data, error } = await supabase
    .rpc('copy_checklist_template_by_type', { 
      p_mandato_id: mandatoId,
      p_tipo_operacion: tipo 
    });

  if (error) {
    throw new DatabaseError('Error copiando template al mandato', { code: error.code });
  }

  return data || 0;
}

// Get detailed progress using RPC
export async function fetchDetailedProgress(mandatoId: string): Promise<ChecklistFaseProgress[]> {
  const { data, error } = await supabase
    .rpc('get_checklist_progress', { p_mandato_id: mandatoId });

  if (error) {
    console.warn('RPC not available, calculating locally:', error.message);
    return [];
  }

  return (data || []).map((row: any) => ({
    fase: row.fase,
    total: Number(row.total) || 0,
    completadas: Number(row.completadas) || 0,
    enCurso: Number(row.en_curso) || 0,
    pendientes: Number(row.pendientes) || 0,
    porcentaje: Number(row.porcentaje) || 0,
    vencidas: Number(row.vencidas) || 0,
    diasEstimados: Number(row.dias_estimados) || 0,
    tareasCriticas: Number(row.tareas_criticas) || 0,
  }));
}

// Get overdue tasks
export async function fetchOverdueTasks(mandatoId: string): Promise<OverdueTask[]> {
  const { data, error } = await supabase
    .rpc('get_overdue_tasks', { p_mandato_id: mandatoId });

  if (error) {
    console.warn('RPC not available:', error.message);
    return [];
  }

  return (data || []).map((row: any) => ({
    id: row.id,
    tarea: row.tarea,
    fase: row.fase,
    fecha_limite: row.fecha_limite,
    es_critica: row.es_critica ?? false,
    dias_vencida: Number(row.dias_vencida) || 0,
  }));
}

// Calculate progress locally (fallback)
export function calculateDynamicProgress(
  tasks: MandatoChecklistTask[], 
  fases: ChecklistFaseConfig[]
): ChecklistFaseProgress[] {
  return fases.map(fase => {
    const tasksInFase = tasks.filter(t => t.fase === fase.nombre);
    const total = tasksInFase.length;
    const completadas = tasksInFase.filter(t => t.estado === "✅ Completa").length;
    const enCurso = tasksInFase.filter(t => t.estado === "🔄 En curso").length;
    const pendientes = tasksInFase.filter(t => t.estado === "⏳ Pendiente").length;
    const vencidas = tasksInFase.filter(t => 
      t.fecha_limite && 
      new Date(t.fecha_limite) < new Date() && 
      t.estado !== "✅ Completa"
    ).length;
    const diasEstimados = tasksInFase.reduce((acc, t) => acc + (t.duracion_estimada_dias || 0), 0);
    const tareasCriticas = tasksInFase.filter(t => t.es_critica).length;

    return {
      fase: fase.nombre,
      total,
      completadas,
      enCurso,
      pendientes,
      porcentaje: total > 0 ? Math.round((completadas / total) * 100) : 0,
      vencidas,
      diasEstimados,
      tareasCriticas,
    };
  });
}

// Fetch tasks with extended data
export async function fetchChecklistTasksExtended(mandatoId: string): Promise<MandatoChecklistTask[]> {
  const { data, error } = await supabase
    .from('mandato_checklist_tasks')
    .select('*')
    .eq('mandato_id', mandatoId)
    .order('fase')
    .order('orden');

  if (error) {
    throw new DatabaseError('Error obteniendo tareas del checklist', { code: error.code });
  }

  return (data || []).map(row => ({
    id: row.id,
    mandato_id: row.mandato_id || '',
    fase: row.fase || '',
    tarea: row.tarea || '',
    descripcion: row.descripcion || undefined,
    responsable: row.responsable as any || undefined,
    sistema: row.sistema as any || undefined,
    estado: (row.estado as any) || '⏳ Pendiente',
    fecha_limite: row.fecha_limite || undefined,
    fecha_completada: row.fecha_completada || undefined,
    url_relacionada: row.url_relacionada || undefined,
    notas: row.notas || undefined,
    orden: row.orden || 0,
    tipo_operacion: row.tipo_operacion as 'compra' | 'venta' | undefined,
    duracion_estimada_dias: row.duracion_estimada_dias ?? undefined,
    es_critica: row.es_critica ?? false,
    dependencias: row.dependencias || [],
    fecha_inicio: row.fecha_inicio || undefined,
    created_at: row.created_at || new Date().toISOString(),
    updated_at: row.updated_at || new Date().toISOString(),
  }));
}

// Update task with extended fields
export async function updateChecklistTaskExtended(
  id: string, 
  data: Partial<MandatoChecklistTask>
): Promise<void> {
  const { error } = await supabase
    .from('mandato_checklist_tasks')
    .update({
      ...data,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id);

  if (error) {
    throw new DatabaseError('Error actualizando tarea', { code: error.code });
  }
}