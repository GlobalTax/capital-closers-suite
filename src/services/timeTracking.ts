import { supabase } from "@/integrations/supabase/client";
import type { TimeEntry, TimeEntryWorkType, TimeEntryStatus, TimeEntryValueType, TimeStats, TeamStats, MandatoInfo, ContactoInfo, ValueTypeStats } from "@/types";

// Helper to validate UUID
const isValidUUID = (str: string): boolean => {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(str);
};

// Common select query for time entries with optional mandato and contacto
const TIME_ENTRY_SELECT = `
  *,
  work_task_type:work_task_types(id, name),
  task:mandato_checklist_tasks(
    id,
    tarea,
    fase
  ),
  mandato:mandatos(
    id,
    codigo,
    descripcion,
    tipo,
    estado,
    probability,
    valor,
    pipeline_stage,
    empresa_principal:empresas(nombre)
  ),
  contacto:contactos(
    id,
    nombre,
    apellidos,
    email,
    empresa_principal:empresas(id, nombre)
  )
`;

// ============================================
// FETCH TIME ENTRIES (with optional mandatoId)
// ============================================
export const fetchTimeEntries = async (
  mandatoId?: string,
  filters?: {
    userId?: string;
    taskId?: string;
    status?: TimeEntryStatus;
    startDate?: string;
    endDate?: string;
  }
): Promise<TimeEntry[]> => {
  let query = supabase
    .from('mandato_time_entries')
    .select(TIME_ENTRY_SELECT)
    .eq('is_deleted', false)
    .order('start_time', { ascending: false });

  if (mandatoId) {
    query = query.eq('mandato_id', mandatoId);
  }
  if (filters?.userId) {
    query = query.eq('user_id', filters.userId);
  }
  if (filters?.taskId) {
    query = query.eq('task_id', filters.taskId);
  }
  if (filters?.status) {
    query = query.eq('status', filters.status);
  }
  if (filters?.startDate) {
    query = query.gte('start_time', filters.startDate);
  }
  if (filters?.endDate) {
    query = query.lte('start_time', filters.endDate);
  }

  const { data, error } = await query;
  if (error) throw error;
  
  // Fetch admin users separately
  const { data: adminUsers } = await supabase
    .from('admin_users')
    .select('user_id, full_name, email');
  
  const usersMap = new Map(
    (adminUsers || []).map(u => [u.user_id, u])
  );
  
  return (data || []).map(entry => ({
    ...entry,
    user: usersMap.get(entry.user_id) ? {
      id: entry.user_id,
      full_name: usersMap.get(entry.user_id)!.full_name || 'Usuario',
      email: usersMap.get(entry.user_id)!.email || ''
    } : undefined,
    mandato: entry.mandato as MandatoInfo | null,
    contacto: entry.contacto as ContactoInfo | null,
    work_task_type: entry.work_task_type as { id: string; name: string } | undefined
  })) as TimeEntry[];
};

// ============================================
// MY TIME ENTRIES (personal view)
// ============================================
export const fetchMyTimeEntries = async (
  userId: string,
  filters?: {
    startDate?: string;
    endDate?: string;
    mandatoId?: string;
    status?: TimeEntryStatus;
  }
): Promise<TimeEntry[]> => {
  let query = supabase
    .from('mandato_time_entries')
    .select(TIME_ENTRY_SELECT)
    .eq('user_id', userId)
    .eq('is_deleted', false)
    .order('start_time', { ascending: false });

  if (filters?.startDate) {
    query = query.gte('start_time', filters.startDate);
  }
  if (filters?.endDate) {
    query = query.lte('start_time', filters.endDate);
  }
  // Sanitize mandatoId filter
  if (filters?.mandatoId && 
      filters.mandatoId !== 'all' && 
      filters.mandatoId !== 'undefined' &&
      isValidUUID(filters.mandatoId)) {
    query = query.eq('mandato_id', filters.mandatoId);
  }
  if (filters?.status && filters.status !== 'draft') {
    query = query.eq('status', filters.status);
  }

  const { data, error } = await query;
  if (error) throw error;
  
  // Get user info
  const { data: adminUser } = await supabase
    .from('admin_users')
    .select('user_id, full_name, email')
    .eq('user_id', userId)
    .single();
  
  return (data || []).map(entry => ({
    ...entry,
    user: adminUser ? {
      id: userId,
      full_name: adminUser.full_name || 'Usuario',
      email: adminUser.email || ''
    } : undefined,
    mandato: entry.mandato as MandatoInfo | null,
    contacto: entry.contacto as ContactoInfo | null,
    work_task_type: entry.work_task_type as { id: string; name: string } | undefined
  })) as TimeEntry[];
};

