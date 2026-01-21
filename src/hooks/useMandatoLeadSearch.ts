import { useState, useEffect, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export type SearchItemType = 'mandato' | 'contacto' | 'internal';

export interface MandatoLeadSearchItem {
  id: string;
  type: SearchItemType;
  label: string;
  sublabel?: string;
  icon?: 'briefcase' | 'user' | 'folder';
  metadata?: {
    codigo?: string;
    tipo?: string;
    estado?: string;
    empresaNombre?: string;
    email?: string;
  };
}

// Debounce hook
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

const GENERAL_WORK_ID = '00000000-0000-0000-0000-000000000001';

// Internal projects that are always shown
const INTERNAL_PROJECTS: MandatoLeadSearchItem[] = [
  {
    id: GENERAL_WORK_ID,
    type: 'internal',
    label: 'Trabajo General M&A',
    sublabel: 'Trabajo interno no asociado a mandato',
    icon: 'folder',
  },
];

interface UseMandatoLeadSearchOptions {
  includeGeneralWork?: boolean;
  includeLeads?: boolean;
  debounceMs?: number;
  limit?: number;
}

export function useMandatoLeadSearch(
  searchTerm: string,
  options: UseMandatoLeadSearchOptions = {}
) {
  const {
    includeGeneralWork = true,
    includeLeads = true,
    debounceMs = 300,
    limit = 10, // Reduced from 15 for faster queries
  } = options;

  const debouncedSearch = useDebounce(searchTerm.trim().toLowerCase(), debounceMs);

  return useQuery({
    queryKey: ['mandato-lead-search', debouncedSearch, includeLeads, limit],
    queryFn: async (): Promise<{
      internalProjects: MandatoLeadSearchItem[];
      mandatos: MandatoLeadSearchItem[];
      contactos: MandatoLeadSearchItem[];
      error?: string;
    }> => {
      const results = {
        internalProjects: [] as MandatoLeadSearchItem[],
        mandatos: [] as MandatoLeadSearchItem[],
        contactos: [] as MandatoLeadSearchItem[],
        error: undefined as string | undefined,
      };

      try {
        // Always include internal projects if enabled
        if (includeGeneralWork) {
          results.internalProjects = INTERNAL_PROJECTS.filter(
            (p) =>
              !debouncedSearch ||
              p.label.toLowerCase().includes(debouncedSearch) ||
              p.sublabel?.toLowerCase().includes(debouncedSearch)
          );
        }

        // Search mandatos with optimized query
        let mandatoQuery = supabase
          .from('mandatos')
          .select(`
            id,
            codigo,
            descripcion,
            tipo,
            estado,
            empresa_principal:empresas(id, nombre)
          `)
          .not('estado', 'in', '("cerrado","cancelado")')
          .order('created_at', { ascending: false })
          .limit(limit);

        if (debouncedSearch) {
          mandatoQuery = mandatoQuery.or(
            `descripcion.ilike.%${debouncedSearch}%,codigo.ilike.%${debouncedSearch}%`
          );
        }

        const { data: mandatos, error: mandatoError } = await mandatoQuery;

        if (mandatoError) {
          console.error('[MandatoLeadSearch] Error fetching mandatos:', mandatoError);
        } else if (mandatos) {
          results.mandatos = mandatos.map((m: any) => ({
            id: m.id,
            type: 'mandato' as const,
            label: m.codigo
              ? `${m.codigo} · ${m.descripcion || 'Sin descripción'}`
              : m.descripcion || 'Sin descripción',
            sublabel: m.empresa_principal?.nombre || undefined,
            icon: 'briefcase' as const,
            metadata: {
              codigo: m.codigo,
              tipo: m.tipo,
              estado: m.estado,
              empresaNombre: m.empresa_principal?.nombre,
            },
          }));
        }

        // Search mandate_leads if enabled (leads are now managed through mandate_leads table)
        if (includeLeads) {
          let leadQuery = supabase
            .from('mandate_leads')
            .select(`
              id,
              company_name,
              contact_name,
              contact_email,
              sector,
              stage,
              mandato:mandatos(id, descripcion, codigo)
            `)
            .not('stage', 'in', '("cerrado_ganado","cerrado_perdido","descartado")')
            .order('created_at', { ascending: false })
            .limit(limit);

          if (debouncedSearch) {
            leadQuery = leadQuery.or(
              `company_name.ilike.%${debouncedSearch}%,contact_name.ilike.%${debouncedSearch}%,contact_email.ilike.%${debouncedSearch}%`
            );
          }

          const { data: leads, error: leadError } = await leadQuery;

          if (leadError) {
            console.error('[MandatoLeadSearch] Error fetching mandate_leads:', leadError);
          } else if (leads) {
            results.contactos = leads.map((l: any) => {
              const mandatoRef = l.mandato?.codigo || l.mandato?.descripcion || '';
              
              return {
                id: l.id,
                type: 'contacto' as const,
                label: l.company_name || l.contact_name || 'Lead sin nombre',
                sublabel: mandatoRef ? `${mandatoRef} · ${l.stage || 'nuevo'}` : l.contact_email,
                icon: 'user' as const,
                metadata: {
                  empresaNombre: l.company_name,
                  email: l.contact_email,
                },
              };
            });
          }
        }
      } catch (err: any) {
        console.error('[MandatoLeadSearch] Unexpected error:', err);
        results.error = err?.message || 'Error al buscar';
      }

      return results;
    },
    staleTime: 30000,
    gcTime: 60000,
    retry: 1, // Reduce retries for faster feedback
  });
}

// Hook to get a single item by ID and type
export function useMandatoLeadItem(id: string | null, type: SearchItemType | null) {
  return useQuery({
    queryKey: ['mandato-lead-item', id, type],
    queryFn: async (): Promise<MandatoLeadSearchItem | null> => {
      if (!id || !type) return null;

      // Check for internal project
      if (type === 'internal' || id === GENERAL_WORK_ID) {
        return INTERNAL_PROJECTS.find((p) => p.id === id) || null;
      }

      if (type === 'mandato') {
        const { data } = await supabase
          .from('mandatos')
          .select(`
            id,
            codigo,
            descripcion,
            tipo,
            estado,
            empresa_principal:empresas(id, nombre)
          `)
          .eq('id', id)
          .single();

        if (data) {
          return {
            id: data.id,
            type: 'mandato',
            label: data.codigo
              ? `${data.codigo} · ${data.descripcion || 'Sin descripción'}`
              : data.descripcion || 'Sin descripción',
            sublabel: (data.empresa_principal as any)?.nombre || undefined,
            icon: 'briefcase',
            metadata: {
              codigo: data.codigo || undefined,
              tipo: data.tipo,
              estado: data.estado,
              empresaNombre: (data.empresa_principal as any)?.nombre,
            },
          };
        }
      }

      if (type === 'contacto') {
        // Now fetch from mandate_leads instead of contactos
        const { data } = await supabase
          .from('mandate_leads')
          .select(`
            id,
            company_name,
            contact_name,
            contact_email,
            stage,
            mandato:mandatos(id, descripcion, codigo)
          `)
          .eq('id', id)
          .single();

        if (data) {
          const mandatoRef = (data.mandato as any)?.codigo || (data.mandato as any)?.descripcion || '';
          
          return {
            id: data.id,
            type: 'contacto',
            label: data.company_name || data.contact_name || 'Lead sin nombre',
            sublabel: mandatoRef ? `${mandatoRef} · ${data.stage || 'nuevo'}` : data.contact_email,
            icon: 'user',
            metadata: {
              empresaNombre: data.company_name,
              email: data.contact_email,
            },
          };
        }
      }

      return null;
    },
    enabled: !!id && !!type,
    staleTime: 60000,
  });
}
