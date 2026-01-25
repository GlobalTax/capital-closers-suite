import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  getTemplates,
  getTemplateById,
  getDefaultTemplate,
  createTemplate,
  updateTemplate,
  deleteTemplate,
  sendTestEmail,
  type EmailTemplate,
  type CreateTemplateData,
  type UpdateTemplateData,
  type TemplateLanguage,
  type TemplateType,
  type RenderVariables,
} from "@/services/emailTemplate.service";

// =============================================
// QUERY HOOKS
// =============================================

export function useEmailTemplates(idioma?: TemplateLanguage) {
  return useQuery({
    queryKey: ["email-templates", idioma],
    queryFn: () => getTemplates(idioma),
  });
}

export function useEmailTemplate(id: string | undefined) {
  return useQuery({
    queryKey: ["email-template", id],
    queryFn: () => id ? getTemplateById(id) : null,
    enabled: !!id,
  });
}

export function useDefaultTemplate(idioma: TemplateLanguage, tipo: TemplateType = 'teaser') {
  return useQuery({
    queryKey: ["email-template-default", idioma, tipo],
    queryFn: () => getDefaultTemplate(idioma, tipo),
  });
}

// =============================================
// MUTATION HOOKS
// =============================================

export function useCreateTemplate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateTemplateData) => createTemplate(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["email-templates"] });
      toast.success("Plantilla creada correctamente");
    },
    onError: (error: Error) => {
      toast.error(`Error al crear plantilla: ${error.message}`);
    },
  });
}

export function useUpdateTemplate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateTemplateData }) =>
      updateTemplate(id, data),
    onSuccess: (template) => {
      queryClient.invalidateQueries({ queryKey: ["email-templates"] });
      queryClient.invalidateQueries({ queryKey: ["email-template", template.id] });
      toast.success("Plantilla actualizada");
    },
    onError: (error: Error) => {
      toast.error(`Error al actualizar plantilla: ${error.message}`);
    },
  });
}

export function useDeleteTemplate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteTemplate(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["email-templates"] });
      toast.success("Plantilla eliminada");
    },
    onError: (error: Error) => {
      toast.error(`Error al eliminar plantilla: ${error.message}`);
    },
  });
}

// =============================================
// TEST EMAIL HOOK
// =============================================

interface SendTestEmailParams {
  templateId?: string;
  testEmail: string;
  subjectTemplate: string;
  htmlContent: string;
  variables?: RenderVariables;
}

export function useSendTestEmail() {
  return useMutation({
    mutationFn: (params: SendTestEmailParams) => sendTestEmail(params),
    onSuccess: () => {
      toast.success("Email de prueba enviado correctamente");
    },
    onError: (error: Error) => {
      toast.error(`Error al enviar email de prueba: ${error.message}`);
    },
  });
}