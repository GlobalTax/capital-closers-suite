import { supabase } from "@/integrations/supabase/client";
import type { BuyerType } from "@/types";

/**
 * Actualizar tipo de comprador de un target
 */
export async function updateBuyerType(
  mandatoEmpresaId: string,
  buyerType: BuyerType | null
): Promise<void> {
  const { error } = await supabase
    .from("mandato_empresas")
    .update({ buyer_type: buyerType })
    .eq("id", mandatoEmpresaId);

  if (error) throw error;
}

/**
 * Actualizar geografía de un target
 */
export async function updateGeografia(
  mandatoEmpresaId: string,
  geografia: string
): Promise<void> {
  const { error } = await supabase
    .from("mandato_empresas")
    .update({ geografia })
    .eq("id", mandatoEmpresaId);

  if (error) throw error;
}

/**
 * Añadir tag a un target
 */
export async function addTag(
  mandatoEmpresaId: string,
  tag: string
): Promise<string[]> {
  // Primero obtener tags actuales
  const { data, error: fetchError } = await supabase
    .from("mandato_empresas")
    .select("tags")
    .eq("id", mandatoEmpresaId)
    .single();

  if (fetchError) throw fetchError;

  const currentTags: string[] = data?.tags || [];
  const normalizedTag = tag.toLowerCase().trim();
  
  if (currentTags.includes(normalizedTag)) {
    return currentTags;
  }

  const newTags = [...currentTags, normalizedTag];

  const { error } = await supabase
    .from("mandato_empresas")
    .update({ tags: newTags })
    .eq("id", mandatoEmpresaId);

  if (error) throw error;
  return newTags;
}

/**
 * Eliminar tag de un target
 */
export async function removeTag(
  mandatoEmpresaId: string,
  tag: string
): Promise<string[]> {
  const { data, error: fetchError } = await supabase
    .from("mandato_empresas")
    .select("tags")
    .eq("id", mandatoEmpresaId)
    .single();

  if (fetchError) throw fetchError;

  const currentTags: string[] = data?.tags || [];
  const newTags = currentTags.filter(t => t !== tag.toLowerCase().trim());

  const { error } = await supabase
    .from("mandato_empresas")
    .update({ tags: newTags })
    .eq("id", mandatoEmpresaId);

  if (error) throw error;
  return newTags;
}

/**
 * Marcar/desmarcar target como "No contactar"
 */
export async function setNoContactar(
  mandatoEmpresaId: string,
  noContactar: boolean,
  motivo?: string
): Promise<void> {
  const { error } = await supabase
    .from("mandato_empresas")
    .update({ 
      no_contactar: noContactar,
      no_contactar_motivo: noContactar ? motivo : null
    })
    .eq("id", mandatoEmpresaId);

  if (error) throw error;
}

/**
 * Marcar/desmarcar target con conflicto
 */
export async function setConflicto(
  mandatoEmpresaId: string,
  tieneConflicto: boolean,
  descripcion?: string
): Promise<void> {
  const { error } = await supabase
    .from("mandato_empresas")
    .update({ 
      tiene_conflicto: tieneConflicto,
      conflicto_descripcion: tieneConflicto ? descripcion : null
    })
    .eq("id", mandatoEmpresaId);

  if (error) throw error;
}

/**
 * Actualizar notas internas de un target
 */
export async function updateNotasInternas(
  mandatoEmpresaId: string,
  notas: string
): Promise<void> {
  const { error } = await supabase
    .from("mandato_empresas")
    .update({ notas_internas: notas })
    .eq("id", mandatoEmpresaId);

  if (error) throw error;
}

/**
 * Obtener todos los tags únicos usados en un mandato
 */
export async function getDistinctTags(mandatoId: string): Promise<string[]> {
  const { data, error } = await supabase
    .from("mandato_empresas")
    .select("tags")
    .eq("mandato_id", mandatoId)
    .eq("rol", "target");

  if (error) throw error;

  const allTags = new Set<string>();
  data?.forEach(row => {
    (row.tags || []).forEach(tag => allTags.add(tag));
  });

  return Array.from(allTags).sort();
}

/**
 * Actualización masiva de tipo de comprador
 */
export async function bulkUpdateBuyerType(
  targetIds: string[],
  buyerType: BuyerType
): Promise<void> {
  const { error } = await supabase
    .from("mandato_empresas")
    .update({ buyer_type: buyerType })
    .in("id", targetIds);

  if (error) throw error;
}

/**
 * Añadir tag a múltiples targets
 */
export async function bulkAddTag(
  targetIds: string[],
  tag: string
): Promise<void> {
  // Obtener tags actuales de todos los targets
  const { data, error: fetchError } = await supabase
    .from("mandato_empresas")
    .select("id, tags")
    .in("id", targetIds);

  if (fetchError) throw fetchError;

  const normalizedTag = tag.toLowerCase().trim();
  
  // Actualizar cada target
  const updates = data?.map(async (row) => {
    const currentTags: string[] = row.tags || [];
    if (!currentTags.includes(normalizedTag)) {
      return supabase
        .from("mandato_empresas")
        .update({ tags: [...currentTags, normalizedTag] })
        .eq("id", row.id);
    }
    return null;
  }).filter(Boolean);

  if (updates) {
    await Promise.all(updates);
  }
}
