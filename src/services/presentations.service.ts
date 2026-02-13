import { supabase } from "@/integrations/supabase/client";
import { DatabaseError } from "@/lib/error-handler";
import type {
  PresentationProject, 
  PresentationSlide, 
  PresentationTemplate,
  PresentationSharingLink,
  PresentationType,
  SlideLayout,
} from "@/types/presentations";

// =============================================
// PROJECTS
// =============================================

export async function getProjects(): Promise<PresentationProject[]> {
  const { data, error } = await supabase
    .from('presentation_projects')
    .select('*')
    .order('updated_at', { ascending: false });

  if (error) throw new DatabaseError('Error al obtener proyectos', { supabaseError: error, table: 'presentation_projects' });
  return data as unknown as PresentationProject[];
}

export async function getProjectById(id: string): Promise<PresentationProject | null> {
  const { data, error } = await supabase
    .from('presentation_projects')
    .select('*')
    .eq('id', id)
    .single();

  if (error) throw error;
  return data as unknown as PresentationProject;
}

export async function createProject(project: Partial<PresentationProject>): Promise<PresentationProject> {
  const { data: user } = await supabase.auth.getUser();
  
  const { data, error } = await supabase
    .from('presentation_projects')
    .insert({
      title: project.title || 'Nueva Presentación',
      description: project.description,
      type: project.type || 'custom',
      status: project.status || 'draft',
      is_confidential: project.is_confidential ?? true,
      brand_kit_id: project.brand_kit_id,
      empresa_id: project.empresa_id,
      client_name: project.client_name,
      project_code: project.project_code,
      created_by: user.user?.id,
    } as never)
    .select()
    .single();

  if (error) throw new DatabaseError('Error al crear proyecto', { supabaseError: error, table: 'presentation_projects' });
  return data as unknown as PresentationProject;
}

export async function updateProject(id: string, updates: Partial<PresentationProject>): Promise<PresentationProject> {
  const { data, error } = await supabase
    .from('presentation_projects')
    .update({
      title: updates.title,
      description: updates.description,
      status: updates.status,
      is_confidential: updates.is_confidential,
      brand_kit_id: updates.brand_kit_id,
      client_name: updates.client_name,
    } as never)
    .eq('id', id)
    .select()
    .single();

  if (error) throw new DatabaseError('Error al actualizar proyecto', { supabaseError: error, table: 'presentation_projects', id });
  return data as unknown as PresentationProject;
}

export async function deleteProject(id: string): Promise<void> {
  const { error } = await supabase
    .from('presentation_projects')
    .delete()
    .eq('id', id);

  if (error) throw new DatabaseError('Error al eliminar proyecto', { supabaseError: error, table: 'presentation_projects', id });
}

// =============================================
// SLIDES
// =============================================

export async function getSlidesByProjectId(projectId: string): Promise<PresentationSlide[]> {
  const { data, error } = await supabase
    .from('presentation_slides')
    .select('*')
    .eq('project_id', projectId)
    .order('order_index', { ascending: true });

  if (error) throw new DatabaseError('Error al obtener slides', { supabaseError: error, table: 'presentation_slides' });
  return data as unknown as PresentationSlide[];
}

export async function createSlide(slide: Partial<PresentationSlide>): Promise<PresentationSlide> {
  const { data, error } = await supabase
    .from('presentation_slides')
    .insert({
      project_id: slide.project_id,
      order_index: slide.order_index ?? 0,
      layout: slide.layout || 'title',
      headline: slide.headline,
      subline: slide.subline,
      content: slide.content || {},
      is_hidden: slide.is_hidden ?? false,
      is_locked: slide.is_locked ?? false,
    } as never)
    .select()
    .single();

  if (error) throw new DatabaseError('Error al crear slide', { supabaseError: error, table: 'presentation_slides' });
  return data as unknown as PresentationSlide;
}

export async function updateSlide(id: string, updates: Partial<PresentationSlide>): Promise<PresentationSlide> {
  const { data, error } = await supabase
    .from('presentation_slides')
    .update({
      layout: updates.layout,
      headline: updates.headline,
      subline: updates.subline,
      content: updates.content,
      background_color: updates.background_color,
      text_color: updates.text_color,
      is_hidden: updates.is_hidden,
      notes: updates.notes,
    } as never)
    .eq('id', id)
    .select()
    .single();

  if (error) throw new DatabaseError('Error al actualizar slide', { supabaseError: error, table: 'presentation_slides', id });
  return data as unknown as PresentationSlide;
}

