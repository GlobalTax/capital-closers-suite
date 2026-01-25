// ============================================
// NDA WORKFLOW SERVICE
// Gestión del flujo NDA post-teaser
// ============================================

import { supabase } from "@/integrations/supabase/client";

export type NDAStatus = "not_required" | "pending" | "sent" | "signed" | "expired" | "rejected";

export interface NDARecipient {
  id: string;
  email: string;
  nombre: string | null;
  empresa?: string | null;
  company_name?: string | null;
  sent_at: string | null;
  opened_at: string | null;
  clicked_at: string | null;
  status: string;
  nda_status: NDAStatus;
  nda_sent_at: string | null;
  nda_signed_at: string | null;
  nda_language: "ES" | "EN" | null;
  nda_document_id: string | null;
  nda_sent_by: string | null;
  cim_access_granted: boolean;
  cim_access_granted_at: string | null;
  cim_access_granted_by: string | null;
}

export interface NDATrackingEvent {
  id: string;
  recipient_id: string;
  event_type: string;
  performed_by: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
}

export interface NDAStats {
  total: number;
  eligible: number;
  pending: number;
  sent: number;
  signed: number;
  cimAccessGranted: number;
}

/**
 * Check if a recipient is eligible to receive NDA
 */
export function isEligibleForNDA(recipient: NDARecipient): boolean {
  // Must have received teaser
  if (!recipient.sent_at) return false;
  
  // Must have engagement (opened, clicked, or responded)
  return !!(recipient.opened_at || recipient.clicked_at || recipient.status === "responded");
}

/**
 * Send NDA to a recipient
 */
export async function sendNDA(
  recipientId: string,
  language: "ES" | "EN",
  ndaDocumentId?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const { data, error } = await supabase.functions.invoke("send-nda-email", {
      body: {
        recipientId,
        language,
        ndaDocumentId,
      },
    });

    if (error) {
      console.error("[NDAWorkflow] Send NDA error:", error);
      return { success: false, error: error.message };
    }

    if (!data?.success) {
      return { success: false, error: data?.error || "Error desconocido" };
    }

    return { success: true };
  } catch (error) {
    console.error("[NDAWorkflow] Send NDA exception:", error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Error al enviar NDA" 
    };
  }
}

/**
 * Send NDA to multiple recipients
 */
export async function sendBulkNDA(
  recipientIds: string[],
  language: "ES" | "EN"
): Promise<{ 
  success: number; 
  failed: number; 
  errors: Array<{ recipientId: string; error: string }> 
}> {
  const results = {
    success: 0,
    failed: 0,
    errors: [] as Array<{ recipientId: string; error: string }>,
  };

  for (const recipientId of recipientIds) {
    const result = await sendNDA(recipientId, language);
    if (result.success) {
      results.success++;
    } else {
      results.failed++;
      results.errors.push({ recipientId, error: result.error || "Unknown error" });
    }
    // Small delay to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  return results;
}

/**
 * Mark NDA as signed (manual confirmation)
 */
export async function markNDAAsSigned(
  recipientId: string,
  signedAt?: Date
): Promise<{ success: boolean; error?: string }> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    const { error } = await supabase
      .from("teaser_recipients")
      .update({
        nda_status: "signed",
        nda_signed_at: (signedAt || new Date()).toISOString(),
      })
      .eq("id", recipientId);

    if (error) {
      console.error("[NDAWorkflow] Mark signed error:", error);
      return { success: false, error: error.message };
    }

    // Log event
    await supabase
      .from("nda_tracking_events")
      .insert({
        recipient_id: recipientId,
        event_type: "nda_signed",
        performed_by: user?.id,
        metadata: {
          manual_confirmation: true,
          signed_at: (signedAt || new Date()).toISOString(),
        },
      });

    return { success: true };
  } catch (error) {
    console.error("[NDAWorkflow] Mark signed exception:", error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Error al marcar NDA como firmado" 
    };
  }
}

/**
 * Grant CIM access (manual override)
 */
export async function grantCIMAccess(
  recipientId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    const { error } = await supabase
      .from("teaser_recipients")
      .update({
        cim_access_granted: true,
        cim_access_granted_at: new Date().toISOString(),
        cim_access_granted_by: user?.id,
      })
      .eq("id", recipientId);

    if (error) {
      console.error("[NDAWorkflow] Grant CIM access error:", error);
      return { success: false, error: error.message };
    }

    // Log event
    await supabase
      .from("nda_tracking_events")
      .insert({
        recipient_id: recipientId,
        event_type: "cim_access_granted",
        performed_by: user?.id,
        metadata: {
          manual_override: true,
        },
      });

    return { success: true };
  } catch (error) {
    console.error("[NDAWorkflow] Grant CIM access exception:", error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Error al conceder acceso CIM" 
    };
  }
}

/**
 * Revoke CIM access
 */
export async function revokeCIMAccess(
  recipientId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    const { error } = await supabase
      .from("teaser_recipients")
      .update({
        cim_access_granted: false,
        cim_access_granted_at: null,
        cim_access_granted_by: null,
      })
      .eq("id", recipientId);

    if (error) {
      console.error("[NDAWorkflow] Revoke CIM access error:", error);
      return { success: false, error: error.message };
    }

    // Log event
    await supabase
      .from("nda_tracking_events")
      .insert({
        recipient_id: recipientId,
        event_type: "manual_override",
        performed_by: user?.id,
        metadata: {
          action: "revoke_cim_access",
        },
      });

    return { success: true };
  } catch (error) {
    console.error("[NDAWorkflow] Revoke CIM access exception:", error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Error al revocar acceso CIM" 
    };
  }
}

/**
 * Get NDA activity log for a recipient
 */
export async function getNDAActivityLog(
  recipientId: string
): Promise<NDATrackingEvent[]> {
  const { data, error } = await supabase
    .from("nda_tracking_events")
    .select("*")
    .eq("recipient_id", recipientId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("[NDAWorkflow] Get activity log error:", error);
    return [];
  }

  return (data || []).map(event => ({
    ...event,
    metadata: (event.metadata as Record<string, unknown>) || {},
  }));
}

/**
 * Calculate NDA stats for a campaign
 */
export function calculateNDAStats(recipients: NDARecipient[]): NDAStats {
  return {
    total: recipients.length,
    eligible: recipients.filter(r => isEligibleForNDA(r)).length,
    pending: recipients.filter(r => r.nda_status === "pending").length,
    sent: recipients.filter(r => r.nda_status === "sent").length,
    signed: recipients.filter(r => r.nda_status === "signed").length,
    cimAccessGranted: recipients.filter(r => r.cim_access_granted || r.nda_status === "signed").length,
  };
}

/**
 * Check if recipient can access CIM
 */
export function canAccessCIM(recipient: NDARecipient): boolean {
  return recipient.nda_status === "signed" || recipient.cim_access_granted === true;
}
