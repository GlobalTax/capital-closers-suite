import { supabase } from "@/integrations/supabase/client";
import { DatabaseError } from "@/lib/error-handler";

export type CompanyDocumentCategory = 'nda' | 'mandate' | 'presentation' | 'info_request_excel' | 'general';

export interface CompanyDocument {
  id: string;
  empresa_id: string;
  documento_id: string;
  category: CompanyDocumentCategory;
  compartido_por: string | null;
  fecha_compartido: string;
  notas: string | null;
  documento: {
    id: string;
    file_name: string;
    file_size_bytes: number;
    mime_type: string;
    storage_path: string;
    tipo: string;
    created_at: string;
  } | null;
}

// Extensiones permitidas por categoría
export const ALLOWED_EXTENSIONS: Record<CompanyDocumentCategory, string[]> = {
  nda: ['.pdf', '.doc', '.docx'],
  mandate: ['.pdf', '.doc', '.docx'],
  presentation: ['.pdf', '.ppt', '.pptx'],
  info_request_excel: ['.xls', '.xlsx', '.csv'],
  general: ['.pdf', '.doc', '.docx', '.ppt', '.pptx', '.xls', '.xlsx', '.csv'],
};

// MIME types permitidos por extensión
export const MIME_TYPES: Record<string, string[]> = {
  '.pdf': ['application/pdf'],
  '.doc': ['application/msword'],
  '.docx': ['application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
  '.ppt': ['application/vnd.ms-powerpoint'],
  '.pptx': ['application/vnd.openxmlformats-officedocument.presentationml.presentation'],
  '.xls': ['application/vnd.ms-excel'],
  '.xlsx': ['application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'],
  '.csv': ['text/csv', 'application/csv', 'text/plain'],
};

export const CATEGORY_LABELS: Record<CompanyDocumentCategory, string> = {
  nda: 'NDA',
  mandate: 'Mandato',
  presentation: 'Presentación',
  info_request_excel: 'Solicitud de información (Excel)',
  general: 'General',
};

// Validar si un archivo es válido para una categoría
export function validateFileForCategory(
  file: File, 
  category: CompanyDocumentCategory
): { valid: boolean; error?: string } {
  const allowedExts = ALLOWED_EXTENSIONS[category];
  const ext = '.' + file.name.split('.').pop()?.toLowerCase();
  
  if (!allowedExts.includes(ext)) {
    return {
      valid: false,
      error: `Extensión no permitida para ${CATEGORY_LABELS[category]}. Permitidas: ${allowedExts.join(', ')}`,
    };
  }

  const allowedMimes = MIME_TYPES[ext] || [];
  if (allowedMimes.length > 0 && !allowedMimes.includes(file.type)) {
    // Ser más permisivo con MIME types (algunos navegadores reportan tipos genéricos)
    console.warn(`[companyDocuments] MIME type ${file.type} no esperado para ${ext}, pero permitiendo`);
  }

  // Límite de 50MB
  const MAX_SIZE = 50 * 1024 * 1024;
  if (file.size > MAX_SIZE) {
    return {
      valid: false,
      error: `El archivo excede el límite de 50MB`,
    };
  }

  return { valid: true };
}

// Obtener documentos de empresa por categoría
export async function getCompanyDocumentsByCategory(
  empresaId: string,
  category: CompanyDocumentCategory
): Promise<CompanyDocument[]> {
  const { data, error } = await supabase
    .from('empresa_documentos')
    .select(`
      *,
      documento:documentos(id, file_name, file_size_bytes, mime_type, storage_path, tipo, created_at)
    `)
    .eq('empresa_id', empresaId)
    .eq('category', category)
    .order('fecha_compartido', { ascending: false });

  if (error) {
    throw new DatabaseError('Error obteniendo documentos de empresa', {
      table: 'empresa_documentos',
      code: error.code,
    });
  }

  return (data || []) as CompanyDocument[];
}

// Subir documento a empresa con categoría
export async function uploadCompanyDocument(
  empresaId: string,
  file: File,
  category: CompanyDocumentCategory,
  notas?: string
): Promise<CompanyDocument> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Usuario no autenticado");

  // Validar archivo
  const validation = validateFileForCategory(file, category);
  if (!validation.valid) {
    throw new Error(validation.error);
  }

  // Generar ruta única
  const timestamp = Date.now();
  const uuid = crypto.randomUUID();
  const sanitizedFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
  const dateFolder = new Date().toISOString().split('T')[0];
  const storagePath = `${empresaId}/${category}/${dateFolder}/${uuid}-${sanitizedFileName}`;

  // Subir a storage
  const { data: uploadData, error: uploadError } = await supabase.storage
    .from('company-documents')
    .upload(storagePath, file, {
      cacheControl: '3600',
      upsert: false,
    });

  if (uploadError) {
    console.error('[companyDocuments] Upload error:', uploadError);
    throw new Error(`Error al subir archivo: ${uploadError.message}`);
  }

  // Crear registro en documentos
  const { data: docData, error: docError } = await supabase
    .from('documentos')
    .insert({
      file_name: file.name,
      file_size_bytes: file.size,
      mime_type: file.type,
      storage_path: uploadData.path,
      tipo: 'Otro',
      uploaded_by: user.id,
    })
    .select()
    .single();

  if (docError) {
    // Rollback: eliminar archivo de storage
    await supabase.storage.from('company-documents').remove([uploadData.path]);
    throw new DatabaseError('Error creando registro de documento', { code: docError.code });
  }

  // Vincular a empresa con categoría
  const { data: linkData, error: linkError } = await supabase
    .from('empresa_documentos')
    .insert({
      empresa_id: empresaId,
      documento_id: docData.id,
      category,
      compartido_por: user.id,
      notas,
    })
    .select(`
      *,
      documento:documentos(id, file_name, file_size_bytes, mime_type, storage_path, tipo, created_at)
    `)
    .single();

  if (linkError) {
    // Rollback: eliminar documento y archivo
    await supabase.from('documentos').delete().eq('id', docData.id);
    await supabase.storage.from('company-documents').remove([uploadData.path]);
    throw new DatabaseError('Error vinculando documento a empresa', { code: linkError.code });
  }

  return linkData as CompanyDocument;
}