export async function deleteSlide(id: string): Promise<void> {
  const { error } = await supabase
    .from('presentation_slides')
    .delete()
    .eq('id', id);

  if (error) throw new DatabaseError('Error al eliminar slide', { supabaseError: error, table: 'presentation_slides', id });
}

export async function reorderSlides(projectId: string, slideIds: string[]): Promise<void> {
  const results = await Promise.allSettled(
    slideIds.map((id, index) =>
      supabase
        .from('presentation_slides')
        .update({ order_index: index } as never)
        .eq('id', id)
    )
  );

  const failed = results.filter(r => r.status === 'rejected');
  if (failed.length > 0) {
    throw new DatabaseError('Error al reordenar slides', { table: 'presentation_slides' });
  }

  // Also check for Supabase-level errors (fulfilled but with error field)
  const supabaseErrors = results
    .filter((r): r is PromiseFulfilledResult<any> => r.status === 'fulfilled')
    .filter(r => r.value?.error);
  if (supabaseErrors.length > 0) {
    throw new DatabaseError('Error al reordenar slides', { supabaseError: supabaseErrors[0].value.error, table: 'presentation_slides' });
  }
}

export async function duplicateSlide(slideId: string): Promise<PresentationSlide> {
  const { data: original, error: fetchError } = await supabase
    .from('presentation_slides')
    .select('*')
    .eq('id', slideId)
    .single();

  if (fetchError) throw new DatabaseError('Error al obtener slide para duplicar', { supabaseError: fetchError, table: 'presentation_slides', id: slideId });

  const typedOriginal = original as unknown as PresentationSlide;
  
  const { data, error } = await supabase
    .from('presentation_slides')
    .insert({
      project_id: typedOriginal.project_id,
      order_index: typedOriginal.order_index + 1,
      layout: typedOriginal.layout,
      headline: typedOriginal.headline,
      subline: typedOriginal.subline,
      content: typedOriginal.content,
      background_color: typedOriginal.background_color,
      text_color: typedOriginal.text_color,
      is_hidden: false,
      is_locked: false,
    } as never)
    .select()
    .single();

  if (error) throw new DatabaseError('Error al duplicar slide', { supabaseError: error, table: 'presentation_slides' });
  return data as unknown as PresentationSlide;
}

// =============================================
// TEMPLATES
// =============================================

export async function getTemplates(): Promise<PresentationTemplate[]> {
  const { data, error } = await supabase
    .from('presentation_templates')
    .select('*')
    .eq('is_active', true)
    .order('display_order', { ascending: true });

  if (error) throw new DatabaseError('Error al obtener plantillas', { supabaseError: error, table: 'presentation_templates' });
  return data as unknown as PresentationTemplate[];
}

export async function getTemplateById(id: string): Promise<PresentationTemplate | null> {
  const { data, error } = await supabase
    .from('presentation_templates')
    .select('*')
    .eq('id', id)
    .single();

  if (error) throw new DatabaseError('Error al obtener plantilla', { supabaseError: error, table: 'presentation_templates', id });
  return data as unknown as PresentationTemplate;
}

// =============================================
// SHARING
// =============================================

export async function createShareLink(
  projectId: string, 
  options: {
    permission?: 'view' | 'download_pdf';
    expiresAt?: string;
    maxViews?: number;
    recipientEmail?: string;
    recipientName?: string;
  } = {}
): Promise<PresentationSharingLink> {
  const { data: user } = await supabase.auth.getUser();
  
  const { data, error } = await supabase
    .from('presentation_sharing_links')
    .insert({
      project_id: projectId,
      permission: options.permission || 'view',
      expires_at: options.expiresAt,
      max_views: options.maxViews,
      recipient_email: options.recipientEmail,
      recipient_name: options.recipientName,
      created_by: user.user?.id,
    })
    .select()
    .single();

  if (error) throw new DatabaseError('Error al crear enlace compartido', { supabaseError: error, table: 'presentation_sharing_links' });
  return data as unknown as PresentationSharingLink;
}

export async function getShareLinksByProject(projectId: string): Promise<PresentationSharingLink[]> {
  const { data, error } = await supabase
    .from('presentation_sharing_links')
    .select('*')
    .eq('project_id', projectId)
    .order('created_at', { ascending: false });

  if (error) throw new DatabaseError('Error al obtener enlaces compartidos', { supabaseError: error, table: 'presentation_sharing_links' });
  return data as unknown as PresentationSharingLink[];
}

