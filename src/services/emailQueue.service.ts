import { supabase } from "@/integrations/supabase/client";

export interface EmailQueueItem {
  id: string;
  queue_type: string;
  reference_id: string | null;
  reference_type: string | null;
  to_email: string;
  to_name: string | null;
  from_email: string;
  from_name: string;
  reply_to: string | null;
  subject: string;
  html_content: string;
  text_content: string | null;
  attachments: unknown[];
  status: string;
  priority: number;
  scheduled_at: string | null;
  attempts: number;
  max_attempts: number;
  next_retry_at: string | null;
  provider: string;
  provider_message_id: string | null;
  provider_status: string | null;
  provider_response: unknown;
  last_error: string | null;
  error_details: unknown;
  created_at: string;
  updated_at: string;
  queued_at: string | null;
  first_attempt_at: string | null;
  last_attempt_at: string | null;
  sent_at: string | null;
  failed_at: string | null;
  metadata: Record<string, unknown>;
  created_by: string | null;
}

export interface EnqueueEmailParams {
  to_email: string;
  to_name?: string;
  subject: string;
  html_content: string;
  text_content?: string;
  queue_type?: 'teaser' | 'transactional' | 'notification' | 'digest' | 'test';
  from_email?: string;
  from_name?: string;
  reply_to?: string;
  attachments?: Array<{
    filename: string;
    content: string;
    content_type?: string;
  }>;
  priority?: number;
  scheduled_at?: string;
  reference_id?: string;
  reference_type?: string;
  metadata?: Record<string, unknown>;
}

export interface QueueStats {
  queue_type: string;
  status: string;
  count: number;
  avg_attempts: number;
  oldest: string;
  newest: string;
}

export interface QueueFilters {
  status?: string;
  queue_type?: string;
  to_email?: string;
  from_date?: string;
  to_date?: string;
}

/**
 * Fetch email queue items with filters and pagination
 */
export async function fetchEmailQueue(
  filters: QueueFilters = {},
  page = 0,
  pageSize = 50
): Promise<{ data: EmailQueueItem[]; count: number }> {
  let query = supabase
    .from("email_queue")
    .select("*", { count: "exact" })
    .order("created_at", { ascending: false });

  if (filters.status) {
    query = query.eq("status", filters.status);
  }

  if (filters.queue_type) {
    query = query.eq("queue_type", filters.queue_type);
  }

  if (filters.to_email) {
    query = query.ilike("to_email", `%${filters.to_email}%`);
  }

  if (filters.from_date) {
    query = query.gte("created_at", filters.from_date);
  }

  if (filters.to_date) {
    query = query.lte("created_at", filters.to_date);
  }

  const { data, error, count } = await query
    .range(page * pageSize, (page + 1) * pageSize - 1);

  if (error) throw error;

  return {
    data: (data as EmailQueueItem[]) || [],
    count: count || 0,
  };
}

/**
 * Fetch queue statistics
 */
export async function fetchQueueStats(): Promise<QueueStats[]> {
  const { data, error } = await supabase
    .from("v_email_queue_stats")
    .select("*");

  if (error) throw error;

  return (data as QueueStats[]) || [];
}

/**
 * Enqueue a new email
 */
export async function enqueueEmail(params: EnqueueEmailParams): Promise<string> {
  const { data, error } = await supabase.rpc("enqueue_email", {
    p_to_email: params.to_email,
    p_subject: params.subject,
    p_html_content: params.html_content,
    p_queue_type: params.queue_type || "transactional",
    p_from_email: params.from_email || "noreply@capittal.es",
    p_from_name: params.from_name || "Capittal M&A",
    p_to_name: params.to_name || null,
    p_text_content: params.text_content || null,
    p_attachments: JSON.parse(JSON.stringify(params.attachments || [])),
    p_priority: params.priority || 5,
    p_scheduled_at: params.scheduled_at || null,
    p_reference_id: params.reference_id || null,
    p_reference_type: params.reference_type || null,
    p_metadata: JSON.parse(JSON.stringify(params.metadata || {})),
  });

  if (error) throw error;

  return data as string;
}

/**
 * Cancel a pending email
 */
export async function cancelEmail(emailId: string): Promise<void> {
  const { error } = await supabase
    .from("email_queue")
    .update({ 
      status: "cancelled",
      updated_at: new Date().toISOString(),
    })
    .eq("id", emailId)
    .in("status", ["pending", "queued"]);

  if (error) throw error;
}

/**
 * Retry a failed email.
 * Includes a cooldown check: only retries if last attempt was >2 minutes ago.
 */
export async function retryEmail(emailId: string): Promise<void> {
  const cooldown = new Date(Date.now() - 2 * 60 * 1000).toISOString();

  const { data, error } = await supabase
    .from("email_queue")
    .update({
      status: "pending",
      next_retry_at: null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", emailId)
    .eq("status", "failed")
    .lt("updated_at", cooldown)
    .select("id");

  if (error) throw error;

  if (!data || data.length === 0) {
    throw new Error("Este email ya fue reintentado recientemente. Espera unos minutos.");
  }
}

/**
 * Bulk retry failed emails.
 * Only retries emails not updated in the last 5 minutes to prevent re-queueing loops.
 */
export async function bulkRetryFailed(queueType?: string): Promise<number> {
  const cooldown = new Date(Date.now() - 5 * 60 * 1000).toISOString();

  let query = supabase
    .from("email_queue")
    .update({
      status: "pending",
      next_retry_at: null,
      updated_at: new Date().toISOString(),
    })
    .eq("status", "failed")
    .lt("attempts", 3)
    .lt("updated_at", cooldown);

  if (queueType) {
    query = query.eq("queue_type", queueType);
  }

  const { data, error } = await query.select("id");

  if (error) throw error;

  return data?.length || 0;
}

/**
 * Clear old completed emails
 */
export async function clearOldEmails(daysOld = 30): Promise<number> {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysOld);

  const { data, error } = await supabase
    .from("email_queue")
    .delete()
    .in("status", ["sent", "cancelled"])
    .lt("created_at", cutoffDate.toISOString())
    .select("id");

  if (error) throw error;

  return data?.length || 0;
}

/**
 * Process the email queue manually
 */
export async function processQueue(options: {
  batchSize?: number;
  processRetries?: boolean;
  queueType?: string;
} = {}): Promise<{
  success: boolean;
  processed: number;
  sent: number;
  failed: number;
  error?: string;
}> {
  const { data, error } = await supabase.functions.invoke("process-email-queue", {
    body: options,
  });

  if (error) throw error;

  return data;
}

/**
 * Get email details by ID
 */
export async function getEmailById(emailId: string): Promise<EmailQueueItem | null> {
  const { data, error } = await supabase
    .from("email_queue")
    .select("*")
    .eq("id", emailId)
    .single();

  if (error) {
    if (error.code === "PGRST116") return null;
    throw error;
  }

  return data as EmailQueueItem;
}
