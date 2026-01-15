import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { 
  getTeaserForMandato, 
  getTeasersForMandatos,
  getTeasersForMandatoByLanguage,
  getOrCreateTeaserFolder,
  getSignedUrlForTeaser,
} from "@/services/teaser.service";
import type { DocumentWithVersion } from "@/types/documents";

/**
 * Hook para obtener el teaser de un mandato específico
 * @deprecated Usar useTeasersByLanguage para soporte ES/EN
 */
export function useTeaserForMandato(mandatoId: string | undefined) {
  return useQuery({
    queryKey: ['teaser', mandatoId],
    queryFn: () => getTeaserForMandato(mandatoId!),
    enabled: !!mandatoId,
    staleTime: 2 * 60 * 1000, // 2 min
  });
}

/**
 * Hook para obtener teasers ES y EN de un mandato
 */
export function useTeasersByLanguage(mandatoId: string | undefined) {
  return useQuery({
    queryKey: ['teasers-language', mandatoId],
    queryFn: () => getTeasersForMandatoByLanguage(mandatoId!),
    enabled: !!mandatoId,
    staleTime: 2 * 60 * 1000,
  });
}

/**
 * Hook para obtener teasers de múltiples mandatos (para tabla)
 */
export function useTeasersForMandatos(mandatoIds: string[]) {
  return useQuery({
    queryKey: ['teasers-batch', mandatoIds.sort().join(',')],
    queryFn: async () => {
      const result = await getTeasersForMandatos(mandatoIds);
      // Convertir Map a objeto para serialización
      const obj: Record<string, DocumentWithVersion | null> = {};
      result.forEach((value, key) => {
        obj[key] = value;
      });
      return obj;
    },
    enabled: mandatoIds.length > 0,
    staleTime: 2 * 60 * 1000,
  });
}

/**
 * Hook para gestionar la carpeta teaser
 */
export function useTeaserFolder(mandatoId: string | undefined) {
  const queryClient = useQueryClient();

  const createFolderMutation = useMutation({
    mutationFn: () => getOrCreateTeaserFolder(mandatoId!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['document-folders', mandatoId] });
      queryClient.invalidateQueries({ queryKey: ['teaser', mandatoId] });
      queryClient.invalidateQueries({ queryKey: ['teasers-language', mandatoId] });
    },
  });

  return {
    ensureTeaserFolder: createFolderMutation.mutateAsync,
    isCreating: createFolderMutation.isPending,
  };
}

/**
 * Hook para descargar teaser
 */
export function useTeaserDownload() {
  const downloadTeaser = async (teaser: DocumentWithVersion) => {
    try {
      const url = await getSignedUrlForTeaser(teaser.storage_path);
      if (url) {
        const link = document.createElement('a');
        link.href = url;
        link.download = teaser.file_name;
        link.target = '_blank';
        link.rel = 'noopener noreferrer';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        return true;
      }
      return false;
    } catch (error) {
      console.error('[Teaser] Download error:', error);
      return false;
    }
  };

  return { downloadTeaser };
}
