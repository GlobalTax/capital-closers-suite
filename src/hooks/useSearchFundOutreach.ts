import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface SearchFundOutreach {
  id: string;
  fund_id: string;
  channel: string | null;
  subject: string | null;
  message_preview: string | null;
  sent_at: string | null;
  status: string | null;
  created_at: string;
  created_by: string | null;
  mandato?: {
    codigo: string;
    empresa?: {
      nombre: string;
    } | null;
  } | null;
}

export const fetchSearchFundOutreach = async (fundId: string): Promise<SearchFundOutreach[]> => {
  const { data, error } = await supabase
    .from("sf_outreach")
    .select(`
      id,
      fund_id,
      channel,
      subject,
      message_preview,
      sent_at,
      status,
      created_at,
      created_by,
      mandato:mandatos(
        codigo,
        empresa:empresas(nombre)
      )
    `)
    .eq("fund_id", fundId)
    .order("sent_at", { ascending: false, nullsFirst: false })
    .order("created_at", { ascending: false });

  if (error) throw error;
  return (data || []) as unknown as SearchFundOutreach[];
};

export const useSearchFundOutreach = (fundId: string | undefined) => {
  return useQuery({
    queryKey: ["search-fund-outreach", fundId],
    queryFn: () => fetchSearchFundOutreach(fundId!),
    enabled: !!fundId,
  });
};
