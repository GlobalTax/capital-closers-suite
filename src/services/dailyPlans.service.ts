import { supabase } from "@/integrations/supabase/client";
import { format, addDays } from "date-fns";
import type { 
  DailyPlan, 
  DailyPlanItem, 
  DailyPlanWithItems, 
  DailyPlanWithUser,
  NewDailyPlanItem,
  DailyPlanStatus 
} from "@/types/dailyPlans";

// Get or create a plan for a specific date
export async function getOrCreatePlan(
  userId: string,
  date: Date
): Promise<DailyPlanWithItems> {
  const dateStr = format(date, 'yyyy-MM-dd');
  
  // Try to get existing plan
  const { data: existingPlan, error: fetchError } = await supabase
    .from('daily_plans')
    .select('*')
    .eq('user_id', userId)
    .eq('planned_for_date', dateStr)
    .maybeSingle();
  
  if (fetchError) throw fetchError;
  
  if (existingPlan) {
    // Get items for this plan
    const { data: items, error: itemsError } = await supabase
      .from('daily_plan_items')
      .select('*')
      .eq('plan_id', existingPlan.id)
      .order('order_index');
    
    if (itemsError) throw itemsError;
    
    return {
      ...existingPlan,
      items: items || []
    } as DailyPlanWithItems;
  }
  
  // Create new plan
  const { data: newPlan, error: createError } = await supabase
    .from('daily_plans')
    .insert({
      user_id: userId,
      planned_for_date: dateStr,
      status: 'draft'
    })
    .select()
    .single();
  
  if (createError) throw createError;
  
  return {
    ...newPlan,
    items: []
  } as DailyPlanWithItems;
}

// Get plan for tomorrow
export async function getTomorrowPlan(userId: string): Promise<DailyPlanWithItems | null> {
  const tomorrow = addDays(new Date(), 1);
  const dateStr = format(tomorrow, 'yyyy-MM-dd');
  
  const { data: plan, error } = await supabase
    .from('daily_plans')
    .select('*')
    .eq('user_id', userId)
    .eq('planned_for_date', dateStr)
    .maybeSingle();
  
  if (error) throw error;
  if (!plan) return null;
  
  const { data: items, error: itemsError } = await supabase
    .from('daily_plan_items')
    .select('*')
    .eq('plan_id', plan.id)
    .order('order_index');
  
  if (itemsError) throw itemsError;
  
  return {
    ...plan,
    items: items || []
  } as DailyPlanWithItems;
}

// Helper: Mark plan as modified if already submitted
async function markPlanAsModified(planId: string): Promise<void> {
  const { data: plan } = await supabase
    .from('daily_plans')
    .select('status')
    .eq('id', planId)
    .single();
  
  if (plan && plan.status !== 'draft') {
    await supabase
      .from('daily_plans')
      .update({ 
        modified_after_submit: true, 
        updated_at: new Date().toISOString() 
      })
      .eq('id', planId);
  }
}

// Add item to plan
export async function addPlanItem(
  planId: string,
  item: NewDailyPlanItem
): Promise<DailyPlanItem> {
  // Get current max order_index
  const { data: existingItems } = await supabase
    .from('daily_plan_items')
    .select('order_index')
    .eq('plan_id', planId)
    .order('order_index', { ascending: false })
    .limit(1);
  
  const nextOrder = (existingItems?.[0]?.order_index ?? -1) + 1;
  
  const { data, error } = await supabase
    .from('daily_plan_items')
    .insert({
      plan_id: planId,
      title: item.title,
      description: item.description || null,
      estimated_minutes: item.estimated_minutes,
      priority: item.priority,
      mandato_id: item.mandato_id || null,
      work_task_type_id: item.work_task_type_id || null,
      order_index: nextOrder
    })
    .select()
    .single();
  
  if (error) throw error;
  
  // Mark plan as modified if already submitted
  await markPlanAsModified(planId);
  
  return data as DailyPlanItem;
}

// Update plan item
export async function updatePlanItem(
  itemId: string,
  updates: Partial<NewDailyPlanItem & { completed?: boolean }>
): Promise<DailyPlanItem> {
  // First get the plan_id to mark as modified
  const { data: item } = await supabase
    .from('daily_plan_items')
    .select('plan_id')
    .eq('id', itemId)
    .single();
  
  const { data, error } = await supabase
    .from('daily_plan_items')
    .update(updates)
    .eq('id', itemId)
    .select()
    .single();
  
  if (error) throw error;
  
  // Mark plan as modified if already submitted
  if (item?.plan_id) {
    await markPlanAsModified(item.plan_id);
  }
  
  return data as DailyPlanItem;
}

// Delete plan item
export async function deletePlanItem(itemId: string): Promise<void> {
  // First get the plan_id to mark as modified
  const { data: item } = await supabase
    .from('daily_plan_items')
    .select('plan_id')
    .eq('id', itemId)
    .single();
  
  const { error } = await supabase
    .from('daily_plan_items')
    .delete()
    .eq('id', itemId);
  
  if (error) throw error;
  
  // Mark plan as modified if already submitted
  if (item?.plan_id) {
    await markPlanAsModified(item.plan_id);
  }
}

