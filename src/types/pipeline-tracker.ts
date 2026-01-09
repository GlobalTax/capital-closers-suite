// Pipeline Tracker Types for documentation and platform status

export type DocStatus = 'si' | 'no' | 'pendiente' | 'n_a';
export type DocTeaserStatus = 'si' | 'no' | 'actualizar' | 'pendiente';
export type DocDatapackStatus = 'si' | 'no' | 'actualizar' | 'pendiente';
export type DocIMStatus = 'si' | 'no' | 'actualizar' | 'n_a' | 'pendiente';
export type DocRodStatus = 'si' | 'no' | 'actualizar' | 'pendiente';
export type PlatformStatus = 'subido' | 'por_subir' | 'actualizar' | 'n_a';

export interface MandatoDocTracking {
  // Documentation status
  doc_valoracion?: DocStatus | null;
  doc_teaser?: DocTeaserStatus | null;
  doc_datapack?: DocDatapackStatus | null;
  doc_im?: DocIMStatus | null;
  doc_rod?: DocRodStatus | null;

  // Platform status
  platform_deale?: PlatformStatus | null;
  platform_dealsuite?: PlatformStatus | null;
  platform_arx?: PlatformStatus | null;

  // Annual accounts
  ccaa_fecha?: string | null;
  ccaa_disponible?: boolean | null;
}

export interface PipelineTrackerItem extends MandatoDocTracking {
  id: string;
  codigo?: string | null;
  nombre_proyecto?: string | null;
  empresa_principal_id?: string | null;
  empresa_nombre?: string | null;
  pipeline_stage?: string | null;
  estado: string;
  tipo: string;
  categoria?: string | null;
}

// Status configuration for visual rendering
export interface StatusConfig {
  label: string;
  bgColor: string;
  textColor: string;
  borderColor: string;
}

export const DOC_STATUS_CONFIG: Record<string, StatusConfig> = {
  si: { label: 'SÍ', bgColor: 'bg-emerald-500/20', textColor: 'text-emerald-600', borderColor: 'border-emerald-500/30' },
  no: { label: 'NO', bgColor: 'bg-red-500/20', textColor: 'text-red-600', borderColor: 'border-red-500/30' },
  pendiente: { label: 'Pendiente', bgColor: 'bg-amber-500/20', textColor: 'text-amber-600', borderColor: 'border-amber-500/30' },
  actualizar: { label: 'Actualizar', bgColor: 'bg-orange-500/20', textColor: 'text-orange-600', borderColor: 'border-orange-500/30' },
  n_a: { label: 'N/A', bgColor: 'bg-muted', textColor: 'text-muted-foreground', borderColor: 'border-border' },
};

export const PLATFORM_STATUS_CONFIG: Record<string, StatusConfig> = {
  subido: { label: 'Subido', bgColor: 'bg-emerald-500/20', textColor: 'text-emerald-600', borderColor: 'border-emerald-500/30' },
  por_subir: { label: 'Por Subir', bgColor: 'bg-amber-500/20', textColor: 'text-amber-600', borderColor: 'border-amber-500/30' },
  actualizar: { label: 'Actualizar', bgColor: 'bg-orange-500/20', textColor: 'text-orange-600', borderColor: 'border-orange-500/30' },
  n_a: { label: 'N/A', bgColor: 'bg-muted', textColor: 'text-muted-foreground', borderColor: 'border-border' },
};

// Mapping Excel "Estado" to pipeline stages
export const ESTADO_PIPELINE_MAP: Record<string, string> = {
  'incoming': 'prospeccion',
  'psh': 'prospeccion',
  'go to market': 'loi',
  'go_to_market': 'loi',
  'dd / spa': 'due_diligence',
  'dd_spa': 'due_diligence',
};

export type TrackerFilterState = 'all' | 'incoming' | 'go_to_market' | 'dd_spa' | 'psh';
