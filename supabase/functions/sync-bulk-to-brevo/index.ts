import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const BREVO_API_KEY = Deno.env.get("BREVO_API_KEY");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

interface SyncResult {
  contactos: { total: number; synced: number; errors: number };
  empresas: { total: number; synced: number; errors: number };
  mandatos: { total: number; synced: number; errors: number };
  errors: string[];
}

async function syncContactToBrevo(
  email: string,
  attributes: Record<string, unknown>
): Promise<{ success: boolean; brevoId?: string; error?: string }> {
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
      return { success: true, brevoId: String(data.id) };
    } else if (response.status === 204) {
      return { success: true }; // Updated
    } else if (response.status === 400) {
      const error = await response.json();
      if (error.code === "duplicate_parameter") {
        return { success: true }; // Already exists
      }
      return { success: false, error: error.message };
    } else {
      return { success: false, error: `HTTP ${response.status}` };
    }
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : String(e);
    return { success: false, error: message };
  }
}

async function syncCompanyToBrevo(
  name: string,
  attributes: Record<string, unknown>
): Promise<{ success: boolean; brevoId?: string; error?: string }> {
  try {
    const response = await fetch("https://api.brevo.com/v3/companies", {
      method: "POST",
      headers: {
        "api-key": BREVO_API_KEY!,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name,
        attributes,
      }),
    });

    if (response.ok) {
      const data = await response.json();
      return { success: true, brevoId: data.id };
    } else if (response.status === 400) {
      const error = await response.json();
      if (error.code === "duplicate_parameter") {
        return { success: true };
      }
      return { success: false, error: error.message };
    } else {
      return { success: false, error: `HTTP ${response.status}` };
    }
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : String(e);
    return { success: false, error: message };
  }
}

