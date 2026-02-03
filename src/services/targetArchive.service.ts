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
