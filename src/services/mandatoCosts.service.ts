import { supabase } from "@/integrations/supabase/client";
import { DatabaseError } from "@/lib/error-handler";
import type { BillingRate, MandatoCostSummary, CostByWorkType, CostByUser } from "@/types";

export interface MandatoCostDetail extends MandatoCostSummary {
  costByWorkType: CostByWorkType[];
  costByUser: CostByUser[];
}

// Fetch cost summary for a specific mandato
export async function fetchMandatoCosts(mandatoId: string): Promise<MandatoCostDetail | null> {
  // Get basic cost data from view
  const { data: costData, error: costError } = await supabase
    .from('v_mandato_costs')
    .select('*')
    .eq('mandato_id', mandatoId)
    .single();

  if (costError || !costData) {
    return null;
  }

  // Get breakdown by work_type
  const { data: workTypeData } = await supabase
    .from('mandato_time_entries')
    .select(`
      work_type,
      duration_minutes,
      is_billable,
      user_id
    `)
    .eq('mandato_id', mandatoId)
    .limit(2000);

  // Get billing rates for cost calculation
  const { data: rates } = await supabase
    .from('billing_rates')
    .select('*')
    .eq('is_active', true)
    .limit(100);

  const rateMap = new Map<string, number>();
  rates?.forEach(r => rateMap.set(r.role, r.hourly_rate));

  // Get user roles for rate lookup
  const { data: users } = await supabase
    .from('admin_users')
    .select('user_id, full_name, role')
    .limit(200);

  const userMap = new Map<string, { name: string; role: string; rate: number }>();
  users?.forEach(u => {
    userMap.set(u.user_id, {
      name: u.full_name || 'Usuario',
      role: u.role,
      rate: rateMap.get(u.role) || 100
    });
  });

  // Aggregate by work_type
  const workTypeAgg: Record<string, { hours: number; cost: number }> = {};
  const userAgg: Record<string, { hours: number; cost: number; name: string; role: string; rate: number }> = {};

  workTypeData?.forEach(entry => {
    const hours = (entry.duration_minutes || 0) / 60;
    const userInfo = userMap.get(entry.user_id) || { name: 'Usuario', role: 'viewer', rate: 100 };
    const cost = hours * userInfo.rate;

    // By work type
    if (!workTypeAgg[entry.work_type]) {
      workTypeAgg[entry.work_type] = { hours: 0, cost: 0 };
    }
    workTypeAgg[entry.work_type].hours += hours;
    workTypeAgg[entry.work_type].cost += cost;

    // By user
    if (!userAgg[entry.user_id]) {
      userAgg[entry.user_id] = { hours: 0, cost: 0, ...userInfo };
    }
    userAgg[entry.user_id].hours += hours;
    userAgg[entry.user_id].cost += cost;
  });

  const costByWorkType: CostByWorkType[] = Object.entries(workTypeAgg)
    .map(([workType, data]) => ({
      workType,
      hours: Math.round(data.hours * 10) / 10,
      cost: Math.round(data.cost)
    }))
    .sort((a, b) => b.cost - a.cost);

  const costByUser: CostByUser[] = Object.entries(userAgg)
    .map(([userId, data]) => ({
      userId,
      userName: data.name,
      role: data.role,
      hours: Math.round(data.hours * 10) / 10,
      rate: data.rate,
      cost: Math.round(data.cost)
    }))
    .sort((a, b) => b.cost - a.cost);

  return {
    mandatoId: costData.mandato_id,
    descripcion: costData.descripcion || '',
    empresaNombre: costData.empresa_nombre,
    tipo: costData.tipo,
    totalHours: Math.round((costData.total_hours || 0) * 10) / 10,
    billableHours: Math.round((costData.billable_hours || 0) * 10) / 10,
    totalCost: Math.round(costData.total_cost || 0),
    billableCost: Math.round(costData.billable_cost || 0),
    billablePercentage: Math.round(costData.billable_percentage || 0),
    costByWorkType,
    costByUser
  };
}

// Fetch top mandatos by cost
export async function fetchTopMandatosByCost(limit = 10): Promise<MandatoCostSummary[]> {
  const { data, error } = await supabase
    .from('v_mandato_costs')
    .select('*')
    .gt('total_cost', 0)
    .order('total_cost', { ascending: false })
    .limit(limit);

  if (error) {
    throw new DatabaseError('Error al obtener top mandatos por coste', { supabaseError: error, table: 'v_mandato_costs' });
  }

  return (data || []).map(row => ({
    mandatoId: row.mandato_id,
    descripcion: row.descripcion || '',
    empresaNombre: row.empresa_nombre,
    tipo: row.tipo,
    totalHours: Math.round((row.total_hours || 0) * 10) / 10,
    billableHours: Math.round((row.billable_hours || 0) * 10) / 10,
    totalCost: Math.round(row.total_cost || 0),
    billableCost: Math.round(row.billable_cost || 0),
    billablePercentage: Math.round(row.billable_percentage || 0)
  }));
}

// Fetch all billing rates
export async function fetchBillingRates(): Promise<BillingRate[]> {
  const { data, error } = await supabase
    .from('billing_rates')
    .select('*')
    .eq('is_active', true)
    .order('hourly_rate', { ascending: false });

  if (error) {
    throw new DatabaseError('Error al obtener tarifas', { supabaseError: error, table: 'billing_rates' });
  }

  return data || [];
}

// Get total cost metrics for reporting
export async function fetchTotalCostMetrics(): Promise<{
  totalCost: number;
  totalHours: number;
  avgBillableRate: number;
  mandatosWithCost: number;
}> {
  const { data, error } = await supabase
    .from('v_mandato_costs')
    .select('total_cost, total_hours, billable_percentage')
    .gt('total_hours', 0);

  if (error || !data?.length) {
    return { totalCost: 0, totalHours: 0, avgBillableRate: 0, mandatosWithCost: 0 };
  }

  const totalCost = data.reduce((sum, r) => sum + (r.total_cost || 0), 0);
  const totalHours = data.reduce((sum, r) => sum + (r.total_hours || 0), 0);
  const avgBillableRate = data.reduce((sum, r) => sum + (r.billable_percentage || 0), 0) / data.length;

  return {
    totalCost: Math.round(totalCost),
    totalHours: Math.round(totalHours * 10) / 10,
    avgBillableRate: Math.round(avgBillableRate),
    mandatosWithCost: data.length
  };
}
