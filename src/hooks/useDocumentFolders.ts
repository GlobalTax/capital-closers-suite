import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { handleError } from "@/lib/error-handler";
import {
  getFoldersByMandato,
  getDocumentsByMandatoWithVersions,
  getDocumentVersionHistory,
  createFolder,
  renameFolder,
  deleteFolder,
  moveDocumentToFolder,
} from "@/services/documentFolders.service";
import { buildFolderTree, type FolderTreeNode } from "@/types/documents";

export function useDocumentFolders(mandatoId: string | undefined) {
  const queryClient = useQueryClient();

  // Obtener carpetas
  const foldersQuery = useQuery({
    queryKey: ['document-folders', mandatoId],
    queryFn: () => getFoldersByMandato(mandatoId!),
    enabled: !!mandatoId,
    staleTime: 5 * 60 * 1000,
  });

  // Obtener documentos con versiones
  const documentsQuery = useQuery({
    queryKey: ['documents-with-versions', mandatoId],
    queryFn: () => getDocumentsByMandatoWithVersions(mandatoId!),
    enabled: !!mandatoId,
    staleTime: 2 * 60 * 1000,
  });

  // Construir árbol de carpetas
  const folderTree: FolderTreeNode[] = 
    foldersQuery.data && documentsQuery.data
      ? buildFolderTree(foldersQuery.data, documentsQuery.data)
      : [];

  // Documentos sin carpeta
  const unfiledDocuments = documentsQuery.data?.filter(d => !d.folder_id) || [];

  // Crear carpeta
  const createFolderMutation = useMutation({
    mutationFn: ({ name, parentId }: { name: string; parentId?: string }) =>
      createFolder(mandatoId!, name, parentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['document-folders', mandatoId] });
      toast.success('Carpeta creada');
    },
    onError: (error) => handleError(error, 'Error creando carpeta'),
  });

  // Renombrar carpeta
  const renameFolderMutation = useMutation({
    mutationFn: ({ folderId, newName }: { folderId: string; newName: string }) =>
      renameFolder(folderId, newName),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['document-folders', mandatoId] });
      toast.success('Carpeta renombrada');
    },
    onError: (error) => handleError(error, 'Error renombrando carpeta'),
  });

  // Eliminar carpeta
  const deleteFolderMutation = useMutation({
    mutationFn: (folderId: string) => deleteFolder(folderId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['document-folders', mandatoId] });
      toast.success('Carpeta eliminada');
    },
    onError: (error) => handleError(error, 'Error eliminando carpeta'),
  });

  // Mover documento
  const moveDocumentMutation = useMutation({
    mutationFn: ({ documentId, folderId }: { documentId: string; folderId: string | null }) =>
      moveDocumentToFolder(documentId, folderId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents-with-versions', mandatoId] });
      toast.success('Documento movido');
    },
    onError: (error) => handleError(error, 'Error moviendo documento'),
  });

  const refetch = () => {
    queryClient.invalidateQueries({ queryKey: ['document-folders', mandatoId] });
    queryClient.invalidateQueries({ queryKey: ['documents-with-versions', mandatoId] });
  };

  return {
    folders: foldersQuery.data || [],
    documents: documentsQuery.data || [],
    folderTree,
    unfiledDocuments,
    isLoading: foldersQuery.isLoading || documentsQuery.isLoading,
    error: foldersQuery.error || documentsQuery.error,
    createFolder: createFolderMutation.mutate,
    renameFolder: renameFolderMutation.mutate,
    deleteFolder: deleteFolderMutation.mutate,
    moveDocument: moveDocumentMutation.mutate,
    isCreating: createFolderMutation.isPending,
    refetch,
  };
}

export function useDocumentVersions(documentId: string | undefined) {
  return useQuery({
    queryKey: ['document-versions', documentId],
    queryFn: () => getDocumentVersionHistory(documentId!),
    enabled: !!documentId,
    staleTime: 5 * 60 * 1000,
  });
}
