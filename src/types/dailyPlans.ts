export type DailyPlanStatus = 'draft' | 'submitted' | 'approved' | 'rejected';
export type DailyPlanItemPriority = 'urgente' | 'alta' | 'media' | 'baja';

export interface DailyPlan {
  id: string;
  user_id: string;
  planned_for_date: string;
  status: DailyPlanStatus;
  submitted_at: string | null;
  approved_at: string | null;
  approved_by: string | null;
  admin_notes: string | null;
  user_notes: string | null;
  modified_after_submit: boolean;
  created_at: string;
  updated_at: string;
}

export interface DailyPlanItem {
  id: string;
  plan_id: string;
  title: string;
  description: string | null;
  estimated_minutes: number;
  priority: DailyPlanItemPriority;
  mandato_id: string | null;
  work_task_type_id: string | null;
  assigned_by_admin: boolean;
  completed: boolean;
  actual_time_entry_id: string | null;
  order_index: number;
  created_at: string;
  linked_task_id: string | null;
  mandate_lead_id: string | null;
}

export interface DailyPlanWithItems extends DailyPlan {
  items: DailyPlanItem[];
}

export interface DailyPlanWithUser extends DailyPlan {
  items: DailyPlanItem[];
  user_name: string | null;
  user_email: string | null;
}

export interface NewDailyPlanItem {
  title: string;
  description?: string;
  estimated_minutes: number;
  priority: DailyPlanItemPriority;
  mandato_id?: string | null;
  work_task_type_id?: string | null;
  mandate_lead_id?: string | null;
}
