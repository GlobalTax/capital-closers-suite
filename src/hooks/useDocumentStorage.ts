import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { documentAccessLogService } from "@/services/documentAccessLog.service";

export type DocumentoTipo = "Contrato" | "NDA" | "Due Diligence" | "Financiero" | "Legal" | "Otro";

export interface MandatoDocumento {
  id: string;
  mandato_id: string;
  file_name: string;
  file_size_bytes: number;
  mime_type: string;
  storage_path: string;
  tipo: DocumentoTipo;
  descripcion?: string;
  uploaded_by?: string;
  created_at: string;
  updated_at: string;
}

interface UploadProgress {
  progress: number;
  status: "uploading" | "processing" | "complete" | "error";
  error?: string;
}

export function useDocumentStorage() {
  const [uploadProgress, setUploadProgress] = useState<Record<string, UploadProgress>>({});

  const generateStoragePath = (userId: string, mandatoId: string, fileName: string): string => {
    const timestamp = Date.now();
    const sanitizedFileName = fileName.replace(/[^a-zA-Z0-9.-]/g, "_");
    return `${userId}/mandatos/${mandatoId}/${timestamp}_${sanitizedFileName}`;
  };

  const uploadFile = async (
    file: File,
    mandatoId: string,
    tipo: DocumentoTipo,
    descripcion?: string
  ): Promise<MandatoDocumento | null> => {
    const fileId = `${file.name}-${Date.now()}`;
    
    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error("Usuario no autenticado");
      }

      setUploadProgress(prev => ({
        ...prev,
        [fileId]: { progress: 0, status: "uploading" }
      }));

      // Generate unique storage path
      const storagePath = generateStoragePath(user.id, mandatoId, file.name);

      // Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from("mandato-documentos")
        .upload(storagePath, file, {
          cacheControl: "3600",
          upsert: false
        });

      if (uploadError) {
        throw uploadError;
      }

      setUploadProgress(prev => ({
        ...prev,
        [fileId]: { progress: 50, status: "processing" }
      }));

      // Insert metadata into database
      const { data: documento, error: dbError } = await supabase
        .from("mandato_documentos")
        .insert({
          mandato_id: mandatoId,
          file_name: file.name,
          file_size_bytes: file.size,
          mime_type: file.type,
          storage_path: storagePath,
          tipo,
          descripcion,
          uploaded_by: user.id
        })
        .select()
        .single();

      if (dbError) {
        // Rollback: delete file from storage if DB insert fails
        await supabase.storage
          .from("mandato-documentos")
          .remove([storagePath]);
        throw dbError;
      }

      setUploadProgress(prev => ({
        ...prev,
        [fileId]: { progress: 100, status: "complete" }
      }));

      // Clean up progress after 2 seconds
      setTimeout(() => {
        setUploadProgress(prev => {
          const newProgress = { ...prev };
          delete newProgress[fileId];
          return newProgress;
        });
      }, 2000);

      return documento as MandatoDocumento;
    } catch (error) {
      console.error("Error uploading file:", error);
      setUploadProgress(prev => ({
        ...prev,
        [fileId]: { 
          progress: 0, 
          status: "error",
          error: error instanceof Error ? error.message : "Error desconocido"
        }
      }));
      throw error;
    }
  };

  const listDocuments = async (mandatoId: string): Promise<MandatoDocumento[]> => {
    try {
      const { data, error } = await supabase
        .from("mandato_documentos")
        .select("*")
        .eq("mandato_id", mandatoId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as MandatoDocumento[];
    } catch (error) {
      console.error("Error listing documents:", error);
      toast.error("Error al cargar documentos");
      return [];
    }
  };

  const getSignedUrl = async (
    storagePath: string,
    documentInfo?: { id: string; nombre: string }
  ): Promise<string | null> => {
    try {
      console.log('[Storage] Generando signed URL para:', storagePath);
      
      if (!storagePath) {
        console.error('[Storage] Error: storage_path vacío o nulo');
        toast.error('El documento no tiene ruta de almacenamiento válida');
        return null;
      }

      const { data, error } = await supabase.storage
        .from("mandato-documentos")
        .createSignedUrl(storagePath, 600); // 10 minutes

      if (error) {
        console.error('[Storage] Error createSignedUrl:', error.message, error);
        throw error;
      }

      console.log('[Storage] Signed URL generada correctamente');

      // Registrar acceso de forma asíncrona (no bloquea la descarga)
      if (documentInfo?.id) {
        documentAccessLogService.logAccess(
          documentInfo.id,
          documentInfo.nombre,
          'download'
        ).catch(console.error);
      }

      return data.signedUrl;
    } catch (error) {
      console.error("[Storage] Error generating signed URL:", error);
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      toast.error(`Error al generar enlace de descarga: ${errorMessage}`);
      return null;
    }
  };

  const deleteDocument = async (
    documentId: string,
    storagePath: string
  ): Promise<boolean> => {
    try {
      // Delete from database first
      const { error: dbError } = await supabase
        .from("mandato_documentos")
        .delete()
        .eq("id", documentId);

      if (dbError) throw dbError;

      // Delete from storage
      const { error: storageError } = await supabase.storage
        .from("mandato-documentos")
        .remove([storagePath]);

      if (storageError) {
        console.error("Storage deletion failed:", storageError);
        // Note: DB record is already deleted, log but don't fail
      }

      toast.success("Documento eliminado correctamente");
      return true;
    } catch (error) {
      console.error("Error deleting document:", error);
      toast.error("Error al eliminar documento");
      return false;
    }
  };

  return {
    uploadFile,
    listDocuments,
    getSignedUrl,
    deleteDocument,
    uploadProgress
  };
}
