import { supabase } from "@/integrations/supabase/client";

// =============================================
// TYPES
// =============================================

export type CampaignStatus = 'draft' | 'scheduled' | 'in_progress' | 'completed' | 'paused' | 'cancelled';
export type WaveStatus = 'pending' | 'scheduled' | 'sending' | 'completed' | 'failed' | 'paused';
export type RecipientStatus = 'pending' | 'queued' | 'sending' | 'sent' | 'delivered' | 'opened' | 'clicked' | 'bounced' | 'failed' | 'skipped';
export type CampaignLanguage = 'ES' | 'EN';

export interface TeaserCampaign {
  id: string;
  mandato_id: string;
  nombre: string;
  idioma: CampaignLanguage;
  teaser_document_id: string | null;
  from_email: string;
  from_name: string;
  subject: string;
  template_id: string | null;
  custom_message: string | null;
  status: CampaignStatus;
  total_recipients: number;
  total_sent: number;
  total_delivered: number;
  total_opened: number;
  total_clicked: number;
  total_bounced: number;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  started_at: string | null;
  completed_at: string | null;
  // Watermark configuration
  enable_watermark: boolean;
  watermark_template: string | null;
  // Relations
  mandato?: { id: string; nombre: string };
  teaser_document?: { id: string; file_name: string; storage_path: string; mime_type?: string } | null;
}

export interface TeaserWave {
  id: string;
  campaign_id: string;
  wave_number: number;
  nombre: string | null;
  scheduled_at: string | null;
  started_at: string | null;
  completed_at: string | null;
  status: WaveStatus;
  total_recipients: number;
  sent_count: number;
  delivered_count: number;
  opened_count: number;
  clicked_count: number;
  failed_count: number;
  batch_size: number;
  delay_between_batches_ms: number;
  created_at: string;
  updated_at: string;
}

export interface TeaserRecipient {
  id: string;
  campaign_id: string;
  wave_id: string | null;
  contacto_id: string | null;
  empresa_id: string | null;
  mandato_empresa_id: string | null;
  email: string;
  nombre: string | null;
  empresa_nombre: string | null;
  status: RecipientStatus;
  skip_reason: string | null;
  provider_message_id: string | null;
  provider_status: string | null;
  queued_at: string | null;
  sent_at: string | null;
  delivered_at: string | null;
  opened_at: string | null;
  clicked_at: string | null;
  bounced_at: string | null;
  failed_at: string | null;
  open_count: number;
  click_count: number;
  bounce_type: string | null;
  error_message: string | null;
  tracking_id: string;
  created_at: string;
  updated_at: string;
  // Watermark fields
  watermarked_path: string | null;
  watermarked_at: string | null;
  watermark_text: string | null;
}

export interface CreateCampaignData {
  mandato_id: string;
  nombre: string;
  idioma: CampaignLanguage;
  teaser_document_id?: string | null;
  subject: string;
  template_id?: string | null;
  custom_message?: string | null;
  from_email?: string;
  from_name?: string;
  enable_watermark?: boolean;
  watermark_template?: string;
}

export interface CreateWaveData {
  campaign_id: string;
  wave_number: number;
  nombre?: string | null;
  scheduled_at?: string | null;
  batch_size?: number;
  delay_between_batches_ms?: number;
}

export interface AddRecipientData {
  campaign_id: string;
  wave_id?: string | null;
  email: string;
  nombre?: string | null;
  empresa_nombre?: string | null;
  contacto_id?: string | null;
  empresa_id?: string | null;
  mandato_empresa_id?: string | null;
}

// =============================================
// CAMPAIGN CRUD
// =============================================

export async function createCampaign(data: CreateCampaignData): Promise<TeaserCampaign> {
  const { data: campaign, error } = await supabase
    .from("teaser_campaigns")
    .insert({
      mandato_id: data.mandato_id,
      nombre: data.nombre,
      idioma: data.idioma,
      teaser_document_id: data.teaser_document_id || null,
      subject: data.subject,
      template_id: data.template_id || null,
      custom_message: data.custom_message || null,
      from_email: data.from_email || "teaser@capittal.es",
      from_name: data.from_name || "Capittal M&A",
      status: "draft",
      enable_watermark: data.enable_watermark !== false, // Default true
      watermark_template: data.watermark_template || "Confidencial — {nombre} — {email} — ID:{id}",
    })
    .select()
    .single();

  if (error) throw error;
  return campaign as TeaserCampaign;
}

export async function updateCampaign(
  campaignId: string,
  updates: Partial<Omit<TeaserCampaign, 'id' | 'created_at' | 'created_by'>>
): Promise<TeaserCampaign> {
  const { data, error } = await supabase
    .from("teaser_campaigns")
    .update(updates)
    .eq("id", campaignId)
    .select()
    .single();

  if (error) throw error;
  return data as TeaserCampaign;
}

