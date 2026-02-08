import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface DealDocumentSection {
  section_title: string;
  content: string;
  order: number;
}

export interface GeneratedDealDocument {
  id: string;
  mandato_id: string;
  template_id: string | null;
  document_type: "teaser" | "cim";
  language: string;
  title: string;
  sections: DealDocumentSection[];
  metadata: Record<string, any>;
  status: "draft" | "reviewed" | "approved" | "exported";
  version: number;
  pdf_storage_path: string | null;
  generated_by: string | null;
  reviewed_by: string | null;
  approved_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface DealDocumentTemplate {
  id: string;
  name: string;
  document_type: "teaser" | "cim";
  language: string;
  sections: { order: number; title: string; instructions: string }[];
  tone: string;
  is_default: boolean;
  is_active: boolean;
}

export function useDealDocuments(mandatoId: string | undefined) {
  return useQuery({
    queryKey: ["deal-documents", mandatoId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("generated_deal_documents")
        .select("*")
        .eq("mandato_id", mandatoId!)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data || []) as unknown as GeneratedDealDocument[];
    },
    enabled: !!mandatoId,
  });
}

export function useDealDocumentTemplates(documentType?: "teaser" | "cim") {
  return useQuery({
    queryKey: ["deal-document-templates", documentType],
    queryFn: async () => {
      let query = supabase
        .from("deal_document_templates")
        .select("*")
        .eq("is_active", true)
        .order("name");
      if (documentType) query = query.eq("document_type", documentType);
      const { data, error } = await query;
      if (error) throw error;
      return (data || []) as unknown as DealDocumentTemplate[];
    },
    staleTime: 10 * 60 * 1000,
  });
}

export function useGenerateDealDocument() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: {
      mandato_id: string;
      document_type: "teaser" | "cim";
      language: string;
      template_id?: string;
    }) => {
      const { data, error } = await supabase.functions.invoke("generate-deal-document", {
        body: params,
      });
      if (error) throw error;
      if (data?.error) {
        throw new Error(data.error);
      }
      return data as GeneratedDealDocument;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["deal-documents", data.mandato_id] });
      toast.success("Documento generado correctamente");
    },
    onError: (error: Error) => {
      if (error.message.includes("Rate limit") || error.message.includes("429")) {
        toast.error("Límite de peticiones excedido. Intenta de nuevo en unos segundos.");
      } else if (error.message.includes("credits") || error.message.includes("402")) {
        toast.error("Créditos de IA agotados. Añade fondos para continuar.");
      } else {
        toast.error(`Error al generar: ${error.message}`);
      }
    },
  });
}

export function useUpdateDealDocument() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: {
      id: string;
      mandato_id: string;
      sections?: DealDocumentSection[];
      title?: string;
      status?: string;
      reviewed_by?: string;
      approved_at?: string;
    }) => {
      const { id, mandato_id, ...updates } = params;
      const { error } = await supabase
        .from("generated_deal_documents")
        .update(updates as any)
        .eq("id", id);
      if (error) throw error;
      return { id, mandato_id };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["deal-documents", data.mandato_id] });
      toast.success("Documento actualizado");
    },
    onError: () => toast.error("Error al actualizar documento"),
  });
}
