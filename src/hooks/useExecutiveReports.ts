import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export function useExecutiveReports() {
  return useQuery({
    queryKey: ["executive-reports"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("executive_reports")
        .select("*")
        .order("report_date", { ascending: false })
        .limit(20);
      if (error) throw error;
      return data;
    },
  });
}

export function useGenerateExecutiveReport() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke("generate-executive-report", {
        body: {},
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["executive-reports"] });
      toast.success(`Reporte generado y enviado a ${data.recipients} destinatarios`);
    },
    onError: (error: Error) => {
      if (error.message?.includes("Rate limit") || error.message?.includes("429")) {
        toast.error("Límite de uso de IA alcanzado. Intenta más tarde.");
      } else if (error.message?.includes("402") || error.message?.includes("Créditos")) {
        toast.error("Créditos de IA agotados.");
      } else {
        toast.error(`Error generando reporte: ${error.message}`);
      }
    },
  });
}

export function useReportRecipients() {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["executive-report-recipients"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("executive_report_recipients")
        .select("*")
        .order("created_at", { ascending: true });
      if (error) throw error;
      return data;
    },
  });

  const addRecipient = useMutation({
    mutationFn: async ({ email, name }: { email: string; name?: string }) => {
      const { error } = await supabase
        .from("executive_report_recipients")
        .insert({ email, name });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["executive-report-recipients"] });
      toast.success("Destinatario añadido");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const removeRecipient = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("executive_report_recipients")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["executive-report-recipients"] });
      toast.success("Destinatario eliminado");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const toggleRecipient = useMutation({
    mutationFn: async ({ id, active }: { id: string; active: boolean }) => {
      const { error } = await supabase
        .from("executive_report_recipients")
        .update({ active })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["executive-report-recipients"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return { ...query, addRecipient, removeRecipient, toggleRecipient };
}
