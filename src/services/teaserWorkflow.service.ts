// ============================================
// TEASER WORKFLOW SERVICE
// Gestión de estados: draft → approved → published
// ============================================

import { supabase } from "@/integrations/supabase/client";
import type { DocumentWithVersion, TeaserStatus, IdiomaTeaser } from "@/types/documents";

export interface TeaserVersion {
  id: string;
  file_name: string;
  version: number;
  status: TeaserStatus;
  idioma: IdiomaTeaser;
  created_at: string;
  approved_by?: string;
  approved_at?: string;
  published_at?: string;
  file_size_bytes: number;
  storage_path: string;
}

/**
 * Obtener historial de versiones de teaser por idioma
 */
export async function getTeaserVersionHistory(
  mandatoId: string,
  idioma?: IdiomaTeaser
): Promise<TeaserVersion[]> {
  let query = supabase
    .from('documentos')
    .select('id, file_name, version, status, idioma, created_at, approved_by, approved_at, published_at, file_size_bytes, storage_path')
    .eq('mandato_id', mandatoId)
    .eq('tipo', 'Teaser')
    .order('version', { ascending: false });

  if (idioma) {
    query = query.eq('idioma', idioma);
  }

  const { data, error } = await query;

  if (error) {
    console.error('[TeaserWorkflow] Error fetching version history:', error);
    throw new Error('Error al obtener historial de versiones');
  }

  return (data || []).map(doc => ({
    ...doc,
    status: (doc.status as TeaserStatus) || 'draft',
    idioma: doc.idioma as IdiomaTeaser,
  }));
}

/**
 * Obtener teaser publicado por idioma (para distribución)
 */
export async function getPublishedTeaser(
  mandatoId: string,
  idioma: IdiomaTeaser
): Promise<DocumentWithVersion | null> {
  const { data, error } = await supabase
    .from('documentos')
    .select('*')
    .eq('mandato_id', mandatoId)
    .eq('tipo', 'Teaser')
    .eq('idioma', idioma)
    .eq('status', 'published')
    .maybeSingle();

  if (error) {
    console.error('[TeaserWorkflow] Error fetching published teaser:', error);
    return null;
  }

  return data as DocumentWithVersion | null;
}

/**
 * Aprobar una versión de teaser
 * Solo admin/super_admin pueden aprobar
 */
export async function approveTeaserVersion(
  documentId: string,
  userId: string
): Promise<{ success: boolean; error?: string }> {
  // Verificar que el documento existe y está en draft
  const { data: doc, error: fetchError } = await supabase
    .from('documentos')
    .select('id, status, tipo')
    .eq('id', documentId)
    .single();

  if (fetchError || !doc) {
    return { success: false, error: 'Documento no encontrado' };
  }

  if (doc.tipo !== 'Teaser') {
    return { success: false, error: 'Solo se pueden aprobar teasers' };
  }

  if (doc.status === 'approved' || doc.status === 'published') {
    return { success: false, error: 'Este teaser ya está aprobado o publicado' };
  }

  // Actualizar a aprobado
  const { error: updateError } = await supabase
    .from('documentos')
    .update({
      status: 'approved',
      approved_by: userId,
      approved_at: new Date().toISOString(),
    })
    .eq('id', documentId);

  if (updateError) {
    console.error('[TeaserWorkflow] Error approving teaser:', updateError);
    return { success: false, error: 'Error al aprobar el teaser' };
  }

  return { success: true };
}

/**
 * Publicar una versión de teaser
 * Despublica cualquier versión anterior del mismo idioma
 */
export async function publishTeaserVersion(
  documentId: string,
  mandatoId: string,
  idioma: IdiomaTeaser
): Promise<{ success: boolean; error?: string }> {
  // Verificar que el documento existe y está aprobado
  const { data: doc, error: fetchError } = await supabase
    .from('documentos')
    .select('id, status, tipo, idioma')
    .eq('id', documentId)
    .single();

  if (fetchError || !doc) {
    return { success: false, error: 'Documento no encontrado' };
  }

  if (doc.tipo !== 'Teaser') {
    return { success: false, error: 'Solo se pueden publicar teasers' };
  }

  if (doc.status !== 'approved') {
    return { success: false, error: 'Solo se pueden publicar teasers aprobados' };
  }

  // Despublicar versión anterior del mismo idioma (si existe)
  await supabase
    .from('documentos')
    .update({ 
      status: 'approved',
      published_at: null 
    })
    .eq('mandato_id', mandatoId)
    .eq('tipo', 'Teaser')
    .eq('idioma', idioma)
    .eq('status', 'published');

  // Publicar la nueva versión
  const { error: updateError } = await supabase
    .from('documentos')
    .update({
      status: 'published',
      published_at: new Date().toISOString(),
      is_latest_version: true,
    })
    .eq('id', documentId);

  if (updateError) {
    console.error('[TeaserWorkflow] Error publishing teaser:', updateError);
    return { success: false, error: 'Error al publicar el teaser' };
  }

  // Marcar otras versiones como no latest
  await supabase
    .from('documentos')
    .update({ is_latest_version: false })
    .eq('mandato_id', mandatoId)
    .eq('tipo', 'Teaser')
    .eq('idioma', idioma)
    .neq('id', documentId);

  return { success: true };
}

