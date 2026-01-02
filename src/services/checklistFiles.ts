import { supabase } from "@/integrations/supabase/client";
import type { MandatoChecklistTaskFile } from "@/types";
import { generateUniqueFileName, getCategoryFromMimeType } from "@/lib/file-utils";

/**
 * Obtiene todos los archivos asociados a una tarea del checklist
 */
export async function fetchTaskFiles(taskId: string): Promise<MandatoChecklistTaskFile[]> {
  const { data, error } = await supabase
    .from('mandato_checklist_task_files')
    .select('*')
    .eq('task_id', taskId)
    .order('created_at', { ascending: false });
  
  if (error) throw error;
  return (data || []) as MandatoChecklistTaskFile[];
}

/**
 * Sube un archivo a Supabase Storage y crea el registro en la BD
 */
export async function uploadTaskFile(
  taskId: string,
  file: File,
  description?: string,
  userId?: string
): Promise<MandatoChecklistTaskFile> {
  // Generar nombre único para el archivo con path estandarizado
  const timestamp = Date.now();
  const sanitizedFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
  const filePath = `checklist-tasks/${taskId}/${timestamp}_${sanitizedFileName}`;
  
  // Subir archivo a Storage
  const { error: uploadError } = await supabase.storage
    .from('mandato-documentos')
    .upload(filePath, file, {
      cacheControl: '3600',
      upsert: false
    });
  
  if (uploadError) throw uploadError;
  
  // Crear registro en la base de datos
  const fileCategory = getCategoryFromMimeType(file.type);
  
  // Nota: No usamos generateUniqueFileName ya que el path ya es único con timestamp
  const { data, error } = await supabase
    .from('mandato_checklist_task_files')
    .insert({
      task_id: taskId,
      file_name: file.name,
      file_path: filePath,
      file_size_bytes: file.size,
      mime_type: file.type,
      uploaded_by: userId,
      description: description || null,
      file_category: fileCategory
    })
    .select()
    .single();
  
  if (error) {
    // Si falla la BD, eliminar archivo de Storage
    await supabase.storage.from('mandato-documentos').remove([filePath]);
    throw error;
  }
  
  return data as MandatoChecklistTaskFile;
}

/**
 * Genera una URL firmada temporal para descargar un archivo
 */
export async function downloadTaskFile(filePath: string): Promise<string> {
  const { data, error } = await supabase.storage
    .from('mandato-documentos')
    .createSignedUrl(filePath, 600); // URL válida por 10 minutos
  
  if (error) throw error;
  if (!data?.signedUrl) throw new Error('No se pudo generar la URL de descarga');
  
  return data.signedUrl;
}

/**
 * Elimina un archivo de Storage y de la base de datos
 */
export async function deleteTaskFile(fileId: string, filePath: string): Promise<void> {
  // Eliminar de Storage
  const { error: storageError } = await supabase.storage
    .from('mandato-documentos')
    .remove([filePath]);
  
  if (storageError) throw storageError;
  
  // Eliminar registro de BD
  const { error: dbError } = await supabase
    .from('mandato_checklist_task_files')
    .delete()
    .eq('id', fileId);
  
  if (dbError) throw dbError;
}
