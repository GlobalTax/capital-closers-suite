import { supabase } from "@/integrations/supabase/client";
import type { PropuestaHonorarios, PropuestaInsert, PropuestaUpdate, PropuestaConcepto } from "@/types/propuestas";

function parseDesglose(data: unknown): PropuestaConcepto[] {
  if (!Array.isArray(data)) return [];
  return data.map((item: Record<string, unknown>) => ({
    concepto: String(item.concepto || ''),
    descripcion: item.descripcion ? String(item.descripcion) : undefined,
    importe: Number(item.importe) || 0,
  }));
}

function mapToPropuesta(row: Record<string, unknown>): PropuestaHonorarios {
  return {
    ...row,
    desglose: parseDesglose(row.desglose),
  } as PropuestaHonorarios;
}

export async function getPropuestasByMandato(mandatoId: string): Promise<PropuestaHonorarios[]> {
  const { data, error } = await supabase
    .from("propuestas_honorarios")
    .select("*")
    .eq("mandato_id", mandatoId)
    .order("version", { ascending: false });

  if (error) throw error;
  return (data || []).map(row => mapToPropuesta(row as Record<string, unknown>));
}

export async function getPropuestaById(id: string): Promise<PropuestaHonorarios | null> {
  const { data, error } = await supabase
    .from("propuestas_honorarios")
    .select("*")
    .eq("id", id)
    .single();

  if (error) throw error;
  return data ? mapToPropuesta(data as Record<string, unknown>) : null;
}

export async function createPropuesta(propuesta: PropuestaInsert): Promise<PropuestaHonorarios> {
  const { data, error } = await supabase
    .from("propuestas_honorarios")
    .insert({ ...propuesta, desglose: propuesta.desglose as unknown as Record<string, unknown>[] })
    .select()
    .single();

  if (error) throw error;
  return mapToPropuesta(data as Record<string, unknown>);
}

export async function updatePropuesta(id: string, updates: PropuestaUpdate): Promise<PropuestaHonorarios> {
  const payload = updates.desglose 
    ? { ...updates, desglose: updates.desglose as unknown as Record<string, unknown>[] }
    : updates;
    
  const { data, error } = await supabase
    .from("propuestas_honorarios")
    .update(payload)
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  return mapToPropuesta(data as Record<string, unknown>);
}

export async function deletePropuesta(id: string): Promise<void> {
  const { error } = await supabase
    .from("propuestas_honorarios")
    .delete()
    .eq("id", id);

  if (error) throw error;
}

export async function getNextVersion(mandatoId: string): Promise<number> {
  const { data } = await supabase
    .from("propuestas_honorarios")
    .select("version")
    .eq("mandato_id", mandatoId)
    .order("version", { ascending: false })
    .limit(1);

  return (data?.[0]?.version || 0) + 1;
}

export async function enviarPropuesta(id: string): Promise<PropuestaHonorarios> {
  return updatePropuesta(id, {
    estado: 'enviada',
    fecha_emision: new Date().toISOString().split('T')[0]
  });
}

export async function aceptarPropuesta(id: string, mandatoId: string): Promise<PropuestaHonorarios> {
  const propuesta = await updatePropuesta(id, {
    estado: 'aceptada',
    fecha_respuesta: new Date().toISOString()
  });

  await supabase
    .from("mandatos")
    .update({ honorarios_aceptados: propuesta.importe_total })
    .eq("id", mandatoId);

  return propuesta;
}

export async function rechazarPropuesta(id: string, motivo?: string): Promise<PropuestaHonorarios> {
  return updatePropuesta(id, {
    estado: 'rechazada',
    fecha_respuesta: new Date().toISOString(),
    motivo_rechazo: motivo
  });
}

export async function crearNuevaVersion(propuestaOriginal: PropuestaHonorarios): Promise<PropuestaHonorarios> {
  const nextVersion = await getNextVersion(propuestaOriginal.mandato_id);
  
  return createPropuesta({
    mandato_id: propuestaOriginal.mandato_id,
    version: nextVersion,
    estado: 'borrador',
    titulo: propuestaOriginal.titulo,
    descripcion: propuestaOriginal.descripcion,
    importe_total: propuestaOriginal.importe_total,
    estructura: propuestaOriginal.estructura,
    desglose: propuestaOriginal.desglose,
    condiciones_pago: propuestaOriginal.condiciones_pago,
    notas_internas: propuestaOriginal.notas_internas
  });
}
