import { useState, useEffect, useCallback } from "react";

export interface SavedSearch {
  id: string;
  name: string;
  filters: Record<string, string | string[]>;
  createdAt: string;
}

interface UseSavedSearchesOptions {
  storageKey: string;
  maxSaved?: number;
}

export function useSavedSearches({ storageKey, maxSaved = 10 }: UseSavedSearchesOptions) {
  const [savedSearches, setSavedSearches] = useState<SavedSearch[]>([]);

  // Cargar desde localStorage al montar
  useEffect(() => {
    try {
      const stored = localStorage.getItem(storageKey);
      if (stored) {
        setSavedSearches(JSON.parse(stored));
      }
    } catch (error) {
      console.error("Error loading saved searches:", error);
    }
  }, [storageKey]);

  // Persistir cambios en localStorage
  const persistSearches = useCallback((searches: SavedSearch[]) => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(searches));
    } catch (error) {
      console.error("Error saving searches:", error);
    }
  }, [storageKey]);

  const saveSearch = useCallback((name: string, filters: Record<string, string | string[]>) => {
    const newSearch: SavedSearch = {
      id: `search_${Date.now()}`,
      name,
      filters,
      createdAt: new Date().toISOString(),
    };

    setSavedSearches((prev) => {
      const updated = [newSearch, ...prev].slice(0, maxSaved);
      persistSearches(updated);
      return updated;
    });

    return newSearch;
  }, [maxSaved, persistSearches]);

  const deleteSearch = useCallback((searchId: string) => {
    setSavedSearches((prev) => {
      const updated = prev.filter((s) => s.id !== searchId);
      persistSearches(updated);
      return updated;
    });
  }, [persistSearches]);

  const renameSearch = useCallback((searchId: string, newName: string) => {
    setSavedSearches((prev) => {
      const updated = prev.map((s) => 
        s.id === searchId ? { ...s, name: newName } : s
      );
      persistSearches(updated);
      return updated;
    });
  }, [persistSearches]);

  const clearAll = useCallback(() => {
    setSavedSearches([]);
    localStorage.removeItem(storageKey);
  }, [storageKey]);

  return {
    savedSearches,
    saveSearch,
    deleteSearch,
    renameSearch,
    clearAll,
    hasSavedSearches: savedSearches.length > 0,
  };
}
