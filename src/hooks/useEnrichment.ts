/**
 * Hook for managing the enrichment flow state
 */

import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import type {
  EnrichmentState,
  EnrichmentStep,
  LoadingPhase,
  MergeMode,
  EnrichedData,
  ContactWithDedupe,
  MergeResult,
} from "@/types/enrichment";
import {
  checkDuplicates,
  fetchEmpresaForMerge,
  calculateFieldDiff,
  dedupeContacts,
  applyEnrichment,
} from "@/services/enrichment.service";

const INITIAL_STATE: EnrichmentState = {
  step: 'input',
  inputMethod: 'name',
  inputValue: '',
  manualUrl: '',
  loadingPhase: null,
  enrichedData: null,
  duplicateDetected: false,
  existingEmpresa: null,
  matchType: null,
  mergeMode: 'update_existing',
  fieldSelections: {},
  contactsToImport: [],
  error: null,
  requireManualUrl: false,
};

interface UseEnrichmentOptions {
  onSuccess?: (result: MergeResult) => void;
  mandatoId?: string;
  empresaId?: string;
}

export function useEnrichment(options: UseEnrichmentOptions = {}) {
  const [state, setState] = useState<EnrichmentState>(INITIAL_STATE);

  const updateState = useCallback((updates: Partial<EnrichmentState>) => {
    setState(prev => ({ ...prev, ...updates }));
  }, []);

  const setStep = useCallback((step: EnrichmentStep) => {
    updateState({ step });
  }, [updateState]);

  const setLoadingPhase = useCallback((phase: LoadingPhase | null) => {
    updateState({ loadingPhase: phase });
  }, [updateState]);

  const setMergeMode = useCallback((mode: MergeMode) => {
    updateState({ mergeMode: mode });
  }, [updateState]);

  const toggleFieldSelection = useCallback((field: string) => {
    setState(prev => ({
      ...prev,
      fieldSelections: {
        ...prev.fieldSelections,
        [field]: !prev.fieldSelections[field],
      },
    }));
  }, []);

  const toggleContactSelection = useCallback((index: number) => {
    setState(prev => {
      const updated = [...prev.contactsToImport];
      updated[index] = { ...updated[index], selected: !updated[index].selected };
      return { ...prev, contactsToImport: updated };
    });
  }, []);

  const reset = useCallback(() => {
    setState(INITIAL_STATE);
  }, []);

  /**
   * Execute the enrichment search
   */
  const search = useCallback(async (urlOverride?: string) => {
    const searchInput = urlOverride || state.inputValue.trim();
    if (!searchInput) return;

    updateState({
      step: 'loading',
      loadingPhase: 'searching',
      error: null,
      requireManualUrl: false,
    });

    try {
      // Phase 1: Searching sources
      setLoadingPhase('scraping');
      
      // Call the edge function
      const { data, error: fnError } = await supabase.functions.invoke("enrich-company-v2", {
        body: { 
          input: searchInput,
          manualUrl: urlOverride || undefined,
        },
      });

      if (fnError) throw new Error(fnError.message);

      // Phase 2: Check response
      setLoadingPhase('extracting');

      if (!data.success) {
        if (data.requireManualUrl) {
          updateState({
            step: 'input',
            requireManualUrl: true,
            error: data.error || "No se encontró información automáticamente",
            loadingPhase: null,
          });
          return;
        }
        throw new Error(data.error || "No se pudieron obtener datos");
      }

      const enrichedData: EnrichedData = data.data;

      // Phase 3: Classify and validate
      setLoadingPhase('classifying');

      // Phase 4: Check for duplicates
      setLoadingPhase('checking_duplicates');
      
      const validation = await checkDuplicates(enrichedData);
      let existingEmpresa = null;
      let fieldSelections: Record<string, boolean> = {};

      if (validation.isDuplicate && validation.existingEmpresa) {
        existingEmpresa = await fetchEmpresaForMerge(validation.existingEmpresa.id);
        
        if (existingEmpresa) {
          const diffs = calculateFieldDiff(existingEmpresa, enrichedData);
          fieldSelections = Object.fromEntries(
            diffs.map(d => [d.field, d.selected])
          );
        }
      }

      // Dedupe contacts
      const contactsWithDedupe = await dedupeContacts(
        enrichedData.contactos,
        existingEmpresa?.id
      );

      updateState({
        step: 'preview',
        loadingPhase: null,
        enrichedData,
        duplicateDetected: validation.isDuplicate,
        existingEmpresa,
        matchType: validation.matchType || null,
        fieldSelections,
        contactsToImport: contactsWithDedupe,
        error: null,
      });

    } catch (err) {
      const message = err instanceof Error ? err.message : "Error desconocido";
      updateState({
        step: 'input',
        loadingPhase: null,
        error: message,
      });
    }
  }, [state.inputValue, updateState, setLoadingPhase]);

  /**
   * Apply the enrichment
   */
  const apply = useCallback(async (): Promise<MergeResult | null> => {
    if (!state.enrichedData) return null;

    updateState({ step: 'confirm' });

    try {
      const result = await applyEnrichment(
        state.enrichedData,
        state.mergeMode !== 'create_new' ? state.existingEmpresa?.id || null : null,
        state.mergeMode,
        state.fieldSelections,
        state.contactsToImport,
        options.mandatoId
      );

      options.onSuccess?.(result);
      return result;

    } catch (err) {
      const message = err instanceof Error ? err.message : "Error al aplicar cambios";
      updateState({ error: message, step: 'preview' });
      return null;
    }
  }, [state, options, updateState]);

  return {
    state,
    setStep,
    setLoadingPhase,
    setMergeMode,
    toggleFieldSelection,
    toggleContactSelection,
    updateState,
    reset,
    search,
    apply,
  };
}
