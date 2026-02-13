import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { subDays, format } from "date-fns";

export type DateRange = "7d" | "30d" | "90d" | "all";

function getStartDate(range: DateRange): string | null {
  if (range === "all") return null;
  const days = range === "7d" ? 7 : range === "30d" ? 30 : 90;
  return subDays(new Date(), days).toISOString();
}

export interface AIKPIs {
  totalCalls: number;
  totalTokens: number;
  totalCost: number;
  successRate: number;
  avgLatency: number;
  successCount: number;
  errorCount: number;
}

export interface AIModuleStats {
  module: string;
  calls: number;
  inputTokens: number;
  outputTokens: number;
  cost: number;
  successRate: number;
  avgLatency: number;
}

export interface AIModelStats {
  model: string;
  calls: number;
  totalTokens: number;
  cost: number;
  avgLatency: number;
}

export interface AIDailyData {
  date: string;
  tokens: number;
  cost: number;
  calls: number;
}

export function useAIDashboard(dateRange: DateRange = "30d") {
  const startDate = getStartDate(dateRange);

  const buildQuery = () => {
    let q = supabase.from("ai_activity_log").select("*").limit(5000);
    if (startDate) q = q.gte("created_at", startDate);
    return q;
  };

  const kpisQuery = useQuery({
    queryKey: ["ai-dashboard", "kpis", dateRange],
    queryFn: async (): Promise<AIKPIs> => {
      const { data, error } = await buildQuery().order("created_at", { ascending: false });
      if (error) throw error;
      if (!data || data.length === 0) {
        return { totalCalls: 0, totalTokens: 0, totalCost: 0, successRate: 0, avgLatency: 0, successCount: 0, errorCount: 0 };
      }
      const totalCalls = data.length;
      const totalTokens = data.reduce((s, r) => s + (r.input_tokens || 0) + (r.output_tokens || 0), 0);
      const totalCost = data.reduce((s, r) => s + (r.estimated_cost_usd || 0), 0);
      const successCount = data.filter(r => r.success).length;
      const errorCount = totalCalls - successCount;
      const successRate = totalCalls > 0 ? (successCount / totalCalls) * 100 : 0;
      const avgLatency = totalCalls > 0 ? data.reduce((s, r) => s + (r.duration_ms || 0), 0) / totalCalls : 0;
      return { totalCalls, totalTokens, totalCost, successRate, avgLatency, successCount, errorCount };
    },
    staleTime: 2 * 60 * 1000,
  });

  const moduleQuery = useQuery({
    queryKey: ["ai-dashboard", "modules", dateRange],
    queryFn: async (): Promise<AIModuleStats[]> => {
      const { data, error } = await buildQuery();
      if (error) throw error;
      if (!data || data.length === 0) return [];
      const map = new Map<string, { calls: number; inTk: number; outTk: number; cost: number; success: number; latency: number }>();
      for (const r of data) {
        const m = r.module;
        const prev = map.get(m) || { calls: 0, inTk: 0, outTk: 0, cost: 0, success: 0, latency: 0 };
        prev.calls++;
        prev.inTk += r.input_tokens || 0;
        prev.outTk += r.output_tokens || 0;
        prev.cost += r.estimated_cost_usd || 0;
        if (r.success) prev.success++;
        prev.latency += r.duration_ms || 0;
        map.set(m, prev);
      }
      return Array.from(map.entries()).map(([module, v]) => ({
        module,
        calls: v.calls,
        inputTokens: v.inTk,
        outputTokens: v.outTk,
        cost: v.cost,
        successRate: v.calls > 0 ? (v.success / v.calls) * 100 : 0,
        avgLatency: v.calls > 0 ? v.latency / v.calls : 0,
      })).sort((a, b) => b.calls - a.calls);
    },
    staleTime: 2 * 60 * 1000,
  });

  const modelQuery = useQuery({
    queryKey: ["ai-dashboard", "models", dateRange],
    queryFn: async (): Promise<AIModelStats[]> => {
      const { data, error } = await buildQuery();
      if (error) throw error;
      if (!data || data.length === 0) return [];
      const map = new Map<string, { calls: number; tokens: number; cost: number; latency: number }>();
      for (const r of data) {
        const m = r.model || "unknown";
        const prev = map.get(m) || { calls: 0, tokens: 0, cost: 0, latency: 0 };
        prev.calls++;
        prev.tokens += (r.input_tokens || 0) + (r.output_tokens || 0);
        prev.cost += r.estimated_cost_usd || 0;
        prev.latency += r.duration_ms || 0;
        map.set(m, prev);
      }
      return Array.from(map.entries()).map(([model, v]) => ({
        model,
        calls: v.calls,
        totalTokens: v.tokens,
        cost: v.cost,
        avgLatency: v.calls > 0 ? v.latency / v.calls : 0,
      })).sort((a, b) => b.calls - a.calls);
    },
    staleTime: 2 * 60 * 1000,
  });

  const timeSeriesQuery = useQuery({
    queryKey: ["ai-dashboard", "timeseries", dateRange],
    queryFn: async (): Promise<AIDailyData[]> => {
      const { data, error } = await buildQuery().order("created_at", { ascending: true });
      if (error) throw error;
      if (!data || data.length === 0) return [];
      const map = new Map<string, { tokens: number; cost: number; calls: number }>();
      for (const r of data) {
        const day = format(new Date(r.created_at), "yyyy-MM-dd");
        const prev = map.get(day) || { tokens: 0, cost: 0, calls: 0 };
        prev.tokens += (r.input_tokens || 0) + (r.output_tokens || 0);
        prev.cost += r.estimated_cost_usd || 0;
        prev.calls++;
        map.set(day, prev);
      }
      return Array.from(map.entries()).map(([date, v]) => ({ date, ...v }));
    },
    staleTime: 2 * 60 * 1000,
  });

  const recentQuery = useQuery({
    queryKey: ["ai-dashboard", "recent", dateRange],
    queryFn: async () => {
      let q = supabase.from("ai_activity_log").select("*").order("created_at", { ascending: false }).limit(50);
      if (startDate) q = q.gte("created_at", startDate);
      const { data, error } = await q;
      if (error) throw error;
      return data || [];
    },
    staleTime: 2 * 60 * 1000,
  });

  return {
    kpis: kpisQuery.data,
    isLoadingKPIs: kpisQuery.isLoading,
    modules: moduleQuery.data || [],
    isLoadingModules: moduleQuery.isLoading,
    models: modelQuery.data || [],
    isLoadingModels: modelQuery.isLoading,
    timeSeries: timeSeriesQuery.data || [],
    isLoadingTimeSeries: timeSeriesQuery.isLoading,
    recent: recentQuery.data || [],
    isLoadingRecent: recentQuery.isLoading,
  };
}
