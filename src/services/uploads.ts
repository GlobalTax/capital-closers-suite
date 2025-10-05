import { supabase } from "@/integrations/supabase/client";

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

    // Generate unique file path
    const timestamp = Date.now();
    const fileExt = file.name.split('.').pop();
    const fileName = `${timestamp}-${file.name}`;
    const storagePath = `${user.id}/${fileName}`;

    // Upload to storage with progress tracking
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('uploads')
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

export const getSignedUrl = async (storagePath: string, expiresIn = 600) => {
  try {
    const { data, error } = await supabase.storage
      .from('uploads')
      .createSignedUrl(storagePath, expiresIn);

    if (error) throw error;
    return data.signedUrl;
  } catch (error) {
    console.error("Error getting signed URL:", error);
    return null;
  }
};

export const deleteFile = async (documentId: string, storagePath: string) => {
  try {
    // Delete from storage
    const { error: storageError } = await supabase.storage
      .from('uploads')
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

export const downloadFile = async (storagePath: string, fileName: string) => {
  try {
    const signedUrl = await getSignedUrl(storagePath);
    if (!signedUrl) throw new Error("No se pudo generar URL de descarga");

    const response = await fetch(signedUrl);
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
    console.error("Error downloading file:", error);
    throw error;
  }
};
