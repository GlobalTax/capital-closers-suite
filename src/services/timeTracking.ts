import { supabase } from "@/integrations/supabase/client";
import type { TimeEntry, TimeEntryWorkType, TimeEntryStatus, TimeStats, TeamStats, MandatoInfo } from "@/types";

// Helper to validate UUID
const isValidUUID = (str: string): boolean => {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(str);
};

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
    .select(`
      *,
      task:mandato_checklist_tasks(
        id,
        tarea,
        fase
      ),
      mandato:mandatos!inner(
        id,
        descripcion,
        tipo,
        estado
      )
    `)
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
    mandato: entry.mandato as MandatoInfo
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
    .select(`
      *,
      task:mandato_checklist_tasks(
        id,
        tarea,
        fase
      ),
      mandato:mandatos!inner(
        id,
        descripcion,
        tipo,
        estado
      )
    `)
    .eq('user_id', userId)
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
    mandato: entry.mandato as MandatoInfo
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
    onlyBillable?: boolean;
  }
): Promise<TimeEntry[]> => {
  let query = supabase
    .from('mandato_time_entries')
    .select(`
      *,
      task:mandato_checklist_tasks(
        id,
        tarea,
        fase
      ),
      mandato:mandatos!inner(
        id,
        descripcion,
        tipo,
        estado
      )
    `)
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
    mandato: entry.mandato as MandatoInfo
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
  const { data, error } = await supabase
    .from('mandato_time_entries')
    .insert([entry] as any)
    .select()
    .single();

  if (error) throw error;
  return data as TimeEntry;
};

export const updateTimeEntry = async (
  id: string,
  updates: Partial<TimeEntry>
): Promise<TimeEntry> => {
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
  const { error } = await supabase
    .from('mandato_time_entries')
    .delete()
    .eq('id', id);

  if (error) throw error;
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