export async function deleteCampaign(campaignId: string): Promise<void> {
  const { error } = await supabase
    .from("teaser_campaigns")
    .delete()
    .eq("id", campaignId);

  if (error) throw error;
}

export async function getCampaignById(campaignId: string): Promise<TeaserCampaign | null> {
  const { data, error } = await supabase
    .from("teaser_campaigns")
    .select(`
      *,
      mandato:mandatos(id, nombre_proyecto),
      teaser_document:documentos(id, file_name, storage_path)
    `)
    .eq("id", campaignId)
    .single();

  if (error) {
    if (error.code === "PGRST116") return null;
    throw error;
  }
  // Map nombre_proyecto to nombre for consistency
  const mapped = {
    ...data,
    mandato: data.mandato ? { id: data.mandato.id, nombre: data.mandato.nombre_proyecto } : undefined
  };
  return mapped as unknown as TeaserCampaign;
}

export async function getCampaignsForMandato(mandatoId: string): Promise<TeaserCampaign[]> {
  const { data, error } = await supabase
    .from("teaser_campaigns")
    .select(`
      *,
      mandato:mandatos(id, nombre_proyecto),
      teaser_document:documentos(id, file_name, storage_path)
    `)
    .eq("mandato_id", mandatoId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return (data || []).map(d => ({
    ...d,
    mandato: d.mandato ? { id: d.mandato.id, nombre: d.mandato.nombre_proyecto } : undefined
  })) as unknown as TeaserCampaign[];
}

export async function getAllCampaigns(): Promise<TeaserCampaign[]> {
  const { data, error } = await supabase
    .from("teaser_campaigns")
    .select(`
      *,
      mandato:mandatos(id, nombre_proyecto),
      teaser_document:documentos(id, file_name, storage_path)
    `)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return (data || []).map(d => ({
    ...d,
    mandato: d.mandato ? { id: d.mandato.id, nombre: d.mandato.nombre_proyecto } : undefined
  })) as unknown as TeaserCampaign[];
}

// =============================================
// WAVE CRUD
// =============================================

export async function createWave(data: CreateWaveData): Promise<TeaserWave> {
  const { data: wave, error } = await supabase
    .from("teaser_waves")
    .insert({
      campaign_id: data.campaign_id,
      wave_number: data.wave_number,
      nombre: data.nombre || `Oleada ${data.wave_number}`,
      scheduled_at: data.scheduled_at || null,
      status: data.scheduled_at ? "scheduled" : "pending",
      batch_size: data.batch_size || 10,
      delay_between_batches_ms: data.delay_between_batches_ms || 1000,
    })
    .select()
    .single();

  if (error) throw error;
  return wave as TeaserWave;
}

export async function updateWave(
  waveId: string,
  updates: Partial<Omit<TeaserWave, 'id' | 'campaign_id' | 'created_at'>>
): Promise<TeaserWave> {
  const { data, error } = await supabase
    .from("teaser_waves")
    .update(updates)
    .eq("id", waveId)
    .select()
    .single();

  if (error) throw error;
  return data as TeaserWave;
}

export async function deleteWave(waveId: string): Promise<void> {
  const { error } = await supabase
    .from("teaser_waves")
    .delete()
    .eq("id", waveId);

  if (error) throw error;
}

export async function getWavesForCampaign(campaignId: string): Promise<TeaserWave[]> {
  const { data, error } = await supabase
    .from("teaser_waves")
    .select("*")
    .eq("campaign_id", campaignId)
    .order("wave_number", { ascending: true });

  if (error) throw error;
  return (data || []) as TeaserWave[];
}

// =============================================
// RECIPIENT CRUD
// =============================================

export async function addRecipients(recipients: AddRecipientData[]): Promise<TeaserRecipient[]> {
  const { data, error } = await supabase
    .from("teaser_recipients")
    .insert(recipients.map(r => ({
      campaign_id: r.campaign_id,
      wave_id: r.wave_id || null,
      email: r.email,
      nombre: r.nombre || null,
      empresa_nombre: r.empresa_nombre || null,
      contacto_id: r.contacto_id || null,
      empresa_id: r.empresa_id || null,
      mandato_empresa_id: r.mandato_empresa_id || null,
      status: "pending",
    })))
    .select();

  if (error) throw error;
  return (data || []) as TeaserRecipient[];
}

export async function removeRecipient(recipientId: string): Promise<void> {
  const { error } = await supabase
    .from("teaser_recipients")
    .delete()
    .eq("id", recipientId);

  if (error) throw error;
}

export async function assignRecipientsToWave(recipientIds: string[], waveId: string): Promise<void> {
  const { error } = await supabase
    .from("teaser_recipients")
    .update({ wave_id: waveId })
    .in("id", recipientIds);

  if (error) throw error;
}

export async function getRecipientsForCampaign(campaignId: string): Promise<TeaserRecipient[]> {
  const { data, error } = await supabase
    .from("teaser_recipients")
    .select("*")
    .eq("campaign_id", campaignId)
    .order("created_at", { ascending: true });

  if (error) throw error;
  return (data || []) as TeaserRecipient[];
}

export async function getRecipientsForWave(waveId: string): Promise<TeaserRecipient[]> {
  const { data, error } = await supabase
    .from("teaser_recipients")
    .select("*")
    .eq("wave_id", waveId)
    .order("created_at", { ascending: true });

  if (error) throw error;
  return (data || []) as TeaserRecipient[];
}

// =============================================
// CAMPAIGN ACTIONS
// =============================================

export async function scheduleCampaign(campaignId: string): Promise<void> {
  // Verify all waves have scheduled times
  const { data: waves } = await supabase
    .from("teaser_waves")
    .select("id, scheduled_at")
    .eq("campaign_id", campaignId);

  if (!waves || waves.length === 0) {
    throw new Error("La campaña debe tener al menos una oleada");
  }

  const unscheduledWaves = waves.filter(w => !w.scheduled_at);
  if (unscheduledWaves.length > 0) {
    throw new Error("Todas las oleadas deben tener fecha de envío programada");
  }

  // Update campaign and wave statuses
  await supabase
    .from("teaser_campaigns")
    .update({ status: "scheduled" })
    .eq("id", campaignId);

  await supabase
    .from("teaser_waves")
    .update({ status: "scheduled" })
    .eq("campaign_id", campaignId)
    .eq("status", "pending");
}

export async function startWaveNow(waveId: string): Promise<void> {
  // Update wave to be processed immediately
  const { data: wave } = await supabase
    .from("teaser_waves")
    .update({ 
      status: "scheduled", 
      scheduled_at: new Date().toISOString() 
    })
    .eq("id", waveId)
    .select()
    .single();

  if (!wave) throw new Error("Oleada no encontrada");

  // Trigger processing
  await supabase.functions.invoke("process-teaser-wave", {
    body: { waveId }
  });
}

export async function pauseCampaign(campaignId: string): Promise<void> {
  await supabase
    .from("teaser_campaigns")
    .update({ status: "paused" })
    .eq("id", campaignId);

  await supabase
    .from("teaser_waves")
    .update({ status: "paused" })
    .eq("campaign_id", campaignId)
    .in("status", ["pending", "scheduled"]);
}

export async function resumeCampaign(campaignId: string): Promise<void> {
  await supabase
    .from("teaser_campaigns")
    .update({ status: "scheduled" })
    .eq("id", campaignId)
    .eq("status", "paused");

  await supabase
    .from("teaser_waves")
    .update({ status: "scheduled" })
    .eq("campaign_id", campaignId)
    .eq("status", "paused");
}

export async function cancelCampaign(campaignId: string): Promise<void> {
  await supabase
    .from("teaser_campaigns")
    .update({ status: "cancelled" })
    .eq("id", campaignId);
}

// =============================================
// STATS & METRICS
// =============================================

export interface CampaignStats {
  total_recipients: number;
  total_sent: number;
  total_delivered: number;
  total_opened: number;
  total_clicked: number;
  total_bounced: number;
  open_rate: number;
  click_rate: number;
  bounce_rate: number;
}

export function calculateCampaignStats(campaign: TeaserCampaign): CampaignStats {
  const total = campaign.total_recipients || 1;
  const sent = campaign.total_sent || 0;
  
  return {
    total_recipients: campaign.total_recipients,
    total_sent: sent,
    total_delivered: campaign.total_delivered,
    total_opened: campaign.total_opened,
    total_clicked: campaign.total_clicked,
    total_bounced: campaign.total_bounced,
    open_rate: sent > 0 ? (campaign.total_opened / sent) * 100 : 0,
    click_rate: sent > 0 ? (campaign.total_clicked / sent) * 100 : 0,
    bounce_rate: sent > 0 ? (campaign.total_bounced / sent) * 100 : 0,
  };
}

// =============================================
// SEND TEST EMAIL
// =============================================

export async function sendTestEmail(recipientId: string, testEmail: string): Promise<{ success: boolean; error?: string }> {
  const { data, error } = await supabase.functions.invoke("send-teaser-email", {
    body: { recipientId, testEmail }
  });

  if (error) {
    return { success: false, error: error.message };
  }

  return data;
}