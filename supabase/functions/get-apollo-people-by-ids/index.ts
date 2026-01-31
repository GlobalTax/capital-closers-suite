import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ApolloPerson {
  id: string;
  first_name: string;
  last_name: string;
  name: string;
  email: string;
  phone_numbers?: { raw_number: string; sanitized_number: string; type: string }[];
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

// Helper to extract Apollo ID from various URL formats
function extractApolloId(input: string): { type: 'person' | 'contact' | 'id'; id: string } | null {
  const trimmed = input.trim();
  
  // app.apollo.io/#/people/PERSON_ID
  const peopleMatch = trimmed.match(/apollo\.io\/#\/people\/([a-zA-Z0-9]+)/);
  if (peopleMatch) {
    return { type: 'person', id: peopleMatch[1] };
  }
  
  // app.apollo.io/#/contacts/CONTACT_ID
  const contactMatch = trimmed.match(/apollo\.io\/#\/contacts\/([a-zA-Z0-9]+)/);
  if (contactMatch) {
    return { type: 'contact', id: contactMatch[1] };
  }
  
  // Direct ID (24-char hex string like MongoDB ObjectId)
  if (/^[a-fA-F0-9]{24}$/.test(trimmed)) {
    return { type: 'id', id: trimmed };
  }
  
  return null;
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

    const { urls_or_ids } = await req.json();

    if (!urls_or_ids || !Array.isArray(urls_or_ids) || urls_or_ids.length === 0) {
      return new Response(
        JSON.stringify({ error: "urls_or_ids array is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`[Apollo People By IDs] Processing ${urls_or_ids.length} inputs`);

    // Parse all inputs and extract IDs
    const parsedIds = urls_or_ids
      .map((input: string) => extractApolloId(input))
      .filter((result): result is { type: 'person' | 'contact' | 'id'; id: string } => result !== null);

    console.log(`[Apollo People By IDs] Parsed ${parsedIds.length} valid IDs`);

    if (parsedIds.length === 0) {
      return new Response(
        JSON.stringify({ 
          people: [], 
          errors: ["No valid Apollo IDs found in input"] 
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const people: ApolloPerson[] = [];
    const errors: string[] = [];

    // Fetch each person by ID
    // Apollo doesn't have a bulk GET endpoint, so we fetch individually
    for (const { id, type } of parsedIds) {
      try {
        // Use the people endpoint to get person details
        const apolloResponse = await fetch(`https://api.apollo.io/api/v1/people/${id}`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            "Cache-Control": "no-cache",
            "X-Api-Key": APOLLO_API_KEY,
          },
        });

        if (!apolloResponse.ok) {
          // Try contacts endpoint if people fails
          if (type === 'contact' || !apolloResponse.ok) {
            const contactResponse = await fetch(`https://api.apollo.io/api/v1/contacts/${id}`, {
              method: "GET",
              headers: {
                "Content-Type": "application/json",
                "Cache-Control": "no-cache",
                "X-Api-Key": APOLLO_API_KEY,
              },
            });

            if (contactResponse.ok) {
              const contactData = await contactResponse.json();
              const contact = contactData.contact;
              if (contact) {
                people.push({
                  id: contact.id,
                  first_name: contact.first_name || "",
                  last_name: contact.last_name || "",
                  name: contact.name || `${contact.first_name || ""} ${contact.last_name || ""}`.trim(),
                  email: contact.email || "",
                  phone_numbers: contact.phone_numbers || [],
                  organization: contact.organization,
                  title: contact.title || "",
                  linkedin_url: contact.linkedin_url || "",
                  city: contact.city || "",
                  state: contact.state || "",
                  country: contact.country || "",
                });
                continue;
              }
            }
          }
          
          errors.push(`Failed to fetch ID ${id}: ${apolloResponse.status}`);
          continue;
        }

        const personData = await apolloResponse.json();
        const person = personData.person;
        
        if (person) {
          people.push({
            id: person.id,
            first_name: person.first_name || "",
            last_name: person.last_name || "",
            name: person.name || `${person.first_name || ""} ${person.last_name || ""}`.trim(),
            email: person.email || "",
            phone_numbers: person.phone_numbers || [],
            organization: person.organization,
            title: person.title || "",
            linkedin_url: person.linkedin_url || "",
            city: person.city || "",
            state: person.state || "",
            country: person.country || "",
          });
        }
      } catch (e) {
        console.error(`[Apollo People By IDs] Error fetching ${id}:`, e);
        errors.push(`Error fetching ID ${id}: ${e instanceof Error ? e.message : 'Unknown error'}`);
      }
    }

    console.log(`[Apollo People By IDs] Retrieved ${people.length} people, ${errors.length} errors`);

    return new Response(
      JSON.stringify({ people, errors }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("[Apollo People By IDs] Error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
