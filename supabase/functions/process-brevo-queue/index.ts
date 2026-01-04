import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const BREVO_API_KEY = Deno.env.get("BREVO_API_KEY");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

interface QueueItem {
  id: string;
  entity_type: "contact" | "company" | "deal";
  entity_id: string;
  action: "INSERT" | "UPDATE" | "DELETE";
  payload: Record<string, unknown>;
  attempts: number;
}

async function syncContactToBrevo(contactData: Record<string, unknown>, action: string): Promise<{ brevoId?: number; error?: string }> {
  const email = contactData.email as string;
  if (!email) return { error: "No email provided" };

  const attributes: Record<string, unknown> = {};
  if (contactData.nombre) attributes.FIRSTNAME = contactData.nombre;
  if (contactData.apellidos) attributes.LASTNAME = contactData.apellidos;
  if (contactData.cargo) attributes.CARGO = contactData.cargo;
  if (contactData.linkedin_url) attributes.LINKEDIN = contactData.linkedin_url;

  try {
    const response = await fetch("https://api.brevo.com/v3/contacts", {
      method: "POST",
      headers: {
        "api-key": BREVO_API_KEY!,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email,
        attributes,
        updateEnabled: true,
      }),
    });

    if (response.status === 201) {
      const data = await response.json();
      return { brevoId: data.id };
    } else if (response.status === 204) {
      // Updated existing contact
      return { brevoId: undefined };
    } else if (response.status === 400) {
      const error = await response.json();
      if (error.code === "duplicate_parameter") {
        return { brevoId: undefined }; // Already exists, considered success
      }
      return { error: error.message || "Bad request" };
    } else {
      const errorText = await response.text();
      return { error: `Brevo API error: ${response.status} - ${errorText}` };
    }
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : String(e);
    return { error: `Network error: ${message}` };
  }
}

async function syncCompanyToBrevo(companyData: Record<string, unknown>): Promise<{ brevoId?: string; error?: string }> {
  const name = companyData.nombre as string;
  if (!name) return { error: "No company name provided" };

  try {
    const response = await fetch("https://api.brevo.com/v3/companies", {
      method: "POST",
      headers: {
        "api-key": BREVO_API_KEY!,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name,
        attributes: {
          sector: companyData.sector || null,
          website: companyData.website || null,
          city: companyData.ciudad || null,
          country: companyData.pais || null,
        },
      }),
    });

    if (response.ok) {
      const data = await response.json();
      return { brevoId: data.id };
    } else if (response.status === 400) {
      const error = await response.json();
      if (error.code === "duplicate_parameter") {
        return { brevoId: undefined };
      }
      return { error: error.message || "Bad request" };
    } else {
      const errorText = await response.text();
      return { error: `Brevo API error: ${response.status} - ${errorText}` };
    }
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : String(e);
    return { error: `Network error: ${message}` };
  }
}