// ============================================
// ALL TIME ENTRIES (Super Admin view)
// ============================================
export const fetchAllTimeEntries = async (
  filters?: {
    startDate?: string;
    endDate?: string;
    userId?: string;
    mandatoId?: string;
    status?: TimeEntryStatus;
    workType?: TimeEntryWorkType;
    valueType?: TimeEntryValueType;
    onlyBillable?: boolean;
  }
): Promise<TimeEntry[]> => {
  let query = supabase
    .from('mandato_time_entries')
    .select(TIME_ENTRY_SELECT)
    .eq('is_deleted', false)
    .order('start_time', { ascending: false });

  if (filters?.startDate) {
    query = query.gte('start_time', filters.startDate);
  }
  if (filters?.endDate) {
    query = query.lte('start_time', filters.endDate);
  }
  // Sanitize userId filter
  if (filters?.userId && 
      filters.userId !== 'all' && 
      filters.userId !== 'undefined' &&
      isValidUUID(filters.userId)) {
    query = query.eq('user_id', filters.userId);
  }
  // Sanitize mandatoId filter
  if (filters?.mandatoId && 
      filters.mandatoId !== 'all' && 
      filters.mandatoId !== 'undefined' &&
      isValidUUID(filters.mandatoId)) {
    query = query.eq('mandato_id', filters.mandatoId);
  }
  if (filters?.status && filters.status !== 'draft') {
    query = query.eq('status', filters.status);
  }
  if (filters?.workType && filters.workType !== 'Otro') {
    query = query.eq('work_type', filters.workType);
  }
  if (filters?.onlyBillable) {
    query = query.eq('is_billable', true);
  }
  if (filters?.valueType) {
    query = query.eq('value_type', filters.valueType);
  }

  const { data, error } = await query;
  if (error) throw error;
  
  // Fetch all admin users
  const { data: adminUsers } = await supabase
    .from('admin_users')
    .select('user_id, full_name, email');
  
  const usersMap = new Map(
    (adminUsers || []).map(u => [u.user_id, u])
  );
  
  return (data || []).map(entry => ({
    ...entry,
    user: usersMap.get(entry.user_id) ? {
      id: entry.user_id,
      full_name: usersMap.get(entry.user_id)!.full_name || 'Usuario',
      email: usersMap.get(entry.user_id)!.email || ''
    } : undefined,
    mandato: entry.mandato as MandatoInfo | null,
    contacto: entry.contacto as ContactoInfo | null,
    work_task_type: entry.work_task_type as { id: string; name: string } | undefined
  })) as TimeEntry[];
};

// ============================================
// MY TIME STATS (personal stats with date filters)
// ============================================
export const getMyTimeStats = async (
  userId: string,
  filters?: {
    startDate?: string;
    endDate?: string;
  }
): Promise<TimeStats> => {
  const entries = await fetchMyTimeEntries(userId, {
    startDate: filters?.startDate,
    endDate: filters?.endDate,
    status: 'approved'
  });
  
  const totalMinutes = entries.reduce((sum, e) => sum + (e.duration_minutes || 0), 0);
  const billableMinutes = entries.filter(e => e.is_billable)
    .reduce((sum, e) => sum + (e.duration_minutes || 0), 0);
  
  // Hours by phase
  const phaseHours: Record<string, number> = {};
  entries.forEach(e => {
    const fase = e.task?.fase || 'Sin fase';
    phaseHours[fase] = (phaseHours[fase] || 0) + (e.duration_minutes || 0);
  });
  
  // Hours by user (always current user)
  const userHours: Record<string, { name: string; hours: number }> = {};
  entries.forEach(e => {
    if (e.user) {
      if (!userHours[e.user.id]) {
        userHours[e.user.id] = { name: e.user.full_name, hours: 0 };
      }
      userHours[e.user.id].hours += (e.duration_minutes || 0);
    }
  });
  
  // Hours by type
  const typeHours: Record<string, number> = {};
  entries.forEach(e => {
    typeHours[e.work_type] = (typeHours[e.work_type] || 0) + (e.duration_minutes || 0);
  });

  return {
    total_hours: totalMinutes / 60,
    billable_hours: billableMinutes / 60,
    total_entries: entries.length,
    hours_by_phase: Object.entries(phaseHours).map(([fase, minutes]) => ({
      fase,
      hours: minutes / 60
    })),
    hours_by_user: Object.entries(userHours).map(([user_id, { name, hours }]) => ({
      user_id,
      user_name: name,
      hours: hours / 60
    })),
    hours_by_type: Object.entries(typeHours).map(([work_type, minutes]) => ({
      work_type,
      hours: minutes / 60
    }))
  };
};

