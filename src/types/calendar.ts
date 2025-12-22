// ============================================
// CALENDAR TYPES - Vista Calendario de Mandatos
// ============================================

export type CalendarEventType = 
  | 'cierre_esperado'     // Fecha cierre esperado del mandato
  | 'inicio_mandato'      // Fecha inicio del mandato
  | 'fin_mandato'         // Fecha cierre real del mandato
  | 'tarea_checklist'     // Tarea del checklist con fecha límite
  | 'tarea_critica'       // Tarea crítica del checklist
  | 'tarea_general';      // Tarea general con fecha vencimiento

export type CalendarViewMode = 'month' | 'week' | 'list';

export interface CalendarEvent {
  id: string;
  title: string;
  date: Date;
  endDate?: Date;
  type: CalendarEventType;
  mandatoId?: string;
  mandatoNombre?: string;
  mandatoTipo?: 'compra' | 'venta';
  taskId?: string;
  fase?: string;
  color: string;
  bgColor: string;
  icon?: string;
  isCompleted?: boolean;
  isOverdue?: boolean;
  metadata?: Record<string, any>;
}

export interface CalendarFilters {
  tipoMandato: 'all' | 'compra' | 'venta';
  estadoMandato: 'all' | 'activo' | 'en_negociacion' | 'cerrado';
  tipoEvento: CalendarEventType[];
  showCompleted: boolean;
}

export interface CalendarDay {
  date: Date;
  isCurrentMonth: boolean;
  isToday: boolean;
  events: CalendarEvent[];
}

// Configuración de colores por tipo de evento
export const EVENT_TYPE_CONFIG: Record<CalendarEventType, { 
  label: string; 
  color: string; 
  bgColor: string; 
  icon: string;
}> = {
  cierre_esperado: {
    label: 'Cierre Esperado',
    color: 'hsl(0 84% 60%)',      // red-500
    bgColor: 'hsl(0 84% 60% / 0.15)',
    icon: '🔴'
  },
  inicio_mandato: {
    label: 'Inicio Mandato',
    color: 'hsl(142 71% 45%)',    // green-500
    bgColor: 'hsl(142 71% 45% / 0.15)',
    icon: '🟢'
  },
  fin_mandato: {
    label: 'Cierre Real',
    color: 'hsl(271 81% 56%)',    // purple-500
    bgColor: 'hsl(271 81% 56% / 0.15)',
    icon: '🟣'
  },
  tarea_checklist: {
    label: 'Tarea Checklist',
    color: 'hsl(217 91% 60%)',    // blue-500
    bgColor: 'hsl(217 91% 60% / 0.15)',
    icon: '🔵'
  },
  tarea_critica: {
    label: 'Tarea Crítica',
    color: 'hsl(25 95% 53%)',     // orange-500
    bgColor: 'hsl(25 95% 53% / 0.15)',
    icon: '🟠'
  },
  tarea_general: {
    label: 'Tarea General',
    color: 'hsl(199 89% 48%)',    // cyan-500
    bgColor: 'hsl(199 89% 48% / 0.15)',
    icon: '📋'
  }
};

// Helpers
export const getEventConfig = (type: CalendarEventType) => EVENT_TYPE_CONFIG[type];

export const getEventTypeLabel = (type: CalendarEventType): string => {
  return EVENT_TYPE_CONFIG[type]?.label || type;
};

export const getEventColor = (type: CalendarEventType): string => {
  return EVENT_TYPE_CONFIG[type]?.color || 'hsl(var(--muted-foreground))';
};

export const getEventBgColor = (type: CalendarEventType): string => {
  return EVENT_TYPE_CONFIG[type]?.bgColor || 'hsl(var(--muted) / 0.5)';
};

export const getEventIcon = (type: CalendarEventType): string => {
  return EVENT_TYPE_CONFIG[type]?.icon || '📅';
};
