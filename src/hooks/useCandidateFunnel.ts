// ============================================
// CANDIDATE FUNNEL HOOK
// Data fetching and filtering for M&A funnel
// ============================================

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { 
  type CandidateFunnelStats, 
  type CandidateWithFunnelStage,
  type CandidateFunnelStage,
  calculateCurrentStage 
} from '@/types/candidateFunnel';

interface UseCandidateFunnelOptions {
  campaignId: string;
  stageFilter?: CandidateFunnelStage | null;
  segmentFilter?: string | null;
  searchQuery?: string;
}

export function useCandidateFunnel({
  campaignId,
  stageFilter,
  segmentFilter,
  searchQuery,
}: UseCandidateFunnelOptions) {
  const queryClient = useQueryClient();

  // Fetch aggregated stats
  const statsQuery = useQuery({
    queryKey: ['campaign-funnel-stats', campaignId],
    queryFn: async (): Promise<CandidateFunnelStats | null> => {
      const { data, error } = await supabase
        .from('vw_campaign_funnel_stats')
        .select('*')
        .eq('campaign_id', campaignId)
        .maybeSingle();

      if (error) {
        console.error('[useCandidateFunnel] Stats error:', error);
        throw error;
      }

      return data as CandidateFunnelStats | null;
    },
    enabled: !!campaignId,
    staleTime: 30 * 1000,
  });

  // Fetch recipients with funnel data
  const recipientsQuery = useQuery({
    queryKey: ['campaign-funnel-recipients', campaignId],
    queryFn: async (): Promise<CandidateWithFunnelStage[]> => {
      const { data, error } = await supabase
        .from('teaser_recipients')
        .select(`
          id, email, nombre, empresa_nombre,
          sent_at, opened_at, 
          nda_status, nda_sent_at, nda_signed_at,
          cim_first_accessed_at,
          ioi_received_at, ioi_amount, ioi_notes
        `)
        .eq('campaign_id', campaignId)
        .order('sent_at', { ascending: false });

      if (error) {
        console.error('[useCandidateFunnel] Recipients error:', error);
        throw error;
      }

      return (data || []).map(r => ({
        id: r.id,
        nombre: r.nombre || '',
        email: r.email,
        empresa_nombre: r.empresa_nombre,
        segment: null, // Column doesn't exist yet
        current_stage: calculateCurrentStage(r),
        teaser_sent_at: r.sent_at,
        teaser_opened_at: r.opened_at,
        nda_sent_at: r.nda_sent_at,
        nda_signed_at: r.nda_signed_at,
        cim_opened_at: r.cim_first_accessed_at,
        ioi_received_at: r.ioi_received_at,
        ioi_amount: r.ioi_amount,
        ioi_notes: r.ioi_notes,
      }));
    },
    enabled: !!campaignId,
    staleTime: 30 * 1000,
  });

  // Apply client-side filters
  const filteredRecipients = (recipientsQuery.data || []).filter(r => {
    // Stage filter
    if (stageFilter && r.current_stage !== stageFilter) {
      return false;
    }
    
    // Segment filter
    if (segmentFilter && r.segment !== segmentFilter) {
      return false;
    }
    
    // Search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const matches = 
        r.nombre?.toLowerCase().includes(query) ||
        r.email?.toLowerCase().includes(query) ||
        r.empresa_nombre?.toLowerCase().includes(query);
      if (!matches) return false;
    }
    
    return true;
  });

  // Register IOI mutation
  const registerIOIMutation = useMutation({
    mutationFn: async ({ 
      recipientId, 
      amount, 
      notes 
    }: { 
      recipientId: string; 
      amount: number; 
      notes?: string 
    }) => {
      const { error } = await supabase
        .from('teaser_recipients')
        .update({
          ioi_received_at: new Date().toISOString(),
          ioi_amount: amount,
          ioi_notes: notes || null,
        })
        .eq('id', recipientId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campaign-funnel-stats', campaignId] });
      queryClient.invalidateQueries({ queryKey: ['campaign-funnel-recipients', campaignId] });
    },
  });

  // Get unique segments for filter
  const segments = [...new Set(
    (recipientsQuery.data || [])
      .map(r => r.segment)
      .filter(Boolean)
  )] as string[];

  // Group by stage for Kanban view
  const recipientsByStage = (recipientsQuery.data || []).reduce((acc, r) => {
    const stage = r.current_stage;
    if (!acc[stage]) acc[stage] = [];
    acc[stage].push(r);
    return acc;
  }, {} as Record<CandidateFunnelStage, CandidateWithFunnelStage[]>);

  return {
    // Data
    stats: statsQuery.data,
    recipients: filteredRecipients,
    allRecipients: recipientsQuery.data || [],
    recipientsByStage,
    segments,
    
    // Loading states
    isLoading: statsQuery.isLoading || recipientsQuery.isLoading,
    isStatsLoading: statsQuery.isLoading,
    isRecipientsLoading: recipientsQuery.isLoading,
    
    // Mutations
    registerIOI: registerIOIMutation.mutateAsync,
    isRegisteringIOI: registerIOIMutation.isPending,
    
    // Helpers
    filterByStage: (stage: CandidateFunnelStage) => 
      (recipientsQuery.data || []).filter(r => r.current_stage === stage),
    
    refetch: () => {
      statsQuery.refetch();
      recipientsQuery.refetch();
    },
  };
}
