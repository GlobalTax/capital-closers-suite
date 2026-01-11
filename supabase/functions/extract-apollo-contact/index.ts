import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

type UrlType = "apollo" | "linkedin";

const detectUrlType = (url: string): UrlType | null => {
  if (url.includes("apollo.io")) return "apollo";
  if (url.includes("linkedin.com/in")) return "linkedin";
  return null;
};

// Extract Apollo contact ID from various URL formats
const extractApolloContactId = (url: string): string | null => {
  // Format 1: https://app.apollo.io/#/contacts/CONTACT_ID
  const contactMatch = url.match(/\/contacts\/([a-zA-Z0-9]+)/);
  if (contactMatch) return contactMatch[1];

  // Format 2: https://app.apollo.io/#/people/PERSON_ID
  const peopleMatch = url.match(/\/people\/([a-zA-Z0-9]+)/);
  if (peopleMatch) return peopleMatch[1];

  return null;
};

// Extract contact data using Apollo API
const extractFromApolloApi = async (contactId: string, apolloApiKey: string) => {
  console.log(`Fetching contact ${contactId} from Apollo API...`);
  
  // Try the people endpoint first
  const response = await fetch(`https://api.apollo.io/v1/people/${contactId}`, {
    method: "GET",
    headers: {
      "X-Api-Key": apolloApiKey,
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    console.log("People endpoint failed, trying contacts endpoint...");
    // Try the contacts endpoint as fallback
    const contactResponse = await fetch(`https://api.apollo.io/v1/contacts/${contactId}`, {
      method: "GET",
      headers: {
        "X-Api-Key": apolloApiKey,
        "Content-Type": "application/json",
      },
    });
    
    if (!contactResponse.ok) {
      const errorText = await contactResponse.text();
      console.error("Apollo API error:", errorText);
      throw new Error(`Apollo API error: ${contactResponse.status}`);
    }
    
    return await contactResponse.json();
  }

  return await response.json();
};

// Map Apollo API response to our contact format
const mapApolloContact = (data: any) => {
  const person = data.person || data.contact || data;
  
  return {
    nombre: person.first_name || null,
    apellidos: person.last_name || null,
    email: person.email || null,
    telefono: person.phone_numbers?.[0]?.raw_number || 
              person.phone_numbers?.[0]?.sanitized_number || 
              person.phone || null,
    cargo: person.title || null,
    empresa: person.organization?.name || 
             person.organization_name || 
             person.company || null,
    linkedin: person.linkedin_url || null,
  };
};

const getLinkedInPrompt = (): string => {
  return `Extract contact information from this LinkedIn profile page.
LinkedIn profiles typically show:
- Full name (usually in a large heading)
- Headline/title (job title, often below the name)
- Current company (in the headline or experience section)
- Location

Note: LinkedIn does NOT show email or phone publicly.

Return a JSON object with these fields (use null for missing data):
{
  "nombre": "first name",
  "apellidos": "last name(s)",
  "email": null,
  "telefono": null,
  "cargo": "job title from headline",
  "empresa": "current company name",
  "linkedin": "the profile URL"
}

Only return the JSON object, no markdown or explanation.`;
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { url } = await req.json();

    if (!url) {
      return new Response(
        JSON.stringify({ error: "URL is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const urlType = detectUrlType(url);
    if (!urlType) {
      return new Response(
        JSON.stringify({ error: "URL must be from Apollo.io or LinkedIn (linkedin.com/in/...)" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Extracting contact from ${urlType} URL:`, url);

    // For Apollo URLs, use the official API
    if (urlType === "apollo") {
      const apolloApiKey = Deno.env.get("APOLLO_API_KEY");
      if (!apolloApiKey) {
        console.error("APOLLO_API_KEY not configured");
        return new Response(
          JSON.stringify({ error: "Apollo API not configured" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const contactId = extractApolloContactId(url);
      if (!contactId) {
        console.error("Could not extract contact ID from URL:", url);
        return new Response(
          JSON.stringify({ error: "Could not extract contact ID from Apollo URL. URL format should be: app.apollo.io/#/contacts/ID or app.apollo.io/#/people/ID" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      console.log("Extracted Apollo contact ID:", contactId);

      try {
        const apolloData = await extractFromApolloApi(contactId, apolloApiKey);
        const contact = mapApolloContact(apolloData);

        console.log("Contact extracted successfully from Apollo API:", contact);

        return new Response(
          JSON.stringify({ 
            success: true, 
            contact,
            source: "apollo"
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      } catch (apiError) {
        console.error("Apollo API error:", apiError);
        return new Response(
          JSON.stringify({ error: `Apollo API error: ${apiError instanceof Error ? apiError.message : 'Unknown error'}` }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    // For LinkedIn URLs, continue using Firecrawl + AI
    const firecrawlApiKey = Deno.env.get("FIRECRAWL_API_KEY");
    if (!firecrawlApiKey) {
      console.error("FIRECRAWL_API_KEY not configured");
      return new Response(
        JSON.stringify({ error: "Firecrawl not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Scrape LinkedIn with Firecrawl
    console.log("Scraping LinkedIn with Firecrawl (waitFor: 1500ms)...");
    const scrapeResponse = await fetch("https://api.firecrawl.dev/v1/scrape", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${firecrawlApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        url,
        formats: ["markdown"],
        onlyMainContent: true,
        waitFor: 1500,
      }),
    });

    if (!scrapeResponse.ok) {
      const errorText = await scrapeResponse.text();
      console.error("Firecrawl error:", errorText);
      return new Response(
        JSON.stringify({ error: "Failed to scrape page" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const scrapeData = await scrapeResponse.json();
    const markdown = scrapeData.data?.markdown || scrapeData.markdown;

    if (!markdown) {
      console.error("No content extracted from page");
      return new Response(
        JSON.stringify({ error: "Could not extract content from page" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Content extracted, length:", markdown.length);

    // Use Lovable AI to extract structured data
    const lovableApiKey = Deno.env.get("LOVABLE_API_KEY");
    if (!lovableApiKey) {
      console.error("LOVABLE_API_KEY not configured");
      return new Response(
        JSON.stringify({ error: "AI service not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const prompt = getLinkedInPrompt();

    console.log("Extracting with AI...");
    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${lovableApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash-lite",
        messages: [
          { role: "system", content: prompt },
          { role: "user", content: `Page:\n\n${markdown.slice(0, 4000)}` },
        ],
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error("AI extraction error:", errorText);
      return new Response(
        JSON.stringify({ error: "AI extraction failed" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const aiData = await aiResponse.json();
    const content = aiData.choices?.[0]?.message?.content;

    if (!content) {
      console.error("No AI response content");
      return new Response(
        JSON.stringify({ error: "AI did not return data" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Parse the JSON response
    let contact;
    try {
      // Clean up the response (remove markdown code blocks if present)
      let cleanContent = content.trim();
      if (cleanContent.startsWith("```json")) {
        cleanContent = cleanContent.replace(/^```json\n?/, "").replace(/\n?```$/, "");
      } else if (cleanContent.startsWith("```")) {
        cleanContent = cleanContent.replace(/^```\n?/, "").replace(/\n?```$/, "");
      }
      contact = JSON.parse(cleanContent);
    } catch (parseError) {
      console.error("Failed to parse AI response:", content);
      return new Response(
        JSON.stringify({ error: "Failed to parse contact data", raw: content }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Add the source URL if LinkedIn URL was provided
    if (!contact.linkedin) {
      contact.linkedin = url;
    }

    console.log("Contact extracted successfully:", contact);

    return new Response(
      JSON.stringify({ 
        success: true, 
        contact,
        source: "linkedin"
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in extract-apollo-contact:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