// Eliminar documento de empresa
export async function deleteCompanyDocument(
  empresaDocumentoId: string,
  documentoId: string,
  storagePath: string
): Promise<void> {
  // Eliminar de storage
  const { error: storageError } = await supabase.storage
    .from('company-documents')
    .remove([storagePath]);

  if (storageError) {
    console.error('[companyDocuments] Storage delete error:', storageError);
    // Continuar igualmente para limpiar DB
  }

  // Eliminar vínculo
  const { error: linkError } = await supabase
    .from('empresa_documentos')
    .delete()
    .eq('id', empresaDocumentoId);

  if (linkError) {
    throw new DatabaseError('Error eliminando vínculo de documento', { code: linkError.code });
  }

  // Eliminar documento
  const { error: docError } = await supabase
    .from('documentos')
    .delete()
    .eq('id', documentoId);

  if (docError) {
    console.error('[companyDocuments] Doc delete error:', docError);
    // No fatal, el archivo ya está desvinculado
  }
}

// Descargar documento
export async function downloadCompanyDocument(storagePath: string, fileName: string): Promise<void> {
  try {
    // Obtener signed URL via edge function
    const { data, error } = await supabase.functions.invoke('download-document', {
      body: { filePath: storagePath, bucket: 'company-documents', expiresIn: 600 }
    });

    if (error || !data?.signedUrl) {
      // Fallback: download directo
      const { data: blobData, error: downloadError } = await supabase.storage
        .from('company-documents')
        .download(storagePath);

      if (downloadError) throw downloadError;

      const url = window.URL.createObjectURL(blobData);
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      return;
    }

    // Descargar via signed URL
    const response = await fetch(data.signedUrl);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  } catch (error) {
    console.error('[companyDocuments] Download error:', error);
    throw new Error('Error al descargar el archivo');
  }
}
