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
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { prospect_ids } = await req.json() as {
      prospect_ids: string[];
    };

    if (!prospect_ids || prospect_ids.length === 0) {
      return new Response(
        JSON.stringify({ error: "prospect_ids is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`[Import Outbound] Processing ${prospect_ids.length} prospects`);

    // Fetch prospects to import
    const { data: prospects, error: fetchError } = await supabase
      .from("outbound_prospects")
      .select(`
        id, 
        campaign_id,
        nombre, 
        apellidos, 
        cargo, 
        empresa, 
        email, 
        telefono, 
        linkedin_url,
        company_industry,
        company_location
      `)
      .in("id", prospect_ids)
      .eq("enrichment_status", "enriched")
      .eq("import_status", "not_imported");

    if (fetchError || !prospects) {
      throw new Error("Failed to fetch prospects");
    }

    // Get campaign info for sector
    let campaignSector = null;
    if (prospects.length > 0) {
      const { data: campaign } = await supabase
        .from("outbound_campaigns")
        .select("sector_name")
        .eq("id", prospects[0].campaign_id)
        .single();
      campaignSector = campaign?.sector_name;
    }

    // Check for existing emails to avoid duplicates
    const emails = prospects.map(p => p.email).filter(Boolean);
    const { data: existingLeads } = await supabase
      .from("contact_leads")
      .select("email")
      .in("email", emails);

    const existingEmails = new Set((existingLeads || []).map(l => l.email.toLowerCase()));

    let imported = 0;
    let duplicates = 0;
    let failed = 0;

    for (const prospect of prospects) {
      try {
        // Check for duplicate
        if (prospect.email && existingEmails.has(prospect.email.toLowerCase())) {
          await supabase
            .from("outbound_prospects")
            .update({ import_status: "duplicate" })
            .eq("id", prospect.id);
          duplicates++;
          continue;
        }

        // Create contact_lead
        const fullName = [prospect.nombre, prospect.apellidos].filter(Boolean).join(" ");
        
        const { data: newLead, error: insertError } = await supabase
          .from("contact_leads")
          .insert({
            full_name: fullName,
            email: prospect.email,
            phone: prospect.telefono,
            company: prospect.empresa,
            position: prospect.cargo,
            linkedin_url: prospect.linkedin_url,
            sector: campaignSector || prospect.company_industry,
            location: prospect.company_location,
            source: "apollo_outbound",
            status: "nuevo",
            notes: `Importado desde campaña de outbound Apollo`,
          })
          .select("id")
          .single();

        if (insertError) {
          console.error(`[Import Outbound] Error inserting lead for prospect ${prospect.id}:`, insertError);
          
          await supabase
            .from("outbound_prospects")
            .update({ import_status: "rejected" })
            .eq("id", prospect.id);
          failed++;
          continue;
        }

        // Update prospect with imported status
        await supabase
          .from("outbound_prospects")
          .update({ 
            import_status: "imported",
            imported_at: new Date().toISOString(),
            imported_lead_id: newLead.id,
          })
          .eq("id", prospect.id);

        imported++;
        
        // Add email to existing set to catch duplicates within same batch
        if (prospect.email) {
          existingEmails.add(prospect.email.toLowerCase());
        }

      } catch (error) {
        console.error(`[Import Outbound] Error processing prospect ${prospect.id}:`, error);
        failed++;
      }
    }

    // Update campaign stats
    if (prospects.length > 0) {
      const campaignId = prospects[0].campaign_id;
      
      const { data: campaign } = await supabase
        .from("outbound_campaigns")
        .select("total_imported")
        .eq("id", campaignId)
        .single();

      if (campaign) {
        await supabase
          .from("outbound_campaigns")
          .update({
            total_imported: (campaign.total_imported || 0) + imported,
          })
          .eq("id", campaignId);
      }
    }

    console.log(`[Import Outbound] Complete: ${imported} imported, ${duplicates} duplicates, ${failed} failed`);

    return new Response(
      JSON.stringify({ imported, duplicates, failed }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("[Import Outbound] Error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
