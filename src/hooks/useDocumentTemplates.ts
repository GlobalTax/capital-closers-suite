import { useQuery } from "@tanstack/react-query";
import {
  getActiveTemplates,
  getTemplatesByCategory,
  getTemplatesByTipoOperacion,
  groupTemplatesByCategory,
} from "@/services/documentTemplates.service";
import type { TemplateCategory } from "@/types/documents";

export function useDocumentTemplates() {
  const query = useQuery({
    queryKey: ['document-templates'],
    queryFn: getActiveTemplates,
    staleTime: 10 * 60 * 1000, // 10 minutos
  });

  const groupedTemplates = query.data 
    ? groupTemplatesByCategory(query.data) 
    : {} as Record<TemplateCategory, any[]>;

  return {
    templates: query.data || [],
    groupedTemplates,
    isLoading: query.isLoading,
    error: query.error,
  };
}

export function useTemplatesByCategory(category: TemplateCategory) {
  return useQuery({
    queryKey: ['document-templates', 'category', category],
    queryFn: () => getTemplatesByCategory(category),
    staleTime: 10 * 60 * 1000,
  });
}

export function useTemplatesByTipoOperacion(tipo: 'compra' | 'venta' | undefined) {
  return useQuery({
    queryKey: ['document-templates', 'tipo', tipo],
    queryFn: () => getTemplatesByTipoOperacion(tipo!),
    enabled: !!tipo,
    staleTime: 10 * 60 * 1000,
  });
}
