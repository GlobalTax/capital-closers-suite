import { supabase } from '@/integrations/supabase/client';

export type OutreachChannel = 'email' | 'linkedin' | 'phone' | 'other';
export type OutreachStatus = 'draft' | 'sent' | 'replied' | 'bounced';

export interface CreateOutreachParams {
  fund_id: string;
  mandato_id?: string;
  person_id?: string;
  channel: OutreachChannel;
  subject?: string;
  message_preview?: string;
  sent_at?: string;
  status: OutreachStatus;
  notes?: string;
}

export interface OutreachRecord {
  id: string;
  fund_id: string;
  crm_entity_id: string | null;
  crm_entity_type: string | null;
  person_id: string | null;
  channel: string | null;
  subject: string | null;
  message_preview: string | null;
  sent_at: string | null;
  status: string | null;
  notes: string | null;
  created_at: string;
  created_by: string | null;
}

export async function createOutreach(params: CreateOutreachParams): Promise<OutreachRecord> {
  const { data: user } = await supabase.auth.getUser();
  
  const { data, error } = await supabase
    .from('sf_outreach')
    .insert({
      fund_id: params.fund_id,
      crm_entity_id: params.mandato_id || null,
      crm_entity_type: params.mandato_id ? 'mandato' : null,
      person_id: params.person_id || null,
      channel: params.channel,
      subject: params.subject || null,
      message_preview: params.message_preview || null,
      sent_at: params.sent_at || null,
      status: params.status,
      notes: params.notes || null,
      created_by: user?.user?.id || null,
    })
    .select()
    .single();

  if (error) throw error;
  return data as OutreachRecord;
}

export async function getOutreachByFund(fundId: string): Promise<OutreachRecord[]> {
  const { data, error } = await supabase
    .from('sf_outreach')
    .select('*')
    .eq('fund_id', fundId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (data || []) as OutreachRecord[];
}

export async function updateOutreachStatus(
  outreachId: string, 
  status: OutreachStatus
): Promise<void> {
  const { error } = await supabase
    .from('sf_outreach')
    .update({ status })
    .eq('id', outreachId);

  if (error) throw error;
}
