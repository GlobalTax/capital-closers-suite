import { useState, useEffect } from "react";
import { fetchTaskFiles, uploadTaskFile, deleteTaskFile } from "@/services/checklistFiles";
import type { MandatoChecklistTaskFile } from "@/types";
import { toast } from "@/hooks/use-toast";
import { validateFile } from "@/lib/file-utils";

export const useTaskFiles = (taskId: string | undefined) => {
  const [files, setFiles] = useState<MandatoChecklistTaskFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  const loadFiles = async () => {
    if (!taskId) {
      setLoading(false);
      return;
    }
    
    try {
      setLoading(true);
      const data = await fetchTaskFiles(taskId);
      setFiles(data);
    } catch (error: any) {
      console.error("Error loading task files:", error);
      toast({
        title: "Error",
        description: "No se pudieron cargar los archivos",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const uploadFile = async (file: File, description?: string, userId?: string) => {
    if (!taskId) return;
    
    try {
      // Validar archivo antes de subir
      validateFile(file, 10); // Max 10MB
      
      setUploading(true);
      const newFile = await uploadTaskFile(taskId, file, description, userId);
      setFiles(prev => [newFile, ...prev]);
      
      toast({
        title: "Éxito",
        description: `Archivo "${file.name}" subido correctamente`,
      });
    } catch (error: any) {
      console.error("Error uploading file:", error);
      toast({
        title: "Error al subir archivo",
        description: error.message || "No se pudo subir el archivo",
        variant: "destructive",
      });
      throw error;
    } finally {
      setUploading(false);
    }
  };

  const removeFile = async (fileId: string, filePath: string) => {
    try {
      await deleteTaskFile(fileId, filePath);
      setFiles(prev => prev.filter(f => f.id !== fileId));
      
      toast({
        title: "Archivo eliminado",
        description: "El archivo se eliminó correctamente",
      });
    } catch (error: any) {
      console.error("Error deleting file:", error);
      toast({
        title: "Error",
        description: "No se pudo eliminar el archivo",
        variant: "destructive",
      });
      throw error;
    }
  };

  useEffect(() => {
    loadFiles();
  }, [taskId]);

  return {
    files,
    loading,
    uploading,
    uploadFile,
    deleteFile: removeFile,
    refetch: loadFiles
  };
};
