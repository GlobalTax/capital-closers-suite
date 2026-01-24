import { useState, useCallback, useMemo } from "react";
import type { FilterSection, FilterOption } from "@/components/shared/FilterPanel";
import type { FilterChip } from "@/components/shared/FilterChips";

interface UseFiltersOptions {
  sections: FilterSection[];
  initialValues?: Record<string, string[]>;
}

// Función para parsear filtro de rango
const parseRangeFilter = (value: string): [number, number] | null => {
  const match = value.match(/^(-?\d+(?:\.\d+)?)-(-?\d+(?:\.\d+)?)$/);
  if (match) {
    return [parseFloat(match[1]), parseFloat(match[2])];
  }
  return null;
};

export function useFilters({ sections, initialValues = {} }: UseFiltersOptions) {
  const [values, setValues] = useState<Record<string, string[]>>(initialValues);

  const handleChange = useCallback((sectionId: string, newValues: string[]) => {
    setValues((prev) => ({
      ...prev,
      [sectionId]: newValues,
    }));
  }, []);

  const handleRemove = useCallback((sectionId: string, value: string) => {
    setValues((prev) => ({
      ...prev,
      [sectionId]: (prev[sectionId] || []).filter((v) => v !== value),
    }));
  }, []);

  const clearAll = useCallback(() => {
    setValues({});
  }, []);

  const applyFilters = useCallback((newFilters: Record<string, string[]>) => {
    setValues(newFilters);
  }, []);

  // Convertir valores a chips para mostrar
  const chips = useMemo((): FilterChip[] => {
    const result: FilterChip[] = [];
    
    sections.forEach((section) => {
      const sectionValues = values[section.id] || [];
      sectionValues.forEach((value) => {
        // Si es un filtro de rango, formatear el label
        if (section.type === "range") {
          const range = parseRangeFilter(value);
          if (range) {
            const formatFn = section.formatValue || ((v: number) => String(v));
            result.push({
              sectionId: section.id,
              sectionLabel: section.label,
              value,
              label: `${formatFn(range[0])} - ${formatFn(range[1])}`,
            });
            return;
          }
        }
        
        const option = section.options?.find((opt) => opt.value === value);
        result.push({
          sectionId: section.id,
          sectionLabel: section.label,
          value,
          label: option?.label || value,
        });
      });
    });

    return result;
  }, [sections, values]);

  // Verificar si hay filtros activos
  const hasActiveFilters = useMemo(() => {
    return Object.values(values).some((arr) => arr.length > 0);
  }, [values]);

  // Contar filtros activos
  const activeFilterCount = useMemo(() => {
    return Object.values(values).reduce((sum, arr) => sum + arr.length, 0);
  }, [values]);

  // Función para aplicar filtros a datos
  const filterData = useCallback(
    <T extends Record<string, any>>(
      data: T[],
      filterFn?: (item: T, sectionId: string, selectedValues: string[]) => boolean
    ): T[] => {
      if (!hasActiveFilters) return data;

      return data.filter((item) => {
        return Object.entries(values).every(([sectionId, selectedValues]) => {
          if (selectedValues.length === 0) return true;
          
          if (filterFn) {
            return filterFn(item, sectionId, selectedValues);
          }
          
          // Detectar si es un filtro de rango (formato "min-max")
          if (selectedValues.length === 1) {
            const range = parseRangeFilter(selectedValues[0]);
            if (range) {
              const itemValue = item[sectionId];
              if (typeof itemValue === "number") {
                return itemValue >= range[0] && itemValue <= range[1];
              }
              return true; // Si no es número, no filtrar
            }
          }
          
          // Lógica de filtro por defecto: verificar si el campo coincide
          const itemValue = item[sectionId];
          if (Array.isArray(itemValue)) {
            return selectedValues.some((v) => itemValue.includes(v));
          }
          return selectedValues.includes(String(itemValue));
        });
      });
    },
    [values, hasActiveFilters]
  );

  return {
    values,
    handleChange,
    handleRemove,
    clearAll,
    applyFilters,
    chips,
    hasActiveFilters,
    activeFilterCount,
    filterData,
  };
}
