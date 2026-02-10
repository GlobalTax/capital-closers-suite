import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import * as presentationsService from "@/services/presentations.service";
import type { 
  PresentationProject,
  PresentationSlide,
  PresentationType,
} from "@/types/presentations";

// =============================================
// PROJECTS HOOKS
// =============================================

export function usePresentationProjects() {
  return useQuery({
    queryKey: ['presentation-projects'],
    queryFn: presentationsService.getProjects,
    staleTime: 30 * 1000,
  });
}

export function usePresentationProject(id: string | undefined) {
  return useQuery({
    queryKey: ['presentation-project', id],
    queryFn: () => presentationsService.getProjectById(id!),
    enabled: !!id,
    staleTime: 30 * 1000,
  });
}

export function useCreateProject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      project, 
      templateType 
    }: { 
      project: Partial<PresentationProject>; 
      templateType: PresentationType;
    }) => {
      // Create project
      const newProject = await presentationsService.createProject(project);
      
      // Create default slides based on template
      const defaultSlides = presentationsService.getDefaultSlidesForTemplate(templateType);
      
      for (const slideData of defaultSlides) {
        await presentationsService.createSlide({
          ...slideData,
          project_id: newProject.id,
          content: slideData.content || {},
          is_hidden: false,
          is_locked: false,
        } as Partial<PresentationSlide>);
      }
      
      return newProject;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['presentation-projects'] });
      toast.success('Presentación creada');
    },
    onError: (error) => {
      toast.error('Error al crear presentación');
      console.error(error);
    },
  });
}

export function useUpdateProject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<PresentationProject> }) =>
      presentationsService.updateProject(id, updates),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['presentation-projects'] });
      queryClient.invalidateQueries({ queryKey: ['presentation-project', id] });
    },
    onError: (error) => {
      toast.error('Error al actualizar presentación');
      console.error(error);
    },
  });
}

export function useDeleteProject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: presentationsService.deleteProject,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['presentation-projects'] });
      toast.success('Presentación eliminada');
    },
    onError: (error) => {
      toast.error('Error al eliminar presentación');
      console.error(error);
    },
  });
}

// =============================================
// SLIDES HOOKS
// =============================================

export function usePresentationSlides(projectId: string | undefined) {
  return useQuery({
    queryKey: ['presentation-slides', projectId],
    queryFn: () => presentationsService.getSlidesByProjectId(projectId!),
    enabled: !!projectId,
    staleTime: 10 * 1000,
  });
}

export function useCreateSlide() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: presentationsService.createSlide,
    onSuccess: (slide) => {
      queryClient.invalidateQueries({ queryKey: ['presentation-slides', slide.project_id] });
      toast.success('Slide añadido');
    },
    onError: (error) => {
      toast.error('Error al añadir slide');
      console.error(error);
    },
  });
}

export function useUpdateSlide() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<PresentationSlide> }) =>
      presentationsService.updateSlide(id, updates),
    onSuccess: (slide) => {
      queryClient.invalidateQueries({ queryKey: ['presentation-slides', slide.project_id] });
    },
    onError: (error) => {
      toast.error('Error al actualizar slide');
      console.error(error);
    },
  });
}

export function useDeleteSlide() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, projectId }: { id: string; projectId: string }) =>
      presentationsService.deleteSlide(id).then(() => projectId),
    onSuccess: (projectId) => {
      queryClient.invalidateQueries({ queryKey: ['presentation-slides', projectId] });
      toast.success('Slide eliminado');
    },
    onError: (error) => {
      toast.error('Error al eliminar slide');
      console.error(error);
    },
  });
}

export function useReorderSlides() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ projectId, slideIds }: { projectId: string; slideIds: string[] }) =>
      presentationsService.reorderSlides(projectId, slideIds).then(() => projectId),
    onSuccess: (projectId) => {
      queryClient.invalidateQueries({ queryKey: ['presentation-slides', projectId] });
    },
    onError: (error) => {
      toast.error('Error al reordenar slides');
      console.error(error);
    },
  });
}

export function useDuplicateSlide() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: presentationsService.duplicateSlide,
    onSuccess: (slide) => {
      queryClient.invalidateQueries({ queryKey: ['presentation-slides', slide.project_id] });
      toast.success('Slide duplicado');
    },
    onError: (error) => {
      toast.error('Error al duplicar slide');
      console.error(error);
    },
  });
}

// =============================================
// TEMPLATES HOOKS
// =============================================

export function usePresentationTemplates() {
  return useQuery({
    queryKey: ['presentation-templates'],
    queryFn: presentationsService.getTemplates,
    staleTime: 5 * 60 * 1000,
  });
}

// =============================================
// SHARING HOOKS
// =============================================

export function useShareLinks(projectId: string | undefined) {
  return useQuery({
    queryKey: ['presentation-share-links', projectId],
    queryFn: () => presentationsService.getShareLinksByProject(projectId!),
    enabled: !!projectId,
    staleTime: 30 * 1000,
  });
}

export function useCreateShareLink() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ 
      projectId, 
      options 
    }: { 
      projectId: string; 
      options?: Parameters<typeof presentationsService.createShareLink>[1];
    }) => presentationsService.createShareLink(projectId, options),
    onSuccess: (link) => {
      queryClient.invalidateQueries({ queryKey: ['presentation-share-links', link.project_id] });
      toast.success('Enlace de compartir creado');
    },
    onError: (error) => {
      toast.error('Error al crear enlace');
      console.error(error);
    },
  });
}

export function useDeactivateShareLink() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, projectId }: { id: string; projectId: string }) =>
      presentationsService.deactivateShareLink(id).then(() => projectId),
    onSuccess: (projectId) => {
      queryClient.invalidateQueries({ queryKey: ['presentation-share-links', projectId] });
      toast.success('Enlace desactivado');
    },
    onError: (error) => {
      toast.error('Error al desactivar enlace');
      console.error(error);
    },
  });
}

export function useValidateShareToken(token: string | undefined) {
  return useQuery({
    queryKey: ['presentation-share-validate', token],
    queryFn: () => presentationsService.validateShareToken(token!),
    enabled: !!token,
    staleTime: 5 * 60 * 1000,
    retry: false,
  });
}
