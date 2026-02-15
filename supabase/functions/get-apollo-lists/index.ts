import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { getCorsHeaders, requireAuth } from '../_shared/auth.ts';

serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);

  // Handle CORS
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { user, error: authError } = await requireAuth(req, corsHeaders);
    if (authError) return authError;

    const APOLLO_API_KEY = Deno.env.get("APOLLO_API_KEY");
    if (!APOLLO_API_KEY) {
      throw new Error("APOLLO_API_KEY not configured");
    }

    console.log("[Apollo Lists] Fetching saved labels/lists");

    // First verify the API key is valid
    const healthCheck = await fetch("https://api.apollo.io/api/v1/auth/health", {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "X-Api-Key": APOLLO_API_KEY,
      },
    });
    
    if (!healthCheck.ok) {
      const healthError = await healthCheck.text();
      console.error("[Apollo Lists] API key validation failed:", healthCheck.status, healthError);
      throw new Error(`Apollo API key invalid or expired: ${healthCheck.status}`);
    }
    
    console.log("[Apollo Lists] API key validated successfully");

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
    
    // Enhanced logging for debugging
    console.log("[Apollo Lists] Raw response keys:", Object.keys(apolloData));
    console.log("[Apollo Lists] Raw labels data:", JSON.stringify(apolloData.labels?.slice(0, 3) || []));
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
      JSON.stringify({ 
        labels,
        api_status: "healthy",
        labels_count: labels.length,
      }),
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
