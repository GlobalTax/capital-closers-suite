import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "https://esm.sh/resend@2.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface EmailPayload {
  to: string | string[];
  toName?: string;
  from?: string;
  fromName?: string;
  replyTo?: string;
  subject: string;
  html: string;
  text?: string;
  attachments?: Array<{
    filename: string;
    content: string; // base64
    content_type?: string;
  }>;
}

interface SendResult {
  success: boolean;
  messageId?: string;
  provider: string;
  error?: string;
  rawResponse?: Record<string, unknown>;
}

// Email provider interface for future extensibility
interface EmailProvider {
  name: string;
  send(payload: EmailPayload): Promise<SendResult>;
}

// Resend provider implementation
class ResendProvider implements EmailProvider {
  name = "resend";
  private client: Resend;

  constructor(apiKey: string) {
    this.client = new Resend(apiKey);
  }

  async send(payload: EmailPayload): Promise<SendResult> {
    try {
      const toAddresses = Array.isArray(payload.to) ? payload.to : [payload.to];
      
      const fromAddress = payload.fromName 
        ? `${payload.fromName} <${payload.from || 'noreply@capittal.es'}>`
        : payload.from || 'noreply@capittal.es';

      // Build attachments if present
      const attachments = payload.attachments?.map(att => ({
        filename: att.filename,
        content: att.content,
      })) || undefined;

      const response = await this.client.emails.send({
        from: fromAddress,
        to: toAddresses,
        subject: payload.subject,
        html: payload.html,
        text: payload.text,
        reply_to: payload.replyTo,
        attachments,
      });

      if (response.error) {
        return {
          success: false,
          provider: this.name,
          error: response.error.message,
          rawResponse: response as unknown as Record<string, unknown>,
        };
      }

      return {
        success: true,
        messageId: response.data?.id,
        provider: this.name,
        rawResponse: response as unknown as Record<string, unknown>,
      };
    } catch (err) {
      const error = err as Error;
      return {
        success: false,
        provider: this.name,
        error: error.message,
      };
    }
  }
}

// Get the appropriate email provider
function getEmailProvider(): EmailProvider {
  const resendKey = Deno.env.get("RESEND_API_KEY");
  
  if (!resendKey) {
    throw new Error("No email provider configured. Set RESEND_API_KEY.");
  }

  return new ResendProvider(resendKey);
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const { 
      queueId,
      to, 
      toName,
      from, 
      fromName,
      replyTo,
      subject, 
      html, 
      text,
      attachments,
      updateQueue = true 
    } = body;

    // Validate required fields
    if (!to || !subject || !html) {
      return new Response(
        JSON.stringify({ success: false, error: "Missing required fields: to, subject, html" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const provider = getEmailProvider();

    const result = await provider.send({
      to,
      toName,
      from: from || "noreply@capittal.es",
      fromName: fromName || "Capittal M&A",
      replyTo,
      subject,
      html,
      text,
      attachments,
    });

    // Update queue record if queueId provided
    if (queueId && updateQueue) {
      const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
      const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
      const supabase = createClient(supabaseUrl, supabaseServiceKey);

      if (result.success) {
        await supabase
          .from("email_queue")
          .update({
            status: "sent",
            sent_at: new Date().toISOString(),
            provider_message_id: result.messageId,
            provider_status: "sent",
            provider_response: result.rawResponse,
            last_attempt_at: new Date().toISOString(),
          })
          .eq("id", queueId);
      } else {
        // Get current attempts
        const { data: queueItem } = await supabase
          .from("email_queue")
          .select("attempts, max_attempts")
          .eq("id", queueId)
          .single();

        const newAttempts = (queueItem?.attempts || 0) + 1;
        const maxAttempts = queueItem?.max_attempts || 3;

        const updateData: Record<string, unknown> = {
          attempts: newAttempts,
          last_attempt_at: new Date().toISOString(),
          last_error: result.error,
          error_details: { provider: result.provider, rawResponse: result.rawResponse },
          provider_response: result.rawResponse,
        };

        if (newAttempts >= maxAttempts) {
          updateData.status = "failed";
          updateData.failed_at = new Date().toISOString();
        } else {
          updateData.status = "pending";
          // Calculate next retry with exponential backoff
          const delays = [60, 300, 1800]; // 1min, 5min, 30min
          const delaySeconds = delays[Math.min(newAttempts - 1, delays.length - 1)];
          updateData.next_retry_at = new Date(Date.now() + delaySeconds * 1000).toISOString();
        }

        await supabase
          .from("email_queue")
          .update(updateData)
          .eq("id", queueId);
      }
    }

    console.log(`Email ${result.success ? 'sent' : 'failed'} via ${result.provider}:`, {
      to,
      subject,
      messageId: result.messageId,
      error: result.error,
    });

    return new Response(
      JSON.stringify(result),
      { 
        status: result.success ? 200 : 500, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );
  } catch (err) {
    const error = err as Error;
    console.error("Error in send-email:", error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
