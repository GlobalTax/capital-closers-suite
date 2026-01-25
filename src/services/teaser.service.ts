import { supabase } from "@/integrations/supabase/client";
import type { DocumentWithVersion, DocumentFolder, IdiomaTeaser } from "@/types/documents";

const TEASER_FOLDER_NAME = "Teaser";
const TEASER_FOLDER_TYPE = "teaser";

/**
 * Traduce errores de DB a mensajes user-friendly
 */
function translateDbError(error: any): string {
  const code = error?.code;
  const msg = error?.message?.toLowerCase() || '';
  
  if (code === '23514' || msg.includes('check constraint')) {
    return 'Tipo de documento no válido';
  }
  if (code === '23505' || msg.includes('unique') || msg.includes('duplicate')) {
    return 'Ya existe un teaser con ese idioma';
  }
  if (code === '42501' || msg.includes('policy') || msg.includes('permission') || msg.includes('row-level')) {
    return 'No tienes permisos para esta operación';
  }
  if (code === '23503' || msg.includes('foreign key')) {
    return 'Referencia inválida (mandato o carpeta no existe)';
  }
  return error?.message || 'Error guardando en base de datos';
}

export interface UpsertTeaserParams {
  mandatoId: string;
  folderId: string;
  fileName: string;
  fileSizeBytes: number;
  mimeType: string;
  storagePath: string;
  uploadedBy: string;
  idioma: IdiomaTeaser;
}

/**
 * Upsert teaser: si ya existe uno para ese idioma, lo reemplaza
 */
export async function upsertTeaser(params: UpsertTeaserParams): Promise<DocumentWithVersion> {
  console.log('[Teaser Upsert] Iniciando upsert:', params.idioma, params.fileName);
  
  // 1. Buscar teaser existente para este idioma
  const { data: existing, error: findError } = await supabase
    .from('documentos')
    .select('id, storage_path')
    .eq('folder_id', params.folderId)
    .eq('idioma', params.idioma)
    .eq('is_latest_version', true)
    .maybeSingle();

  if (findError) {
    console.error('[Teaser Upsert] Error buscando existente:', findError);
    throw new Error(translateDbError(findError));
  }

  let version = 1;

  if (existing) {
    console.log('[Teaser Upsert] Teaser existente encontrado:', existing.id);
    version = 2; // Será la versión 2+

    // 2. Marcar anterior como no-latest
    const { error: updateError } = await supabase
      .from('documentos')
      .update({ is_latest_version: false })
      .eq('id', existing.id);

    if (updateError) {
      console.error('[Teaser Upsert] Error marcando anterior:', updateError);
      throw new Error(translateDbError(updateError));
    }

    // 3. Eliminar archivo anterior del storage (best effort)
    try {
      await supabase.storage
        .from('mandato-documentos')
        .remove([existing.storage_path]);
      console.log('[Teaser Upsert] Archivo anterior eliminado del storage');
    } catch (storageErr) {
      console.warn('[Teaser Upsert] No se pudo eliminar archivo anterior:', storageErr);
    }
  }

  // 4. Insertar nuevo registro
  const { data: newDoc, error: insertError } = await supabase
    .from('documentos')
    .insert({
      mandato_id: params.mandatoId,
      folder_id: params.folderId,
      file_name: params.fileName,
      file_size_bytes: params.fileSizeBytes,
      mime_type: params.mimeType,
      storage_path: params.storagePath,
      tipo: 'Teaser',
      descripcion: `Teaser (${params.idioma === 'ES' ? 'Español' : 'Inglés'})`,
      uploaded_by: params.uploadedBy,
      idioma: params.idioma,
      version: version,
      parent_document_id: existing?.id || null,
      is_latest_version: true,
    })
    .select()
    .single();

  if (insertError) {
    console.error('[Teaser Upsert] Error insertando:', insertError);
    throw new Error(translateDbError(insertError));
  }

  console.log('[Teaser Upsert] Nuevo teaser creado:', newDoc.id);
  return newDoc as DocumentWithVersion;
}

/**
 * Obtener o crear la carpeta Teaser para un mandato
 * Con manejo robusto de errores y fallback a tipo 'custom' si 'teaser' falla
 */
