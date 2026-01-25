// ============================================
// CANDIDATE FUNNEL TYPES
// M&A Marketing funnel stages and stats
// ============================================

export type CandidateFunnelStage = 
  | 'teaser_sent'
  | 'teaser_opened'
  | 'nda_sent'
  | 'nda_signed'
  | 'cim_opened'
  | 'ioi_received';

export interface CandidateFunnelStats {
  campaign_id: string;
  total_recipients: number;
  teaser_sent: number;
  teaser_opened: number;
  nda_sent: number;
  nda_signed: number;
  cim_opened: number;
  ioi_received: number;
  open_rate: number;
  nda_conversion: number;
  cim_conversion: number;
  ioi_conversion: number;
}

export interface CandidateWithFunnelStage {
  id: string;
  nombre: string;
  email: string;
  empresa_nombre: string | null;
  segment: string | null;
  current_stage: CandidateFunnelStage;
  // Timestamps
  teaser_sent_at: string | null;
  teaser_opened_at: string | null;
  nda_sent_at: string | null;
  nda_signed_at: string | null;
  cim_opened_at: string | null;
  ioi_received_at: string | null;
  ioi_amount: number | null;
  ioi_notes: string | null;
}

export interface FunnelStageConfig {
  key: CandidateFunnelStage;
  label: string;
  shortLabel: string;
  color: string;
  bgColor: string;
  icon: string;
  order: number;
}

export const FUNNEL_STAGES: FunnelStageConfig[] = [
  { 
    key: 'teaser_sent', 
    label: 'Teaser Enviado', 
    shortLabel: 'Enviado',
    color: 'hsl(var(--muted-foreground))', 
    bgColor: 'hsl(var(--muted))',
    icon: 'Mail', 
    order: 1 
  },
  { 
    key: 'teaser_opened', 
    label: 'Teaser Abierto', 
    shortLabel: 'Abierto',
    color: 'hsl(217, 91%, 60%)', 
    bgColor: 'hsl(217, 91%, 95%)',
    icon: 'Eye', 
    order: 2 
  },
  { 
    key: 'nda_sent', 
    label: 'NDA Enviado', 
    shortLabel: 'NDA Env.',
    color: 'hsl(262, 83%, 58%)', 
    bgColor: 'hsl(262, 83%, 95%)',
    icon: 'Send', 
    order: 3 
  },
  { 
    key: 'nda_signed', 
    label: 'NDA Firmado', 
    shortLabel: 'NDA Firm.',
    color: 'hsl(142, 76%, 36%)', 
    bgColor: 'hsl(142, 76%, 95%)',
    icon: 'CheckCircle2', 
    order: 4 
  },
  { 
    key: 'cim_opened', 
    label: 'CIM Abierto', 
    shortLabel: 'CIM',
    color: 'hsl(38, 92%, 50%)', 
    bgColor: 'hsl(38, 92%, 95%)',
    icon: 'FileText', 
    order: 5 
  },
  { 
    key: 'ioi_received', 
    label: 'IOI Recibido', 
    shortLabel: 'IOI',
    color: 'hsl(330, 81%, 60%)', 
    bgColor: 'hsl(330, 81%, 95%)',
    icon: 'DollarSign', 
    order: 6 
  },
];

export function getStageConfig(stage: CandidateFunnelStage): FunnelStageConfig {
  return FUNNEL_STAGES.find(s => s.key === stage) || FUNNEL_STAGES[0];
}

export function calculateCurrentStage(recipient: {
  sent_at?: string | null;
  opened_at?: string | null;
  nda_status?: string | null;
  nda_sent_at?: string | null;
  nda_signed_at?: string | null;
  cim_first_accessed_at?: string | null;
  ioi_received_at?: string | null;
}): CandidateFunnelStage {
  if (recipient.ioi_received_at) return 'ioi_received';
  if (recipient.cim_first_accessed_at) return 'cim_opened';
  if (recipient.nda_status === 'signed' || recipient.nda_signed_at) return 'nda_signed';
  if (recipient.nda_status === 'sent' || recipient.nda_sent_at) return 'nda_sent';
  if (recipient.opened_at) return 'teaser_opened';
  return 'teaser_sent';
}