// Submit plan
export async function submitPlan(planId: string): Promise<DailyPlan> {
  const { data, error } = await supabase
    .from('daily_plans')
    .update({
      status: 'submitted',
      submitted_at: new Date().toISOString()
    })
    .eq('id', planId)
    .select()
    .single();
  
  if (error) throw error;
  return data as DailyPlan;
}

// Update plan notes
export async function updatePlanNotes(
  planId: string,
  notes: string
): Promise<DailyPlan> {
  const { data, error } = await supabase
    .from('daily_plans')
    .update({ user_notes: notes })
    .eq('id', planId)
    .select()
    .single();
  
  if (error) throw error;
  return data as DailyPlan;
}

// Admin: Get all plans for a date
export async function getPlansForDate(date: Date): Promise<DailyPlanWithUser[]> {
  const dateStr = format(date, 'yyyy-MM-dd');
  
  const { data: plans, error } = await supabase
    .from('daily_plans')
    .select('*')
    .eq('planned_for_date', dateStr)
    .order('created_at');
  
  if (error) throw error;
  if (!plans || plans.length === 0) return [];
  
  // Get user info
  const userIds = [...new Set(plans.map(p => p.user_id))];
  const { data: users } = await supabase
    .from('admin_users')
    .select('user_id, full_name, email')
    .in('user_id', userIds);
  
  const userMap = new Map(users?.map(u => [u.user_id, u]) || []);
  
  // Get items for all plans
  const planIds = plans.map(p => p.id);
  const { data: allItems } = await supabase
    .from('daily_plan_items')
    .select('*')
    .in('plan_id', planIds)
    .order('order_index');
  
  const itemsByPlan = new Map<string, DailyPlanItem[]>();
  allItems?.forEach(item => {
    const items = itemsByPlan.get(item.plan_id) || [];
    items.push(item as DailyPlanItem);
    itemsByPlan.set(item.plan_id, items);
  });
  
  return plans.map(plan => ({
    ...plan,
    items: itemsByPlan.get(plan.id) || [],
    user_name: userMap.get(plan.user_id)?.full_name || null,
    user_email: userMap.get(plan.user_id)?.email || null
  })) as DailyPlanWithUser[];
}

// Admin: Approve/reject plan
export async function updatePlanStatus(
  planId: string,
  status: DailyPlanStatus,
  adminNotes?: string
): Promise<DailyPlan> {
  const updates: Record<string, any> = { status };
  
  if (status === 'approved') {
    const { data: { user } } = await supabase.auth.getUser();
    updates.approved_at = new Date().toISOString();
    updates.approved_by = user?.id;
  }
  
  if (adminNotes !== undefined) {
    updates.admin_notes = adminNotes;
  }
  
  const { data, error } = await supabase
    .from('daily_plans')
    .update(updates)
    .eq('id', planId)
    .select()
    .single();
  
  if (error) throw error;
  return data as DailyPlan;
}

// Admin: Add task to user's plan
export async function addAdminTask(
  planId: string,
  item: NewDailyPlanItem
): Promise<DailyPlanItem> {
  const { data: existingItems } = await supabase
    .from('daily_plan_items')
    .select('order_index')
    .eq('plan_id', planId)
    .order('order_index', { ascending: false })
    .limit(1);
  
  const nextOrder = (existingItems?.[0]?.order_index ?? -1) + 1;
  
  const { data, error } = await supabase
    .from('daily_plan_items')
    .insert({
      plan_id: planId,
      title: item.title,
      description: item.description || null,
      estimated_minutes: item.estimated_minutes,
      priority: item.priority,
      mandato_id: item.mandato_id || null,
      work_task_type_id: item.work_task_type_id || null,
      assigned_by_admin: true,
      order_index: nextOrder
    })
    .select()
    .single();
  
  if (error) throw error;
  return data as DailyPlanItem;
}

// Check if user can register hours for a date (today or future requires submitted plan)
export async function canRegisterHoursForDate(
  userId: string,
  date: Date
): Promise<{ allowed: boolean; reason?: string; planId?: string }> {
  const targetDate = format(date, 'yyyy-MM-dd');
  const today = format(new Date(), 'yyyy-MM-dd');
  
  // Only PAST dates (before today) are allowed without a plan
  if (targetDate < today) {
    return { allowed: true };
  }
  
  // TODAY and FUTURE dates require a submitted plan
  const { data: plan, error } = await supabase
    .from('daily_plans')
    .select('id, status')
    .eq('user_id', userId)
    .eq('planned_for_date', targetDate)
    .maybeSingle();
  
  if (error) throw error;
  
  if (!plan) {
    const isToday = targetDate === today;
    return {
      allowed: false,
      reason: isToday 
        ? 'Debes crear y enviar tu plan para hoy antes de registrar horas'
        : 'Debes crear y enviar tu plan diario antes de registrar horas para este día'
    };
  }
  
  if (plan.status === 'draft') {
    return {
      allowed: false,
      reason: 'Debes enviar tu plan diario antes de registrar horas',
      planId: plan.id
    };
  }
  
  return { allowed: true, planId: plan.id };
}
