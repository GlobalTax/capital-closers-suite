import { supabase } from "@/integrations/supabase/client";
import { DatabaseError } from "@/lib/error-handler";
import type { DocumentFolder, DocumentWithVersion } from "@/types/documents";

// Obtener carpetas de un mandato
export async function getFoldersByMandato(mandatoId: string): Promise<DocumentFolder[]> {
  const { data, error } = await supabase
    .from('document_folders')
    .select('*')
    .eq('mandato_id', mandatoId)
    .order('orden', { ascending: true });

  if (error) {
    throw new DatabaseError('Error obteniendo carpetas', { code: error.code });
  }

  return (data || []) as DocumentFolder[];
}

// Obtener documentos de un mandato con info de versiones
export async function getDocumentsByMandatoWithVersions(mandatoId: string): Promise<DocumentWithVersion[]> {
  const { data, error } = await supabase
    .from('documentos')
    .select(`
      *,
      folder:document_folders(name, folder_type, is_data_room)
    `)
    .eq('mandato_id', mandatoId)
    .eq('is_latest_version', true)
    .order('created_at', { ascending: false });

  if (error) {
    throw new DatabaseError('Error obteniendo documentos', { code: error.code });
  }

  return (data || []).map((doc: any) => ({
    ...doc,
    folder_name: doc.folder?.name,
    folder_type: doc.folder?.folder_type,
    is_data_room: doc.folder?.is_data_room,
  })) as DocumentWithVersion[];
}

// Obtener historial de versiones de un documento
export async function getDocumentVersionHistory(documentId: string): Promise<DocumentWithVersion[]> {
  // Primero obtener el documento padre original
  const { data: doc, error: docError } = await supabase
    .from('documentos')
    .select('id, parent_document_id')
    .eq('id', documentId)
    .single();

  if (docError) {
    throw new DatabaseError('Error obteniendo documento', { code: docError.code });
  }

  // Determinar el ID raíz
  const rootId = doc.parent_document_id || doc.id;

  // Obtener todas las versiones
  const { data, error } = await supabase
    .from('documentos')
    .select('*')
    .or(`id.eq.${rootId},parent_document_id.eq.${rootId}`)
    .order('version', { ascending: false });

  if (error) {
    throw new DatabaseError('Error obteniendo versiones', { code: error.code });
  }

  return (data || []) as DocumentWithVersion[];
}

// Crear carpeta
export async function createFolder(
  mandatoId: string, 
  name: string, 
  parentId?: string,
  folderType: string = 'custom'
): Promise<DocumentFolder> {
  // Obtener el orden máximo actual
  const { data: maxOrden } = await supabase
    .from('document_folders')
    .select('orden')
    .eq('mandato_id', mandatoId)
    .eq('parent_id', parentId || null)
    .order('orden', { ascending: false })
    .limit(1);

  const orden = maxOrden && maxOrden.length > 0 ? (maxOrden[0] as any).orden + 1 : 1;

  const { data, error } = await supabase
    .from('document_folders')
    .insert({
      mandato_id: mandatoId,
      name,
      parent_id: parentId || null,
      folder_type: folderType,
      orden,
    })
    .select()
    .single();

  if (error) {
    throw new DatabaseError('Error creando carpeta', { code: error.code });
  }

  return data as DocumentFolder;
}

// Renombrar carpeta
export async function renameFolder(folderId: string, newName: string): Promise<void> {
  const { error } = await supabase
    .from('document_folders')
    .update({ name: newName })
    .eq('id', folderId);

  if (error) {
    throw new DatabaseError('Error renombrando carpeta', { code: error.code });
  }
}

// Eliminar carpeta (solo si está vacía o es custom)
export async function deleteFolder(folderId: string): Promise<void> {
  // Verificar que no tenga documentos
  const { count: docCount } = await supabase
    .from('documentos')
    .select('id', { count: 'exact', head: true })
    .eq('folder_id', folderId);

  if (docCount && docCount > 0) {
    throw new Error('No se puede eliminar una carpeta con documentos');
  }

  // Verificar que no tenga subcarpetas
  const { count: subCount } = await supabase
    .from('document_folders')
    .select('id', { count: 'exact', head: true })
    .eq('parent_id', folderId);

  if (subCount && subCount > 0) {
    throw new Error('No se puede eliminar una carpeta con subcarpetas');
  }

  const { error } = await supabase
    .from('document_folders')
    .delete()
    .eq('id', folderId);

  if (error) {
    throw new DatabaseError('Error eliminando carpeta', { code: error.code });
  }
}

// Mover documento a carpeta
export async function moveDocumentToFolder(documentId: string, folderId: string | null): Promise<void> {
  const { error } = await supabase
    .from('documentos')
    .update({ folder_id: folderId })
    .eq('id', documentId);

  if (error) {
    throw new DatabaseError('Error moviendo documento', { code: error.code });
  }
}

// Subir documento a carpeta específica
export async function uploadDocumentToFolder(
  mandatoId: string,
  folderId: string | null,
  fileName: string,
  fileSizeBytes: number,
  mimeType: string,
  storagePath: string,
  tipo: string,
  descripcion?: string,
  uploadedBy?: string
): Promise<DocumentWithVersion> {
  const { data, error } = await supabase
    .from('documentos')
    .insert({
      mandato_id: mandatoId,
      folder_id: folderId,
      file_name: fileName,
      file_size_bytes: fileSizeBytes,
      mime_type: mimeType,
      storage_path: storagePath,
      tipo,
      descripcion,
      uploaded_by: uploadedBy,
      version: 1,
      is_latest_version: true,
    })
    .select()
    .single();

  if (error) {
    throw new DatabaseError('Error subiendo documento', { code: error.code });
  }

  return data as DocumentWithVersion;
}

// Crear nueva versión de documento
export async function createDocumentVersion(
  parentDocumentId: string,
  fileName: string,
  fileSizeBytes: number,
  mimeType: string,
  storagePath: string,
  uploadedBy?: string
): Promise<DocumentWithVersion> {
  // Usar la función RPC de la base de datos
  const { data, error } = await supabase.rpc('create_document_version', {
    p_parent_document_id: parentDocumentId,
    p_file_name: fileName,
    p_file_size_bytes: fileSizeBytes,
    p_mime_type: mimeType,
    p_storage_path: storagePath,
    p_uploaded_by: uploadedBy,
  });

  if (error) {
    throw new DatabaseError('Error creando versión', { code: error.code });
  }

  // Obtener el documento creado
  const { data: newDoc, error: fetchError } = await supabase
    .from('documentos')
    .select('*')
    .eq('id', data)
    .single();

  if (fetchError) {
    throw new DatabaseError('Error obteniendo nueva versión', { code: fetchError.code });
  }

  return newDoc as DocumentWithVersion;
}
