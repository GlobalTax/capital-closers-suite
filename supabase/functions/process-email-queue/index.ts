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

const CONFIG = {
  EMAILS_PER_BATCH: 10,
  BATCH_DELAY_MS: 3000,
  MAX_PROCESSING_TIME_MS: 50000,
};

/**
 * Validates internal auth: either SERVICE_ROLE_KEY or admin user.
 * Returns null if authorized, or a Response with error if not.
 */
async function validateInternalAuth(req: Request): Promise<Response | null> {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return new Response(
      JSON.stringify({ success: false, error: "No autorizado: token requerido" }),
      { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  const token = authHeader.replace("Bearer ", "");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

  // Allow internal service calls
  if (token === serviceRoleKey) {
    return null;
  }

  // Validate as admin user
  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

  const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: authHeader } },
  });

  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) {
    return new Response(
      JSON.stringify({ success: false, error: "No autorizado: token inválido" }),
      { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey!);
  const { data: adminUser, error: adminError } = await supabaseAdmin
    .from("admin_users")
    .select("role")
    .eq("user_id", user.id)
    .eq("is_active", true)
    .single();

  if (adminError || !adminUser || !["admin", "super_admin"].includes(adminUser.role)) {
    return new Response(
      JSON.stringify({ success: false, error: "Permisos insuficientes: se requiere rol admin" }),
      { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  return null;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // Auth validation
  const authError = await validateInternalAuth(req);
  if (authError) return authError;

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
    const stuckThreshold = new Date(Date.now() - 15 * 60 * 1000).toISOString();
    const results = {
      processed: 0,
      sent: 0,
      failed: 0,
      retried: 0,
      recovered: 0,
      errors: [] as string[],
    };

    // Recover stuck "sending" emails (>15 min without progress)
    const { data: stuckEmails, error: stuckError } = await supabase
      .from("email_queue")
      .update({ status: "queued", last_error: "Recovered from stuck sending state" })
      .eq("status", "sending")
      .lt("last_attempt_at", stuckThreshold)
      .select("id");

    if (!stuckError && stuckEmails && stuckEmails.length > 0) {
      results.recovered = stuckEmails.length;
      console.log(`Recovered ${stuckEmails.length} stuck emails from 'sending' state`);
    }

    // Also recover "sending" emails that never had last_attempt_at set (stuck from the start)
    const { data: stuckNoAttempt } = await supabase
      .from("email_queue")
      .update({ status: "queued", last_error: "Recovered: never attempted" })
      .eq("status", "sending")
      .is("last_attempt_at", null)
      .lt("created_at", stuckThreshold)
      .select("id");

    if (stuckNoAttempt && stuckNoAttempt.length > 0) {
      results.recovered += stuckNoAttempt.length;
      console.log(`Recovered ${stuckNoAttempt.length} never-attempted stuck emails`);
    }

    // Build query for pending emails
    let query = supabase
      .from("email_queue")
      .select("*")
      .or(`status.eq.pending,status.eq.queued`)
      .lte("scheduled_at", now)
      .order("priority", { ascending: true })
      .order("created_at", { ascending: true })
      .limit(batchSize * 3);

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
        .lt("attempts", 3)
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

    const allEmails = [
      ...(pendingEmails || []) as EmailQueueItem[],
      ...retryEmails,
    ];

    if (allEmails.length === 0) {
      return new Response(
        JSON.stringify({ success: true, message: "No emails to process", ...results }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Processing ${allEmails.length} emails...`);

    let batchIndex = 0;
    
    while (batchIndex * batchSize < allEmails.length) {
      if (Date.now() - startTime > CONFIG.MAX_PROCESSING_TIME_MS) {
        console.log("Approaching timeout, stopping processing");
        break;
      }

      const batch = allEmails.slice(batchIndex * batchSize, (batchIndex + 1) * batchSize);
      
      const batchIds = batch.map(e => e.id);
      await supabase
        .from("email_queue")
        .update({ status: "sending" })
        .in("id", batchIds);

      await supabase
        .from("email_queue")
        .update({ first_attempt_at: new Date().toISOString() })
        .in("id", batchIds)
        .is("first_attempt_at", null);

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
            if (email.attempts > 0) results.retried++;
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

      if ((batchIndex + 1) * batchSize < allEmails.length) {
        await new Promise(resolve => setTimeout(resolve, CONFIG.BATCH_DELAY_MS));
      }

      batchIndex++;
    }

    console.log("Queue processing complete:", results);

    return new Response(
      JSON.stringify({ success: true, ...results, duration_ms: Date.now() - startTime }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    const error = err as Error;
    console.error("Error processing email queue:", error);
    return new Response(
      JSON.stringify({ success: false, error: error.message, duration_ms: Date.now() - startTime }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
