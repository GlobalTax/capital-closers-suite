import { useState, useCallback } from "react";
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

  const openPreview = useCallback(async (doc: DocumentInfo) => {
    if (!doc.storage_path) {
      console.error("[useDocumentPreview] Document has no storage_path");
      return;
    }

    setPreviewState({ document: doc, url: null, isLoading: true });

    try {
      // Use longer expiration for Office docs
      const expiration = isOfficeDocument(doc.mime_type) ? 7200 : 3600;
      const url = await getSignedUrl(doc.storage_path, expiration);
      setPreviewState({ document: doc, url, isLoading: false });
    } catch (error) {
      console.error("[useDocumentPreview] Error getting signed URL:", error);
      setPreviewState({ document: doc, url: null, isLoading: false });
    }
  }, []);

  const closePreview = useCallback(() => {
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
