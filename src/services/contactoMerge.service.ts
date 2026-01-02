import { supabase } from "@/integrations/supabase/client";
import { DatabaseError } from "@/lib/error-handler";
import { isValidUUID } from "@/lib/validation/regex";

export interface MergeResult {
  success: boolean;
  source_id: string;
  target_id: string;
  counts: {
    interacciones: number;
    mandatos: number;
    documentos: number;
    ai_imports: number;
  };
}

export async function mergeContactos(
  sourceId: string, 
  targetId: string, 
  userId: string
): Promise<MergeResult> {
  if (!isValidUUID(sourceId)) {
    throw new DatabaseError('ID de contacto origen inválido', { sourceId });
  }
  if (!isValidUUID(targetId)) {
    throw new DatabaseError('ID de contacto destino inválido', { targetId });
  }
  if (!isValidUUID(userId)) {
    throw new DatabaseError('ID de usuario inválido', { userId });
  }

  const { data, error } = await supabase
    .rpc('merge_contactos', {
      p_source_id: sourceId,
      p_target_id: targetId,
      p_user_id: userId
    });

  if (error) {
    throw new DatabaseError('Error al fusionar contactos', {
      supabaseError: error,
      table: 'contactos',
    });
  }

  return data as unknown as MergeResult;
}
