import { useState, useEffect } from 'react';
import { empresaService } from '@/services/empresas';
import type { Empresa } from '@/types';
import { handleError } from '@/lib/error-handler';

/**
 * Hook para búsqueda de empresas con debounce server-side
 * Optimizado para selectores typeahead
 */
export function useEmpresasSearch(
  query: string,
  debounceMs = 250,
  esTarget?: boolean
) {
  const [empresas, setEmpresas] = useState<Empresa[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Mínimo 2 caracteres para buscar
    if (!query || query.trim().length < 2) {
      setEmpresas([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    
    const timer = setTimeout(async () => {
      try {
        const results = await empresaService.search(query.trim(), {
          limit: 20,
          esTarget,
        });
        setEmpresas(results);
      } catch (error) {
        handleError(error, 'Búsqueda de empresas');
        setEmpresas([]);
      } finally {
        setLoading(false);
      }
    }, debounceMs);

    return () => clearTimeout(timer);
  }, [query, debounceMs, esTarget]);

  return { empresas, loading };
}
