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
    limit = 15,
  } = options;

  const debouncedSearch = useDebounce(searchTerm.trim().toLowerCase(), debounceMs);

  return useQuery({
    queryKey: ['mandato-lead-search', debouncedSearch, includeLeads, limit],
    queryFn: async (): Promise<{
      internalProjects: MandatoLeadSearchItem[];
      mandatos: MandatoLeadSearchItem[];
      contactos: MandatoLeadSearchItem[];
    }> => {
      const results = {
        internalProjects: [] as MandatoLeadSearchItem[],
        mandatos: [] as MandatoLeadSearchItem[],
        contactos: [] as MandatoLeadSearchItem[],
      };

      // Always include internal projects if enabled
      if (includeGeneralWork) {
        results.internalProjects = INTERNAL_PROJECTS.filter(
          (p) =>
            !debouncedSearch ||
            p.label.toLowerCase().includes(debouncedSearch) ||
            p.sublabel?.toLowerCase().includes(debouncedSearch)
        );
      }

      // Search mandatos
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

      const { data: mandatos } = await mandatoQuery;

      if (mandatos) {
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

      // Search contactos/leads if enabled
      if (includeLeads) {
        let contactoQuery = supabase
          .from('contactos')
          .select(`
            id,
            nombre,
            apellidos,
            email,
            empresa_principal:empresas(id, nombre)
          `)
          .is('merged_into_contacto_id', null)
          .order('updated_at', { ascending: false })
          .limit(limit);

        if (debouncedSearch) {
          contactoQuery = contactoQuery.or(
            `nombre.ilike.%${debouncedSearch}%,apellidos.ilike.%${debouncedSearch}%,email.ilike.%${debouncedSearch}%`
          );
        }

        const { data: contactos } = await contactoQuery;

        if (contactos) {
          results.contactos = contactos.map((c: any) => {
            const fullName = [c.nombre, c.apellidos].filter(Boolean).join(' ');
            const empresaNombre = c.empresa_principal?.nombre;

            return {
              id: c.id,
              type: 'contacto' as const,
              label: empresaNombre || fullName,
              sublabel: empresaNombre ? fullName : c.email,
              icon: 'user' as const,
              metadata: {
                empresaNombre,
                email: c.email,
              },
            };
          });
        }
      }

      return results;
    },
    staleTime: 30000,
    gcTime: 60000,
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
        const { data } = await supabase
          .from('contactos')
          .select(`
            id,
            nombre,
            apellidos,
            email,
            empresa_principal:empresas(id, nombre)
          `)
          .eq('id', id)
          .single();

        if (data) {
          const fullName = [data.nombre, data.apellidos].filter(Boolean).join(' ');
          const empresaNombre = (data.empresa_principal as any)?.nombre;

          return {
            id: data.id,
            type: 'contacto',
            label: empresaNombre || fullName,
            sublabel: empresaNombre ? fullName : data.email,
            icon: 'user',
            metadata: {
              empresaNombre,
              email: data.email,
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
