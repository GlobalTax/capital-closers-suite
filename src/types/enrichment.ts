/**
 * Types for the company enrichment flow
 */

// Enrichment flow steps
export type EnrichmentStep = 'input' | 'loading' | 'preview' | 'confirm';

// Merge modes when a duplicate is detected
export type MergeMode = 'create_new' | 'update_existing' | 'empty_only';

// Loading phases for multi-phase progress
export type LoadingPhase = 
  | 'searching' 
  | 'scraping' 
  | 'extracting' 
  | 'classifying' 
  | 'checking_duplicates';

// Input method for enrichment
export type InputMethod = 'url' | 'name';

// Confidence levels for sector classification
export type SectorConfidence = 'alto' | 'medio' | 'bajo';

// Enriched contact from the API
export interface EnrichedContact {
  nombre: string;
  cargo?: string;
  email?: string;
  linkedin?: string;
  telefono?: string;
}

// Contact with selection and dedupe info
export interface ContactWithDedupe extends EnrichedContact {
  selected: boolean;
  isDuplicate: boolean;
  existingContactId?: string;
  existingContactName?: string;
}

// Enriched company data from the API
export interface EnrichedData {
  nombre: string;
  descripcion?: string;
  actividades_destacadas?: string[];
  cnae_codigo?: string;
  cnae_descripcion?: string;
  sector?: string;
  sector_id?: string;
  sector_confianza?: SectorConfidence;
  empleados?: number;
  sitio_web?: string;
  ubicacion?: string;
  linkedin?: string;
  twitter?: string;
  fuente: string;
  contactos: EnrichedContact[];
}

// Existing company data for merge comparison
export interface ExistingEmpresa {
  id: string;
  nombre: string;
  descripcion?: string | null;
  sector?: string | null;
  sector_id?: string | null;
  empleados?: number | null;
  sitio_web?: string | null;
  ubicacion?: string | null;
  cif?: string | null;
  facturacion?: number | null;
  ebitda?: number | null;
  cnae_codigo?: string | null;
  cnae_descripcion?: string | null;
  actividades_destacadas?: string[] | null;
}

// Field comparison for merge
export interface FieldDiff {
  field: string;
  label: string;
  oldValue: string | number | string[] | null | undefined;
  newValue: string | number | string[] | null | undefined;
  isConflict: boolean;
  selected: boolean;
}

// Result after applying enrichment
export interface MergeResult {
  empresaId: string;
  action: 'created' | 'updated' | 'skipped';
  fieldsUpdated: string[];
  contactsCreated: number;
  contactsSkipped: number;
}

// State for the enrichment drawer
export interface EnrichmentState {
  step: EnrichmentStep;
  inputMethod: InputMethod;
  inputValue: string;
  manualUrl: string;
  loadingPhase: LoadingPhase | null;
  enrichedData: EnrichedData | null;
  duplicateDetected: boolean;
  existingEmpresa: ExistingEmpresa | null;
  matchType: 'cif' | 'nombre' | 'web' | null;
  mergeMode: MergeMode;
  fieldSelections: Record<string, boolean>;
  contactsToImport: ContactWithDedupe[];
  error: string | null;
  requireManualUrl: boolean;
}

// Props for the enrichment drawer
export interface EnrichmentDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mandatoId?: string;
  empresaId?: string; // For enriching existing empresa
  initialName?: string;
  initialUrl?: string;
  onSuccess: (result: MergeResult) => void;
}
