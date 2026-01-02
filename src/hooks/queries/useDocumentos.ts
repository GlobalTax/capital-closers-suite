import { useQuery, useMutation, useQueryClient, keepPreviousData } from "@tanstack/react-query";
import { 
  fetchDocumentos,
  fetchDocumentosPaginated,
  getDocumentoById, 
  createDocumento, 
  deleteDocumento,
  getContactoDocumentos,
  getEmpresaDocumentos,
  vincularDocumentoContacto,
  desvincularDocumentoContacto
} from "@/services/documentos.service";
import { deleteFile } from "@/services/uploads";
import { toast } from "sonner";
import { handleError } from "@/lib/error-handler";
import type { Documento } from "@/types";
import { DEFAULT_PAGE_SIZE } from "@/types/pagination";

export function useDocumentos() {
  return useQuery({
    queryKey: ['documentos'],
    queryFn: fetchDocumentos,
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Hook para obtener documentos con paginación server-side
 */
export function useDocumentosPaginated(page: number = 1, pageSize: number = DEFAULT_PAGE_SIZE) {
  return useQuery({
    queryKey: ['documentos', 'paginated', page, pageSize],
    queryFn: () => fetchDocumentosPaginated(page, pageSize),
    staleTime: 5 * 60 * 1000,
    placeholderData: keepPreviousData,
  });
}

export function useDocumento(id: string | undefined) {
  return useQuery({
    queryKey: ['documentos', id],
    queryFn: () => getDocumentoById(id!),
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
  });
}

export function useContactoDocumentos(contactoId: string | undefined) {
  return useQuery({
    queryKey: ['documentos', 'contacto', contactoId],
    queryFn: () => getContactoDocumentos(contactoId!),
    enabled: !!contactoId,
    staleTime: 5 * 60 * 1000,
  });
}

export function useEmpresaDocumentos(empresaId: string | undefined) {
  return useQuery({
    queryKey: ['documentos', 'empresa', empresaId],
    queryFn: () => getEmpresaDocumentos(empresaId!),
    enabled: !!empresaId,
    staleTime: 5 * 60 * 1000,
  });
}

export function useDeleteDocumento() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, storagePath }: { id: string; storagePath: string }) => 
      deleteFile(id, storagePath),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documentos'] });
      toast.success("Documento eliminado correctamente");
    },
    onError: (error) => {
      handleError(error, "Error al eliminar documento");
    },
  });
}

export function useCreateDocumento() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createDocumento,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documentos'] });
      toast.success("Documento creado exitosamente");
    },
    onError: (error) => {
      handleError(error, "Error al crear documento");
    },
  });
}

export function useVincularDocumentoContacto() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ contactoId, documentoId, notas }: { 
      contactoId: string; 
      documentoId: string; 
      notas?: string 
    }) => vincularDocumentoContacto(contactoId, documentoId, notas),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ 
        queryKey: ['documentos', 'contacto', variables.contactoId] 
      });
      toast.success("Documento vinculado correctamente");
    },
    onError: (error) => {
      handleError(error, "Error al vincular documento");
    },
  });
}

export function useDesvincularDocumentoContacto() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ contactoId, documentoId }: { 
      contactoId: string; 
      documentoId: string 
    }) => desvincularDocumentoContacto(contactoId, documentoId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ 
        queryKey: ['documentos', 'contacto', variables.contactoId] 
      });
      toast.success("Documento desvinculado");
    },
    onError: (error) => {
      handleError(error, "Error al desvincular documento");
    },
  });
}

