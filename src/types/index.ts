// ============================================
// TYPES & INTERFACES - Capittal CRM Cierre
// ============================================

export type MandatoEstado = "prospecto" | "activo" | "en_negociacion" | "cerrado" | "cancelado";
export type MandatoTipo = "compra" | "venta";
export type TargetEstado = "pendiente" | "contactada" | "interesada" | "rechazada" | "en_dd" | "oferta" | "cerrada";
export type NivelInteres = "Alto" | "Medio" | "Bajo";
export type TareaPrioridad = "alta" | "media" | "baja" | "urgente";
export type TareaEstado = "pendiente" | "en_progreso" | "completada" | "cancelada";
export type DocumentoTipo = "Contrato" | "NDA" | "Due Diligence" | "Financiero" | "Legal" | "Otro";
export type TransactionType = "ingreso" | "gasto" | "honorario" | "due_diligence" | "ajuste_valoracion" | "comision" | "otro";
export type TransactionStatus = "pendiente" | "completada" | "cancelada";
export type ContactoRol = "vendedor" | "comprador" | "asesor" | "intermediario" | "otro";
export type EmpresaRol = "vendedora" | "compradora" | "competidora" | "comparable" | "target" | "otro";

// ============================================
// EMPRESA (unifica clientes.empresa + empresas_target)
// ============================================
export interface Empresa {
  id: string;
  nombre: string;
  cif?: string;
  sector: string;
  subsector?: string;
  ubicacion?: string;
  facturacion?: number;
  empleados?: number;
  sitio_web?: string;
  descripcion?: string;
  
  // Datos financieros
  revenue?: number;
  ebitda?: number;
  margen_ebitda?: number;
  deuda?: number;
  capital_circulante?: number;
  
  // Si es target
  es_target: boolean;
  estado_target?: TargetEstado;
  nivel_interes?: NivelInteres;
  
  created_at: string;
  updated_at: string;
}

// ============================================
// CONTACTO (antes Cliente)
// ============================================
export interface Contacto {
  id: string;
  nombre: string;
  apellidos?: string;
  email: string;
  telefono?: string;
  cargo?: string;
  empresa_principal_id?: string;
  empresa_principal?: Empresa;
  linkedin?: string;
  notas?: string;
  avatar?: string;
  
  created_at: string;
  updated_at: string;
}

// ============================================
// RELACIONES MANDATO
// ============================================
export interface MandatoContacto {
  id: string;
  mandato_id: string;
  contacto_id: string;
  contacto?: Contacto;
  rol: ContactoRol;
  notas?: string;
  created_at: string;
}

export interface MandatoEmpresa {
  id: string;
  mandato_id: string;
  empresa_id: string;
  empresa?: Empresa;
  rol: EmpresaRol;
  notas?: string;
  created_at: string;
}

// ============================================
// MANDATO
// ============================================
export interface Mandato {
  id: string;
  tipo: MandatoTipo;
  empresa_principal_id?: string;
  empresa_principal?: Empresa;
  estado: MandatoEstado;
  valor?: number;
  fecha_inicio?: string;
  fecha_cierre?: string;
  descripcion?: string;
  prioridad?: TareaPrioridad;
  
  // Campos específicos de COMPRA
  perfil_empresa_buscada?: string;
  rango_inversion_min?: number;
  rango_inversion_max?: number;
  sectores_interes?: string[];
  timeline_objetivo?: string;
  
  // Campos específicos de VENTA
  valoracion_esperada?: number;
  tipo_comprador_buscado?: string;
  estado_negociacion?: string;
  numero_ofertas_recibidas?: number;
  
  // Relaciones pobladas
  contactos?: MandatoContacto[];
  empresas?: MandatoEmpresa[];
  
  // Resumen financiero
  total_ingresos?: number;
  total_gastos?: number;
  balance_neto?: number;
  transacciones_count?: number;
  
  created_at: string;
  updated_at: string;
}

// ============================================
// TRANSACCIÓN FINANCIERA
// ============================================
export interface MandatoTransaction {
  id: string;
  mandato_id: string;
  transaction_type: TransactionType;
  amount: number;
  currency: string;
  transaction_date: string;
  description: string;
  category?: string;
  status: TransactionStatus;
  payment_method?: string;
  reference_number?: string;
  notes?: string;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

// ============================================
// TAREA
// ============================================
export interface Tarea {
  id: string;
  mandato_id?: string;
  titulo: string;
  descripcion?: string;
  estado: TareaEstado;
  prioridad: TareaPrioridad;
  asignado_a?: string;
  fecha_vencimiento?: string;
  created_at: string;
  updated_at: string;
}

// ============================================
// DOCUMENTO
// ============================================
export interface Documento {
  id: string;
  mandato_id?: string;
  file_name: string;
  file_size_bytes: number;
  mime_type: string;
  storage_path: string;
  tipo: DocumentoTipo;
  descripcion?: string;
  tags?: string[];
  uploaded_by?: string;
  created_at: string;
  updated_at: string;
}

// ============================================
// INTERACCIONES Y DATOS FINANCIEROS (para targets)
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
  tipo: "mandato" | "contacto" | "empresa";
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
  metadata?: Record<string, any>;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// ============================================
// DEPRECATED TYPES (mantener temporalmente para compatibilidad)
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
}

export interface EmpresaTarget {
  id: string;
  nombre: string;
  sector: string;
  facturacion: string;
  empleados: number;
  ubicacion: string;
  interes: NivelInteres;
  estado?: TargetEstado;
  mandatoId?: string;
  revenue?: number;
  ebitda?: number;
  interacciones?: Interaccion[];
  datosFinancieros?: DatosFinancieros;
}

// ============================================
// CHECKLIST M&A
// ============================================
export type ChecklistFase = "1. Preparación" | "2. Marketing" | "3. Ofertas";
export type ChecklistResponsable = "Dirección M&A" | "Analista" | "Asesor M&A" | "Marketing" | "Legal" | "Research" | "M&A Support";
export type ChecklistSistema = "Brevo" | "CRM" | "Lovable.dev" | "DealSuite" | "ARX" | "Data Room" | "Supabase";
export type ChecklistEstado = "⏳ Pendiente" | "🔄 En curso" | "✅ Completa";

export interface MandatoChecklistTask {
  id: string;
  mandato_id: string;
  fase: ChecklistFase;
  tarea: string;
  descripcion?: string;
  responsable?: ChecklistResponsable;
  sistema?: ChecklistSistema;
  estado: ChecklistEstado;
  fecha_limite?: string;
  fecha_completada?: string;
  url_relacionada?: string;
  notas?: string;
  orden: number;
  created_at: string;
  updated_at: string;
}

export interface ChecklistFaseProgress {
  fase: ChecklistFase;
  total: number;
  completadas: number;
  enCurso: number;
  pendientes: number;
  porcentaje: number;
}

// Archivos del Checklist M&A
export type FileCategory = "documento" | "imagen" | "hoja_calculo" | "presentacion" | "otro";

export interface MandatoChecklistTaskFile {
  id: string;
  task_id: string;
  file_name: string;
  file_path: string;
  file_size_bytes: number;
  mime_type: string;
  uploaded_by?: string;
  description?: string;
  file_category?: FileCategory;
  created_at: string;
  updated_at: string;
}
