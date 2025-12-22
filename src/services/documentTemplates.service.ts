import { supabase } from "@/integrations/supabase/client";
import { DatabaseError } from "@/lib/error-handler";
import type { DocumentTemplate, TemplateCategory } from "@/types/documents";

// Obtener todas las plantillas activas
export async function getActiveTemplates(): Promise<DocumentTemplate[]> {
  const { data, error } = await supabase
    .from('document_templates')
    .select('*')
    .eq('is_active', true)
    .order('category', { ascending: true })
    .order('name', { ascending: true });

  if (error) {
    throw new DatabaseError('Error obteniendo plantillas', { code: error.code });
  }

  return (data || []) as DocumentTemplate[];
}

// Obtener plantillas por categoría
export async function getTemplatesByCategory(category: TemplateCategory): Promise<DocumentTemplate[]> {
  const { data, error } = await supabase
    .from('document_templates')
    .select('*')
    .eq('category', category)
    .eq('is_active', true)
    .order('name', { ascending: true });

  if (error) {
    throw new DatabaseError('Error obteniendo plantillas', { code: error.code });
  }

  return (data || []) as DocumentTemplate[];
}

// Obtener plantillas por tipo de operación
export async function getTemplatesByTipoOperacion(tipo: 'compra' | 'venta'): Promise<DocumentTemplate[]> {
  const { data, error } = await supabase
    .from('document_templates')
    .select('*')
    .or(`tipo_operacion.eq.${tipo},tipo_operacion.eq.ambos`)
    .eq('is_active', true)
    .order('fase_aplicable', { ascending: true })
    .order('name', { ascending: true });

  if (error) {
    throw new DatabaseError('Error obteniendo plantillas', { code: error.code });
  }

  return (data || []) as DocumentTemplate[];
}

// Obtener plantillas por fase
export async function getTemplatesByFase(fase: string): Promise<DocumentTemplate[]> {
  const { data, error } = await supabase
    .from('document_templates')
    .select('*')
    .eq('fase_aplicable', fase)
    .eq('is_active', true)
    .order('name', { ascending: true });

  if (error) {
    throw new DatabaseError('Error obteniendo plantillas', { code: error.code });
  }

  return (data || []) as DocumentTemplate[];
}

// Crear plantilla (admin)
export async function createTemplate(template: {
  name: string;
  category: string;
  description?: string;
  tipo_operacion?: string;
  fase_aplicable?: string;
  template_url?: string;
}): Promise<DocumentTemplate> {
  const { data, error } = await supabase
    .from('document_templates')
    .insert(template)
    .select()
    .single();

  if (error) {
    throw new DatabaseError('Error creando plantilla', { code: error.code });
  }

  return data as DocumentTemplate;
}

// Actualizar plantilla (admin)
export async function updateTemplate(id: string, updates: Partial<DocumentTemplate>): Promise<void> {
  const { error } = await supabase
    .from('document_templates')
    .update(updates)
    .eq('id', id);

  if (error) {
    throw new DatabaseError('Error actualizando plantilla', { code: error.code });
  }
}

// Desactivar plantilla (admin)
export async function deactivateTemplate(id: string): Promise<void> {
  const { error } = await supabase
    .from('document_templates')
    .update({ is_active: false })
    .eq('id', id);

  if (error) {
    throw new DatabaseError('Error desactivando plantilla', { code: error.code });
  }
}

// Agrupar plantillas por categoría
export function groupTemplatesByCategory(templates: DocumentTemplate[]): Record<TemplateCategory, DocumentTemplate[]> {
  const grouped: Record<string, DocumentTemplate[]> = {};
  
  templates.forEach(template => {
    if (!grouped[template.category]) {
      grouped[template.category] = [];
    }
    grouped[template.category].push(template);
  });

  return grouped as Record<TemplateCategory, DocumentTemplate[]>;
}

// Obtener icono por categoría
export function getTemplateCategoryIcon(category: TemplateCategory): string {
  switch (category) {
    case 'NDA': return 'shield';
    case 'LOI': return 'file-signature';
    case 'Teaser': return 'presentation';
    case 'SPA': return 'file-contract';
    case 'DD_Checklist': return 'list-checks';
    case 'Contrato': return 'scroll';
    default: return 'file';
  }
}

// Obtener color por categoría
export function getTemplateCategoryColor(category: TemplateCategory): string {
  switch (category) {
    case 'NDA': return 'text-red-500';
    case 'LOI': return 'text-blue-500';
    case 'Teaser': return 'text-green-500';
    case 'SPA': return 'text-purple-500';
    case 'DD_Checklist': return 'text-orange-500';
    case 'Contrato': return 'text-amber-500';
    default: return 'text-muted-foreground';
  }
}