async function syncDealToBrevo(dealData: Record<string, unknown>, entityId: string): Promise<{ brevoId?: string; error?: string }> {
  const name = dealData.nombre as string;
  if (!name) return { error: "No deal name provided" };

  // Map pipeline stages
  const stageMap: Record<string, string> = {
    lead: "Lead",
    contacto_inicial: "Contacted",
    analisis: "Analysis",
    propuesta: "Proposal",
    due_diligence: "Qualification",
    negociacion: "Negotiation",
    cerrado_ganado: "Won",
    cerrado_perdido: "Lost",
  };

  const stage = stageMap[dealData.pipeline_stage as string] || "Lead";

  try {
    const response = await fetch("https://api.brevo.com/v3/crm/deals", {
      method: "POST",
      headers: {
        "api-key": BREVO_API_KEY!,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name,
        attributes: {
          deal_stage: stage,
          deal_type: dealData.tipo || null,
          amount: dealData.valor_estimado || 0,
        },
      }),
    });

    if (response.ok) {
      const data = await response.json();
      return { brevoId: data.id };
    } else {
      const errorText = await response.text();
      return { error: `Brevo API error: ${response.status} - ${errorText}` };
    }
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : String(e);
    return { error: `Network error: ${message}` };
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  console.log("Starting brevo queue processing...");

  if (!BREVO_API_KEY) {
    console.error("BREVO_API_KEY not configured");
    return new Response(
      JSON.stringify({ success: false, error: "BREVO_API_KEY not configured" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  try {
    // Get pending items (limit to 50 per run to avoid timeouts)
    const { data: queueItems, error: fetchError } = await supabase
      .from("brevo_sync_queue")
      .select("*")
      .eq("status", "pending")
      .lt("attempts", 3)
      .order("priority", { ascending: true })
      .order("created_at", { ascending: true })
      .limit(50);

    if (fetchError) {
      throw new Error(`Failed to fetch queue: ${fetchError.message}`);
    }

    if (!queueItems || queueItems.length === 0) {
      console.log("No pending items in queue");
      return new Response(
        JSON.stringify({ success: true, processed: 0, message: "No pending items" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Processing ${queueItems.length} queue items...`);

    let processed = 0;
    let succeeded = 0;
    let failed = 0;
    const errors: string[] = [];

    for (const item of queueItems as QueueItem[]) {
      // Mark as processing
      await supabase
        .from("brevo_sync_queue")
        .update({ status: "processing", attempts: item.attempts + 1 })
        .eq("id", item.id);

      let result: { brevoId?: string | number; error?: string };

      try {
        switch (item.entity_type) {
          case "contact":
            result = await syncContactToBrevo(item.payload, item.action);
            if (!result.error && result.brevoId) {
              await supabase
                .from("contactos")
                .update({ brevo_id: String(result.brevoId), brevo_synced_at: new Date().toISOString() })
                .eq("id", item.entity_id);
            }
            break;
          case "company":
            result = await syncCompanyToBrevo(item.payload);
            if (!result.error && result.brevoId) {
              await supabase
                .from("empresas")
                .update({ brevo_id: String(result.brevoId), brevo_synced_at: new Date().toISOString() })
                .eq("id", item.entity_id);
            }
            break;
          case "deal":
            result = await syncDealToBrevo(item.payload, item.entity_id);
            if (!result.error && result.brevoId) {
              await supabase
                .from("mandatos")
                .update({ brevo_deal_id: String(result.brevoId), brevo_synced_at: new Date().toISOString() })
                .eq("id", item.entity_id);
            }
            break;
          default:
            result = { error: `Unknown entity type: ${item.entity_type}` };
        }

        if (result.error) {
          // Check if we should retry
          if (item.attempts + 1 >= 3) {
            await supabase
              .from("brevo_sync_queue")
              .update({ 
                status: "failed", 
                error_message: result.error,
                processed_at: new Date().toISOString()
              })
              .eq("id", item.id);
            failed++;
            errors.push(`${item.entity_type}:${item.entity_id} - ${result.error}`);
          } else {
            // Schedule retry with exponential backoff
            const nextRetry = new Date(Date.now() + Math.pow(2, item.attempts + 1) * 60000);
            await supabase
              .from("brevo_sync_queue")
              .update({ 
                status: "pending",
                error_message: result.error,
                next_retry_at: nextRetry.toISOString()
              })
              .eq("id", item.id);
          }
        } else {
          // Success
          await supabase
            .from("brevo_sync_queue")
            .update({ 
              status: "completed",
              processed_at: new Date().toISOString()
            })
            .eq("id", item.id);
          succeeded++;

          // Log to brevo_sync_log
          await supabase.from("brevo_sync_log").insert({
            entity_type: item.entity_type,
            entity_id: item.entity_id,
            sync_type: "outbound",
            sync_status: "success",
            brevo_id: result.brevoId ? String(result.brevoId) : null,
            last_sync_at: new Date().toISOString(),
          });
        }

        processed++;
      } catch (e: unknown) {
        const errMsg = e instanceof Error ? e.message : String(e);
        console.error(`Error processing item ${item.id}:`, e);
        await supabase
          .from("brevo_sync_queue")
          .update({ 
            status: item.attempts + 1 >= 3 ? "failed" : "pending",
            error_message: errMsg,
            next_retry_at: item.attempts + 1 < 3 
              ? new Date(Date.now() + Math.pow(2, item.attempts + 1) * 60000).toISOString()
              : null
          })
          .eq("id", item.id);
        failed++;
      }

      // Small delay to respect rate limits
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    console.log(`Queue processing complete: ${succeeded} succeeded, ${failed} failed`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        processed,
        succeeded,
        failed,
        errors: errors.slice(0, 10) // Limit errors in response
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: unknown) {
    const errMsg = error instanceof Error ? error.message : String(error);
    console.error("Error processing queue:", error);
    return new Response(
      JSON.stringify({ success: false, error: errMsg }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
