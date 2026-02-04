import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import * as corporateBuyersService from "@/services/corporateBuyers.service";
import type { 
  CorporateBuyersFilters, 
  CreateCorporateBuyerInput, 
  UpdateCorporateBuyerInput,
  CreateSourceTagInput,
  UpdateSourceTagInput
} from "@/types/corporateBuyers";

// ============ CORPORATE BUYERS ============

export function useCorporateBuyers(filters?: CorporateBuyersFilters) {
  return useQuery({
    queryKey: ['corporate-buyers', filters],
    queryFn: () => corporateBuyersService.getCorporateBuyers(filters),
  });
}

export function useCorporateBuyer(id: string | undefined) {
  return useQuery({
    queryKey: ['corporate-buyer', id],
    queryFn: () => corporateBuyersService.getCorporateBuyerById(id!),
    enabled: !!id,
  });
}

export function useCreateCorporateBuyer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateCorporateBuyerInput) => 
      corporateBuyersService.createCorporateBuyer(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['corporate-buyers'] });
      queryClient.invalidateQueries({ queryKey: ['corporate-buyers-kpis'] });
      toast.success('Comprador creado correctamente');
    },
    onError: (error: Error) => {
      console.error('[useCorporateBuyers] Error creating buyer:', error);
      toast.error(`Error al crear comprador: ${error.message}`);
    },
  });
}

export function useUpdateCorporateBuyer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateCorporateBuyerInput }) =>
      corporateBuyersService.updateCorporateBuyer(id, input),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['corporate-buyers'] });
      queryClient.invalidateQueries({ queryKey: ['corporate-buyer', variables.id] });
      queryClient.invalidateQueries({ queryKey: ['corporate-buyers-kpis'] });
      toast.success('Comprador actualizado correctamente');
    },
    onError: (error: Error) => {
      console.error('[useCorporateBuyers] Error updating buyer:', error);
      toast.error(`Error al actualizar: ${error.message}`);
    },
  });
}

export function useDeleteCorporateBuyer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => corporateBuyersService.deleteCorporateBuyer(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['corporate-buyers'] });
      queryClient.invalidateQueries({ queryKey: ['corporate-buyers-kpis'] });
      toast.success('Comprador eliminado correctamente');
    },
    onError: (error: Error) => {
      console.error('[useCorporateBuyers] Error deleting buyer:', error);
      toast.error(`Error al eliminar: ${error.message}`);
    },
  });
}

// ============ KPIs ============

export function useCorporateBuyersKPIs() {
  return useQuery({
    queryKey: ['corporate-buyers-kpis'],
    queryFn: () => corporateBuyersService.getCorporateBuyersKPIs(),
    staleTime: 60 * 1000, // 1 minute
  });
}

// ============ SOURCE TAGS ============

export function useBuyerSourceTags(includeInactive = false) {
  return useQuery({
    queryKey: ['buyer-source-tags', includeInactive],
    queryFn: () => corporateBuyersService.getBuyerSourceTags(includeInactive),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useCreateSourceTag() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateSourceTagInput) => 
      corporateBuyersService.createSourceTag(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['buyer-source-tags'] });
      toast.success('Etiqueta creada correctamente');
    },
    onError: (error: Error) => {
      console.error('[useCorporateBuyers] Error creating tag:', error);
      toast.error(`Error al crear etiqueta: ${error.message}`);
    },
  });
}

export function useUpdateSourceTag() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateSourceTagInput }) =>
      corporateBuyersService.updateSourceTag(id, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['buyer-source-tags'] });
      toast.success('Etiqueta actualizada correctamente');
    },
    onError: (error: Error) => {
      console.error('[useCorporateBuyers] Error updating tag:', error);
      toast.error(`Error al actualizar etiqueta: ${error.message}`);
    },
  });
}
