import { supabase } from "@/integrations/supabase/client";

export type WorkTaskTypeContext = 'all' | 'mandate' | 'prospection' | 'internal';
export type TimeEntryValueType = 'core_ma' | 'soporte' | 'bajo_valor';

export interface WorkTaskType {
  id: string;
  name: string;
  description: string | null;
  is_active: boolean;
  sort_order: number;
  context: WorkTaskTypeContext;
  default_value_type: TimeEntryValueType;
  created_at: string;
  updated_at: string;
  // Dynamic validation requirements
  require_mandato: boolean;
  require_lead: boolean;
  require_description: boolean;
  // Additional validation rules
  min_description_length: number;
  default_billable: boolean;
}

export interface CreateWorkTaskTypeData {
  name: string;
  description?: string;
  sort_order?: number;
  context?: WorkTaskTypeContext;
  default_value_type?: TimeEntryValueType;
  require_mandato?: boolean;
  require_lead?: boolean;
  require_description?: boolean;
  min_description_length?: number;
  default_billable?: boolean;
}

export interface UpdateWorkTaskTypeData {
  name?: string;
  description?: string;
  is_active?: boolean;
  sort_order?: number;
  context?: WorkTaskTypeContext;
  default_value_type?: TimeEntryValueType;
  // Validation rules editable from admin
  require_mandato?: boolean;
  require_lead?: boolean;
  require_description?: boolean;
  min_description_length?: number;
  default_billable?: boolean;
}

export async function fetchActiveWorkTaskTypes(): Promise<WorkTaskType[]> {
  const { data, error } = await supabase
    .from('work_task_types')
    .select('*')
    .eq('is_active', true)
    .order('sort_order', { ascending: true })
    .order('name', { ascending: true });

  if (error) throw error;
  // Cast context and default_value_type from string to typed values
  return (data || []).map(item => ({
    ...item,
    context: (item.context as WorkTaskTypeContext) || 'all',
    default_value_type: (item.default_value_type as TimeEntryValueType) || 'core_ma'
  }));
}

export async function fetchAllWorkTaskTypes(): Promise<WorkTaskType[]> {
  const { data, error } = await supabase
    .from('work_task_types')
    .select('*')
    .order('sort_order', { ascending: true })
    .order('name', { ascending: true });

  if (error) throw error;
  // Cast context and default_value_type from string to typed values
  return (data || []).map(item => ({
    ...item,
    context: (item.context as WorkTaskTypeContext) || 'all',
    default_value_type: (item.default_value_type as TimeEntryValueType) || 'core_ma'
  }));
}

export async function getWorkTaskTypeById(id: string): Promise<WorkTaskType | null> {
  const { data, error } = await supabase
    .from('work_task_types')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    throw error;
  }
  return data ? { 
    ...data, 
    context: (data.context as WorkTaskTypeContext) || 'all',
    default_value_type: (data.default_value_type as TimeEntryValueType) || 'core_ma'
  } : null;
}

export async function createWorkTaskType(data: CreateWorkTaskTypeData): Promise<WorkTaskType> {
  // Si no se especifica sort_order, obtener el máximo actual + 1
  let sortOrder = data.sort_order;
  if (sortOrder === undefined) {
    const { data: maxData } = await supabase
      .from('work_task_types')
      .select('sort_order')
      .order('sort_order', { ascending: false })
      .limit(1)
      .single();
    sortOrder = (maxData?.sort_order || 0) + 1;
  }

  const { data: result, error } = await supabase
    .from('work_task_types')
    .insert({ ...data, sort_order: sortOrder })
    .select()
    .single();

  if (error) throw error;
  return { 
    ...result, 
    context: (result.context as WorkTaskTypeContext) || 'all',
    default_value_type: (result.default_value_type as TimeEntryValueType) || 'core_ma'
  };
}

export async function updateWorkTaskType(id: string, data: UpdateWorkTaskTypeData): Promise<WorkTaskType> {
  const { data: result, error } = await supabase
    .from('work_task_types')
    .update(data)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return { 
    ...result, 
    context: (result.context as WorkTaskTypeContext) || 'all',
    default_value_type: (result.default_value_type as TimeEntryValueType) || 'core_ma'
  };
}

export async function toggleWorkTaskTypeActive(id: string, isActive: boolean): Promise<WorkTaskType> {
  return updateWorkTaskType(id, { is_active: isActive });
}

export async function reorderWorkTaskTypes(orderedIds: string[]): Promise<void> {
  // Actualizar sort_order para cada id en el nuevo orden
  const updates = orderedIds.map((id, index) => 
    supabase
      .from('work_task_types')
      .update({ sort_order: index + 1 })
      .eq('id', id)
  );

  const results = await Promise.all(updates);
  const errors = results.filter(r => r.error);
  if (errors.length > 0) {
    throw errors[0].error;
  }
}
