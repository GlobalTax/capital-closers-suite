import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ProcessQueueRequest {
  batchSize?: number;
  processRetries?: boolean;
  queueType?: string;
}

interface EmailQueueItem {
  id: string;
  to_email: string;
  to_name: string | null;
  from_email: string;
  from_name: string;
  reply_to: string | null;
  subject: string;
  html_content: string;
  text_content: string | null;
  attachments: Array<{
    filename: string;
    content: string;
    content_type?: string;
  }>;
  attempts: number;
  max_attempts: number;
  priority: number;
  queue_type: string;
}

// Configuration
const CONFIG = {
  EMAILS_PER_BATCH: 10,
  BATCH_DELAY_MS: 3000, // 3 seconds between batches = ~20 emails/min
  MAX_PROCESSING_TIME_MS: 50000, // 50 seconds max (leave margin for edge function timeout)
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = Date.now();

  try {
    const body = await req.json().catch(() => ({})) as ProcessQueueRequest;
    const { 
      batchSize = CONFIG.EMAILS_PER_BATCH, 
      processRetries = true,
      queueType 
    } = body;

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const now = new Date().toISOString();
    const results = {
      processed: 0,
      sent: 0,
      failed: 0,
      retried: 0,
      errors: [] as string[],
    };

    // Build query for pending emails
    let query = supabase
      .from("email_queue")
      .select("*")
      .or(`status.eq.pending,status.eq.queued`)
      .lte("scheduled_at", now)
      .order("priority", { ascending: true })
      .order("created_at", { ascending: true })
      .limit(batchSize * 3); // Get more to have buffer

    if (queueType) {
      query = query.eq("queue_type", queueType);
    }

    const { data: pendingEmails, error: pendingError } = await query;

    if (pendingError) {
      console.error("Error fetching pending emails:", pendingError);
      throw pendingError;
    }

    // Also get retry candidates if enabled
    let retryEmails: EmailQueueItem[] = [];
    if (processRetries) {
      let retryQuery = supabase
        .from("email_queue")
        .select("*")
        .eq("status", "failed")
        .lt("attempts", 3) // Less than max_attempts
        .lte("next_retry_at", now)
        .order("priority", { ascending: true })
        .order("next_retry_at", { ascending: true })
        .limit(batchSize);

      if (queueType) {
        retryQuery = retryQuery.eq("queue_type", queueType);
      }

      const { data: retries } = await retryQuery;
      retryEmails = (retries || []) as EmailQueueItem[];
    }

    // Combine and prioritize
    const allEmails = [
      ...(pendingEmails || []) as EmailQueueItem[],
      ...retryEmails,
    ];

    if (allEmails.length === 0) {
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: "No emails to process", 
          ...results 
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Processing ${allEmails.length} emails...`);

    // Process in batches with rate limiting
    let batchIndex = 0;
    
    while (batchIndex * batchSize < allEmails.length) {
      // Check if we're running out of time
      if (Date.now() - startTime > CONFIG.MAX_PROCESSING_TIME_MS) {
        console.log("Approaching timeout, stopping processing");
        break;
      }

      const batch = allEmails.slice(batchIndex * batchSize, (batchIndex + 1) * batchSize);
      
      // Mark batch as sending
      const batchIds = batch.map(e => e.id);
      await supabase
        .from("email_queue")
        .update({ status: "sending" })
        .in("id", batchIds);

      // Update first_attempt_at for new emails
      await supabase
        .from("email_queue")
        .update({ first_attempt_at: new Date().toISOString() })
        .in("id", batchIds)
        .is("first_attempt_at", null);

      // Process batch in parallel
      const sendPromises = batch.map(async (email) => {
        try {
          const response = await fetch(`${supabaseUrl}/functions/v1/send-email`, {
            method: "POST",
            headers: {
              "Authorization": `Bearer ${supabaseServiceKey}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              queueId: email.id,
              to: email.to_email,
              toName: email.to_name,
              from: email.from_email,
              fromName: email.from_name,
              replyTo: email.reply_to,
              subject: email.subject,
              html: email.html_content,
              text: email.text_content,
              attachments: email.attachments,
              updateQueue: true,
            }),
          });

          const result = await response.json();
          
          if (result.success) {
            results.sent++;
            if (email.attempts > 0) {
              results.retried++;
            }
          } else {
            results.failed++;
            results.errors.push(`${email.to_email}: ${result.error}`);
          }
          
          results.processed++;
          return result;
        } catch (err) {
          const error = err as Error;
          results.failed++;
          results.processed++;
          results.errors.push(`${email.to_email}: ${error.message}`);
          
          // Update email as failed
          await supabase
            .from("email_queue")
            .update({
              status: "failed",
              last_error: error.message,
              last_attempt_at: new Date().toISOString(),
              attempts: email.attempts + 1,
            })
            .eq("id", email.id);

          return { success: false, error: error.message };
        }
      });

      await Promise.all(sendPromises);

      // Rate limiting delay between batches
      if ((batchIndex + 1) * batchSize < allEmails.length) {
        await new Promise(resolve => setTimeout(resolve, CONFIG.BATCH_DELAY_MS));
      }

      batchIndex++;
    }

    console.log("Queue processing complete:", results);

    return new Response(
      JSON.stringify({ 
        success: true, 
        ...results,
        duration_ms: Date.now() - startTime,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    const error = err as Error;
    console.error("Error processing email queue:", error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message,
        duration_ms: Date.now() - startTime,
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
