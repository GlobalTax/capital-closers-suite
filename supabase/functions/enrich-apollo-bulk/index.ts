import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const APOLLO_API_KEY = Deno.env.get("APOLLO_API_KEY");
    if (!APOLLO_API_KEY) {
      throw new Error("APOLLO_API_KEY not configured");
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { prospect_ids, include_phone = false } = await req.json() as {
      prospect_ids: string[];
      include_phone?: boolean;
    };

    if (!prospect_ids || prospect_ids.length === 0) {
      return new Response(
        JSON.stringify({ error: "prospect_ids is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`[Apollo Enrich] Processing ${prospect_ids.length} prospects, include_phone: ${include_phone}`);

    // Fetch prospects with their apollo_ids
    const { data: prospects, error: fetchError } = await supabase
      .from("outbound_prospects")
      .select("id, apollo_id, linkedin_url, nombre, apellidos, empresa, campaign_id")
      .in("id", prospect_ids);

    if (fetchError || !prospects) {
      throw new Error("Failed to fetch prospects");
    }

    // Mark as enriching
    await supabase
      .from("outbound_prospects")
      .update({ enrichment_status: "enriching" })
      .in("id", prospect_ids);

    let enriched = 0;
    let failed = 0;
    let creditsUsed = 0;

    // Process in batches of 10 to avoid rate limits
    const batchSize = 10;
    for (let i = 0; i < prospects.length; i += batchSize) {
      const batch = prospects.slice(i, i + batchSize);
      
      // Process batch in parallel
      const results = await Promise.allSettled(
        batch.map(async (prospect) => {
          try {
            // Try to enrich by apollo_id first
            let personData: any = null;

            if (prospect.apollo_id) {
              const response = await fetch(`https://api.apollo.io/v1/people/${prospect.apollo_id}`, {
                method: "GET",
                headers: {
                  "Content-Type": "application/json",
                  "X-Api-Key": APOLLO_API_KEY,
                },
              });

              if (response.ok) {
                const data = await response.json();
                personData = data.person;
              }
            }

            // If no apollo_id or failed, try match by LinkedIn
            if (!personData && prospect.linkedin_url) {
              const matchResponse = await fetch("https://api.apollo.io/v1/people/match", {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({
                  api_key: APOLLO_API_KEY,
                  linkedin_url: prospect.linkedin_url,
                  reveal_personal_emails: false,
                  reveal_phone_number: include_phone,
                }),
              });

              if (matchResponse.ok) {
                const data = await matchResponse.json();
                personData = data.person;
              }
            }

            // Last resort: match by name and company
            if (!personData && prospect.nombre && prospect.empresa) {
              const matchResponse = await fetch("https://api.apollo.io/v1/people/match", {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({
                  api_key: APOLLO_API_KEY,
                  first_name: prospect.nombre,
                  last_name: prospect.apellidos || "",
                  organization_name: prospect.empresa,
                  reveal_personal_emails: false,
                  reveal_phone_number: include_phone,
                }),
              });

              if (matchResponse.ok) {
                const data = await matchResponse.json();
                personData = data.person;
              }
            }

            if (personData && personData.email) {
              // Extract phone if available
              let telefono = null;
              let telefonoType = null;
              if (include_phone && personData.phone_numbers && personData.phone_numbers.length > 0) {
                telefono = personData.phone_numbers[0].raw_number;
                telefonoType = personData.phone_numbers[0].type;
              }

              // Update prospect with enriched data
              await supabase
                .from("outbound_prospects")
                .update({
                  email: personData.email,
                  email_status: personData.email_status || "unknown",
                  telefono,
                  telefono_type: telefonoType,
                  enrichment_status: "enriched",
                  enriched_at: new Date().toISOString(),
                })
                .eq("id", prospect.id);

              return { success: true, creditsUsed: include_phone ? 2 : 1 };
            } else {
              // Mark as failed
              await supabase
                .from("outbound_prospects")
                .update({ enrichment_status: "failed" })
                .eq("id", prospect.id);

              return { success: false, creditsUsed: 0 };
            }
          } catch (error) {
            console.error(`[Apollo Enrich] Error for prospect ${prospect.id}:`, error);
            
            await supabase
              .from("outbound_prospects")
              .update({ enrichment_status: "failed" })
              .eq("id", prospect.id);

            return { success: false, creditsUsed: 0 };
          }
        })
      );

      // Aggregate results
      for (const result of results) {
        if (result.status === "fulfilled") {
          if (result.value.success) {
            enriched++;
            creditsUsed += result.value.creditsUsed;
          } else {
            failed++;
          }
        } else {
          failed++;
        }
      }

      // Small delay between batches to avoid rate limiting
      if (i + batchSize < prospects.length) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }

    // Update campaign stats
    if (prospects.length > 0) {
      const campaignId = prospects[0].campaign_id;
      
      // Get current stats
      const { data: campaign } = await supabase
        .from("outbound_campaigns")
        .select("total_enriched, credits_used")
        .eq("id", campaignId)
        .single();

      if (campaign) {
        await supabase
          .from("outbound_campaigns")
          .update({
            total_enriched: (campaign.total_enriched || 0) + enriched,
            credits_used: (campaign.credits_used || 0) + creditsUsed,
            status: "enriching",
          })
          .eq("id", campaignId);
      }
    }

    console.log(`[Apollo Enrich] Complete: ${enriched} enriched, ${failed} failed, ${creditsUsed} credits used`);

    return new Response(
      JSON.stringify({ enriched, failed, creditsUsed }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("[Apollo Enrich] Error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
