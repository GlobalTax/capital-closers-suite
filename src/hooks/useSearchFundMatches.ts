import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  fetchSearchFunds,
  getMatchesWithFundsForMandato,
  matchSearchFundToMandato,
  removeMatchFromMandato,
  updateMatchStatus,
  updateMatchNotes,
  getMatchedFundIds,
} from '@/services/searchFunds.service';
import type { MatchStatus } from '@/types/searchFunds';

// Hook para obtener Search Funds disponibles
export function useSearchFunds(filters?: {
  sector?: string;
  ebitdaMin?: number;
  ebitdaMax?: number;
  status?: string;
  search?: string;
}) {
  return useQuery({
    queryKey: ['search-funds', filters],
    queryFn: () => fetchSearchFunds(filters),
    staleTime: 5 * 60 * 1000, // 5 minutos
  });
}

// Hook para obtener matches de un mandato con datos del fondo
export function useSearchFundMatchesForMandato(mandatoId: string | undefined) {
  return useQuery({
    queryKey: ['sf-matches', mandatoId],
    queryFn: () => getMatchesWithFundsForMandato(mandatoId!),
    enabled: !!mandatoId,
  });
}

// Hook para obtener IDs de fondos ya asociados
export function useMatchedFundIds(mandatoId: string | undefined) {
  return useQuery({
    queryKey: ['sf-matched-ids', mandatoId],
    queryFn: () => getMatchedFundIds(mandatoId!),
    enabled: !!mandatoId,
  });
}

// Hook para asociar un Search Fund a un mandato
export function useMatchSearchFund() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ fundId, mandatoId, notes }: { 
      fundId: string; 
      mandatoId: string; 
      notes?: string;
    }) => matchSearchFundToMandato(fundId, mandatoId, notes),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['sf-matches', variables.mandatoId] });
      queryClient.invalidateQueries({ queryKey: ['sf-matched-ids', variables.mandatoId] });
      toast.success('Search Fund asociado correctamente');
    },
    onError: (error) => {
      console.error('[useMatchSearchFund] Error:', error);
      toast.error('Error al asociar el Search Fund');
    },
  });
}

// Hook para eliminar un match
export function useRemoveMatch() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ matchId, mandatoId }: { matchId: string; mandatoId: string }) => 
      removeMatchFromMandato(matchId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['sf-matches', variables.mandatoId] });
      queryClient.invalidateQueries({ queryKey: ['sf-matched-ids', variables.mandatoId] });
      toast.success('Search Fund desvinculado');
    },
    onError: (error) => {
      console.error('[useRemoveMatch] Error:', error);
      toast.error('Error al desvincular el Search Fund');
    },
  });
}

// Hook para actualizar estado del match
export function useUpdateMatchStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ matchId, status, mandatoId, additionalFields }: { 
      matchId: string; 
      status: MatchStatus;
      mandatoId: string;
      additionalFields?: Partial<{
        notes: string;
        contacted_at: string;
        teaser_sent_at: string;
        nda_sent_at: string;
      }>;
    }) => updateMatchStatus(matchId, status, additionalFields),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['sf-matches', variables.mandatoId] });
      toast.success('Estado actualizado');
    },
    onError: (error) => {
      console.error('[useUpdateMatchStatus] Error:', error);
      toast.error('Error al actualizar el estado');
    },
  });
}

// Hook para actualizar notas del match
export function useUpdateMatchNotes() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ matchId, notes, mandatoId }: { 
      matchId: string; 
      notes: string;
      mandatoId: string;
    }) => updateMatchNotes(matchId, notes),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['sf-matches', variables.mandatoId] });
      toast.success('Notas actualizadas');
    },
    onError: (error) => {
      console.error('[useUpdateMatchNotes] Error:', error);
      toast.error('Error al actualizar las notas');
    },
  });
}
