import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { ONBOARDING_STEPS } from '@/config/onboardingSteps';
import type { UserOnboardingProgress, OnboardingState } from '@/types/onboarding';
import { toast } from 'sonner';

interface AutoChecks {
  has_empresa: boolean;
  has_contacto: boolean;
  has_mandato: boolean;
  has_documento: boolean;
  has_tarea: boolean;
  has_viewed_report: boolean;
}

export function useOnboarding() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  
  // Query: Get user progress
  const { data: progress, isLoading } = useQuery({
    queryKey: ['onboarding-progress', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('user_onboarding_progress')
        .select('*')
        .eq('user_id', user!.id);
      
      if (error) throw error;
      return data as UserOnboardingProgress[];
    },
    enabled: !!user?.id,
  });

  // Query: Automatic checks (has_empresa, has_contacto, etc.)
  const { data: autoChecks } = useQuery({
    queryKey: ['onboarding-auto-checks', user?.id],
    queryFn: async (): Promise<AutoChecks> => {
      const [empresas, contactos, mandatos, documentos, tareas] = await Promise.all([
        supabase.from('empresas').select('id', { count: 'exact', head: true }),
        supabase.from('contactos').select('id', { count: 'exact', head: true }),
        supabase.from('mandatos').select('id', { count: 'exact', head: true }),
        supabase.from('documentos').select('id', { count: 'exact', head: true }),
        supabase.from('tareas').select('id', { count: 'exact', head: true }),
      ]);
      
      return {
        has_empresa: (empresas.count || 0) > 0,
        has_contacto: (contactos.count || 0) > 0,
        has_mandato: (mandatos.count || 0) > 0,
        has_documento: (documentos.count || 0) > 0,
        has_tarea: (tareas.count || 0) > 0,
        has_viewed_report: false, // Marked manually when visiting /reportes
      };
    },
    enabled: !!user?.id,
    staleTime: 1000 * 60, // Cache 1 minute
  });

  // Mutation: Mark step as completed
  const completeStepMutation = useMutation({
    mutationFn: async (stepId: string) => {
      const { error } = await supabase
        .from('user_onboarding_progress')
        .upsert({
          user_id: user!.id,
          step_id: stepId,
          completed_at: new Date().toISOString(),
          skipped: false,
          updated_at: new Date().toISOString(),
        }, { onConflict: 'user_id,step_id' });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['onboarding-progress'] });
    },
  });

  // Mutation: Reset onboarding
  const resetOnboardingMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from('user_onboarding_progress')
        .delete()
        .eq('user_id', user!.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['onboarding-progress'] });
      toast.success('Onboarding reiniciado');
    },
  });

  // Derived state
  const state: OnboardingState = useMemo(() => {
    const steps = ONBOARDING_STEPS.map(step => {
      const manualProgress = progress?.find(p => p.step_id === step.id);
      const autoCompleted = step.autoCompleteCheck && autoChecks?.[step.autoCompleteCheck];
      
      return {
        id: step.id,
        completed: !!manualProgress?.completed_at || !!autoCompleted,
        completedAt: manualProgress?.completed_at || null,
        skipped: manualProgress?.skipped || false,
      };
    });
    
    const completedSteps = steps.filter(s => s.completed).length;
    
    return {
      steps,
      totalSteps: ONBOARDING_STEPS.length,
      completedSteps,
      progressPercentage: Math.round((completedSteps / ONBOARDING_STEPS.length) * 100),
      isComplete: completedSteps === ONBOARDING_STEPS.length,
    };
  }, [progress, autoChecks]);

  return {
    state,
    isLoading,
    completeStep: completeStepMutation.mutate,
    resetOnboarding: resetOnboardingMutation.mutate,
    isResetting: resetOnboardingMutation.isPending,
  };
}