export async function getOrCreateTeaserFolder(mandatoId: string): Promise<DocumentFolder> {
  console.log('[Teaser] Buscando/creando carpeta teaser para mandato:', mandatoId);
  
  // 1. Buscar carpeta existente por tipo 'teaser' O por nombre 'Teaser' (fallback)
  const { data: existing, error: findError } = await supabase
    .from('document_folders')
    .select('*')
    .eq('mandato_id', mandatoId)
    .or(`folder_type.eq.${TEASER_FOLDER_TYPE},name.eq.${TEASER_FOLDER_NAME}`)
    .limit(1)
    .maybeSingle();

  if (findError) {
    console.error('[Teaser] Error buscando carpeta:', findError);
    if (findError.code === '42501' || findError.message?.includes('policy')) {
      throw new Error('No tienes permisos para acceder a las carpetas. Contacta al administrador.');
    }
    throw new Error(`Error buscando carpeta teaser: ${findError.message}`);
  }

  if (existing) {
    console.log('[Teaser] Carpeta existente encontrada:', existing.id, 'tipo:', existing.folder_type);
    return existing as DocumentFolder;
  }

  // 2. Crear carpeta - intentar primero con tipo 'teaser'
  console.log('[Teaser] Creando nueva carpeta con folder_type:', TEASER_FOLDER_TYPE);
  
  const insertPayload = {
    mandato_id: mandatoId,
    name: TEASER_FOLDER_NAME,
    folder_type: TEASER_FOLDER_TYPE,
    orden: 0,
    is_data_room: false,
  };
  
  console.log('[Teaser] Payload de inserción:', JSON.stringify(insertPayload));
  
  const { data: newFolder, error: createError } = await supabase
    .from('document_folders')
    .insert(insertPayload)
    .select()
    .single();

  if (createError) {
    console.error('[Teaser] Error creando carpeta:', {
      code: createError.code,
      message: createError.message,
      details: createError.details,
      hint: createError.hint,
    });
    
    // Si es error de check constraint, intentar con tipo 'custom' como fallback
    if (createError.code === '23514' || createError.message?.includes('check constraint')) {
      console.warn('[Teaser] folder_type "teaser" no aceptado, intentando con "custom"...');
      
      const fallbackPayload = {
        ...insertPayload,
        folder_type: 'custom',
      };
      
      const { data: fallbackFolder, error: fallbackError } = await supabase
        .from('document_folders')
        .insert(fallbackPayload)
        .select()
        .single();
        
      if (fallbackError) {
        console.error('[Teaser] Error en fallback:', fallbackError);
        throw new Error(`Error creando carpeta Teaser: ${translateDbError(fallbackError)}`);
      }
      
      console.log('[Teaser] Carpeta creada con fallback (custom):', fallbackFolder.id);
      return fallbackFolder as DocumentFolder;
    }
    
    // Mensaje específico para error de RLS
    if (createError.code === '42501' || createError.message?.includes('policy') || createError.message?.includes('row-level')) {
      throw new Error('No tienes permisos para crear carpetas. Contacta al administrador.');
    }
    
    throw new Error(`Error creando carpeta Teaser: ${translateDbError(createError)}`);
  }

  console.log('[Teaser] Carpeta creada exitosamente:', newFolder.id, 'tipo:', newFolder.folder_type);
  return newFolder as DocumentFolder;
}

/**
 * Obtener teaser por idioma específico
 */
export async function getTeaserByIdioma(
  mandatoId: string, 
  idioma: IdiomaTeaser
): Promise<DocumentWithVersion | null> {
  // Buscar carpeta teaser por tipo O nombre (fallback para carpetas creadas como 'custom')
  const { data: folder } = await supabase
    .from('document_folders')
    .select('id')
    .eq('mandato_id', mandatoId)
    .or(`folder_type.eq.${TEASER_FOLDER_TYPE},name.eq.${TEASER_FOLDER_NAME}`)
    .limit(1)
    .maybeSingle();

  if (!folder) {
    return null;
  }

  // Buscar documento por idioma con maybeSingle
  const { data: doc } = await supabase
    .from('documentos')
    .select('*')
    .eq('folder_id', folder.id)
    .eq('idioma', idioma)
    .eq('is_latest_version', true)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  return doc as DocumentWithVersion || null;
}

/**
 * Obtener ambos teasers (ES y EN) de un mandato
 */
export async function getTeasersForMandatoByLanguage(mandatoId: string): Promise<{
  es: DocumentWithVersion | null;
  en: DocumentWithVersion | null;
}> {
  const [es, en] = await Promise.all([
    getTeaserByIdioma(mandatoId, 'ES'),
    getTeaserByIdioma(mandatoId, 'EN'),
  ]);
  return { es, en };
}

