import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { Database } from "@/integrations/supabase/types";

type BuyerContact = Database['public']['Tables']['buyer_contacts']['Row'];
type CampaignType = 'buy' | 'sell';

export function useCampaignContacts(campaignType: CampaignType) {
  return useQuery({
    queryKey: ['campaign-contacts', campaignType],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('buyer_contacts')
        .select('*')
        .eq('campaign_type', campaignType)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as BuyerContact[];
    }
  });
}

export function useDeleteCampaignContact() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (contactId: string) => {
      const { error } = await supabase
        .from('buyer_contacts')
        .delete()
        .eq('id', contactId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campaign-contacts'] });
      toast.success("Contacto eliminado");
    },
    onError: (error: Error) => {
      toast.error("Error al eliminar", { description: error.message });
    }
  });
}

export function useUpdateCampaignContact() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<BuyerContact> }) => {
      const { error } = await supabase
        .from('buyer_contacts')
        .update(updates)
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campaign-contacts'] });
      toast.success("Contacto actualizado");
    },
    onError: (error: Error) => {
      toast.error("Error al actualizar", { description: error.message });
    }
  });
}

export function useCampaignContactStats(campaignType: CampaignType) {
  return useQuery({
    queryKey: ['campaign-contacts-stats', campaignType],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('buyer_contacts')
        .select('status, id')
        .eq('campaign_type', campaignType);
      
      if (error) throw error;
      
      const stats = {
        total: data.length,
        new: data.filter(c => c.status === 'new' || !c.status).length,
        contacted: data.filter(c => c.status === 'contacted').length,
        qualified: data.filter(c => c.status === 'qualified').length,
        converted: data.filter(c => c.status === 'converted').length,
        rejected: data.filter(c => c.status === 'rejected').length
      };
      
      return stats;
    }
  });
}