// ============================================
// TEAM TIME STATS (Super Admin)
// ============================================
export const getAllTimeStats = async (
  filters?: {
    startDate?: string;
    endDate?: string;
    userId?: string;
    mandatoId?: string;
  }
): Promise<TeamStats> => {
  const entries = await fetchAllTimeEntries({
    startDate: filters?.startDate,
    endDate: filters?.endDate,
    userId: filters?.userId,
    mandatoId: filters?.mandatoId,
    status: 'approved'
  });
  
  const totalMinutes = entries.reduce((sum, e) => sum + (e.duration_minutes || 0), 0);
  const billableMinutes = entries.filter(e => e.is_billable)
    .reduce((sum, e) => sum + (e.duration_minutes || 0), 0);
  
  // Active users
  const uniqueUsers = new Set(entries.map(e => e.user_id));
  const activeUsers = uniqueUsers.size;
  
  // Hours by user
  const userHoursMap: Record<string, { name: string; hours: number; billable_hours: number }> = {};
  entries.forEach(e => {
    if (e.user) {
      if (!userHoursMap[e.user.id]) {
        userHoursMap[e.user.id] = { 
          name: e.user.full_name, 
          hours: 0,
          billable_hours: 0
        };
      }
      userHoursMap[e.user.id].hours += (e.duration_minutes || 0);
      if (e.is_billable) {
        userHoursMap[e.user.id].billable_hours += (e.duration_minutes || 0);
      }
    }
  });
  
  // Hours by mandato
  const mandatoHoursMap: Record<string, { name: string; hours: number }> = {};
  entries.forEach(e => {
    if (e.mandato) {
      if (!mandatoHoursMap[e.mandato.id]) {
        mandatoHoursMap[e.mandato.id] = { 
          name: e.mandato.descripcion || `Mandato ${e.mandato.tipo}`,
          hours: 0
        };
      }
      mandatoHoursMap[e.mandato.id].hours += (e.duration_minutes || 0);
    }
  });
  
  // Hours by type
  const typeHours: Record<string, number> = {};
  entries.forEach(e => {
    typeHours[e.work_type] = (typeHours[e.work_type] || 0) + (e.duration_minutes || 0);
  });

  return {
    total_hours: totalMinutes / 60,
    billable_hours: billableMinutes / 60,
    active_users: activeUsers,
    average_hours_per_user: activeUsers > 0 ? (totalMinutes / 60) / activeUsers : 0,
    total_entries: entries.length,
    hours_by_user: Object.entries(userHoursMap).map(([user_id, data]) => ({
      user_id,
      user_name: data.name,
      hours: data.hours / 60,
      billable_hours: data.billable_hours / 60
    })),
    hours_by_mandato: Object.entries(mandatoHoursMap).map(([mandato_id, data]) => ({
      mandato_id,
      mandato_name: data.name,
      hours: data.hours / 60
    })),
    hours_by_type: Object.entries(typeHours).map(([work_type, minutes]) => ({
      work_type,
      hours: minutes / 60
    }))
  };
};

