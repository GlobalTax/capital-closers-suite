import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ApolloContact {
  id: string;
  first_name: string;
  last_name: string;
  name: string;
  email: string;
  phone_numbers?: { raw_number: string; sanitized_number: string; type: string }[];
  organization_name?: string;
  organization_id?: string;
  organization?: {
    id: string;
    name: string;
    industry?: string;
    country?: string;
    estimated_num_employees?: number;
    primary_domain?: string;
    linkedin_url?: string;
  };
  title?: string;
  linkedin_url?: string;
  city?: string;
  state?: string;
  country?: string;
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

    const { label_id, page = 1, per_page = 100 } = await req.json();

    if (!label_id) {
      return new Response(
        JSON.stringify({ error: "label_id is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`[Apollo List Contacts] Fetching contacts for label: ${label_id}, page: ${page}`);

    // Call Apollo Contacts Search API with label filter
    const apolloResponse = await fetch("https://api.apollo.io/api/v1/contacts/search", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "no-cache",
        "X-Api-Key": APOLLO_API_KEY,
      },
      body: JSON.stringify({
        contact_label_ids: [label_id],
        page,
        per_page,
        sort_by_field: "contact_updated_at",
        sort_ascending: false,
      }),
    });

    if (!apolloResponse.ok) {
      const errorText = await apolloResponse.text();
      console.error("[Apollo List Contacts] API error:", apolloResponse.status, errorText);
      throw new Error(`Apollo API error: ${apolloResponse.status}`);
    }

    const apolloData = await apolloResponse.json();
    const contacts = apolloData.contacts || [];
    const pagination = apolloData.pagination || { total_entries: 0, total_pages: 0 };

    console.log(`[Apollo List Contacts] Found ${pagination.total_entries} total contacts, page ${page}/${pagination.total_pages}`);

    // Transform contacts to a cleaner format
    const transformedContacts: ApolloContact[] = contacts.map((contact: any) => ({
      id: contact.id,
      first_name: contact.first_name || "",
      last_name: contact.last_name || "",
      name: contact.name || `${contact.first_name || ""} ${contact.last_name || ""}`.trim(),
      email: contact.email || "",
      phone_numbers: contact.phone_numbers || [],
      organization_name: contact.organization_name || contact.organization?.name || "",
      organization_id: contact.organization_id || contact.organization?.id || "",
      organization: contact.organization ? {
        id: contact.organization.id,
        name: contact.organization.name,
        industry: contact.organization.industry,
        country: contact.organization.country,
        estimated_num_employees: contact.organization.estimated_num_employees,
        primary_domain: contact.organization.primary_domain,
        linkedin_url: contact.organization.linkedin_url,
      } : undefined,
      title: contact.title || "",
      linkedin_url: contact.linkedin_url || "",
      city: contact.city || "",
      state: contact.state || "",
      country: contact.country || "",
    }));

    return new Response(
      JSON.stringify({
        contacts: transformedContacts,
        pagination: {
          page: pagination.page || page,
          per_page: pagination.per_page || per_page,
          total_entries: pagination.total_entries,
          total_pages: pagination.total_pages,
        },
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("[Apollo List Contacts] Error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
