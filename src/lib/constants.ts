// ============================================
// CONSTANTS - Capittal CRM Cierre
// ============================================

export const APP_NAME = "Capittal CRM";
export const APP_VERSION = "1.0.0";

// Tipos de Mandato
export const MANDATO_TIPOS = ["compra", "venta"] as const;

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