// ============================================
// LEGACY FUNCTIONS (backward compatibility)
// ============================================
export const getTimeStats = async (mandatoId?: string): Promise<TimeStats> => {
  const entries = await fetchTimeEntries(mandatoId, { status: 'approved' });
  
  const totalMinutes = entries.reduce((sum, e) => sum + (e.duration_minutes || 0), 0);
  const billableMinutes = entries.filter(e => e.is_billable)
    .reduce((sum, e) => sum + (e.duration_minutes || 0), 0);
  
  // Hours by phase
  const phaseHours: Record<string, number> = {};
  entries.forEach(e => {
    const fase = e.task?.fase || 'Sin fase';
    phaseHours[fase] = (phaseHours[fase] || 0) + (e.duration_minutes || 0);
  });
  
  // Hours by user
  const userHours: Record<string, { name: string; hours: number }> = {};
  entries.forEach(e => {
    if (e.user) {
      if (!userHours[e.user.id]) {
        userHours[e.user.id] = { name: e.user.full_name, hours: 0 };
      }
      userHours[e.user.id].hours += (e.duration_minutes || 0);
    }
  });
  
  // Hours by type
  const typeHours: Record<string, number> = {};
  entries.forEach(e => {
    typeHours[e.work_type] = (typeHours[e.work_type] || 0) + (e.duration_minutes || 0);
  });

  return {
    total_hours: totalMinutes / 60,
    billable_hours: billableMinutes / 60,
    total_entries: entries.length,
    hours_by_phase: Object.entries(phaseHours).map(([fase, minutes]) => ({
      fase,
      hours: minutes / 60
    })),
    hours_by_user: Object.entries(userHours).map(([user_id, { name, hours }]) => ({
      user_id,
      user_name: name,
      hours: hours / 60
    })),
    hours_by_type: Object.entries(typeHours).map(([work_type, minutes]) => ({
      work_type,
      hours: minutes / 60
    }))
  };
};

// ============================================
// TIME ENTRY CRUD OPERATIONS
// ============================================
export const createTimeEntry = async (
  entry: Partial<TimeEntry>
): Promise<TimeEntry> => {
  console.log('[TimeTracking] Creando entrada:', {
    mandato_id: entry.mandato_id,
    contacto_id: entry.contacto_id,
    mandate_lead_id: (entry as any).mandate_lead_id,
    work_task_type_id: entry.work_task_type_id,
    user_id: entry.user_id
  });

  // Validate: must have either mandato_id, contacto_id, OR mandate_lead_id
  if (!entry.mandato_id && !entry.contacto_id && !(entry as any).mandate_lead_id) {
    throw new Error('Debe seleccionar un mandato o un lead');
  }

  // Prepare the entry data, ensuring null values for empty IDs
  const entryData = {
    ...entry,
    mandato_id: entry.mandato_id || null,
    contacto_id: entry.contacto_id || null,
    mandate_lead_id: (entry as any).mandate_lead_id || null,
  };

  const { data, error } = await supabase
    .from('mandato_time_entries')
    .insert([entryData] as any)
    .select()
    .single();

  if (error) {
    console.error('[TimeTracking] Error al crear entrada:', error);
    
    // Detect constraint violation error
    if (error.message?.includes('chk_mandato_or_lead') || error.message?.includes('chk_mandato_or_contacto')) {
      throw new Error('Debe seleccionar un mandato o un lead');
    }
    
    // Detect FK error and give clearer message
    if (error.message?.includes('foreign key constraint') || 
        error.code === '23503') {
      throw new Error('El mandato o lead seleccionado no existe. Selecciona uno válido.');
    }
    throw error;
  }
  
  console.log('[TimeTracking] Entrada creada:', data.id);
  return data as TimeEntry;
};

export const updateTimeEntry = async (
  id: string,
  updates: Partial<TimeEntry>,
  editReason?: string  // Optional reason for editing approved entries
): Promise<TimeEntry> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('No autenticado');

  // First, fetch current entry state
  const { data: currentEntry, error: fetchError } = await supabase
    .from('mandato_time_entries')
    .select('status, user_id, edit_count')
    .eq('id', id)
    .single();

  if (fetchError) throw fetchError;

  // If entry is approved, require edit reason and set traceability fields
  if (currentEntry.status === 'approved') {
    if (!editReason || editReason.trim().length < 5) {
      throw new Error('Debes proporcionar un motivo de edición (mínimo 5 caracteres)');
    }

    // Add traceability fields and change status back to submitted
    updates = {
      ...updates,
      status: 'submitted',  // Revert to submitted for re-approval
      edited_at: new Date().toISOString(),
      edited_by: user.id,
      edit_reason: editReason.trim(),
      edit_count: (currentEntry.edit_count || 0) + 1,
    };
  }

  const { data, error } = await supabase
    .from('mandato_time_entries')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data as TimeEntry;
};

export const deleteTimeEntry = async (id: string): Promise<void> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('No autenticado');

  console.log('[deleteTimeEntry] Soft delete:', id);

  const { data, error } = await supabase
    .from('mandato_time_entries')
    .update({
      is_deleted: true,
      deleted_at: new Date().toISOString(),
      deleted_by: user.id
    })
    .eq('id', id)
    .select('id')
    .single();

  if (error) {
    console.error('[deleteTimeEntry] Error:', error);
    if (error.code === '42501') {
      throw new Error('No tienes permisos para eliminar este registro');
    }
    if (error.code === 'PGRST116') {
      throw new Error('El registro no existe o ya fue eliminado');
    }
    throw error;
  }

  if (!data) {
    throw new Error('El registro no existe o ya fue eliminado');
  }

  console.log('[deleteTimeEntry] Eliminado correctamente');
};

