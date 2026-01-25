import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// 1x1 transparent GIF
const TRANSPARENT_GIF = Uint8Array.from(atob("R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7"), c => c.charCodeAt(0));

// UUID validation regex
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Anti-cache headers for email clients
const gifHeaders = {
  "Content-Type": "image/gif",
  "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0",
  "Pragma": "no-cache",
  "Expires": "Thu, 01 Jan 1970 00:00:00 GMT",
  "X-Content-Type-Options": "nosniff",
};

serve(async (req) => {
  try {
    const url = new URL(req.url);
    const trackingId = url.searchParams.get("tid");

    // Always return GIF even if tracking fails
    if (!trackingId) {
      return new Response(TRANSPARENT_GIF, { headers: gifHeaders });
    }

    // Validate UUID format to prevent abuse
    if (!UUID_REGEX.test(trackingId)) {
      console.warn("Invalid tracking ID format:", trackingId);
      return new Response(TRANSPARENT_GIF, { headers: gifHeaders });
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

    // Detect email preview bots (still record, but could filter in reports)
    const isPreviewBot = /googleimageproxy|outlookmobile|thunderbird|yahoo.*slurp|microsoft.*office/i.test(userAgent);
    
    if (isPreviewBot) {
      console.log("Preview bot detected:", userAgent.substring(0, 100));
    }

    // Call the tracking function
    const { error } = await supabase.rpc("record_tracking_event", {
      p_tracking_id: trackingId,
      p_event_type: "opened",
      p_ip_address: ipAddress !== "unknown" ? ipAddress : null,
      p_user_agent: userAgent || null,
    });

    if (error) {
      console.error("Error recording open event:", error);
    }

    // Return transparent 1x1 GIF
    return new Response(TRANSPARENT_GIF, { headers: gifHeaders });
  } catch (error) {
    console.error("Error tracking open:", error);
    
    // Always return the GIF even on error
    return new Response(TRANSPARENT_GIF, { headers: gifHeaders });
  }
});
