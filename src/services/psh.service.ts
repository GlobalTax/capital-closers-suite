import { supabase } from "@/integrations/supabase/client";
import type { PSHPlantilla, AlcanceDD, ClausulasAdicionales } from "@/types/psh";

function parseJsonField<T>(data: unknown, defaultValue: T): T {
  if (!data) return defaultValue;
  if (typeof data === 'object') return data as T;
  try {
    return JSON.parse(String(data)) as T;
  } catch {
    return defaultValue;
  }
}

function mapToPlantilla(row: Record<string, unknown>): PSHPlantilla {
  return {
    id: String(row.id),
    nombre: String(row.nombre),
    tipo_servicio: String(row.tipo_servicio),
    descripcion: row.descripcion ? String(row.descripcion) : undefined,
    alcance_default: parseJsonField<AlcanceDD>(row.alcance_default, {}),
    clausulas_default: parseJsonField<ClausulasAdicionales>(row.clausulas_default, {}),
    condiciones_pago_default: row.condiciones_pago_default ? String(row.condiciones_pago_default) : undefined,
    is_active: Boolean(row.is_active),
    display_order: Number(row.display_order) || 0,
    created_at: String(row.created_at),
    updated_at: String(row.updated_at),
  };
}

export async function getPSHPlantillas(): Promise<PSHPlantilla[]> {
  const { data, error } = await supabase
    .from("psh_plantillas")
    .select("*")
    .eq("is_active", true)
    .order("display_order", { ascending: true });

  if (error) throw error;
  return (data || []).map(row => mapToPlantilla(row as Record<string, unknown>));
}

export async function getPSHPlantillaById(id: string): Promise<PSHPlantilla | null> {
  const { data, error } = await supabase
    .from("psh_plantillas")
    .select("*")
    .eq("id", id)
    .single();

  if (error) throw error;
  return data ? mapToPlantilla(data as Record<string, unknown>) : null;
}

export async function getPSHPlantillaByTipo(tipo: string): Promise<PSHPlantilla[]> {
  const { data, error } = await supabase
    .from("psh_plantillas")
    .select("*")
    .eq("tipo_servicio", tipo)
    .eq("is_active", true)
    .order("display_order", { ascending: true });

  if (error) throw error;
  return (data || []).map(row => mapToPlantilla(row as Record<string, unknown>));
}

// Calculate total from alcance_dd
export function calcularTotalDD(alcance: AlcanceDD): number {
  let total = 0;
  for (const area of Object.values(alcance)) {
    if (area?.incluido) {
      total += area.importe || 0;
    }
  }
  return total;
}
