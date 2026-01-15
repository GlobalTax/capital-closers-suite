import { supabase } from "@/integrations/supabase/client";

export async function updateLeadChannel(
  leadId: string, 
  leadType: 'contact' | 'valuation' | 'collaborator',
  channelId: string | null
): Promise<void> {
  let tableName: 'contact_leads' | 'company_valuations' | 'collaborator_applications';
  
  switch (leadType) {
    case 'contact':
      tableName = 'contact_leads';
      break;
    case 'valuation':
      tableName = 'company_valuations';
      break;
    case 'collaborator':
      tableName = 'collaborator_applications';
      break;
  }

  const { error } = await supabase
    .from(tableName)
    .update({ acquisition_channel_id: channelId })
    .eq('id', leadId);

  if (error) {
    throw new Error(`Error al actualizar canal: ${error.message}`);
  }
}
