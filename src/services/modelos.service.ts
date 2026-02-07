import { supabase } from "@/integrations/supabase/client";
import { DatabaseError } from "@/lib/error-handler";
import type { DocumentTemplate, ModeloCategory } from "@/types/documents";

// Extensiones permitidas
const ALLOWED_EXTENSIONS = ['.doc', '.docx', '.pdf', '.ppt', '.pptx', '.xls', '.xlsx', '.csv'];

// Mapa de extensión → MIME type (para contentType en upload)
const EXTENSION_MIME_MAP: Record<string, string> = {
  '.doc': 'application/msword',
  '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  '.pdf': 'application/pdf',
  '.ppt': 'application/vnd.ms-powerpoint',
  '.pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  '.xls': 'application/vnd.ms-excel',
  '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  '.csv': 'text/csv',
};

const MAX_SIZE_BYTES = 50 * 1024 * 1024; // 50MB
const STORAGE_BUCKET = 'document-templates';

/** Get file extension (lowercase, with dot) */
function getFileExtension(filename: string): string {
  const parts = filename.split('.');
  return parts.length > 1 ? '.' + parts.pop()!.toLowerCase() : '';
}

/** Sanitize filename for storage path */
function sanitizeFilename(filename: string): string {
  return filename
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // remove accents
    .replace(/[^a-zA-Z0-9._-]/g, '_') // replace special chars
    .replace(/_+/g, '_'); // collapse multiple underscores
}

/** Get MIME type from extension */
function getMimeForExtension(ext: string): string {
  return EXTENSION_MIME_MAP[ext] || 'application/octet-stream';
}

/** Validate file for modelo upload — validates by extension only (not MIME) */
export function validateModeloFile(file: File): { valid: boolean; error?: string } {
  const ext = getFileExtension(file.name);

  if (!ext || !ALLOWED_EXTENSIONS.includes(ext)) {
    return {
      valid: false,
      error: `Formato no permitido. Formatos aceptados: ${ALLOWED_EXTENSIONS.join(', ')}`,
    };
  }

  if (file.size > MAX_SIZE_BYTES) {
    return { valid: false, error: 'El archivo supera el límite de 50 MB' };
  }

  if (file.size === 0) {
    return { valid: false, error: 'El archivo está vacío' };
  }

  return { valid: true };
}

/** @deprecated Use validateModeloFile instead */
export const validateWordFile = validateModeloFile;

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
  category: ModeloCategory,
): Promise<DocumentTemplate> {
  if (!title.trim()) {
    throw new Error('El título es obligatorio');
  }

  const validation = validateModeloFile(file);
  if (!validation.valid) {
    throw new Error(validation.error);
  }

  const ext = getFileExtension(file.name);
  const contentType = getMimeForExtension(ext);

  // Build unique storage path: modelos/{category}/{yyyy}/{mm}/{uuid}_{sanitized}
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const fileId = crypto.randomUUID();
  const safeName = sanitizeFilename(file.name);
  const storagePath = `modelos/${category}/${yyyy}/${mm}/${fileId}_${safeName}`;

  // Upload to storage with explicit contentType
  const { error: uploadError } = await supabase.storage
    .from(STORAGE_BUCKET)
    .upload(storagePath, file, {
      cacheControl: '3600',
      upsert: false,
      contentType,
    });

  if (uploadError) {
    console.error('[modelos] Upload error:', uploadError);
    throw new DatabaseError('Error subiendo archivo', { code: uploadError.message });
  }

  // Insert DB record
  const { data, error: insertError } = await supabase
    .from('document_templates')
    .insert({
      name: title.trim(),
      category,
      template_url: storagePath,
      file_name: file.name,
      file_size_bytes: file.size,
      mime_type: contentType,
      is_active: true,
    })
    .select()
    .single();

  if (insertError) {
    // Rollback: remove uploaded file
    await supabase.storage.from(STORAGE_BUCKET).remove([storagePath]);
    console.error('[modelos] Insert error:', insertError);
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

  const blobUrl = URL.createObjectURL(data);
  const link = document.createElement('a');
  link.href = blobUrl;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  setTimeout(() => URL.revokeObjectURL(blobUrl), 100);
}

export { ALLOWED_EXTENSIONS, MAX_SIZE_BYTES };
