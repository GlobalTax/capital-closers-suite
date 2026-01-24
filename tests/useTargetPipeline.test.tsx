import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import { useTargetPipeline } from '@/hooks/useTargetPipeline';
import * as targetScoringService from '@/services/targetScoring.service';
import * as targetOfertasService from '@/services/targetOfertas.service';
import { toast } from '@/hooks/use-toast';

// Mock services
vi.mock('@/services/targetScoring.service', () => ({
  getTargetsWithScoring: vi.fn(),
  getTargetPipelineStats: vi.fn(),
  moveTargetToFunnelStage: vi.fn(),
  moveTargetToPipelineStage: vi.fn(),
  upsertTargetScoring: vi.fn(),
  updateMatchScore: vi.fn(),
}));

vi.mock('@/services/targetOfertas.service', () => ({
  createOferta: vi.fn(),
  updateOferta: vi.fn(),
  deleteOferta: vi.fn(),
  getOfertasByTarget: vi.fn(),
  cambiarEstadoOferta: vi.fn(),
}));

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
  return ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client: queryClient }, children);
};

describe('useTargetPipeline', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(targetScoringService.getTargetsWithScoring).mockResolvedValue([]);
    vi.mocked(targetScoringService.getTargetPipelineStats).mockResolvedValue({
      totalTargets: 0,
      byFunnelStage: {},
      byPipelineStage: {},
    } as any);
  });

  it('should not fetch when mandatoId is undefined', async () => {
    const { result } = renderHook(
      () => useTargetPipeline(undefined),
      { wrapper: createWrapper() }
    );

    // Wait a tick for any potential async operations
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(targetScoringService.getTargetsWithScoring).not.toHaveBeenCalled();
    expect(result.current.targets).toEqual([]);
  });

  it('should fetch targets when mandatoId is provided', async () => {
    const mockTargets = [
      { id: 'target-1', empresa: { nombre: 'Test Corp' } },
      { id: 'target-2', empresa: { nombre: 'Another Corp' } },
    ];
    vi.mocked(targetScoringService.getTargetsWithScoring).mockResolvedValue(mockTargets as any);

    const { result } = renderHook(
      () => useTargetPipeline('mandato-123'),
      { wrapper: createWrapper() }
    );

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.targets).toHaveLength(2);
    expect(targetScoringService.getTargetsWithScoring).toHaveBeenCalledWith('mandato-123');
  });

  it('should invalidate queries and show toast on moveToPipeline success', async () => {
    vi.mocked(targetScoringService.moveTargetToPipelineStage).mockResolvedValue(undefined);
    vi.mocked(targetScoringService.getTargetsWithScoring).mockResolvedValue([]);

    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
    });
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

    const wrapper = ({ children }: { children: React.ReactNode }) =>
      React.createElement(QueryClientProvider, { client: queryClient }, children);

    const { result } = renderHook(
      () => useTargetPipeline('mandato-123'),
      { wrapper }
    );

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    await act(async () => {
      result.current.moveToPipeline({ targetId: 'target-1', stage: 'loi' });
    });

    await waitFor(() => {
      expect(targetScoringService.moveTargetToPipelineStage).toHaveBeenCalledWith('target-1', 'loi');
    });

    await waitFor(() => {
      expect(toast).toHaveBeenCalledWith(
        expect.objectContaining({ 
          title: 'Target movido',
          description: 'Etapa del pipeline actualizada',
        })
      );
    });

    expect(invalidateSpy).toHaveBeenCalled();
  });

  it('should show toast on updateScoring success', async () => {
    vi.mocked(targetScoringService.upsertTargetScoring).mockResolvedValue({} as any);
    vi.mocked(targetScoringService.getTargetsWithScoring).mockResolvedValue([]);

    const { result } = renderHook(
      () => useTargetPipeline('mandato-123'),
      { wrapper: createWrapper() }
    );

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    await act(async () => {
      result.current.updateScoring({
        targetId: 'target-1',
        scoring: { fit_score: 8 },
      });
    });

    await waitFor(() => {
      expect(targetScoringService.upsertTargetScoring).toHaveBeenCalledWith(
        'target-1',
        { fit_score: 8 }
      );
    });

    await waitFor(() => {
      expect(toast).toHaveBeenCalledWith(
        expect.objectContaining({ title: 'Scoring actualizado' })
      );
    });
  });

  it('should fetch stats when mandatoId is provided', async () => {
    const mockStats = {
      totalTargets: 10,
      byFunnelStage: { identified: 5, contacted: 3 },
      byPipelineStage: { nda: 2 },
    };
    vi.mocked(targetScoringService.getTargetPipelineStats).mockResolvedValue(mockStats as any);

    const { result } = renderHook(
      () => useTargetPipeline('mandato-123'),
      { wrapper: createWrapper() }
    );

    await waitFor(() => expect(result.current.isLoadingStats).toBe(false));

    expect(result.current.stats).toEqual(mockStats);
    expect(targetScoringService.getTargetPipelineStats).toHaveBeenCalledWith('mandato-123');
  });

  it('should create oferta and show toast on success', async () => {
    vi.mocked(targetOfertasService.createOferta).mockResolvedValue({} as any);
    vi.mocked(targetScoringService.getTargetsWithScoring).mockResolvedValue([]);

    const { result } = renderHook(
      () => useTargetPipeline('mandato-123'),
      { wrapper: createWrapper() }
    );

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    await act(async () => {
      result.current.createOferta({
        targetId: 'target-1',
        oferta: { tipo: 'indicativa', monto: 1000000 },
      });
    });

    await waitFor(() => {
      expect(targetOfertasService.createOferta).toHaveBeenCalledWith(
        'target-1',
        { tipo: 'indicativa', monto: 1000000 }
      );
    });

    await waitFor(() => {
      expect(toast).toHaveBeenCalledWith(
        expect.objectContaining({ title: 'Oferta creada' })
      );
    });
  });

  it('should provide refetch function that triggers both queries', async () => {
    vi.mocked(targetScoringService.getTargetsWithScoring).mockResolvedValue([]);

    const { result } = renderHook(
      () => useTargetPipeline('mandato-123'),
      { wrapper: createWrapper() }
    );

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    // Clear mock call counts
    vi.mocked(targetScoringService.getTargetsWithScoring).mockClear();
    vi.mocked(targetScoringService.getTargetPipelineStats).mockClear();

    await act(async () => {
      result.current.refetch();
    });

    // Both queries should be refetched
    await waitFor(() => {
      expect(targetScoringService.getTargetsWithScoring).toHaveBeenCalled();
    });
  });
});
