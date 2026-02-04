import { supabase } from "@/integrations/supabase/client";
import { DatabaseError } from "@/lib/error-handler";
import type { DocumentTemplate, ModeloCategory } from "@/types/documents";

// Constantes de validación
const ALLOWED_EXTENSIONS = ['.doc', '.docx'];
const ALLOWED_MIME_TYPES = [
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
];
const MAX_SIZE_BYTES = 50 * 1024 * 1024; // 50MB

// Bucket de storage
const STORAGE_BUCKET = 'document-templates';

// Validar archivo Word
export function validateWordFile(file: File): { valid: boolean; error?: string } {
  const extension = '.' + file.name.split('.').pop()?.toLowerCase();
  
  if (!ALLOWED_EXTENSIONS.includes(extension)) {
    return { valid: false, error: `Solo se permiten archivos ${ALLOWED_EXTENSIONS.join(', ')}` };
  }
  
  if (!ALLOWED_MIME_TYPES.includes(file.type)) {
    return { valid: false, error: 'Tipo de archivo no válido. Solo documentos Word.' };
  }
  
  if (file.size > MAX_SIZE_BYTES) {
    return { valid: false, error: 'El archivo supera el límite de 50MB' };
  }
  
  return { valid: true };
}

// Obtener modelos por categoría
export async function getModelosByCategory(category: ModeloCategory): Promise<DocumentTemplate[]> {
  const { data, error } = await supabase
    .from('document_templates')
    .select('*')
    .eq('category', category)
    .eq('is_active', true)
    .order('created_at', { ascending: false });

  if (error) {
    throw new DatabaseError('Error obteniendo modelos', { code: error.code });
  }

  return (data || []) as DocumentTemplate[];
}

// Subir nuevo modelo
export async function uploadModelo(
  file: File, 
  title: string, 
  category: ModeloCategory
): Promise<DocumentTemplate> {
  // Validar título
  if (!title.trim()) {
    throw new Error('El título es obligatorio');
  }

  // Validar archivo
  const validation = validateWordFile(file);
  if (!validation.valid) {
    throw new Error(validation.error);
  }

  // Generar ruta única en storage
  const fileId = crypto.randomUUID();
  const storagePath = `modelos/${category}/${fileId}-${file.name}`;

  // Subir archivo a storage
  const { error: uploadError } = await supabase.storage
    .from(STORAGE_BUCKET)
    .upload(storagePath, file, {
      cacheControl: '3600',
      upsert: false,
    });

  if (uploadError) {
    throw new DatabaseError('Error subiendo archivo', { code: uploadError.message });
  }

  // Insertar registro en DB
  const { data, error: insertError } = await supabase
    .from('document_templates')
    .insert({
      name: title.trim(),
      category,
      template_url: storagePath,
      file_name: file.name,
      file_size_bytes: file.size,
      mime_type: file.type,
      is_active: true,
    })
    .select()
    .single();

  if (insertError) {
    // Rollback: eliminar archivo subido
    await supabase.storage.from(STORAGE_BUCKET).remove([storagePath]);
    throw new DatabaseError('Error guardando modelo', { code: insertError.code });
  }

  return data as DocumentTemplate;
}

// Eliminar modelo (soft delete)
export async function deleteModelo(id: string): Promise<void> {
  const { error } = await supabase
    .from('document_templates')
    .update({ is_active: false })
    .eq('id', id);

  if (error) {
    throw new DatabaseError('Error eliminando modelo', { code: error.code });
  }
}

// Descargar modelo usando patrón download-to-blob
export async function downloadModelo(storagePath: string, fileName: string): Promise<void> {
  const { data, error } = await supabase.storage
    .from(STORAGE_BUCKET)
    .download(storagePath);

  if (error) {
    throw new DatabaseError('Error descargando archivo', { code: error.message });
  }

  // Crear blob URL y descargar
  const blobUrl = URL.createObjectURL(data);
  const link = document.createElement('a');
  link.href = blobUrl;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  // Cleanup
  setTimeout(() => URL.revokeObjectURL(blobUrl), 100);
}

// Constantes exportadas
export { ALLOWED_EXTENSIONS, MAX_SIZE_BYTES };
