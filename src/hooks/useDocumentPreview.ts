import { useState, useCallback, useEffect, useRef } from "react";
import { getSignedUrl } from "@/services/uploads";
import { isOfficeDocument } from "@/lib/file-utils";
import type { DocumentInfo } from "@/components/shared/UnifiedDocumentViewer";

interface PreviewState {
  document: DocumentInfo | null;
  url: string | null;
  isLoading: boolean;
}

/**
 * Hook for managing document preview state.
 * Handles signed URL generation and preview dialog state.
 */
export function useDocumentPreview() {
  const [previewState, setPreviewState] = useState<PreviewState>({
    document: null,
    url: null,
    isLoading: false,
  });
  
  // Track blob URLs for cleanup
  const blobUrlRef = useRef<string | null>(null);

  // Cleanup blob URLs when they change or on unmount
  useEffect(() => {
    return () => {
      if (blobUrlRef.current) {
        URL.revokeObjectURL(blobUrlRef.current);
        blobUrlRef.current = null;
      }
    };
  }, []);

  const openPreview = useCallback(async (doc: DocumentInfo) => {
    if (!doc.storage_path) {
      console.error("[useDocumentPreview] Document has no storage_path");
      return;
    }

    // Cleanup previous blob URL
    if (blobUrlRef.current) {
      URL.revokeObjectURL(blobUrlRef.current);
      blobUrlRef.current = null;
    }

    setPreviewState({ document: doc, url: null, isLoading: true });

    try {
      // Use longer expiration for Office docs (param ignored but kept for compat)
      const expiration = isOfficeDocument(doc.mime_type) ? 7200 : 3600;
      const url = await getSignedUrl(doc.storage_path, expiration);
      
      // Track blob URL for cleanup
      if (url && url.startsWith('blob:')) {
        blobUrlRef.current = url;
      }
      
      setPreviewState({ document: doc, url, isLoading: false });
    } catch (error) {
      console.error("[useDocumentPreview] Error getting document URL:", error);
      setPreviewState({ document: doc, url: null, isLoading: false });
    }
  }, []);

  const closePreview = useCallback(() => {
    // Cleanup blob URL when closing
    if (blobUrlRef.current) {
      URL.revokeObjectURL(blobUrlRef.current);
      blobUrlRef.current = null;
    }
    setPreviewState({ document: null, url: null, isLoading: false });
  }, []);

  const setPreviewOpen = useCallback((open: boolean) => {
    if (!open) {
      closePreview();
    }
  }, [closePreview]);

  return {
    previewDocument: previewState.document,
    previewUrl: previewState.url,
    isPreviewLoading: previewState.isLoading,
    isPreviewOpen: !!previewState.document,
    openPreview,
    closePreview,
    setPreviewOpen,
  };
}
