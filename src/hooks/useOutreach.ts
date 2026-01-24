import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { 
  createOutreach, 
  getOutreachByFund, 
  updateOutreachStatus,
  type CreateOutreachParams,
  type OutreachStatus 
} from '@/services/outreach.service';

export function useOutreachByFund(fundId: string | undefined) {
  return useQuery({
    queryKey: ['search-fund-outreach', fundId],
    queryFn: () => getOutreachByFund(fundId!),
    enabled: !!fundId,
  });
}

export function useCreateOutreach() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (params: CreateOutreachParams) => createOutreach(params),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ 
        queryKey: ['search-fund-outreach', variables.fund_id] 
      });
      toast.success('Outreach registrado correctamente');
    },
    onError: (error) => {
      console.error('Error creating outreach:', error);
      toast.error('Error al registrar outreach');
    },
  });
}

export function useUpdateOutreachStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ outreachId, status }: { outreachId: string; status: OutreachStatus }) =>
      updateOutreachStatus(outreachId, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['search-fund-outreach'] });
      toast.success('Estado actualizado');
    },
    onError: () => {
      toast.error('Error al actualizar estado');
    },
  });
}