async function syncDealToBrevo(
  name: string,
  attributes: Record<string, unknown>
): Promise<{ success: boolean; brevoId?: string; error?: string }> {
  try {
    const response = await fetch("https://api.brevo.com/v3/crm/deals", {
      method: "POST",
      headers: {
        "api-key": BREVO_API_KEY!,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name,
        attributes,
      }),
    });

    if (response.ok) {
      const data = await response.json();
      return { success: true, brevoId: data.id };
    } else {
      return { success: false, error: `HTTP ${response.status}` };
    }
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : String(e);
    return { success: false, error: message };
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  console.log("Starting bulk sync to Brevo...");

  if (!BREVO_API_KEY) {
    return new Response(
      JSON.stringify({ success: false, error: "BREVO_API_KEY not configured" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
  const body = await req.json().catch(() => ({}));
  const entityType = body.entityType || "all"; // all, contacts, companies, deals
  const batchSize = body.batchSize || 50;

  const result: SyncResult = {
    contactos: { total: 0, synced: 0, errors: 0 },
    empresas: { total: 0, synced: 0, errors: 0 },
    mandatos: { total: 0, synced: 0, errors: 0 },
    errors: [],
  };

  try {
    // Sync contacts
    if (entityType === "all" || entityType === "contacts") {
      console.log("Syncing contacts...");
      
      const { data: contacts, error: contactsError } = await supabase
        .from("contactos")
        .select("id, email, nombre, apellidos, cargo, linkedin_url, empresa_id")
        .is("brevo_id", null)
        .not("email", "is", null)
        .limit(batchSize);

      if (contactsError) {
        result.errors.push(`Error fetching contacts: ${contactsError.message}`);
      } else if (contacts) {
        result.contactos.total = contacts.length;
        
        for (const contact of contacts) {
          const syncResult = await syncContactToBrevo(contact.email, {
            FIRSTNAME: contact.nombre || "",
            LASTNAME: contact.apellidos || "",
            CARGO: contact.cargo || "",
            LINKEDIN: contact.linkedin_url || "",
          });

          if (syncResult.success) {
            result.contactos.synced++;
            await supabase
              .from("contactos")
              .update({ 
                brevo_id: syncResult.brevoId || "synced",
                brevo_synced_at: new Date().toISOString()
              })
              .eq("id", contact.id);

            // Log sync
            await supabase.from("brevo_sync_log").insert({
              entity_type: "contact",
              entity_id: contact.id,
              sync_type: "bulk_export",
              sync_status: "success",
              brevo_id: syncResult.brevoId,
              last_sync_at: new Date().toISOString(),
            });
          } else {
            result.contactos.errors++;
            result.errors.push(`Contact ${contact.email}: ${syncResult.error}`);
          }

          // Rate limit
          await new Promise(r => setTimeout(r, 100));
        }
      }
    }

    // Sync companies
    if (entityType === "all" || entityType === "companies") {
      console.log("Syncing companies...");
      
      const { data: empresas, error: empresasError } = await supabase
        .from("empresas")
        .select("id, nombre, sector, website, ciudad, pais")
        .is("brevo_id", null)
        .not("nombre", "is", null)
        .limit(batchSize);

      if (empresasError) {
        result.errors.push(`Error fetching companies: ${empresasError.message}`);
      } else if (empresas) {
        result.empresas.total = empresas.length;
        
        for (const empresa of empresas) {
          const syncResult = await syncCompanyToBrevo(empresa.nombre, {
            sector: empresa.sector,
            website: empresa.website,
            city: empresa.ciudad,
            country: empresa.pais,
          });

          if (syncResult.success) {
            result.empresas.synced++;
            await supabase
              .from("empresas")
              .update({ 
                brevo_id: syncResult.brevoId || "synced",
                brevo_synced_at: new Date().toISOString()
              })
              .eq("id", empresa.id);

            await supabase.from("brevo_sync_log").insert({
              entity_type: "company",
              entity_id: empresa.id,
              sync_type: "bulk_export",
              sync_status: "success",
              brevo_id: syncResult.brevoId,
              last_sync_at: new Date().toISOString(),
            });
          } else {
            result.empresas.errors++;
            result.errors.push(`Company ${empresa.nombre}: ${syncResult.error}`);
          }

          await new Promise(r => setTimeout(r, 100));
        }
      }
    }

    // Sync mandatos as deals
    if (entityType === "all" || entityType === "deals") {
      console.log("Syncing mandatos as deals...");
      
      const { data: mandatos, error: mandatosError } = await supabase
        .from("mandatos")
        .select("id, nombre, tipo, estado, pipeline_stage, valor_estimado")
        .is("brevo_deal_id", null)
        .not("nombre", "is", null)
        .limit(batchSize);

      if (mandatosError) {
        result.errors.push(`Error fetching mandatos: ${mandatosError.message}`);
      } else if (mandatos) {
        result.mandatos.total = mandatos.length;
        
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
        
        for (const mandato of mandatos) {
          const syncResult = await syncDealToBrevo(mandato.nombre, {
            deal_stage: stageMap[mandato.pipeline_stage] || "Lead",
            deal_type: mandato.tipo,
            amount: mandato.valor_estimado || 0,
          });

          if (syncResult.success) {
            result.mandatos.synced++;
            await supabase
              .from("mandatos")
              .update({ 
                brevo_deal_id: syncResult.brevoId || "synced",
                brevo_synced_at: new Date().toISOString()
              })
              .eq("id", mandato.id);

            await supabase.from("brevo_sync_log").insert({
              entity_type: "deal",
              entity_id: mandato.id,
              sync_type: "bulk_export",
              sync_status: "success",
              brevo_id: syncResult.brevoId,
              last_sync_at: new Date().toISOString(),
            });
          } else {
            result.mandatos.errors++;
            result.errors.push(`Mandato ${mandato.nombre}: ${syncResult.error}`);
          }

          await new Promise(r => setTimeout(r, 100));
        }
      }
    }

    console.log("Bulk sync complete:", result);

    return new Response(
      JSON.stringify({ success: true, result }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: unknown) {
    const errMsg = error instanceof Error ? error.message : String(error);
    console.error("Bulk sync error:", error);
    return new Response(
      JSON.stringify({ success: false, error: errMsg }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
