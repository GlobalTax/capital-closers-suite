import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import type { PresentationVersion, PresentationSlide } from "@/types/presentations";

// =============================================
// VERSION MANAGEMENT HOOKS
// =============================================

export function usePresentationVersions(projectId: string | undefined) {
  return useQuery({
    queryKey: ['presentation-versions', projectId],
    queryFn: async () => {
      if (!projectId) return [];
      const { data, error } = await supabase
        .from('presentation_versions')
        .select('*')
        .eq('project_id', projectId)
        .order('version_number', { ascending: false });
      
      if (error) throw error;
      return data as unknown as PresentationVersion[];
    },
    enabled: !!projectId,
    staleTime: 30 * 1000,
  });
}

export function useCreateVersion() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      projectId, 
      slides, 
      notes 
    }: { 
      projectId: string; 
      slides: PresentationSlide[]; 
      notes?: string;
    }) => {
      // Get the next version number
      const { data: existingVersions, error: countError } = await supabase
        .from('presentation_versions')
        .select('version_number')
        .eq('project_id', projectId)
        .order('version_number', { ascending: false })
        .limit(1);

      if (countError) throw countError;

      const nextVersionNumber = (existingVersions?.[0]?.version_number || 0) + 1;

      // Create snapshot of all slides
      const snapshot = {
        slides: slides.map(s => ({
          id: s.id,
          order_index: s.order_index,
          layout: s.layout,
          headline: s.headline,
          subline: s.subline,
          content: s.content,
          background_color: s.background_color,
          text_color: s.text_color,
          is_hidden: s.is_hidden,
          notes: s.notes,
          approval_status: s.approval_status,
          is_locked: s.is_locked,
        })),
        created_at: new Date().toISOString(),
      };

      const { data: user } = await supabase.auth.getUser();

      const { data, error } = await supabase
        .from('presentation_versions')
        .insert({
          project_id: projectId,
          version_number: nextVersionNumber,
          snapshot: snapshot as never,
          notes,
          created_by: user.user?.id,
        })
        .select()
        .single();

      if (error) throw error;
      return data as unknown as PresentationVersion;
    },
    onSuccess: (_, { projectId }) => {
      queryClient.invalidateQueries({ queryKey: ['presentation-versions', projectId] });
      toast.success('Versión guardada');
    },
    onError: (error) => {
      toast.error('Error al guardar versión');
      console.error(error);
    },
  });
}

export function useRestoreVersion() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      version, 
      projectId 
    }: { 
      version: PresentationVersion; 
      projectId: string;
    }) => {
      const snapshot = version.snapshot as { slides: Array<Partial<PresentationSlide>> } | null;
      if (!snapshot?.slides) throw new Error('Invalid version snapshot');

      // Delete current slides
      const { error: deleteError } = await supabase
        .from('presentation_slides')
        .delete()
        .eq('project_id', projectId);

      if (deleteError) throw deleteError;

      // Restore slides from snapshot
      for (const slideData of snapshot.slides) {
        const { error: insertError } = await supabase
          .from('presentation_slides')
          .insert({
            project_id: projectId,
            order_index: slideData.order_index ?? 0,
            layout: slideData.layout || 'title',
            headline: slideData.headline,
            subline: slideData.subline,
            content: slideData.content || {},
            background_color: slideData.background_color,
            text_color: slideData.text_color,
            is_hidden: slideData.is_hidden ?? false,
            is_locked: slideData.is_locked ?? false,
            approval_status: slideData.approval_status,
          } as never);

        if (insertError) throw insertError;
      }

      return { projectId, versionNumber: version.version_number };
    },
    onSuccess: ({ projectId }) => {
      queryClient.invalidateQueries({ queryKey: ['presentation-slides', projectId] });
      toast.success('Versión restaurada');
    },
    onError: (error) => {
      toast.error('Error al restaurar versión');
      console.error(error);
    },
  });
}

// =============================================
// SLIDE APPROVAL HOOKS
// =============================================

export function useApproveSlide() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ slideId, projectId }: { slideId: string; projectId: string }) => {
      const { data: user } = await supabase.auth.getUser();

      const { data, error } = await supabase
        .from('presentation_slides')
        .update({
          approval_status: 'approved',
          is_locked: true,
          approved_at: new Date().toISOString(),
          approved_by: user.user?.id,
        } as never)
        .eq('id', slideId)
        .select()
        .single();

      if (error) throw error;
      return { slide: data, projectId };
    },
    onSuccess: ({ projectId }) => {
      queryClient.invalidateQueries({ queryKey: ['presentation-slides', projectId] });
      toast.success('Slide aprobado y bloqueado');
    },
    onError: (error) => {
      toast.error('Error al aprobar slide');
      console.error(error);
    },
  });
}

export function useUnlockSlide() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ slideId, projectId }: { slideId: string; projectId: string }) => {
      const { data, error } = await supabase
        .from('presentation_slides')
        .update({
          approval_status: 'pending',
          is_locked: false,
          approved_at: null,
          approved_by: null,
        } as never)
        .eq('id', slideId)
        .select()
        .single();

      if (error) throw error;
      return { slide: data, projectId };
    },
    onSuccess: ({ projectId }) => {
      queryClient.invalidateQueries({ queryKey: ['presentation-slides', projectId] });
      toast.success('Slide desbloqueado');
    },
    onError: (error) => {
      toast.error('Error al desbloquear slide');
      console.error(error);
    },
  });
}

// =============================================
// HELPERS
// =============================================

export function isSlideProtected(slide: PresentationSlide): boolean {
  return slide.is_locked || slide.approval_status === 'approved';
}

export function getProtectedSlideIds(slides: PresentationSlide[]): string[] {
  return slides.filter(isSlideProtected).map(s => s.id);
}

export function getUnprotectedSlides(slides: PresentationSlide[]): PresentationSlide[] {
  return slides.filter(s => !isSlideProtected(s));
}
