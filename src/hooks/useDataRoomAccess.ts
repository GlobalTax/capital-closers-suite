// ============================================
// DATA ROOM ACCESS HOOK
// Hook para validar y gestionar acceso externo al Data Room
// ============================================

import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export type AccessDeniedReason = 
  | "invalid_token" 
  | "nda_not_signed" 
  | "access_revoked" 
  | "project_not_found";

export interface DataRoomDocument {
  id: string;
  file_name: string;
  descripcion: string | null;
  tipo: string | null;
  storage_path: string;
  file_size_bytes: number | null;
  created_at: string;
}

export interface DataRoomAccessState {
  isLoading: boolean;
  isValid: boolean;
  hasAccess: boolean;
  recipient: {
    nombre: string | null;
    email: string;
    empresa: string | null;
  } | null;
  project: {
    id: string;
    nombre: string;
  } | null;
  documents: DataRoomDocument[];
  accessDeniedReason?: AccessDeniedReason;
  ndaStatus?: string;
  revokeReason?: string;
  error?: string;
}

const initialState: DataRoomAccessState = {
  isLoading: true,
  isValid: false,
  hasAccess: false,
  recipient: null,
  project: null,
  documents: [],
};

export function useDataRoomAccess(trackingId: string | undefined) {
  const [state, setState] = useState<DataRoomAccessState>(initialState);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  // Validate access on mount
  useEffect(() => {
    if (!trackingId) {
      setState({
        ...initialState,
        isLoading: false,
        accessDeniedReason: "invalid_token",
        error: "Token no proporcionado",
      });
      return;
    }

    validateAndLoadDocuments(trackingId);
  }, [trackingId]);

  async function validateAndLoadDocuments(token: string) {
    setState({ ...initialState, isLoading: true });

    try {
      const { data, error } = await supabase.functions.invoke("access-cim-document", {
        body: { trackingId: token, action: "list" },
      });

      if (error) {
        console.error("[DataRoomAccess] Function error:", error);
        setState({
          ...initialState,
          isLoading: false,
          accessDeniedReason: "invalid_token",
          error: error.message,
        });
        return;
      }

      // Handle error responses from the function
      if (data?.code) {
        let reason: AccessDeniedReason = "invalid_token";
        
        switch (data.code) {
          case "INVALID_TOKEN":
            reason = "invalid_token";
            break;
          case "NDA_REQUIRED":
            reason = "nda_not_signed";
            break;
          case "ACCESS_REVOKED":
            reason = "access_revoked";
            break;
          case "PROJECT_NOT_FOUND":
            reason = "project_not_found";
            break;
        }

        setState({
          ...initialState,
          isLoading: false,
          isValid: data.code !== "INVALID_TOKEN",
          accessDeniedReason: reason,
          ndaStatus: data.ndaStatus,
          revokeReason: data.reason,
          recipient: data.recipient || null,
          error: data.error,
        });
        return;
      }

      // Success - has access
      setState({
        isLoading: false,
        isValid: true,
        hasAccess: true,
        recipient: data.recipient,
        project: data.project,
        documents: data.documents || [],
      });

    } catch (err) {
      console.error("[DataRoomAccess] Unexpected error:", err);
      setState({
        ...initialState,
        isLoading: false,
        accessDeniedReason: "invalid_token",
        error: err instanceof Error ? err.message : "Error inesperado",
      });
    }
  }

  async function downloadDocument(documentId: string): Promise<string | null> {
    if (!trackingId) return null;
    
    setDownloadingId(documentId);
    
    try {
      const { data, error } = await supabase.functions.invoke("access-cim-document", {
        body: { 
          trackingId, 
          documentId, 
          action: "download" 
        },
      });

      if (error || data?.code) {
        console.error("[DataRoomAccess] Download error:", error || data);
        return null;
      }

      return data.signedUrl;
    } catch (err) {
      console.error("[DataRoomAccess] Download exception:", err);
      return null;
    } finally {
      setDownloadingId(null);
    }
  }

  async function openDocument(documentId: string) {
    const url = await downloadDocument(documentId);
    if (url) {
      window.open(url, "_blank");
    }
  }

  async function triggerDownload(documentId: string, filename: string) {
    const url = await downloadDocument(documentId);
    if (url) {
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    }
  }

  function refresh() {
    if (trackingId) {
      validateAndLoadDocuments(trackingId);
    }
  }

  return {
    ...state,
    downloadingId,
    downloadDocument,
    openDocument,
    triggerDownload,
    refresh,
  };
}
