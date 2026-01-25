import { supabase } from "@/integrations/supabase/client";

// =============================================
// TYPES
// =============================================

export type TemplateType = 'teaser' | 'follow_up' | 'reminder' | 'custom';
export type TemplateLanguage = 'ES' | 'EN';

export interface EmailTemplate {
  id: string;
  nombre: string;
  idioma: TemplateLanguage;
  tipo: TemplateType;
  subject_template: string;
  html_content: string;
  text_content: string | null;
  variables: string[];
  is_default: boolean;
  is_active: boolean;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateTemplateData {
  nombre: string;
  idioma: TemplateLanguage;
  tipo?: TemplateType;
  subject_template: string;
  html_content: string;
  text_content?: string | null;
  variables?: string[];
  is_default?: boolean;
}

export interface UpdateTemplateData {
  nombre?: string;
  idioma?: TemplateLanguage;
  tipo?: TemplateType;
  subject_template?: string;
  html_content?: string;
  text_content?: string | null;
  variables?: string[];
  is_default?: boolean;
  is_active?: boolean;
}

// =============================================
// AVAILABLE VARIABLES
// =============================================

export const TEMPLATE_VARIABLES = [
  { key: 'contact_name', label: 'Nombre del contacto', example: 'Juan García' },
  { key: 'company', label: 'Nombre de la empresa', example: 'Acme Corp' },
  { key: 'mandato_nombre', label: 'Nombre del mandato', example: 'SELK Suministros' },
  { key: 'custom_message', label: 'Mensaje personalizado', example: '' },
  { key: 'teaser_link', label: 'Enlace al teaser', example: 'https://...' },
] as const;

// =============================================
// CRUD OPERATIONS
// =============================================

export async function getTemplates(idioma?: TemplateLanguage): Promise<EmailTemplate[]> {
  let query = supabase
    .from("email_templates")
    .select("*")
    .eq("is_active", true)
    .order("is_default", { ascending: false })
    .order("nombre", { ascending: true });

  if (idioma) {
    query = query.eq("idioma", idioma);
  }

  const { data, error } = await query;

  if (error) throw error;
  return (data || []).map(t => ({
    ...t,
    variables: t.variables as string[],
  })) as EmailTemplate[];
}

export async function getTemplateById(id: string): Promise<EmailTemplate | null> {
  const { data, error } = await supabase
    .from("email_templates")
    .select("*")
    .eq("id", id)
    .single();

  if (error) {
    if (error.code === "PGRST116") return null;
    throw error;
  }
  
  return {
    ...data,
    variables: data.variables as string[],
  } as EmailTemplate;
}

export async function getDefaultTemplate(idioma: TemplateLanguage, tipo: TemplateType = 'teaser'): Promise<EmailTemplate | null> {
  const { data, error } = await supabase
    .from("email_templates")
    .select("*")
    .eq("idioma", idioma)
    .eq("tipo", tipo)
    .eq("is_default", true)
    .eq("is_active", true)
    .single();

  if (error) {
    if (error.code === "PGRST116") return null;
    throw error;
  }
  
  return {
    ...data,
    variables: data.variables as string[],
  } as EmailTemplate;
}

export async function createTemplate(data: CreateTemplateData): Promise<EmailTemplate> {
  // If setting as default, unset other defaults for same language/type
  if (data.is_default) {
    await supabase
      .from("email_templates")
      .update({ is_default: false })
      .eq("idioma", data.idioma)
      .eq("tipo", data.tipo || "teaser");
  }

  const { data: template, error } = await supabase
    .from("email_templates")
    .insert({
      nombre: data.nombre,
      idioma: data.idioma,
      tipo: data.tipo || "teaser",
      subject_template: data.subject_template,
      html_content: data.html_content,
      text_content: data.text_content || null,
      variables: data.variables || ["contact_name", "company", "mandato_nombre", "custom_message"],
      is_default: data.is_default || false,
      is_active: true,
    })
    .select()
    .single();

  if (error) throw error;
  
  return {
    ...template,
    variables: template.variables as string[],
  } as EmailTemplate;
}

export async function updateTemplate(id: string, data: UpdateTemplateData): Promise<EmailTemplate> {
  // If setting as default, get current template to know its language/type
  if (data.is_default) {
    const current = await getTemplateById(id);
    if (current) {
      await supabase
        .from("email_templates")
        .update({ is_default: false })
        .eq("idioma", data.idioma || current.idioma)
        .eq("tipo", data.tipo || current.tipo)
        .neq("id", id);
    }
  }

  const { data: template, error } = await supabase
    .from("email_templates")
    .update(data)
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  
  return {
    ...template,
    variables: template.variables as string[],
  } as EmailTemplate;
}

export async function deleteTemplate(id: string): Promise<void> {
  // Soft delete by setting is_active to false
  const { error } = await supabase
    .from("email_templates")
    .update({ is_active: false })
    .eq("id", id);

  if (error) throw error;
}

// =============================================
// TEMPLATE RENDERING
// =============================================

export interface RenderVariables {
  contact_name?: string;
  company?: string;
  mandato_nombre?: string;
  custom_message?: string;
  teaser_link?: string;
  [key: string]: string | undefined;
}

export function renderTemplate(template: EmailTemplate, variables: RenderVariables): {
  subject: string;
  html: string;
  text: string | null;
} {
  let subject = template.subject_template;
  let html = template.html_content;
  let text = template.text_content;

  // Replace all variables
  for (const [key, value] of Object.entries(variables)) {
    const regex = new RegExp(`{{${key}}}`, "g");
    const replacement = value || "";
    
    subject = subject.replace(regex, replacement);
    html = html.replace(regex, replacement);
    if (text) {
      text = text.replace(regex, replacement);
    }
  }

  // Remove any unreplaced variables
  const unreplacedRegex = /{{[^}]+}}/g;
  subject = subject.replace(unreplacedRegex, "");
  html = html.replace(unreplacedRegex, "");
  if (text) {
    text = text.replace(unreplacedRegex, "");
  }

  return { subject, html, text };
}

// =============================================
// PREVIEW DATA
// =============================================

export const PREVIEW_DATA: RenderVariables = {
  contact_name: "Juan García",
  company: "Acme Inversiones S.L.",
  mandato_nombre: "SELK Suministros Industriales",
  custom_message: "",
  teaser_link: "https://capittal.es/teaser/example",
};

// =============================================
// SEND TEST EMAIL
// =============================================

interface SendTestEmailParams {
  templateId?: string;
  testEmail: string;
  subjectTemplate: string;
  htmlContent: string;
  variables?: RenderVariables;
}

export async function sendTestEmail(params: SendTestEmailParams): Promise<{ success: boolean; emailId?: string }> {
  const { data, error } = await supabase.functions.invoke("send-test-email", {
    body: params,
  });

  if (error) throw error;
  return data;
}