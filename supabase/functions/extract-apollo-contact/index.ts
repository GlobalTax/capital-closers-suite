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

const getPromptForType = (urlType: UrlType): string => {
  if (urlType === "linkedin") {
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
  }

  // Apollo prompt
  return `Extract contact information from this Apollo.io profile page.
Look for:
- Full name
- Job title/position
- Company name
- Email address (Apollo often shows this)
- Phone number (if available)
- LinkedIn URL

Return a JSON object with these fields (use null for missing data):
{
  "nombre": "first name",
  "apellidos": "last name(s)",
  "email": "email@example.com",
  "telefono": "+1234567890",
  "cargo": "job title",
  "empresa": "company name",
  "linkedin": "linkedin profile URL if available"
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

    // Get Firecrawl API key
    const firecrawlApiKey = Deno.env.get("FIRECRAWL_API_KEY");
    if (!firecrawlApiKey) {
      console.error("FIRECRAWL_API_KEY not configured");
      return new Response(
        JSON.stringify({ error: "Firecrawl not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Scrape the page with Firecrawl - dynamic wait time based on platform
    const waitTime = urlType === "apollo" ? 1000 : 1500;
    console.log(`Scraping with Firecrawl (waitFor: ${waitTime}ms)...`);
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
        waitFor: waitTime,
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

    const prompt = getPromptForType(urlType);

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

    // Add the source URL if not a LinkedIn URL was provided
    if (urlType === "linkedin" && !contact.linkedin) {
      contact.linkedin = url;
    }

    console.log("Contact extracted successfully:", contact);

    return new Response(
      JSON.stringify({ 
        success: true, 
        contact,
        source: urlType
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
