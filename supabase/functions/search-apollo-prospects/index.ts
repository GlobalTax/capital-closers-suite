import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface OutboundFilters {
  revenue_min?: number;
  revenue_max?: number;
  employee_ranges?: string[];
  locations?: string[];
  titles?: string[];
  seniority?: string[];
  keywords?: string[];
}

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

    const { campaign_id, keywords, filters, page = 1 } = await req.json() as {
      campaign_id: string;
      keywords: string[];
      filters: OutboundFilters;
      page?: number;
    };

    if (!campaign_id || !keywords || keywords.length === 0) {
      return new Response(
        JSON.stringify({ error: "campaign_id and keywords are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`[Apollo Search] Campaign: ${campaign_id}, Keywords: ${keywords.join(", ")}, Page: ${page}`);

    // Build Apollo search params
    const searchParams: Record<string, unknown> = {
      api_key: APOLLO_API_KEY,
      page,
      per_page: 100,
      q_keywords: keywords.join(" OR "),
    };

    // Apply filters
    if (filters.employee_ranges && filters.employee_ranges.length > 0) {
      searchParams.organization_num_employees_ranges = filters.employee_ranges;
    }

    if (filters.locations && filters.locations.length > 0) {
      searchParams.person_locations = filters.locations;
    }

    if (filters.seniority && filters.seniority.length > 0) {
      searchParams.person_seniorities = filters.seniority;
    }

    if (filters.titles && filters.titles.length > 0) {
      searchParams.person_titles = filters.titles;
    }

    console.log("[Apollo Search] Request params:", JSON.stringify(searchParams, null, 2));

    // Call Apollo People Search API
    const apolloResponse = await fetch("https://api.apollo.io/v1/mixed_people/search", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "no-cache",
      },
      body: JSON.stringify(searchParams),
    });

    if (!apolloResponse.ok) {
      const errorText = await apolloResponse.text();
      console.error("[Apollo Search] API error:", apolloResponse.status, errorText);
      throw new Error(`Apollo API error: ${apolloResponse.status}`);
    }

    const apolloData = await apolloResponse.json();
    console.log(`[Apollo Search] Found ${apolloData.pagination?.total_entries || 0} total results`);

    const people = apolloData.people || [];
    const pagination = apolloData.pagination || { total_entries: 0, total_pages: 0 };

    // Transform and save prospects
    const prospects = people.map((person: any) => ({
      campaign_id,
      apollo_id: person.id,
      apollo_org_id: person.organization?.id,
      nombre: person.first_name || "",
      apellidos: person.last_name || "",
      cargo: person.title || "",
      empresa: person.organization?.name || "",
      linkedin_url: person.linkedin_url || "",
      website_domain: person.organization?.primary_domain || "",
      company_linkedin_url: person.organization?.linkedin_url || "",
      company_size: person.organization?.estimated_num_employees?.toString() || "",
      company_industry: person.organization?.industry || "",
      company_location: person.organization?.country || "",
      score: person.score || 0,
      enrichment_status: "pending",
      import_status: "not_imported",
    }));

    // Upsert prospects (avoid duplicates by apollo_id)
    if (prospects.length > 0) {
      // First check for existing apollo_ids
      const apolloIds = prospects.map((p: any) => p.apollo_id).filter(Boolean);
      
      const { data: existing } = await supabase
        .from("outbound_prospects")
        .select("apollo_id")
        .eq("campaign_id", campaign_id)
        .in("apollo_id", apolloIds);

      const existingIds = new Set((existing || []).map((e) => e.apollo_id));
      const newProspects = prospects.filter((p: any) => !existingIds.has(p.apollo_id));

      if (newProspects.length > 0) {
        const { error: insertError } = await supabase
          .from("outbound_prospects")
          .insert(newProspects);

        if (insertError) {
          console.error("[Apollo Search] Insert error:", insertError);
        } else {
          console.log(`[Apollo Search] Inserted ${newProspects.length} new prospects`);
        }
      }
    }

    // Update campaign stats
    if (page === 1) {
      await supabase
        .from("outbound_campaigns")
        .update({
          status: "searching",
          total_found: pagination.total_entries,
          last_search_at: new Date().toISOString(),
        })
        .eq("id", campaign_id);
    }

    return new Response(
      JSON.stringify({
        prospects,
        total: pagination.total_entries,
        page: pagination.page,
        totalPages: pagination.total_pages,
        hasMore: page < pagination.total_pages,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("[Apollo Search] Error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
