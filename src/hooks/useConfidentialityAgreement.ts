import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

const CURRENT_AGREEMENT_VERSION = 1;

export function useConfidentialityAgreement() {
  const { user } = useAuth();

  const { data: hasAccepted, isLoading } = useQuery({
    queryKey: ["confidentiality-agreement", user?.id],
    queryFn: async () => {
      if (!user?.id) return false;
      const { data, error } = await supabase
        .from("user_confidentiality_agreements")
        .select("id")
        .eq("user_id", user.id)
        .eq("agreement_version", CURRENT_AGREEMENT_VERSION)
        .maybeSingle();
      if (error) throw error;
      return !!data;
    },
    enabled: !!user?.id,
    staleTime: Infinity,
  });

  const queryClient = useQueryClient();

  const acceptMutation = useMutation({
    mutationFn: async () => {
      if (!user?.id) throw new Error("No user");
      const { error } = await supabase
        .from("user_confidentiality_agreements")
        .insert({
          user_id: user.id,
          agreement_version: CURRENT_AGREEMENT_VERSION,
          user_agent: navigator.userAgent,
        });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.setQueryData(["confidentiality-agreement", user?.id], true);
    },
  });

  return {
    hasAccepted: hasAccepted ?? false,
    isLoading,
    acceptAgreement: acceptMutation.mutate,
    isAccepting: acceptMutation.isPending,
  };
}