export const submitTimeEntry = async (id: string): Promise<TimeEntry> => {
  return updateTimeEntry(id, { status: 'submitted' });
};

export const approveTimeEntry = async (id: string, userId: string): Promise<TimeEntry> => {
  return updateTimeEntry(id, {
    status: 'approved',
    approved_by: userId,
    approved_at: new Date().toISOString()
  });
};

export const rejectTimeEntry = async (id: string, reason: string): Promise<TimeEntry> => {
  return updateTimeEntry(id, {
    status: 'rejected',
    rejection_reason: reason
  });
};

// ============================================
// ACTIVE TIMER FUNCTIONS
// ============================================
export const getMyActiveTimer = async (): Promise<TimeEntry | null> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from('mandato_time_entries')
    .select(`
      *,
      task:mandato_checklist_tasks(id, tarea, fase),
      mandato:mandatos!inner(id, descripcion, tipo, estado)
    `)
    .eq('user_id', user.id)
    .eq('is_deleted', false)
    .is('end_time', null)
    .order('start_time', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error || !data) return null;
  
  return {
    ...data,
    mandato: data.mandato as MandatoInfo
  } as TimeEntry;
};

export const startTimer = async (
  taskId: string,
  mandatoId: string,
  description: string,
  workType: TimeEntryWorkType
): Promise<TimeEntry> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  // Stop any active timers first
  const activeTimer = await getMyActiveTimer();
  if (activeTimer) {
    await stopTimer(activeTimer.id);
  }

  return createTimeEntry({
    task_id: taskId,
    mandato_id: mandatoId,
    user_id: user.id,
    start_time: new Date().toISOString(),
    description,
    work_type: workType,
    is_billable: true,
    status: 'draft'
  });
};

export const stopTimer = async (id: string): Promise<TimeEntry> => {
  const endTime = new Date().toISOString();
  return updateTimeEntry(id, {
    end_time: endTime
  });
};

// ============================================
// VALUE TYPE STATS (Strategic Analysis)
// ============================================
export const getValueTypeStats = async (
  mandatoId?: string,
  dateRange?: { start: string; end: string }
): Promise<ValueTypeStats[]> => {
  const entries = await fetchAllTimeEntries({
    mandatoId,
    startDate: dateRange?.start,
    endDate: dateRange?.end,
    status: 'approved'
  });
  
  const byValueType: Record<TimeEntryValueType, { minutes: number; count: number }> = {
    core_ma: { minutes: 0, count: 0 },
    soporte: { minutes: 0, count: 0 },
    bajo_valor: { minutes: 0, count: 0 }
  };
  
  entries.forEach(e => {
    // Default to 'core_ma' for entries without value_type (backward compatibility)
    const vt: TimeEntryValueType = (e.value_type as TimeEntryValueType) || 'core_ma';
    byValueType[vt].minutes += e.duration_minutes || 0;
    byValueType[vt].count += 1;
  });
  
  const totalMinutes = Object.values(byValueType).reduce((sum, v) => sum + v.minutes, 0);
  
  return (['core_ma', 'soporte', 'bajo_valor'] as TimeEntryValueType[]).map(vt => ({
    value_type: vt,
    total_hours: byValueType[vt].minutes / 60,
    percentage: totalMinutes > 0 ? (byValueType[vt].minutes / totalMinutes) * 100 : 0,
    entries_count: byValueType[vt].count
  }));
};

// ============================================
// MANDATO INVESTMENT ANALYSIS
// ============================================
export interface MandatoInvestmentStats {
  mandato_id: string;
  mandato_codigo?: string;
  mandato_descripcion?: string;
  total_hours: number;
  core_ma_hours: number;
  soporte_hours: number;
  bajo_valor_hours: number;
  billable_hours: number;
  value_efficiency: number; // % of core_ma hours vs total
}

