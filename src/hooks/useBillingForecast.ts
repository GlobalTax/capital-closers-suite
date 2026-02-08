import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface BillingForecastRow {
  id: string;
  codigo: string | null;
  nombre_proyecto: string | null;
  empresa_nombre: string | null;
  tipo: string;
  categoria: string | null;
  estado: string;
  pipeline_stage: string | null;
  probability: number | null;
  valor: number | null;
  honorarios_propuestos: number | null;
  honorarios_aceptados: number | null;
  estructura_honorarios: string | null;
  fee_facturado: number | null;
  fecha_cierre: string | null;
  expected_close_date: string | null;
  fecha_inicio: string | null;
  last_activity_at: string | null;
}

export function useBillingForecast() {
  return useQuery({
    queryKey: ["billing-forecast"],
    queryFn: async (): Promise<BillingForecastRow[]> => {
      const { data, error } = await supabase
        .from("mandatos")
        .select(`
          id, codigo, nombre_proyecto, tipo, categoria, estado,
          pipeline_stage, probability, valor,
          honorarios_propuestos, honorarios_aceptados, estructura_honorarios,
          fee_facturado, fecha_cierre, expected_close_date, fecha_inicio,
          last_activity_at,
          empresas!mandatos_empresa_principal_id_fkey ( nombre )
        `)
        .not("estado", "in", "(cerrado_perdido,cancelado)")
        .order("fecha_cierre", { ascending: true, nullsFirst: false });

      if (error) throw error;

      return (data ?? []).map((m: any) => ({
        id: m.id,
        codigo: m.codigo,
        nombre_proyecto: m.nombre_proyecto,
        empresa_nombre: m.empresas?.nombre ?? null,
        tipo: m.tipo,
        categoria: m.categoria,
        estado: m.estado,
        pipeline_stage: m.pipeline_stage,
        probability: m.probability,
        valor: m.valor,
        honorarios_propuestos: m.honorarios_propuestos,
        honorarios_aceptados: m.honorarios_aceptados,
        estructura_honorarios: m.estructura_honorarios,
        fee_facturado: m.fee_facturado,
        fecha_cierre: m.fecha_cierre,
        expected_close_date: m.expected_close_date,
        fecha_inicio: m.fecha_inicio,
        last_activity_at: m.last_activity_at,
      }));
    },
    staleTime: 2 * 60 * 1000,
  });
}
