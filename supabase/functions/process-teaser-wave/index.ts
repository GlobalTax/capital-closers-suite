import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ProcessWaveRequest {
  waveId?: string; // Process specific wave
  processScheduled?: boolean; // Process all scheduled waves due now
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json().catch(() => ({})) as ProcessWaveRequest;
    const { waveId, processScheduled = true } = body;

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    let wavesToProcess: string[] = [];

    if (waveId) {
      // Process specific wave
      wavesToProcess = [waveId];
    } else if (processScheduled) {
      // Find all waves that are scheduled and due
      const now = new Date().toISOString();
      const { data: scheduledWaves } = await supabase
        .from("teaser_waves")
        .select("id")
        .eq("status", "scheduled")
        .lte("scheduled_at", now);

      wavesToProcess = scheduledWaves?.map(w => w.id) || [];
    }

    if (wavesToProcess.length === 0) {
      return new Response(
        JSON.stringify({ success: true, message: "No waves to process", processed: 0 }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const results = [];

    for (const currentWaveId of wavesToProcess) {
      try {
        // Get wave details
        const { data: wave, error: waveError } = await supabase
          .from("teaser_waves")
          .select(`
            *,
            campaign:teaser_campaigns(id, status, mandato_id)
          `)
          .eq("id", currentWaveId)
          .single();

        if (waveError || !wave) {
          results.push({ waveId: currentWaveId, success: false, error: "Wave not found" });
          continue;
        }

        // Check campaign status
        if (wave.campaign?.status === "paused" || wave.campaign?.status === "cancelled") {
          results.push({ waveId: currentWaveId, success: false, error: "Campaign is paused or cancelled" });
          continue;
        }

        // Update wave status to sending
        await supabase
          .from("teaser_waves")
          .update({ 
            status: "sending", 
            started_at: new Date().toISOString() 
          })
          .eq("id", currentWaveId);

        // Update campaign status if first wave
        await supabase
          .from("teaser_campaigns")
          .update({ 
            status: "in_progress",
            started_at: new Date().toISOString()
          })
          .eq("id", wave.campaign_id)
          .eq("status", "scheduled");

        // Get pending recipients for this wave
        const { data: recipients } = await supabase
          .from("teaser_recipients")
          .select("id, email, status")
          .eq("wave_id", currentWaveId)
          .eq("status", "pending")
          .order("created_at", { ascending: true });

        if (!recipients || recipients.length === 0) {
          // Mark wave as completed if no pending recipients
          await supabase
            .from("teaser_waves")
            .update({ 
              status: "completed", 
              completed_at: new Date().toISOString() 
            })
            .eq("id", currentWaveId);

          results.push({ waveId: currentWaveId, success: true, sent: 0, message: "No pending recipients" });
          continue;
        }

        const batchSize = wave.batch_size || 10;
        const delayMs = wave.delay_between_batches_ms || 1000;
        let sentCount = 0;
        let failedCount = 0;

        // Process in batches
        for (let i = 0; i < recipients.length; i += batchSize) {
          const batch = recipients.slice(i, i + batchSize);

          // Mark batch as queued
          await supabase
            .from("teaser_recipients")
            .update({ status: "queued", queued_at: new Date().toISOString() })
            .in("id", batch.map(r => r.id));

          // Send emails in parallel (within batch)
          const sendPromises = batch.map(async (recipient) => {
            try {
              const response = await fetch(`${supabaseUrl}/functions/v1/send-teaser-email`, {
                method: "POST",
                headers: {
                  "Authorization": `Bearer ${supabaseServiceKey}`,
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({ recipientId: recipient.id }),
              });

              const result = await response.json();
              return { recipientId: recipient.id, success: result.success, error: result.error };
            } catch (err) {
              const error = err as Error;
              return { recipientId: recipient.id, success: false, error: error.message };
            }
          });

          const batchResults = await Promise.all(sendPromises);
          
          sentCount += batchResults.filter(r => r.success).length;
          failedCount += batchResults.filter(r => !r.success).length;

          // Update wave metrics after each batch
          await supabase.rpc("update_wave_metrics", { p_wave_id: currentWaveId });

          // Delay between batches (rate limiting)
          if (i + batchSize < recipients.length) {
            await new Promise(resolve => setTimeout(resolve, delayMs));
          }
        }

        // Mark wave as completed
        await supabase
          .from("teaser_waves")
          .update({ 
            status: failedCount === recipients.length ? "failed" : "completed", 
            completed_at: new Date().toISOString() 
          })
          .eq("id", currentWaveId);

        // Update campaign metrics
        await supabase.rpc("update_campaign_metrics", { p_campaign_id: wave.campaign_id });

        // Check if all waves are completed
        const { data: pendingWaves } = await supabase
          .from("teaser_waves")
          .select("id")
          .eq("campaign_id", wave.campaign_id)
          .not("status", "in", "('completed', 'failed')");

        if (!pendingWaves || pendingWaves.length === 0) {
          // Mark campaign as completed
          await supabase
            .from("teaser_campaigns")
            .update({ 
              status: "completed",
              completed_at: new Date().toISOString()
            })
            .eq("id", wave.campaign_id);
        }

        results.push({ 
          waveId: currentWaveId, 
          success: true, 
          sent: sentCount, 
          failed: failedCount,
          total: recipients.length 
        });

      } catch (err) {
        const waveError = err as Error;
        console.error(`Error processing wave ${currentWaveId}:`, waveError);
        
        // Mark wave as failed
        await supabase
          .from("teaser_waves")
          .update({ status: "failed" })
          .eq("id", currentWaveId);

        results.push({ waveId: currentWaveId, success: false, error: waveError.message });
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        processed: wavesToProcess.length,
        results 
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    const error = err as Error;
    console.error("Error processing waves:", error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});