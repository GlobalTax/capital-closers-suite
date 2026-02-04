import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { format, addDays, startOfWeek, eachDayOfInterval } from "date-fns";
import type { DailyPlanStatus } from "@/types/dailyPlans";

export interface DayCompliance {
  date: string;
  status: DailyPlanStatus | 'none';
  planId?: string;
  totalMinutes: number;
  itemCount: number;
}

export interface UserCompliance {
  userId: string;
  userName: string;
  userEmail: string;
  days: DayCompliance[];
  complianceRate: number; // % of days with approved/submitted plan
  totalPlannedMinutes: number;
}

export interface ComplianceStats {
  totalUsers: number;
  usersWithPlans: number;
  plansPendingReview: number;
  plansApproved: number;
  averageComplianceRate: number;
}

export function usePlanCompliance(weekStart: Date) {
  const [compliance, setCompliance] = useState<UserCompliance[]>([]);
  const [stats, setStats] = useState<ComplianceStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const weekEnd = addDays(weekStart, 6);
  const weekDays = eachDayOfInterval({ start: weekStart, end: weekEnd });

  useEffect(() => {
    loadCompliance();
  }, [weekStart]);

  async function loadCompliance() {
    try {
      setLoading(true);
      setError(null);

      // Get all active users
      const { data: users, error: usersError } = await supabase
        .from('admin_users')
        .select('user_id, full_name, email')
        .eq('is_active', true)
        .order('full_name');

      if (usersError) throw usersError;

      // Get all plans for the week
      const startStr = format(weekStart, 'yyyy-MM-dd');
      const endStr = format(weekEnd, 'yyyy-MM-dd');

      const { data: plans, error: plansError } = await supabase
        .from('daily_plans')
        .select('id, user_id, planned_for_date, status, total_estimated_minutes')
        .gte('planned_for_date', startStr)
        .lte('planned_for_date', endStr);

      if (plansError) throw plansError;

      // Get items count for each plan
      const planIds = plans?.map(p => p.id) || [];
      const { data: itemCounts } = await supabase
        .from('daily_plan_items')
        .select('plan_id')
        .in('plan_id', planIds.length > 0 ? planIds : ['none']);

      const itemCountMap = new Map<string, number>();
      itemCounts?.forEach(item => {
        itemCountMap.set(item.plan_id, (itemCountMap.get(item.plan_id) || 0) + 1);
      });

      // Build plan lookup
      const plansByUserDate = new Map<string, typeof plans[0]>();
      plans?.forEach(plan => {
        const key = `${plan.user_id}_${plan.planned_for_date}`;
        plansByUserDate.set(key, plan);
      });

      // Build compliance data for each user
      const complianceData: UserCompliance[] = (users || []).map(user => {
        const days: DayCompliance[] = weekDays.map(day => {
          const dateStr = format(day, 'yyyy-MM-dd');
          const key = `${user.user_id}_${dateStr}`;
          const plan = plansByUserDate.get(key);

          return {
            date: dateStr,
            status: plan ? (plan.status as DailyPlanStatus) : 'none',
            planId: plan?.id,
            totalMinutes: plan?.total_estimated_minutes || 0,
            itemCount: plan ? (itemCountMap.get(plan.id) || 0) : 0
          };
        });

        const daysWithPlan = days.filter(d => d.status === 'approved' || d.status === 'submitted');
        const complianceRate = Math.round((daysWithPlan.length / 5) * 100); // 5 work days
        const totalPlannedMinutes = days.reduce((sum, d) => sum + d.totalMinutes, 0);

        return {
          userId: user.user_id,
          userName: user.full_name || 'Usuario',
          userEmail: user.email || '',
          days,
          complianceRate,
          totalPlannedMinutes
        };
      });

      // Calculate stats
      const usersWithAtLeastOnePlan = complianceData.filter(u => 
        u.days.some(d => d.status !== 'none')
      ).length;

      const pendingPlans = plans?.filter(p => p.status === 'submitted').length || 0;
      const approvedPlans = plans?.filter(p => p.status === 'approved').length || 0;
      
      const avgCompliance = complianceData.length > 0
        ? Math.round(complianceData.reduce((sum, u) => sum + u.complianceRate, 0) / complianceData.length)
        : 0;

      setCompliance(complianceData);
      setStats({
        totalUsers: users?.length || 0,
        usersWithPlans: usersWithAtLeastOnePlan,
        plansPendingReview: pendingPlans,
        plansApproved: approvedPlans,
        averageComplianceRate: avgCompliance
      });
    } catch (err) {
      console.error('Error loading compliance:', err);
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  }

  return {
    compliance,
    stats,
    loading,
    error,
    refresh: loadCompliance,
    weekDays
  };
}
