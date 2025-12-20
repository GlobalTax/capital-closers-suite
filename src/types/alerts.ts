// ============================================
// ALERTAS M&A TYPES
// ============================================

export type AlertType = 
  | 'inactive_mandate' 
  | 'overdue_task' 
  | 'stuck_deal' 
  | 'upcoming_deadline'
  | 'missing_document'
  | 'low_probability';

export type AlertSeverity = 'info' | 'warning' | 'critical';

export interface MandatoAlert {
  id: string;
  mandato_id: string;
  alert_type: AlertType;
  severity: AlertSeverity;
  title: string;
  description?: string;
  is_read: boolean;
  is_dismissed: boolean;
  created_at: string;
  updated_at: string;
  expires_at?: string;
  metadata: Record<string, any>;
}

export interface ActiveAlert extends MandatoAlert {
  mandato_tipo: 'compra' | 'venta';
  mandato_estado: string;
  mandato_valor?: number;
  pipeline_stage?: string;
  empresa_nombre?: string;
  empresa_sector?: string;
}

export interface AlertStats {
  total: number;
  critical: number;
  warning: number;
  info: number;
  unread: number;
}
