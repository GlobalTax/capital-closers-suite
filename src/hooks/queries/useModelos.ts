import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import type { ModeloCategory } from "@/types/documents";
import {
  getModelosByCategory,
  uploadModelo,
  deleteModelo,
  downloadModelo,
} from "@/services/modelos.service";

// Query key factory
const modelosKeys = {
  all: ['modelos'] as const,
  byCategory: (category: ModeloCategory) => [...modelosKeys.all, category] as const,
};

// Hook para obtener modelos por categoría
export function useModelosByCategory(category: ModeloCategory) {
  return useQuery({
    queryKey: modelosKeys.byCategory(category),
    queryFn: () => getModelosByCategory(category),
    staleTime: 5 * 60 * 1000, // 5 minutos
  });
}

// Hook para subir modelo
export function useUploadModelo() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ file, title, category }: { file: File; title: string; category: ModeloCategory }) =>
      uploadModelo(file, title, category),
    onSuccess: (_, variables) => {
      toast.success('Modelo subido correctamente');
      queryClient.invalidateQueries({ queryKey: modelosKeys.byCategory(variables.category) });
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Error al subir modelo');
    },
  });
}

// Hook para eliminar modelo
export function useDeleteModelo() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, category }: { id: string; category: ModeloCategory }) =>
      deleteModelo(id),
    onSuccess: (_, variables) => {
      toast.success('Modelo eliminado');
      queryClient.invalidateQueries({ queryKey: modelosKeys.byCategory(variables.category) });
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Error al eliminar modelo');
    },
  });
}

// Hook para descargar modelo
export function useDownloadModelo() {
  return useMutation({
    mutationFn: ({ storagePath, fileName }: { storagePath: string; fileName: string }) =>
      downloadModelo(storagePath, fileName),
    onError: (error: Error) => {
      toast.error(error.message || 'Error al descargar archivo');
    },
  });
}
