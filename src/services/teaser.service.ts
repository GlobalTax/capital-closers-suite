import { supabase } from "@/integrations/supabase/client";
import type { DocumentWithVersion, DocumentFolder, IdiomaTeaser } from "@/types/documents";

const TEASER_FOLDER_NAME = "Teaser";
const TEASER_FOLDER_TYPE = "teaser";

/**
 * Obtener o crear la carpeta Teaser para un mandato
 */
export async function getOrCreateTeaserFolder(mandatoId: string): Promise<DocumentFolder> {
  console.log('[Teaser] Buscando/creando carpeta teaser para mandato:', mandatoId);
  
  // Buscar carpeta existente con maybeSingle - no lanza error si no existe
  const { data: existing, error: findError } = await supabase
    .from('document_folders')
    .select('*')
    .eq('mandato_id', mandatoId)
    .eq('folder_type', TEASER_FOLDER_TYPE)
    .maybeSingle();

  if (findError) {
    console.error('[Teaser] Error buscando carpeta:', findError);
    // Detectar errores de RLS
    if (findError.code === '42501' || findError.message?.includes('policy')) {
      throw new Error('No tienes permisos para acceder a las carpetas. Contacta al administrador.');
    }
    throw new Error(`Error buscando carpeta teaser: ${findError.message}`);
  }

  if (existing) {
    console.log('[Teaser] Carpeta existente encontrada:', existing.id);
    return existing as DocumentFolder;
  }

  // Crear carpeta si no existe
  console.log('[Teaser] Creando nueva carpeta teaser...');
  const { data: newFolder, error: createError } = await supabase
    .from('document_folders')
    .insert({
      mandato_id: mandatoId,
      name: TEASER_FOLDER_NAME,
      folder_type: TEASER_FOLDER_TYPE,
      orden: 0,
      is_data_room: false,
    })
    .select()
    .single();

  if (createError) {
    console.error('[Teaser] Error creando carpeta:', createError);
    // Mensaje específico para error de RLS
    if (createError.code === '42501' || createError.message?.includes('policy') || createError.message?.includes('row-level')) {
      throw new Error('No tienes permisos para crear carpetas. Contacta al administrador.');
    }
    throw new Error(`Error creando carpeta Teaser: ${createError.message}`);
  }

  console.log('[Teaser] Carpeta creada exitosamente:', newFolder.id);
  return newFolder as DocumentFolder;
}

/**
 * Obtener teaser por idioma específico
 */
export async function getTeaserByIdioma(
  mandatoId: string, 
  idioma: IdiomaTeaser
): Promise<DocumentWithVersion | null> {
  // Buscar carpeta teaser con maybeSingle
  const { data: folder } = await supabase
    .from('document_folders')
    .select('id')
    .eq('mandato_id', mandatoId)
    .eq('folder_type', TEASER_FOLDER_TYPE)
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
  // Buscar carpeta teaser con maybeSingle
  const { data: folder } = await supabase
    .from('document_folders')
    .select('id')
    .eq('mandato_id', mandatoId)
    .eq('folder_type', TEASER_FOLDER_TYPE)
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

  // Obtener todas las carpetas teaser de los mandatos
  const { data: folders } = await supabase
    .from('document_folders')
    .select('id, mandato_id')
    .in('mandato_id', mandatoIds)
    .eq('folder_type', TEASER_FOLDER_TYPE);

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
 * Generar URL firmada para un documento
 */
export async function getSignedUrlForTeaser(storagePath: string, expiresIn: number = 600): Promise<string | null> {
  const { data, error } = await supabase.storage
    .from('mandato-documentos')
    .createSignedUrl(storagePath, expiresIn);

  if (error || !data) {
    console.error('[Teaser] Error generating signed URL:', error);
    return null;
  }

  return data.signedUrl;
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