export const getMandatoInvestmentStats = async (
  mandatoId: string
): Promise<MandatoInvestmentStats> => {
  const entries = await fetchTimeEntries(mandatoId, { status: 'approved' });
  
  let totalMinutes = 0;
  let coreMaMinutes = 0;
  let soporteMinutes = 0;
  let bajoValorMinutes = 0;
  let billableMinutes = 0;
  
  entries.forEach(e => {
    const duration = e.duration_minutes || 0;
    totalMinutes += duration;
    
    const vt: TimeEntryValueType = (e.value_type as TimeEntryValueType) || 'core_ma';
    switch (vt) {
      case 'core_ma':
        coreMaMinutes += duration;
        break;
      case 'soporte':
        soporteMinutes += duration;
        break;
      case 'bajo_valor':
        bajoValorMinutes += duration;
        break;
    }
    
    if (e.is_billable) {
      billableMinutes += duration;
    }
  });
  
  const mandato = entries[0]?.mandato;
  
  return {
    mandato_id: mandatoId,
    mandato_codigo: mandato?.codigo,
    mandato_descripcion: mandato?.descripcion,
    total_hours: totalMinutes / 60,
    core_ma_hours: coreMaMinutes / 60,
    soporte_hours: soporteMinutes / 60,
    bajo_valor_hours: bajoValorMinutes / 60,
    billable_hours: billableMinutes / 60,
    value_efficiency: totalMinutes > 0 ? (coreMaMinutes / totalMinutes) * 100 : 0
  };
};

// ============================================
// TOP MANDATOS BY HOURS (for Investment Chart)
// ============================================
export interface MandatoHoursData {
  mandato_id: string;
  codigo: string;
  descripcion: string;
  probability?: number;
  valor?: number;
  pipeline_stage?: string;
  estado?: string;
  total_hours: number;
  core_ma_hours: number;
  soporte_hours: number;
  bajo_valor_hours: number;
  core_ma_pct: number;
  soporte_pct: number;
  bajo_valor_pct: number;
}

export const getTopMandatosByHours = async (
  entries: TimeEntry[],
  limit: number = 10
): Promise<MandatoHoursData[]> => {
  // Aggregate by mandato_id
  const mandatoMap = new Map<string, {
    mandato: MandatoInfo | undefined;
    totalMinutes: number;
    coreMaMinutes: number;
    soporteMinutes: number;
    bajoValorMinutes: number;
  }>();

  entries.forEach(entry => {
    const mandatoId = entry.mandato_id;
    if (!mandatoId) return;

    const existing = mandatoMap.get(mandatoId) || {
      mandato: entry.mandato,
      totalMinutes: 0,
      coreMaMinutes: 0,
      soporteMinutes: 0,
      bajoValorMinutes: 0
    };

    const duration = entry.duration_minutes || 0;
    existing.totalMinutes += duration;

    const vt: TimeEntryValueType = (entry.value_type as TimeEntryValueType) || 'core_ma';
    switch (vt) {
      case 'core_ma':
        existing.coreMaMinutes += duration;
        break;
      case 'soporte':
        existing.soporteMinutes += duration;
        break;
      case 'bajo_valor':
        existing.bajoValorMinutes += duration;
        break;
    }

    mandatoMap.set(mandatoId, existing);
  });

  // Convert to array and sort by total hours
  const result: MandatoHoursData[] = Array.from(mandatoMap.entries())
    .map(([mandatoId, data]) => {
      const totalHours = data.totalMinutes / 60;
      const coreMaHours = data.coreMaMinutes / 60;
      const soporteHours = data.soporteMinutes / 60;
      const bajoValorHours = data.bajoValorMinutes / 60;

      return {
        mandato_id: mandatoId,
        codigo: data.mandato?.codigo || `M-${mandatoId.slice(0, 4)}`,
        descripcion: data.mandato?.descripcion || 'Sin descripción',
        probability: data.mandato?.probability,
        valor: data.mandato?.valor,
        pipeline_stage: data.mandato?.pipeline_stage,
        estado: data.mandato?.estado,
        total_hours: totalHours,
        core_ma_hours: coreMaHours,
        soporte_hours: soporteHours,
        bajo_valor_hours: bajoValorHours,
        core_ma_pct: totalHours > 0 ? (coreMaHours / totalHours) * 100 : 0,
        soporte_pct: totalHours > 0 ? (soporteHours / totalHours) * 100 : 0,
        bajo_valor_pct: totalHours > 0 ? (bajoValorHours / totalHours) * 100 : 0
      };
    })
    .sort((a, b) => b.total_hours - a.total_hours)
    .slice(0, limit);

  return result;
};
