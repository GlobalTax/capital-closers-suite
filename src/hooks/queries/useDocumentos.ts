import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { 
  fetchDocumentos, 
  getDocumentoById, 
  createDocumento, 
  deleteDocumento,
  getContactoDocumentos,
  getEmpresaDocumentos
} from "@/services/documentos.service";
import { toast } from "sonner";
import { handleError } from "@/lib/error-handler";
import type { Documento } from "@/types";

export function useDocumentos() {
  return useQuery({
    queryKey: ['documentos'],
    queryFn: fetchDocumentos,
    staleTime: 5 * 60 * 1000,
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

export function useDeleteDocumento() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteDocumento,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documentos'] });
      toast.success("Documento eliminado exitosamente");
    },
    onError: (error) => {
      handleError(error, "Error al eliminar documento");
    },
  });
}
