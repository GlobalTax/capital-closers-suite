// ============================================
// CONSTANTS - Capittal CRM Cierre
// ============================================

export const APP_NAME = "Capittal CRM";
export const APP_VERSION = "1.0.0";

// Proyectos Internos (para horas no asignadas a mandatos de cliente)
export const INTERNAL_PROJECTS = {
  BUSINESS_DEVELOPMENT: "00000000-0000-0000-0000-000000000001",
  REUNIONES_INTERNAS: "00000000-0000-0000-0000-000000000002",
  ADMINISTRATIVO: "00000000-0000-0000-0000-000000000003",
  PROSPECCION: "00000000-0000-0000-0000-000000000004",
} as const;

export const INTERNAL_PROJECT_LABELS: Record<string, { label: string; description: string; icon: string }> = {
  [INTERNAL_PROJECTS.BUSINESS_DEVELOPMENT]: { 
    label: "Business Development", 
    description: "Captación de operaciones, networking", 
    icon: "Target" 
  },
  [INTERNAL_PROJECTS.REUNIONES_INTERNAS]: { 
    label: "Reuniones Internas", 
    description: "Reuniones de equipo, formación", 
    icon: "Users" 
  },
  [INTERNAL_PROJECTS.ADMINISTRATIVO]: { 
    label: "Administrativo", 
    description: "Tareas administrativas, reporting", 
    icon: "FileText" 
  },
  [INTERNAL_PROJECTS.PROSPECCION]: { 
    label: "Prospección Comercial", 
    description: "Tiempo con prospectos pre-cliente", 
    icon: "UserPlus" 
  },
};

// Tipos de Mandato
export const MANDATO_TIPOS = ["compra", "venta"] as const;

// Categorías de Mandato/Proyecto
export const MANDATO_CATEGORIAS = [
  "operacion_ma",
  "due_diligence", 
  "spa_legal",
  "valoracion",
  "asesoria",
] as const;

export const MANDATO_CATEGORIA_LABELS: Record<string, { label: string; description: string; icon: string }> = {
  operacion_ma: { label: "Operación M&A", description: "Compra o venta completa", icon: "Briefcase" },
  due_diligence: { label: "Due Diligence", description: "DD sin llevar la operación", icon: "Search" },
  spa_legal: { label: "SPA / Legal", description: "Redacción de contratos", icon: "FileText" },
  valoracion: { label: "Valoración", description: "Valoración de empresa", icon: "Calculator" },
  asesoria: { label: "Asesoría", description: "Otros servicios", icon: "Users" },
};

// Tipos de servicio (para categorías que no son operacion_ma)
export const SERVICIO_TIPOS = ["buy-side", "sell-side", "vendor", "independiente"] as const;

export const SERVICIO_TIPO_LABELS: Record<string, string> = {
  "buy-side": "Buy-Side (compradores)",
  "sell-side": "Sell-Side (vendedores)",
  "vendor": "Vendor DD",
  "independiente": "Independiente",
};

// Estructuras de honorarios
export const ESTRUCTURA_HONORARIOS = ["fijo", "exito", "mixto", "horario"] as const;

export const ESTRUCTURA_HONORARIOS_LABELS: Record<string, string> = {
  fijo: "Fijo",
  exito: "Éxito (% del deal)",
  mixto: "Mixto (fijo + éxito)",
  horario: "Por horas",
};

// Pipeline stages por categoría
export const PIPELINE_STAGES_MA = [
  "prospeccion", "loi", "due_diligence", "negociacion", "cierre"
] as const;

export const PIPELINE_STAGES_SERVICIO = [
  "propuesta", "en_ejecucion", "entregado"
] as const;

export const PIPELINE_STAGE_LABELS_SERVICIO: Record<string, string> = {
  propuesta: "Propuesta",
  en_ejecucion: "En Ejecución",
  entregado: "Entregado",
};

// Estados
export const MANDATO_ESTADOS = [
  "prospecto",
  "activo",
  "en_negociacion",
  "cerrado",
  "cancelado",
] as const;

export const TAREA_ESTADOS = ["pendiente", "en_progreso", "completada", "cancelada"] as const;

export const NIVEL_INTERES = ["Alto", "Medio", "Bajo"] as const;

export const TARGET_ESTADOS = [
  "pendiente",
  "contactada",
  "interesada",
  "rechazada",
  "en_dd",
  "oferta",
  "cerrada",
] as const;

// Due Diligence Workstreams
export const DD_WORKSTREAMS = [
  'legal', 'financial', 'commercial', 'ops', 'it', 'tax', 'other'
] as const;

// Pipeline Stages
export const PIPELINE_STAGES = [
  'prospeccion', 'loi', 'due_diligence', 'negociacion', 'cierre'
] as const;

export const PIPELINE_STAGE_LABELS: Record<string, string> = {
  prospeccion: 'Prospección',
  loi: 'LOI',
  due_diligence: 'Due Diligence',
  negociacion: 'Negociación',
  cierre: 'Cierre',
};

// Mandato Outcomes (Win/Loss)
export const MANDATO_OUTCOMES = ['open', 'won', 'lost', 'cancelled'] as const;

// Loss Reasons (Top 8 + Otro)
export const LOSS_REASON_OPTIONS = [
  { value: 'precio', label: 'Precio/Valoración no aceptada' },
  { value: 'competidor', label: 'Perdido ante competidor' },
  { value: 'timing', label: 'Timing inadecuado' },
  { value: 'fit_estrategico', label: 'No encaja estratégicamente' },
  { value: 'due_diligence', label: 'Problemas en Due Diligence' },
  { value: 'financiacion', label: 'No obtuvo financiación' },
  { value: 'cambio_prioridades', label: 'Cliente cambió prioridades' },
  { value: 'relacion_cliente', label: 'Problema en relación' },
  { value: 'otro', label: 'Otra razón' },
] as const;
