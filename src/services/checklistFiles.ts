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
  // Generar nombre único para el archivo
  const uniqueFileName = generateUniqueFileName(file.name);
  const filePath = `${taskId}/${uniqueFileName}`;
  
  // Subir archivo a Storage
  const { error: uploadError } = await supabase.storage
    .from('mandato-checklist-files')
    .upload(filePath, file, {
      cacheControl: '3600',
      upsert: false
    });
  
  if (uploadError) throw uploadError;
  
  // Crear registro en la base de datos
  const fileCategory = getCategoryFromMimeType(file.type);
  
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
    await supabase.storage.from('mandato-checklist-files').remove([filePath]);
    throw error;
  }
  
  return data as MandatoChecklistTaskFile;
}

/**
 * Genera una URL firmada temporal para descargar un archivo
 */
export async function downloadTaskFile(filePath: string): Promise<string> {
  const { data, error } = await supabase.storage
    .from('mandato-checklist-files')
    .createSignedUrl(filePath, 3600); // URL válida por 1 hora
  
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
    .from('mandato-checklist-files')
    .remove([filePath]);
  
  if (storageError) throw storageError;
  
  // Eliminar registro de BD
  const { error: dbError } = await supabase
    .from('mandato_checklist_task_files')
    .delete()
    .eq('id', fileId);
  
  if (dbError) throw dbError;
}

/**
 * Obtiene la URL pública del archivo (si el bucket fuera público)
 */
export function getFileUrl(filePath: string): string {
  const { data } = supabase.storage
    .from('mandato-checklist-files')
    .getPublicUrl(filePath);
  
  return data.publicUrl;
}
