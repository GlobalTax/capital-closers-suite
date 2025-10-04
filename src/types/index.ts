// ============================================
// TYPES & INTERFACES - Capittal CRM Cierre
// ============================================

export type MandatoEstado = 
  | "En progreso" 
  | "Negociación" 
  | "Due Diligence" 
  | "Cerrado" 
  | "Cancelado";

export type NivelInteres = "Alto" | "Medio" | "Bajo";

export type TareaEstado = "pendiente" | "en-progreso" | "completada";

export type TareaPrioridad = "alta" | "media" | "baja";

export type DocumentoTipo = 
  | "Contrato" 
  | "NDA" 
  | "Due Diligence" 
  | "Financiero" 
  | "Legal";

// ============================================
// MANDATO
// ============================================
export interface Mandato {
  id: string;
  empresa: string;
  cliente: string;
  clienteId: string;
  estado: MandatoEstado;
  valor: string;
  fecha: string;
  descripcion?: string;
  sector?: string;
  ubicacion?: string;
  responsable?: string;
  documentosCount?: number;
  actividadesCount?: number;
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
