import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// UUID validation regex
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Default redirect for errors
const DEFAULT_REDIRECT = "https://capittal.es";

// Allowed redirect domains (prevent open redirect)
const ALLOWED_DOMAINS = ["capittal.es", "www.capittal.es", "crm-capittal.lovable.app"];

function isAllowedRedirect(targetUrl: string): boolean {
  try {
    const parsed = new URL(targetUrl);
    return ALLOWED_DOMAINS.some(
      (d) => parsed.hostname === d || parsed.hostname.endsWith(`.${d}`)
    );
  } catch {
    return false;
  }
}

function safeRedirectUrl(targetUrl: string | null): string {
  if (!targetUrl) return DEFAULT_REDIRECT;
  const decoded = decodeURIComponent(targetUrl);
  return isAllowedRedirect(decoded) ? decoded : DEFAULT_REDIRECT;
}

serve(async (req) => {
  try {
    const url = new URL(req.url);
    const trackingId = url.searchParams.get("tid");
    const targetUrl = url.searchParams.get("url");

    if (!trackingId || !targetUrl) {
      // Redirect to homepage if missing params
      return new Response(null, {
        status: 302,
        headers: { "Location": DEFAULT_REDIRECT },
      });
    }

    // Validate UUID format to prevent abuse
    if (!UUID_REGEX.test(trackingId)) {
      console.warn("Invalid tracking ID format:", trackingId);
      return new Response(null, {
        status: 302,
        headers: { "Location": DEFAULT_REDIRECT },
      });
    }

    const decodedUrl = decodeURIComponent(targetUrl);

    // Validate target URL is allowed (prevent open redirect)
    if (!isAllowedRedirect(decodedUrl)) {
      console.warn("Blocked redirect to disallowed domain:", decodedUrl);
      return new Response(null, {
        status: 302,
        headers: { "Location": DEFAULT_REDIRECT },
      });
    }

    // Initialize Supabase client with service role
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get client info for logging
    const ipAddress = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || 
                     req.headers.get("x-real-ip") || 
                     "unknown";
    const userAgent = req.headers.get("user-agent") || "";

    // Call the tracking function (don't await to speed up redirect)
    supabase.rpc("record_tracking_event", {
      p_tracking_id: trackingId,
      p_event_type: "clicked",
      p_ip_address: ipAddress !== "unknown" ? ipAddress : null,
      p_user_agent: userAgent || null,
      p_clicked_url: decodedUrl,
    }).then(({ error }) => {
      if (error) {
        console.error("Error recording click event:", error);
      }
    });

    // Redirect to the original URL immediately
    return new Response(null, {
      status: 302,
      headers: { 
        "Location": decodedUrl,
        "Cache-Control": "no-store, no-cache, must-revalidate",
        "Pragma": "no-cache",
      },
    });
  } catch (error) {
    console.error("Error tracking click:", error);
    
    return new Response(null, {
      status: 302,
      headers: { "Location": DEFAULT_REDIRECT },
    });
  }
});
