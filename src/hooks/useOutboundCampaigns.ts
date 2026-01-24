/**
 * Hooks para gestión de campañas de Outbound
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import * as outboundService from '@/services/outbound.service';
import type { OutboundCampaign, OutboundProspect, OutboundFilters } from '@/types/outbound';

// ============================================
// CAMPAÑAS
// ============================================

export function useOutboundCampaigns() {
  return useQuery({
    queryKey: ['outbound-campaigns'],
    queryFn: outboundService.getCampaigns,
  });
}

export function useOutboundCampaign(id: string | undefined) {
  return useQuery({
    queryKey: ['outbound-campaign', id],
    queryFn: () => outboundService.getCampaignById(id!),
    enabled: !!id,
  });
}

export function useCreateCampaign() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: {
      name: string;
      description?: string;
      sector_id?: string;
      sector_name?: string;
      filters: OutboundFilters;
      apollo_keywords?: string[];
    }) => outboundService.createCampaign(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['outbound-campaigns'] });
      toast.success('Campaña creada correctamente');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}

export function useUpdateCampaign() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<OutboundCampaign> }) =>
      outboundService.updateCampaign(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['outbound-campaigns'] });
      queryClient.invalidateQueries({ queryKey: ['outbound-campaign', variables.id] });
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}

export function useDeleteCampaign() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: outboundService.deleteCampaign,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['outbound-campaigns'] });
      toast.success('Campaña eliminada');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}

export function useArchiveCampaign() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: outboundService.archiveCampaign,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['outbound-campaigns'] });
      toast.success('Campaña archivada');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}

// ============================================
// PROSPECTOS
// ============================================

export function useProspects(campaignId: string | undefined) {
  return useQuery({
    queryKey: ['outbound-prospects', campaignId],
    queryFn: () => outboundService.getProspects(campaignId!),
    enabled: !!campaignId,
  });
}

export function useProspectsPaginated(
  campaignId: string | undefined,
  page: number,
  pageSize: number = 50,
  search?: string,
  statusFilter?: string
) {
  return useQuery({
    queryKey: ['outbound-prospects-paginated', campaignId, page, pageSize, search, statusFilter],
    queryFn: () => outboundService.getProspectsPaginated(
      campaignId!,
      page,
      pageSize,
      search,
      statusFilter
    ),
    enabled: !!campaignId,
    placeholderData: (prev) => prev, // Keep previous data while loading
  });
}

export function useUpdateProspect() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<OutboundProspect> }) =>
      outboundService.updateProspect(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['outbound-prospects'] });
      queryClient.invalidateQueries({ queryKey: ['outbound-prospects-paginated'] });
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}

export function useUpdateProspectsSelection() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ ids, isSelected }: { ids: string[]; isSelected: boolean }) =>
      outboundService.updateProspectsSelection(ids, isSelected),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['outbound-prospects'] });
      queryClient.invalidateQueries({ queryKey: ['outbound-prospects-paginated'] });
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}

export function useDeleteProspects() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: outboundService.deleteProspects,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['outbound-prospects'] });
      queryClient.invalidateQueries({ queryKey: ['outbound-prospects-paginated'] });
      toast.success('Prospectos eliminados');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}

// ============================================
// APOLLO OPERATIONS
// ============================================

export function useSearchApolloProspects() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      campaignId,
      keywords,
      filters,
      page,
    }: {
      campaignId: string;
      keywords: string[];
      filters: OutboundFilters;
      page?: number;
    }) => outboundService.searchApolloProspects(campaignId, keywords, filters, page),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['outbound-prospects', variables.campaignId] });
      queryClient.invalidateQueries({ queryKey: ['outbound-campaign', variables.campaignId] });
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}

export function useEnrichProspects() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      prospectIds,
      includePhone,
    }: {
      prospectIds: string[];
      includePhone?: boolean;
    }) => outboundService.enrichProspects(prospectIds, includePhone),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['outbound-prospects'] });
      queryClient.invalidateQueries({ queryKey: ['outbound-campaigns'] });
      toast.success(`${result.enriched} prospectos enriquecidos (${result.creditsUsed} créditos)`);
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}

export function useImportProspectsToLeads() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: outboundService.importProspectsToLeads,
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['outbound-prospects'] });
      queryClient.invalidateQueries({ queryKey: ['outbound-prospects-paginated'] });
      queryClient.invalidateQueries({ queryKey: ['outbound-campaigns'] });
      queryClient.invalidateQueries({ queryKey: ['gestion-leads'] });
      toast.success(`${result.imported} prospectos importados al CRM`);
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}

export function useImportAllProspects() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: outboundService.importAllProspects,
    onSuccess: (result, campaignId) => {
      queryClient.invalidateQueries({ queryKey: ['outbound-prospects-paginated', campaignId] });
      queryClient.invalidateQueries({ queryKey: ['outbound-campaign', campaignId] });
      queryClient.invalidateQueries({ queryKey: ['outbound-campaigns'] });
      queryClient.invalidateQueries({ queryKey: ['gestion-leads'] });
      if (result.imported === 0 && result.duplicates === 0) {
        toast.info('No hay prospectos enriquecidos pendientes de importar');
      } else {
        toast.success(`${result.imported} importados, ${result.duplicates} duplicados`);
      }
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}

// ============================================
// MAPEO DE SECTORES
// ============================================

export function useSectorMappings() {
  return useQuery({
    queryKey: ['apollo-sector-mappings'],
    queryFn: outboundService.getSectorMappings,
    staleTime: 1000 * 60 * 10, // 10 minutos
  });
}

// ============================================
// ESTADÍSTICAS
// ============================================

export function useOutboundStats() {
  return useQuery({
    queryKey: ['outbound-stats'],
    queryFn: outboundService.getOutboundStats,
  });
}
