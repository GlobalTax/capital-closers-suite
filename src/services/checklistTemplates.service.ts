import { supabase } from "@/integrations/supabase/client";

// Types
export interface ChecklistFase {
  id: string;
  nombre: string;
  orden: number;
  color: string | null;
  descripcion: string | null;
  tipo_operacion: string;
  activo: boolean | null;
  created_at: string | null;
  updated_at: string | null;
}

export interface ChecklistTemplate {
  id: string;
  fase: string;
  tarea: string;
  descripcion: string | null;
  responsable: string | null;
  sistema: string | null;
  orden: number;
  tipo_operacion: string | null;
  duracion_estimada_dias: number | null;
  es_critica: boolean | null;
  activo: boolean | null;
  dependencias: string[] | null;
  created_at: string | null;
}

// ── Fases ──

export async function fetchFases(tipo: string): Promise<ChecklistFase[]> {
  const { data, error } = await supabase
    .from("checklist_fases")
    .select("*")
    .eq("tipo_operacion", tipo)
    .order("orden", { ascending: true });
  if (error) throw error;
  return data ?? [];
}

export async function createFase(data: {
  nombre: string;
  tipo_operacion: string;
  orden: number;
  color?: string;
  descripcion?: string;
}): Promise<ChecklistFase> {
  const { data: result, error } = await supabase
    .from("checklist_fases")
    .insert(data)
    .select()
    .single();
  if (error) throw error;
  return result;
}

export async function updateFase(
  id: string,
  data: Partial<Pick<ChecklistFase, "nombre" | "color" | "orden" | "descripcion" | "activo">>
): Promise<ChecklistFase> {
  const { data: result, error } = await supabase
    .from("checklist_fases")
    .update({ ...data, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return result;
}

export async function deleteFase(id: string): Promise<void> {
  const { error } = await supabase
    .from("checklist_fases")
    .delete()
    .eq("id", id);
  if (error) throw error;
}

export async function reorderFases(
  items: { id: string; orden: number }[]
): Promise<void> {
  // Update each fase's orden sequentially (no batch upsert available)
  for (const item of items) {
    const { error } = await supabase
      .from("checklist_fases")
      .update({ orden: item.orden })
      .eq("id", item.id);
    if (error) throw error;
  }
}

// ── Templates (tareas plantilla) ──

export async function fetchTemplates(tipo: string): Promise<ChecklistTemplate[]> {
  const { data, error } = await supabase
    .from("mandato_checklist_templates")
    .select("*")
    .eq("tipo_operacion", tipo)
    .eq("activo", true)
    .order("orden", { ascending: true });
  if (error) throw error;
  return data ?? [];
}

export async function createTemplate(data: {
  fase: string;
  tarea: string;
  tipo_operacion: string;
  orden: number;
  descripcion?: string;
  responsable?: string;
  sistema?: string;
  duracion_estimada_dias?: number;
  es_critica?: boolean;
}): Promise<ChecklistTemplate> {
  const { data: result, error } = await supabase
    .from("mandato_checklist_templates")
    .insert({ ...data, activo: true })
    .select()
    .single();
  if (error) throw error;
  return result;
}

export async function updateTemplate(
  id: string,
  data: Partial<Pick<ChecklistTemplate, "fase" | "tarea" | "descripcion" | "responsable" | "sistema" | "orden" | "duracion_estimada_dias" | "es_critica" | "activo">>
): Promise<ChecklistTemplate> {
  const { data: result, error } = await supabase
    .from("mandato_checklist_templates")
    .update(data)
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return result;
}

export async function deleteTemplate(id: string): Promise<void> {
  // Soft delete by setting activo = false
  const { error } = await supabase
    .from("mandato_checklist_templates")
    .update({ activo: false })
    .eq("id", id);
  if (error) throw error;
}

export async function reorderTemplates(
  items: { id: string; orden: number }[]
): Promise<void> {
  for (const item of items) {
    const { error } = await supabase
      .from("mandato_checklist_templates")
      .update({ orden: item.orden })
      .eq("id", item.id);
    if (error) throw error;
  }
}

// ── Sync ──

export async function countAffectedMandatos(tipo: string): Promise<number> {
  const { data, error } = await supabase.rpc("count_sync_affected_mandatos", {
    p_tipo: tipo,
  });
  if (error) throw error;
  return data ?? 0;
}

export async function syncAdditions(
  tipo: string
): Promise<{ mandatos_updated: number; tasks_added: number }> {
  const { data, error } = await supabase.rpc("sync_template_additions", {
    p_tipo: tipo,
  });
  if (error) throw error;
  return data as { mandatos_updated: number; tasks_added: number };
}

export async function syncFullReset(
  tipo: string
): Promise<{ mandatos_updated: number; tasks_added: number }> {
  const { data, error } = await supabase.rpc("sync_template_full_reset", {
    p_tipo: tipo,
  });
  if (error) throw error;
  return data as { mandatos_updated: number; tasks_added: number };
}
