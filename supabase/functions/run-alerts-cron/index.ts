import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

  // Auth: SERVICE_ROLE_KEY for pg_cron, admin auth for manual, or internal pg_cron call
  const authHeader = req.headers.get("Authorization");
  const token = authHeader?.replace("Bearer ", "") || "";
  const isServiceRole = token === serviceRoleKey;

  // Check if this is a pg_cron internal call (body contains source: "pg_cron")
  let body: Record<string, unknown> = {};
  try {
    body = await req.json();
  } catch {
    // No body is fine
  }
  const isPgCron = body?.source === "pg_cron";

  if (!isServiceRole && !isPgCron) {
    // Validate admin auth
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader || "" } },
    });
    const { data: { user }, error: userErr } = await userClient.auth.getUser();
    if (userErr || !user) {
      return new Response(JSON.stringify({ error: "No autorizado" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const adminClient = createClient(supabaseUrl, serviceRoleKey);
    const { data: admin } = await adminClient
      .from("admin_users").select("role")
      .eq("user_id", user.id).eq("is_active", true).single();
    if (!admin || !["admin", "super_admin"].includes(admin.role)) {
      return new Response(JSON.stringify({ error: "Permisos insuficientes" }), {
        status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
  }

  try {
    const supabase = createClient(supabaseUrl, serviceRoleKey);
    const startTime = Date.now();

    // 1. Generate alerts via RPC
    const { error: rpcError } = await supabase.rpc("generate_mandato_alerts");
    if (rpcError) {
      console.error("RPC error:", rpcError);
      throw new Error(`generate_mandato_alerts failed: ${rpcError.message}`);
    }

    // 2. Find recent alerts without description (need AI enhancement)
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const { data: newAlerts, error: fetchErr } = await supabase
      .from("mandato_alerts")
      .select("id")
      .gte("created_at", twentyFourHoursAgo)
      .eq("is_dismissed", false)
      .is("description", null)
      .limit(50);

    if (fetchErr) {
      console.error("Fetch alerts error:", fetchErr);
    }

    // 3. Enhance each alert with AI (fire-and-forget via edge function call)
    let enhancedCount = 0;
    if (newAlerts && newAlerts.length > 0) {
      for (const alert of newAlerts) {
        try {
          const enhanceResp = await fetch(
            `${supabaseUrl}/functions/v1/enhance-alert-message`,
            {
              method: "POST",
              headers: {
                Authorization: `Bearer ${serviceRoleKey}`,
                "Content-Type": "application/json",
              },
              body: JSON.stringify({ alert_id: alert.id }),
            }
          );
          if (enhanceResp.ok) enhancedCount++;
          else console.warn(`Enhance failed for ${alert.id}: ${enhanceResp.status}`);
        } catch (e) {
          console.warn(`Enhance error for ${alert.id}:`, e);
        }
      }
    }

    const durationMs = Date.now() - startTime;

    // Log execution
    await supabase.from("ai_activity_log").insert({
      module: "alerts_cron",
      entity_type: "system",
      success: true,
      duration_ms: durationMs,
      user_id: null,
    });

    return new Response(
      JSON.stringify({
        success: true,
        alerts_generated: true,
        alerts_enhanced: enhancedCount,
        total_new: newAlerts?.length || 0,
        duration_ms: durationMs,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("run-alerts-cron error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
