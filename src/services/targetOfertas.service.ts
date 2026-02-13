import { supabase } from "@/integrations/supabase/client";
import { DatabaseError } from "@/lib/error-handler";
import type { TargetOferta, OfertaTipo, OfertaEstado } from "@/types";

/**
 * Crear una nueva oferta para un target
 */
export async function createOferta(
  mandatoEmpresaId: string,
  oferta: {
    tipo: OfertaTipo;
    monto: number;
    fecha?: string;
    condiciones?: string;
    fecha_expiracion?: string;
    notas?: string;
  }
): Promise<TargetOferta> {
  const { data: user } = await supabase.auth.getUser();

  const { data, error } = await supabase
    .from("target_ofertas")
    .insert({
      mandato_empresa_id: mandatoEmpresaId,
      tipo: oferta.tipo,
      monto: oferta.monto,
      fecha: oferta.fecha || new Date().toISOString().split('T')[0],
      estado: 'enviada' as OfertaEstado,
      condiciones: oferta.condiciones,
      fecha_expiracion: oferta.fecha_expiracion,
      notas: oferta.notas,
      created_by: user?.user?.id,
    })
    .select()
    .single();

  if (error) throw new DatabaseError('Error en operación de ofertas', { supabaseError: error, table: 'target_ofertas' });
  return data as TargetOferta;
}

/**
 * Actualizar una oferta existente
 */
export async function updateOferta(
  id: string,
  updates: Partial<Pick<TargetOferta, 'estado' | 'monto' | 'condiciones' | 'fecha_expiracion' | 'contraoferta_monto' | 'notas'>>
): Promise<TargetOferta> {
  const { data, error } = await supabase
    .from("target_ofertas")
    .update(updates)
    .eq("id", id)
    .select()
    .single();

  if (error) throw new DatabaseError('Error en operación de ofertas', { supabaseError: error, table: 'target_ofertas' });
  return data as TargetOferta;
}

/**
 * Eliminar una oferta
 */
export async function deleteOferta(id: string): Promise<void> {
  const { error } = await supabase
    .from("target_ofertas")
    .delete()
    .eq("id", id);

  if (error) throw new DatabaseError('Error en operación de ofertas', { supabaseError: error, table: 'target_ofertas' });
}

/**
 * Obtener ofertas de un target específico
 */
export async function getOfertasByTarget(mandatoEmpresaId: string): Promise<TargetOferta[]> {
  const { data, error } = await supabase
    .from("target_ofertas")
    .select("*")
    .eq("mandato_empresa_id", mandatoEmpresaId)
    .order("fecha", { ascending: false });

  if (error) throw new DatabaseError('Error en operación de ofertas', { supabaseError: error, table: 'target_ofertas' });
  return (data || []) as TargetOferta[];
}

/**
 * Obtener todas las ofertas de un mandato (todos sus targets)
 */
export async function getOfertasByMandato(mandatoId: string): Promise<TargetOferta[]> {
  // Primero obtenemos los IDs de mandato_empresas del mandato
  const { data: mandatoEmpresas, error: meError } = await supabase
    .from("mandato_empresas")
    .select("id")
    .eq("mandato_id", mandatoId)
    .eq("rol", "target");

  if (meError) throw new DatabaseError('Error al obtener targets del mandato', { supabaseError: meError, table: 'mandato_empresas' });
  if (!mandatoEmpresas || mandatoEmpresas.length === 0) return [];

  const { data, error } = await supabase
    .from("target_ofertas")
    .select("*")
    .in("mandato_empresa_id", mandatoEmpresas.map(me => me.id))
    .order("fecha", { ascending: false });

  if (error) throw new DatabaseError('Error en operación de ofertas', { supabaseError: error, table: 'target_ofertas' });
  return (data || []) as TargetOferta[];
}

/**
 * Cambiar estado de una oferta
 */
export async function cambiarEstadoOferta(
  id: string,
  estado: OfertaEstado,
  contraofertaMonto?: number
): Promise<TargetOferta> {
  const updates: any = { estado };
  if (estado === 'contraoferta' && contraofertaMonto !== undefined) {
    updates.contraoferta_monto = contraofertaMonto;
  }

  return updateOferta(id, updates);
}

/**
 * Obtener resumen de ofertas por estado
 */
export async function getOfertasResumen(mandatoId: string): Promise<{
  total: number;
  byEstado: Record<OfertaEstado, number>;
  montoTotal: number;
  ultimaOferta?: TargetOferta;
}> {
  const ofertas = await getOfertasByMandato(mandatoId);

  const resumen = {
    total: ofertas.length,
    byEstado: {
      enviada: 0,
      aceptada: 0,
      rechazada: 0,
      contraoferta: 0,
      expirada: 0,
      retirada: 0,
    } as Record<OfertaEstado, number>,
    montoTotal: 0,
    ultimaOferta: ofertas[0] as TargetOferta | undefined,
  };

  ofertas.forEach(o => {
    resumen.byEstado[o.estado as OfertaEstado]++;
    resumen.montoTotal += o.monto;
  });

  return resumen;
}
