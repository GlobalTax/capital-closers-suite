import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

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

    console.log("[Apollo Lists] Fetching saved labels/lists");

    // Call Apollo Labels API
    const apolloResponse = await fetch("https://api.apollo.io/api/v1/labels", {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "no-cache",
        "X-Api-Key": APOLLO_API_KEY,
      },
    });

    if (!apolloResponse.ok) {
      const errorText = await apolloResponse.text();
      console.error("[Apollo Lists] API error:", apolloResponse.status, errorText);
      throw new Error(`Apollo API error: ${apolloResponse.status}`);
    }

    const apolloData = await apolloResponse.json();
    console.log(`[Apollo Lists] Found ${apolloData.labels?.length || 0} labels`);

    // Transform labels to a cleaner format
    const labels = (apolloData.labels || []).map((label: any) => ({
      id: label.id,
      name: label.name,
      cached_count: label.cached_count || 0,
      created_at: label.created_at,
      updated_at: label.updated_at,
    }));

    return new Response(
      JSON.stringify({ labels }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("[Apollo Lists] Error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
