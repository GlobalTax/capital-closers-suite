// ============================================
// TYPES & INTERFACES - Capittal CRM Cierre
// ============================================

export type MandatoEstado = 
  | "En progreso" 
  | "Negociación" 
  | "Due Diligence" 
  | "Cerrado" 
  | "Cancelado";

export type MandatoTipo = "compra" | "venta";

export type NivelInteres = "Alto" | "Medio" | "Bajo";

export type TareaEstado = "pendiente" | "en-progreso" | "completada";

export type TareaPrioridad = "alta" | "media" | "baja";

export type DocumentoTipo = 
  | "Contrato" 
  | "NDA" 
  | "Due Diligence" 
  | "Financiero" 
  | "Legal";

export type TargetEstado = 
  | "pendiente" 
  | "contactada" 
  | "interesada" 
  | "rechazada" 
  | "en_dd" 
  | "oferta" 
  | "cerrada";

// ============================================
// MANDATO
// ============================================
export interface Mandato {
  id: string;
  empresa: string;
  cliente: string;
  clienteId: string;
  tipo: MandatoTipo;
  estado: MandatoEstado;
  valor: string;
  fecha: string;
  descripcion?: string;
  sector?: string;
  ubicacion?: string;
  responsable?: string;
  documentosCount?: number;
  actividadesCount?: number;
  targetsCount?: number;
  tareasAbiertas?: number;
  ultimaActualizacion?: string;
}

// ============================================
// CLIENTE
// ============================================
export interface Cliente {
  id: string;
  nombre: string;
  empresa: string;
  email: string;
  telefono: string;
  mandatos: number;
  estado: "Activo" | "Inactivo";
  avatar?: string;
  cargo?: string;
  notas?: string;
  fechaRegistro?: string;
}

// ============================================
// EMPRESA TARGET
// ============================================
export interface Interaccion {
  id: string;
  tipo: "email" | "llamada" | "reunion" | "nota";
  titulo: string;
  descripcion?: string;
  fecha: string;
  responsable: string;
}

export interface DatosFinancieros {
  revenue?: number;
  ebitda?: number;
  margenEbitda?: number;
  deuda?: number;
  capitalCirculante?: number;
  notas?: string;
}

export interface EmpresaTarget {
  id: string;
  nombre: string;
  sector: string;
  facturacion: string;
  empleados: number;
  ubicacion: string;
  interes: NivelInteres;
  descripcion?: string;
  contactoPrincipal?: string;
  email?: string;
  telefono?: string;
  sitioWeb?: string;
  fechaProspeccion?: string;
  estado?: TargetEstado;
  mandatoId?: string;
  mandatoNombre?: string;
  ultimaActividad?: string;
  revenue?: number;
  ebitda?: number;
  interacciones?: Interaccion[];
  datosFinancieros?: DatosFinancieros;
}

// ============================================
// TAREA
// ============================================
export interface Tarea {
  id: string;
  titulo: string;
  descripcion?: string;
  estado: TareaEstado;
  prioridad: TareaPrioridad;
  fechaVencimiento: string;
  asignado?: string;
  mandatoId?: string;
  mandatoNombre?: string;
  etiquetas?: string[];
}

// ============================================
// DOCUMENTO
// ============================================
export interface Documento {
  id: string;
  nombre: string;
  tipo: DocumentoTipo;
  mandato: string;
  mandatoId: string;
  fecha: string;
  tamano: string;
  url?: string;
  uploadedBy?: string;
}

// ============================================
// ACTIVIDAD (Timeline)
// ============================================
export interface Actividad {
  id: string;
  tipo: "creacion" | "actualizacion" | "comentario" | "documento" | "estado";
  titulo: string;
  descripcion?: string;
  usuario: string;
  fecha: string;
  mandatoId?: string;
}

// ============================================
// BÚSQUEDA GLOBAL
// ============================================
export interface ResultadoBusqueda {
  tipo: "mandato" | "cliente" | "target";
  id: string;
  titulo: string;
  subtitulo?: string;
  ruta: string;
}

// ============================================
// API RESPONSES
// ============================================
export interface ApiResponse<T> {
  data: T;
  success: boolean;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}
