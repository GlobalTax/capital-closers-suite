import { supabase } from "@/integrations/supabase/client";
import { documentAccessLogService } from "./documentAccessLog.service";

import type { DocumentoTipo } from "@/types";

export interface UploadProgress {
  fileName: string;
  progress: number;
  status: 'uploading' | 'success' | 'error';
  error?: string;
}

export const uploadFile = async (
  file: File,
  tipo: DocumentoTipo,
  descripcion?: string,
  onProgress?: (progress: number) => void
) => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Usuario no autenticado");

    // Generate unique file path with sanitized filename
    const timestamp = Date.now();
    const sanitizedFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
    const storagePath = `${user.id}/uploads/${timestamp}_${sanitizedFileName}`;

    // Upload to storage with progress tracking
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('mandato-documentos')
      .upload(storagePath, file, {
        cacheControl: '3600',
        upsert: false,
      });

    if (uploadError) throw uploadError;

    // Create database record
    const { data: docData, error: docError } = await supabase
      .from('documentos')
      .insert({
        file_name: file.name,
        file_size_bytes: file.size,
        mime_type: file.type,
        storage_path: uploadData.path,
        tipo,
        descripcion,
        uploaded_by: user.id,
      })
      .select()
      .single();

    if (docError) throw docError;

    onProgress?.(100);
    return docData;
  } catch (error) {
    console.error("Error uploading file:", error);
    throw error;
  }
};

/**
 * Obtiene signed URL via Edge Function con Service Role (bypasea RLS).
 * @param storagePath - Ruta del archivo en storage
 * @param bucket - Bucket de storage (default: mandato-documentos)
 * @param expiresIn - Tiempo de expiración en segundos
 */
const getSignedUrlViaEdge = async (
  storagePath: string, 
  bucket = 'mandato-documentos',
  expiresIn = 600
): Promise<string | null> => {
  try {
    const { data, error } = await supabase.functions.invoke('download-document', {
      body: { filePath: storagePath, bucket, expiresIn }
    });
    
    if (error) {
      console.error('[uploads] Edge function error:', error);
      throw error;
    }
    
    return data?.signedUrl || null;
  } catch (error) {
    console.error('[uploads] Error getting signed URL via edge:', error);
    return null;
  }
};

/**
 * Obtiene URL firmada para documentos usando Edge Function (bypasea RLS).
 * @param storagePath - Ruta del archivo en storage
 * @param expiresIn - Tiempo de expiración en segundos
 */
export const getSignedUrl = async (storagePath: string, expiresIn = 600): Promise<string | null> => {
  return getSignedUrlViaEdge(storagePath, 'mandato-documentos', expiresIn);
};

/**
 * Descarga blob usando signed URL de Edge Function (bypasea RLS).
 */
export const downloadBlob = async (storagePath: string, bucket = 'mandato-documentos'): Promise<Blob | null> => {
  try {
    const signedUrl = await getSignedUrlViaEdge(storagePath, bucket);
    if (!signedUrl) throw new Error('No se pudo obtener URL firmada');
    
    const response = await fetch(signedUrl);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    
    return await response.blob();
  } catch (error) {
    console.error("Error downloading blob:", error);
    return null;
  }
};

export const deleteFile = async (documentId: string, storagePath: string) => {
  try {
    // Delete from storage
    const { error: storageError } = await supabase.storage
      .from('mandato-documentos')
      .remove([storagePath]);

    if (storageError) throw storageError;

    // Delete from database
    const { error: dbError } = await supabase
      .from('documentos')
      .delete()
      .eq('id', documentId);

    if (dbError) throw dbError;

    return true;
  } catch (error) {
    console.error("Error deleting file:", error);
    throw error;
  }
};

export const listUserFiles = async () => {
  try {
    const { data, error } = await supabase
      .from('documentos')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return (data || []) as any[];
  } catch (error) {
    console.error("Error listing files:", error);
    return [];
  }
};

export const downloadFile = async (
  storagePath: string, 
  fileName: string,
  documentId?: string
) => {
  try {
    // Usar download directo para evitar problemas de RLS con signed URLs
    const blob = await downloadBlob(storagePath);
    if (!blob) throw new Error("No se pudo descargar el archivo");

    // Registrar acceso de forma asíncrona
    if (documentId) {
      documentAccessLogService.logAccess(documentId, fileName, 'download').catch(console.error);
    }
    
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  } catch (error) {
    console.error("Error downloading file:", error);
    throw error;
  }
};

// Obtener URL de objeto local para preview (evita signed URLs)
export const getPreviewBlobUrl = async (storagePath: string): Promise<string | null> => {
  try {
    const blob = await downloadBlob(storagePath);
    if (!blob) return null;
    return window.URL.createObjectURL(blob);
  } catch (error) {
    console.error("Error getting preview blob URL:", error);
    return null;
  }
};
