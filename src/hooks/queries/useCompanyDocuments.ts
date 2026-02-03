import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { handleError } from "@/lib/error-handler";
import { supabase } from "@/integrations/supabase/client";
import {
  getCompanyDocumentsByCategory,
  uploadCompanyDocument,
  deleteCompanyDocument,
  downloadCompanyDocument,
  type CompanyDocumentCategory,
  type CompanyDocument,
} from "@/services/companyDocuments.service";

// Hook para obtener el conteo total de documentos de una empresa (todas las categorías)
export function useCompanyDocumentsCount(empresaId: string | undefined) {
  return useQuery({
    queryKey: ['companyDocumentsCount', empresaId],
    queryFn: async () => {
      if (!empresaId) return 0;
      const { count, error } = await supabase
        .from('empresa_documentos')
        .select('*', { count: 'exact', head: true })
        .eq('empresa_id', empresaId);
      
      if (error) return 0;
      return count || 0;
    },
    enabled: !!empresaId,
    staleTime: 2 * 60 * 1000,
  });
}

export function useCompanyDocumentsByCategory(
  empresaId: string | undefined,
  category: CompanyDocumentCategory
) {
  return useQuery({
    queryKey: ['companyDocuments', empresaId, category],
    queryFn: () => getCompanyDocumentsByCategory(empresaId!, category),
    enabled: !!empresaId,
    staleTime: 2 * 60 * 1000, // 2 minutos
  });
}

export function useUploadCompanyDocument() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      empresaId,
      file,
      category,
      notas,
    }: {
      empresaId: string;
      file: File;
      category: CompanyDocumentCategory;
      notas?: string;
    }) => uploadCompanyDocument(empresaId, file, category, notas),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['companyDocuments', variables.empresaId, variables.category],
      });
      queryClient.invalidateQueries({
        queryKey: ['companyDocumentsCount', variables.empresaId],
      });
      toast.success(`Documento subido correctamente`);
    },
    onError: (error: any) => {
      handleError(error, "Error al subir documento");
    },
  });
}

export function useDeleteCompanyDocument() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      empresaDocumentoId,
      documentoId,
      storagePath,
      empresaId,
      category,
    }: {
      empresaDocumentoId: string;
      documentoId: string;
      storagePath: string;
      empresaId: string;
      category: CompanyDocumentCategory;
    }) => deleteCompanyDocument(empresaDocumentoId, documentoId, storagePath),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['companyDocuments', variables.empresaId, variables.category],
      });
      queryClient.invalidateQueries({
        queryKey: ['companyDocumentsCount', variables.empresaId],
      });
      toast.success("Documento eliminado");
    },
    onError: (error) => {
      handleError(error, "Error al eliminar documento");
    },
  });
}

export function useDownloadCompanyDocument() {
  return useMutation({
    mutationFn: async ({ storagePath, fileName }: { storagePath: string; fileName: string }) =>
      downloadCompanyDocument(storagePath, fileName),
    onError: (error) => {
      handleError(error, "Error al descargar documento");
    },
  });
}
