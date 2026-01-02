import { supabase } from "@/integrations/supabase/client";
import type { LossReasonType } from "@/types";
import { LOSS_REASON_OPTIONS, PIPELINE_STAGE_LABELS } from "@/lib/constants";

export interface WinLossMetrics {
  totalClosed: number;
  wonCount: number;
  lostCount: number;
  cancelledCount: number;
  winRate: number;
  totalWonValue: number;
  avgWonValue: number;
  
  lossesByReason: {
    reason: LossReasonType;
    label: string;
    count: number;
    percentage: number;
  }[];
  
  lossesByStage: {
    stage: string;
    stage_label: string;
    count: number;
    percentage: number;
  }[];
  
  byType: {
    tipo: "compra" | "venta";
    won: number;
    lost: number;
    cancelled: number;
    winRate: number;
  }[];
}

export async function fetchWinLossMetrics(): Promise<WinLossMetrics> {
  // Fetch all closed mandatos
  const { data: mandatos, error } = await supabase
    .from("mandatos")
    .select("id, tipo, outcome, loss_reason, pipeline_stage, valor, won_value")
    .in("outcome", ["won", "lost", "cancelled"]);

  if (error) throw error;

  const closed = mandatos || [];
  const won = closed.filter((m) => m.outcome === "won");
  const lost = closed.filter((m) => m.outcome === "lost");
  const cancelled = closed.filter((m) => m.outcome === "cancelled");

  const totalClosed = closed.length;
  const wonCount = won.length;
  const lostCount = lost.length;
  const cancelledCount = cancelled.length;
  const winRate = totalClosed > 0 ? Math.round((wonCount / totalClosed) * 100) : 0;
  
  const totalWonValue = won.reduce((sum, m) => sum + (m.won_value || m.valor || 0), 0);
  const avgWonValue = wonCount > 0 ? Math.round(totalWonValue / wonCount) : 0;

  // Losses by reason
  const reasonCounts: Record<string, number> = {};
  lost.forEach((m) => {
    if (m.loss_reason) {
      reasonCounts[m.loss_reason] = (reasonCounts[m.loss_reason] || 0) + 1;
    }
  });

  const lossesByReason = LOSS_REASON_OPTIONS.map((opt) => ({
    reason: opt.value as LossReasonType,
    label: opt.label,
    count: reasonCounts[opt.value] || 0,
    percentage: lostCount > 0 ? Math.round(((reasonCounts[opt.value] || 0) / lostCount) * 100) : 0,
  }))
    .filter((r) => r.count > 0)
    .sort((a, b) => b.count - a.count);

  // Losses by stage
  const stageCounts: Record<string, number> = {};
  lost.forEach((m) => {
    const stage = m.pipeline_stage || "unknown";
    stageCounts[stage] = (stageCounts[stage] || 0) + 1;
  });

  const lossesByStage = Object.entries(stageCounts)
    .map(([stage, count]) => ({
      stage,
      stage_label: PIPELINE_STAGE_LABELS[stage] || stage,
      count,
      percentage: lostCount > 0 ? Math.round((count / lostCount) * 100) : 0,
    }))
    .sort((a, b) => b.count - a.count);

  // By type (compra vs venta)
  const byTypeMap: Record<string, { won: number; lost: number; cancelled: number }> = {
    compra: { won: 0, lost: 0, cancelled: 0 },
    venta: { won: 0, lost: 0, cancelled: 0 },
  };

  closed.forEach((m) => {
    const tipo = m.tipo || "venta";
    if (byTypeMap[tipo]) {
      if (m.outcome === "won") byTypeMap[tipo].won++;
      else if (m.outcome === "lost") byTypeMap[tipo].lost++;
      else if (m.outcome === "cancelled") byTypeMap[tipo].cancelled++;
    }
  });

  const byType = (["compra", "venta"] as const).map((tipo) => {
    const data = byTypeMap[tipo];
    const total = data.won + data.lost + data.cancelled;
    return {
      tipo,
      ...data,
      winRate: total > 0 ? Math.round((data.won / total) * 100) : 0,
    };
  });

  return {
    totalClosed,
    wonCount,
    lostCount,
    cancelledCount,
    winRate,
    totalWonValue,
    avgWonValue,
    lossesByReason,
    lossesByStage,
    byType,
  };
}
