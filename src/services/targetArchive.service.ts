import { supabase } from "@/integrations/supabase/client";

/**
 * Archivar un target (excluirlo de KPIs activos)
 */
export async function archiveTarget(mandatoEmpresaId: string): Promise<void> {
  const { data: user } = await supabase.auth.getUser();
  
  const { error } = await supabase
    .from("mandato_empresas")
    .update({ 
      is_archived: true,
      archived_at: new Date().toISOString(),
      archived_by: user?.user?.id
    })
    .eq("id", mandatoEmpresaId);

  if (error) throw error;
}

/**
 * Archivar múltiples targets a la vez
 */
export async function archiveTargetsBulk(mandatoEmpresaIds: string[]): Promise<void> {
  if (mandatoEmpresaIds.length === 0) return;
  
  const { data: user } = await supabase.auth.getUser();
  
  const { error } = await supabase
    .from("mandato_empresas")
    .update({ 
      is_archived: true,
      archived_at: new Date().toISOString(),
      archived_by: user?.user?.id
    })
    .in("id", mandatoEmpresaIds);

  if (error) throw error;
}

/**
 * Restaurar un target archivado
 */
export async function unarchiveTarget(mandatoEmpresaId: string): Promise<void> {
  const { error } = await supabase
    .from("mandato_empresas")
    .update({ 
      is_archived: false,
      archived_at: null,
      archived_by: null
    })
    .eq("id", mandatoEmpresaId);

  if (error) throw error;
}

/**
 * Desvincular un target del mandato (elimina la relación permanentemente).
 * Las tablas hijas (scoring, ofertas) se eliminan por CASCADE.
 */
export async function unlinkTarget(mandatoEmpresaId: string): Promise<void> {
  const { error } = await supabase
    .from("mandato_empresas")
    .delete()
    .eq("id", mandatoEmpresaId);

  if (error) throw error;
}