export async function validateShareToken(token: string): Promise<{
  valid: boolean;
  project?: PresentationProject;
  slides?: PresentationSlide[];
  permission?: 'view' | 'download_pdf';
}> {
  const { data: link, error: linkError } = await supabase
    .from('presentation_sharing_links')
    .select('*')
    .eq('token', token)
    .eq('is_active', true)
    .single();

  if (linkError || !link) {
    return { valid: false };
  }

  const typedLink = link as unknown as PresentationSharingLink;

  // Check expiration
  if (typedLink.expires_at && new Date(typedLink.expires_at) < new Date()) {
    return { valid: false };
  }

  // Check max views
  if (typedLink.max_views && typedLink.view_count >= typedLink.max_views) {
    return { valid: false };
  }

  // Increment view count
  await supabase
    .from('presentation_sharing_links')
    .update({ 
      view_count: typedLink.view_count + 1,
      last_accessed_at: new Date().toISOString(),
    })
    .eq('id', typedLink.id);

  // Get project and slides
  const [projectResult, slidesResult] = await Promise.all([
    getProjectById(typedLink.project_id),
    getSlidesByProjectId(typedLink.project_id),
  ]);

  return {
    valid: true,
    project: projectResult || undefined,
    slides: slidesResult,
    permission: typedLink.permission,
  };
}

export async function deactivateShareLink(id: string): Promise<void> {
  const { error } = await supabase
    .from('presentation_sharing_links')
    .update({ is_active: false })
    .eq('id', id);

  if (error) throw new DatabaseError('Error al desactivar enlace', { supabaseError: error, table: 'presentation_sharing_links', id });
}

// =============================================
// HELPERS
// =============================================

export function getDefaultSlidesForTemplate(type: PresentationType): Partial<PresentationSlide>[] {
  switch (type) {
    case 'teaser_sell':
      return [
        { layout: 'title' as SlideLayout, order_index: 0, headline: 'Proyecto Confidencial', subline: 'Teaser de Inversión' },
        { layout: 'overview' as SlideLayout, order_index: 1, headline: 'Resumen Ejecutivo' },
        { layout: 'bullets' as SlideLayout, order_index: 2, headline: 'Descripción de la Compañía' },
        { layout: 'financials' as SlideLayout, order_index: 3, headline: 'Información Financiera' },
        { layout: 'stats' as SlideLayout, order_index: 4, headline: 'Highlights de Inversión' },
        { layout: 'market' as SlideLayout, order_index: 5, headline: 'Posición de Mercado' },
        { layout: 'bullets' as SlideLayout, order_index: 6, headline: 'Oportunidades de Crecimiento' },
        { layout: 'closing' as SlideLayout, order_index: 7, headline: 'Proceso y Contacto' },
      ];
    case 'firm_deck':
      return [
        { layout: 'title' as SlideLayout, order_index: 0, headline: 'Presentación Corporativa' },
        { layout: 'overview' as SlideLayout, order_index: 1, headline: 'Sobre Nosotros' },
        { layout: 'bullets' as SlideLayout, order_index: 2, headline: 'Nuestros Servicios' },
        { layout: 'stats' as SlideLayout, order_index: 3, headline: 'Track Record' },
        { layout: 'team' as SlideLayout, order_index: 4, headline: 'Nuestro Equipo' },
        { layout: 'closing' as SlideLayout, order_index: 5, headline: 'Contacto' },
      ];
    case 'client_deck':
      return [
        { layout: 'title' as SlideLayout, order_index: 0, headline: 'Propuesta de Servicios' },
        { layout: 'overview' as SlideLayout, order_index: 1, headline: 'Entendimiento de la Situación' },
        { layout: 'bullets' as SlideLayout, order_index: 2, headline: 'Nuestra Aproximación' },
        { layout: 'timeline' as SlideLayout, order_index: 3, headline: 'Plan de Trabajo' },
        { layout: 'team' as SlideLayout, order_index: 4, headline: 'Equipo y Honorarios' },
        { layout: 'closing' as SlideLayout, order_index: 5, headline: 'Próximos Pasos' },
      ];
    case 'one_pager':
      return [
        { layout: 'title' as SlideLayout, order_index: 0, headline: 'Resumen Ejecutivo' },
        { layout: 'overview' as SlideLayout, order_index: 1, headline: 'Información Principal' },
        { layout: 'closing' as SlideLayout, order_index: 2, headline: 'Contacto' },
      ];
    default:
      return [
        { layout: 'title' as SlideLayout, order_index: 0, headline: 'Nueva Presentación' },
      ];
  }
}
