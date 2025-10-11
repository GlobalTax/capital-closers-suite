import { useState, useEffect } from 'react';
import { searchContactos } from '@/services/contactos';
import type { Contacto } from '@/types';
import { handleError } from '@/lib/error-handler';

export function useContactosSearch(query: string, debounceMs = 300) {
  const [contactos, setContactos] = useState<Contacto[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!query || query.trim().length < 2) {
      setContactos([]);
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const results = await searchContactos(query.trim());
        setContactos(results);
      } catch (error) {
        handleError(error, 'Búsqueda de contactos');
        setContactos([]);
      } finally {
        setLoading(false);
      }
    }, debounceMs);

    return () => clearTimeout(timer);
  }, [query, debounceMs]);

  return { contactos, loading };
}