/**
 * Obtener el teaser principal de un mandato (documento más reciente en carpeta Teaser)
 * @deprecated Usar getTeasersForMandatoByLanguage para soporte ES/EN
 */
export async function getTeaserForMandato(mandatoId: string): Promise<DocumentWithVersion | null> {
  // Buscar carpeta teaser por tipo O nombre (fallback para carpetas creadas como 'custom')
  const { data: folder } = await supabase
    .from('document_folders')
    .select('id')
    .eq('mandato_id', mandatoId)
    .or(`folder_type.eq.${TEASER_FOLDER_TYPE},name.eq.${TEASER_FOLDER_NAME}`)
    .limit(1)
    .maybeSingle();

  if (!folder) {
    return null;
  }

  // Buscar documento más reciente con maybeSingle
  const { data: doc } = await supabase
    .from('documentos')
    .select('*')
    .eq('folder_id', folder.id)
    .eq('is_latest_version', true)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  return doc as DocumentWithVersion || null;
}

/**
 * Obtener teasers de múltiples mandatos
 */
export async function getTeasersForMandatos(mandatoIds: string[]): Promise<Map<string, DocumentWithVersion | null>> {
  const result = new Map<string, DocumentWithVersion | null>();
  
  if (mandatoIds.length === 0) {
    return result;
  }

  // Obtener todas las carpetas teaser de los mandatos (por tipo O nombre para soportar fallback)
  const { data: folders } = await supabase
    .from('document_folders')
    .select('id, mandato_id')
    .in('mandato_id', mandatoIds)
    .or(`folder_type.eq.${TEASER_FOLDER_TYPE},name.eq.${TEASER_FOLDER_NAME}`);

  if (!folders || folders.length === 0) {
    mandatoIds.forEach(id => result.set(id, null));
    return result;
  }

  const folderIds = folders.map(f => f.id);
  const folderToMandato = new Map(folders.map(f => [f.id, f.mandato_id]));

  // Obtener documentos de todas las carpetas
  const { data: docs } = await supabase
    .from('documentos')
    .select('*')
    .in('folder_id', folderIds)
    .eq('is_latest_version', true)
    .order('created_at', { ascending: false });

  // Mapear por mandato (tomar el más reciente por carpeta)
  const mandatoToDoc = new Map<string, DocumentWithVersion>();
  
  if (docs) {
    docs.forEach(doc => {
      const mandatoId = folderToMandato.get(doc.folder_id);
      if (mandatoId && !mandatoToDoc.has(mandatoId)) {
        mandatoToDoc.set(mandatoId, doc as DocumentWithVersion);
      }
    });
  }

  mandatoIds.forEach(id => {
    result.set(id, mandatoToDoc.get(id) || null);
  });

  return result;
}

/**
 * Genera URL firmada para un teaser usando Edge Function (bypasea RLS).
 */
export async function getSignedUrlForTeaser(storagePath: string, expiresIn: number = 600): Promise<string | null> {
  try {
    const { data, error } = await supabase.functions.invoke('download-document', {
      body: { filePath: storagePath, bucket: 'mandato-documentos', expiresIn }
    });

    if (error || !data?.signedUrl) {
      console.error('[Teaser] Error getting signed URL via edge:', error);
      return null;
    }

    return data.signedUrl;
  } catch (error) {
    console.error('[Teaser] Error getting teaser URL:', error);
    return null;
  }
}

export interface TeaserInfo {
  mandatoId: string;
  mandatoNombre: string;
  teaser: DocumentWithVersion | null;
}

/**
 * Obtener información de teasers para envío masivo
 */
export async function prepareTeasersForSending(
  mandatoIds: string[], 
  mandatosMap: Map<string, string>
): Promise<{ withTeaser: TeaserInfo[]; withoutTeaser: TeaserInfo[] }> {
  const teasers = await getTeasersForMandatos(mandatoIds);
  
  const withTeaser: TeaserInfo[] = [];
  const withoutTeaser: TeaserInfo[] = [];

  mandatoIds.forEach(id => {
    const teaser = teasers.get(id) || null;
    const info: TeaserInfo = {
      mandatoId: id,
      mandatoNombre: mandatosMap.get(id) || 'Sin nombre',
      teaser,
    };

    if (teaser) {
      withTeaser.push(info);
    } else {
      withoutTeaser.push(info);
    }
  });

  return { withTeaser, withoutTeaser };
}