/**
 * Revertir a una versión anterior
 * Despublica la actual y publica la seleccionada
 */
export async function revertToVersion(
  documentId: string,
  mandatoId: string,
  idioma: IdiomaTeaser
): Promise<{ success: boolean; error?: string }> {
  // Verificar que el documento está aprobado o fue publicado antes
  const { data: doc, error: fetchError } = await supabase
    .from('documentos')
    .select('id, status, tipo')
    .eq('id', documentId)
    .single();

  if (fetchError || !doc) {
    return { success: false, error: 'Documento no encontrado' };
  }

  if (doc.status === 'draft') {
    return { success: false, error: 'No se puede revertir a un borrador. Apruébelo primero.' };
  }

  // Despublicar versión actual
  await supabase
    .from('documentos')
    .update({ 
      status: 'approved',
      published_at: null,
      is_latest_version: false
    })
    .eq('mandato_id', mandatoId)
    .eq('tipo', 'Teaser')
    .eq('idioma', idioma)
    .eq('status', 'published');

  // Publicar la versión seleccionada
  const { error: updateError } = await supabase
    .from('documentos')
    .update({
      status: 'published',
      published_at: new Date().toISOString(),
      is_latest_version: true,
    })
    .eq('id', documentId);

  if (updateError) {
    console.error('[TeaserWorkflow] Error reverting teaser:', updateError);
    return { success: false, error: 'Error al revertir el teaser' };
  }

  return { success: true };
}

/**
 * Eliminar un borrador de teaser
 * Solo se pueden eliminar borradores
 */
export async function deleteDraftTeaser(
  documentId: string,
  storagePath: string
): Promise<{ success: boolean; error?: string }> {
  // Verificar que es un borrador
  const { data: doc, error: fetchError } = await supabase
    .from('documentos')
    .select('id, status, tipo')
    .eq('id', documentId)
    .single();

  if (fetchError || !doc) {
    return { success: false, error: 'Documento no encontrado' };
  }

  if (doc.status !== 'draft') {
    return { success: false, error: 'Solo se pueden eliminar borradores' };
  }

  // Eliminar de storage
  const { error: storageError } = await supabase.storage
    .from('mandato-documentos')
    .remove([storagePath]);

  if (storageError) {
    console.warn('[TeaserWorkflow] Error deleting from storage:', storageError);
  }

  // Eliminar de base de datos
  const { error: deleteError } = await supabase
    .from('documentos')
    .delete()
    .eq('id', documentId);

  if (deleteError) {
    console.error('[TeaserWorkflow] Error deleting teaser:', deleteError);
    return { success: false, error: 'Error al eliminar el teaser' };
  }

  return { success: true };
}

/**
 * Obtener teasers publicados para distribución (SendTeasersDialog)
 */
export async function getPublishedTeasersForMandatos(
  mandatoIds: string[]
): Promise<Map<string, { es: DocumentWithVersion | null; en: DocumentWithVersion | null }>> {
  if (mandatoIds.length === 0) {
    return new Map();
  }

  const { data, error } = await supabase
    .from('documentos')
    .select('*')
    .in('mandato_id', mandatoIds)
    .eq('tipo', 'Teaser')
    .eq('status', 'published');

  if (error) {
    console.error('[TeaserWorkflow] Error fetching published teasers:', error);
    return new Map();
  }

  const result = new Map<string, { es: DocumentWithVersion | null; en: DocumentWithVersion | null }>();

  mandatoIds.forEach(id => {
    result.set(id, { es: null, en: null });
  });

  (data || []).forEach(doc => {
    const mandatoEntry = result.get(doc.mandato_id);
    if (mandatoEntry) {
      if (doc.idioma === 'ES') {
        mandatoEntry.es = doc as DocumentWithVersion;
      } else if (doc.idioma === 'EN') {
        mandatoEntry.en = doc as DocumentWithVersion;
      }
    }
  });

  return result;
}
