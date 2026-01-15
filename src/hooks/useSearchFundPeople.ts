import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface SearchFundPerson {
  id: string;
  fund_id: string;
  full_name: string;
  role: string | null;
  email: string | null;
  phone: string | null;
  linkedin_url: string | null;
  location: string | null;
  school: string | null;
  languages: string[] | null;
  is_primary_contact: boolean | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export const fetchSearchFundPeople = async (fundId: string): Promise<SearchFundPerson[]> => {
  const { data, error } = await supabase
    .from("sf_people")
    .select("*")
    .eq("fund_id", fundId)
    .order("is_primary_contact", { ascending: false })
    .order("full_name");

  if (error) throw error;
  return data || [];
};

export const useSearchFundPeople = (fundId: string | undefined) => {
  return useQuery({
    queryKey: ["search-fund-people", fundId],
    queryFn: () => fetchSearchFundPeople(fundId!),
    enabled: !!fundId,
  });
};
