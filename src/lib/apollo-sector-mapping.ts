/**
 * Mapeo de sectores CRM a keywords de Apollo
 * Utilizado para construir queries de búsqueda en Apollo API
 */

import type { OutboundFilters } from '@/types/outbound';

// Rangos de empleados de Apollo
export const APOLLO_EMPLOYEE_RANGES = [
  { value: '1,10', label: '1-10' },
  { value: '11,20', label: '11-20' },
  { value: '21,50', label: '21-50' },
  { value: '51,100', label: '51-100' },
  { value: '101,200', label: '101-200' },
  { value: '201,500', label: '201-500' },
  { value: '501,1000', label: '501-1000' },
  { value: '1001,5000', label: '1001-5000' },
  { value: '5001,10000', label: '5001-10000' },
  { value: '10001,', label: '10000+' },
] as const;

// Rangos de facturación de Apollo (en USD)
export const APOLLO_REVENUE_RANGES = [
  { value: '0,1000000', label: '< $1M' },
  { value: '1000000,10000000', label: '$1M - $10M' },
  { value: '10000000,50000000', label: '$10M - $50M' },
  { value: '50000000,100000000', label: '$50M - $100M' },
  { value: '100000000,500000000', label: '$100M - $500M' },
  { value: '500000000,1000000000', label: '$500M - $1B' },
  { value: '1000000000,', label: '> $1B' },
] as const;

// Niveles de seniority de Apollo
export const APOLLO_SENIORITY_LEVELS = [
  { value: 'owner', label: 'Propietario' },
  { value: 'founder', label: 'Fundador' },
  { value: 'c_suite', label: 'C-Level' },
  { value: 'partner', label: 'Socio' },
  { value: 'vp', label: 'VP' },
  { value: 'head', label: 'Director' },
  { value: 'director', label: 'Director' },
  { value: 'manager', label: 'Manager' },
  { value: 'senior', label: 'Senior' },
  { value: 'entry', label: 'Entry Level' },
] as const;

// Títulos comunes para M&A
export const APOLLO_COMMON_TITLES = [
  { value: 'ceo', label: 'CEO' },
  { value: 'cfo', label: 'CFO' },
  { value: 'coo', label: 'COO' },
  { value: 'owner', label: 'Owner / Propietario' },
  { value: 'founder', label: 'Founder / Fundador' },
  { value: 'managing director', label: 'Managing Director' },
  { value: 'general manager', label: 'General Manager' },
  { value: 'director general', label: 'Director General' },
  { value: 'president', label: 'Presidente' },
  { value: 'partner', label: 'Socio' },
] as const;

// Países/Regiones
export const APOLLO_LOCATIONS = [
  { value: 'Spain', label: 'España' },
  { value: 'Portugal', label: 'Portugal' },
  { value: 'Mexico', label: 'México' },
  { value: 'Argentina', label: 'Argentina' },
  { value: 'Colombia', label: 'Colombia' },
  { value: 'Chile', label: 'Chile' },
  { value: 'United States', label: 'Estados Unidos' },
  { value: 'United Kingdom', label: 'Reino Unido' },
  { value: 'Germany', label: 'Alemania' },
  { value: 'France', label: 'Francia' },
  { value: 'Italy', label: 'Italia' },
] as const;

/**
 * Construye los parámetros de búsqueda para Apollo API
 */
export function buildApolloSearchParams(
  keywords: string[],
  filters: OutboundFilters,
  page: number = 1,
  perPage: number = 100
): Record<string, unknown> {
  const params: Record<string, unknown> = {
    page,
    per_page: perPage,
  };

  // Keywords de industria/sector
  if (keywords.length > 0) {
    params.q_keywords = keywords.join(' OR ');
  }

  // Filtro de empleados
  if (filters.employee_ranges && filters.employee_ranges.length > 0) {
    params.organization_num_employees_ranges = filters.employee_ranges;
  }

  // Filtro de ubicación
  if (filters.locations && filters.locations.length > 0) {
    params.person_locations = filters.locations;
  }

  // Filtro de seniority
  if (filters.seniority && filters.seniority.length > 0) {
    params.person_seniorities = filters.seniority;
  }

  // Filtro de títulos
  if (filters.titles && filters.titles.length > 0) {
    params.person_titles = filters.titles;
  }

  // Keywords adicionales
  if (filters.keywords && filters.keywords.length > 0) {
    const existingKeywords = params.q_keywords ? `${params.q_keywords} OR ` : '';
    params.q_keywords = existingKeywords + filters.keywords.join(' OR ');
  }

  return params;
}

/**
 * Estima el número de créditos Apollo que se consumirán
 * - Búsqueda: gratis
 * - Enriquecimiento de email: 1 crédito por persona
 * - Enriquecimiento de teléfono: 1 crédito adicional por persona
 */
export function estimateApolloCredits(
  prospectCount: number,
  includePhone: boolean = false
): number {
  const emailCredits = prospectCount;
  const phoneCredits = includePhone ? prospectCount : 0;
  return emailCredits + phoneCredits;
}

/**
 * Formatea el rango de empleados para mostrar
 */
export function formatEmployeeRange(range: string): string {
  const found = APOLLO_EMPLOYEE_RANGES.find(r => r.value === range);
  return found?.label || range;
}

/**
 * Formatea el rango de facturación para mostrar
 */
export function formatRevenueRange(range: string): string {
  const found = APOLLO_REVENUE_RANGES.find(r => r.value === range);
  return found?.label || range;
}
