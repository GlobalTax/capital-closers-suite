import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  getFinancialStatements,
  createFinancialStatement,
  updateFinancialStatement,
  deleteFinancialStatement,
  extractFinancialDataFromImage
} from "@/services/financialStatements.service";
import type { FinancialStatementInsert, FinancialStatementUpdate } from "@/types/financials";

export function useFinancialStatements(empresaId: string | undefined) {
  const queryClient = useQueryClient();

  const { data: statements = [], isLoading, error } = useQuery({
    queryKey: ['financial-statements', empresaId],
    queryFn: () => getFinancialStatements(empresaId!),
    enabled: !!empresaId,
  });

  const createMutation = useMutation({
    mutationFn: (data: FinancialStatementInsert) => createFinancialStatement(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['financial-statements', empresaId] });
      toast.success('Estado financiero creado');
    },
    onError: (error: any) => {
      if (error.code === '23505') {
        toast.error('Ya existe un estado financiero para ese año y periodo');
      } else {
        toast.error('Error al crear estado financiero');
      }
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: FinancialStatementUpdate }) =>
      updateFinancialStatement(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['financial-statements', empresaId] });
      toast.success('Estado financiero actualizado');
    },
    onError: () => {
      toast.error('Error al actualizar estado financiero');
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteFinancialStatement(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['financial-statements', empresaId] });
      toast.success('Estado financiero eliminado');
    },
    onError: () => {
      toast.error('Error al eliminar estado financiero');
    }
  });

  return {
    statements,
    isLoading,
    error,
    createStatement: createMutation.mutateAsync,
    updateStatement: updateMutation.mutateAsync,
    deleteStatement: deleteMutation.mutateAsync,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
}

export function useExtractFinancialData() {
  return useMutation({
    mutationFn: (imageBase64: string) => extractFinancialDataFromImage(imageBase64),
    onError: () => {
      toast.error('Error al extraer datos de la imagen');
    }
  });
}
