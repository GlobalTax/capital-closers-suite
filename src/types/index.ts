// ============================================
// TYPES & INTERFACES - Capittal CRM Cierre
// ============================================

export type MandatoEstado = "prospecto" | "activo" | "en_negociacion" | "cerrado" | "cancelado";
export type MandatoTipo = "compra" | "venta";
export type MandatoCategoria = "operacion_ma" | "due_diligence" | "spa_legal" | "valoracion" | "asesoria";
export type ServicioTipo = "buy-side" | "sell-side" | "vendor" | "independiente";
export type EstructuraHonorarios = "fijo" | "exito" | "mixto" | "horario";
export type TargetEstado = "pendiente" | "contactada" | "interesada" | "rechazada" | "en_dd" | "oferta" | "cerrada";
export type NivelInteres = "Alto" | "Medio" | "Bajo";
export type TareaPrioridad = "alta" | "media" | "baja" | "urgente";
export type TareaEstado = "pendiente" | "en_progreso" | "completada" | "cancelada";
export type DocumentoTipo = "Contrato" | "NDA" | "Due Diligence" | "Financiero" | "Legal" | "Otro";
export type TransactionType = "ingreso" | "gasto" | "honorario" | "due_diligence" | "ajuste_valoracion" | "comision" | "otro";
export type TransactionStatus = "pendiente" | "completada" | "cancelada";
export type ContactoRol = "vendedor" | "comprador" | "asesor" | "intermediario" | "otro";
export type EmpresaRol = "vendedora" | "compradora" | "competidora" | "comparable" | "target" | "otro";

// Win/Loss Types
export type MandatoOutcome = 'open' | 'won' | 'lost' | 'cancelled';
export type LossReasonType = 
  | 'precio'
  | 'competidor'
  | 'timing'
  | 'fit_estrategico'
  | 'due_diligence'
  | 'financiacion'
  | 'cambio_prioridades'
  | 'relacion_cliente'
  | 'otro';

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
// RELACIONES PARCIALES (para optimizar queries)
// ============================================
export interface EmpresaBasic {
  id: string;
  nombre: string;
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
  empresa_principal?: EmpresaBasic | null;
  linkedin?: string;
  notas?: string;
  avatar?: string;
  merged_into_contacto_id?: string;
  
  // Campos de sincronización Brevo
  brevo_id?: string;
  brevo_synced_at?: string;
  
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
  categoria?: MandatoCategoria;
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
  
  // Campos para servicios (DD, SPA, Valoración, Asesoría)
  parent_mandato_id?: string;
  parent_mandato?: Mandato;
  servicio_tipo?: ServicioTipo;
  cliente_externo?: string;
  honorarios_propuestos?: number;
  honorarios_aceptados?: number;
  estructura_honorarios?: EstructuraHonorarios;
  
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
  
  // Win/Loss tracking
  outcome?: MandatoOutcome;
  loss_reason?: LossReasonType;
  loss_notes?: string;
  won_value?: number;
  closed_at?: string;
  closed_by?: string;
  last_activity_at?: string;
  
  // Campos de sincronización externa
  external_operation_id?: string;
  external_source?: 'manual' | 'capittal_marketplace' | 'brevo';
  external_synced_at?: string;
  url_publica?: string;
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
  /** Name of the assigned user (joined from admin_users) */
  asignado_nombre?: string;
  fecha_vencimiento?: string;
  /** Position within Kanban column for ordering */
  order_index?: number;
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
// TIME TRACKING
// ============================================
export type TimeEntryWorkType = 
  | 'Análisis' 
  | 'Reunión' 
  | 'Due Diligence' 
  | 'Documentación' 
  | 'Negociación' 
  | 'Marketing' 
  | 'Research' 
  | 'Otro';

export type TimeEntryStatus = 'draft' | 'submitted' | 'approved' | 'rejected';

// Tipo de tarea configurable desde admin
export interface WorkTaskType {
  id: string;
  name: string;
  description?: string | null;
  is_active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface TimeEntry {
  id: string;
  task_id?: string;
  mandato_id: string;
  user_id: string;
  work_task_type_id?: string;
  
  start_time: string;
  end_time?: string;
  duration_minutes?: number;
  
  description: string;
  /** @deprecated Use work_task_type_id instead. Kept for backward compatibility with historical data */
  work_type?: TimeEntryWorkType;
  is_billable: boolean;
  status: TimeEntryStatus;
  notes?: string;
  rejection_reason?: string;
  
  approved_by?: string;
  approved_at?: string;
  
  created_at: string;
  updated_at: string;
  
  // Joined data
  user?: {
    id: string;
    full_name: string;
    email: string;
  };
  task?: {
    id: string;
    tarea: string;
    fase: ChecklistFase;
  };
  mandato?: MandatoInfo;
  work_task_type?: WorkTaskType;
}

export interface TimeStats {
  total_hours: number;
  billable_hours: number;
  total_entries: number;
  hours_by_phase: { fase: string; hours: number }[];
  hours_by_user: { user_id: string; user_name: string; hours: number }[];
  hours_by_type: { work_type: string; hours: number }[];
}

// ============================================
// CHECKLIST M&A
// ============================================

// Fases dinámicas por tipo de operación
export type ChecklistFaseCompra = 
  | "1. Definición" 
  | "2. Búsqueda" 
  | "3. Aproximación" 
  | "4. Due Diligence" 
  | "5. Cierre";

export type ChecklistFaseVenta = 
  | "1. Preparación" 
  | "2. Marketing" 
  | "3. Ofertas"
  | "4. Due Diligence"
  | "5. Cierre";

export type ChecklistFase = ChecklistFaseCompra | ChecklistFaseVenta | string;

export type ChecklistResponsable = "Dirección M&A" | "Analista" | "Asesor M&A" | "Marketing" | "Legal" | "Research" | "M&A Support";
export type ChecklistSistema = "Brevo" | "CRM" | "Lovable.dev" | "DealSuite" | "ARX" | "Data Room" | "Supabase";
export type ChecklistEstado = "⏳ Pendiente" | "🔄 En curso" | "✅ Completa";

// ============================================
// DUE DILIGENCE WORKSTREAMS
// ============================================
export type DDWorkstream = 'legal' | 'financial' | 'commercial' | 'ops' | 'it' | 'tax' | 'other';

export const WORKSTREAM_CONFIG: Record<DDWorkstream, { label: string; color: string; icon: string }> = {
  legal: { label: 'Legal', color: '#8B5CF6', icon: 'Scale' },
  financial: { label: 'Finanzas', color: '#10B981', icon: 'Calculator' },
  commercial: { label: 'Comercial', color: '#F59E0B', icon: 'TrendingUp' },
  ops: { label: 'Operaciones', color: '#3B82F6', icon: 'Settings' },
  it: { label: 'IT', color: '#EC4899', icon: 'Server' },
  tax: { label: 'Fiscal', color: '#EF4444', icon: 'FileText' },
  other: { label: 'Otro', color: '#6B7280', icon: 'Circle' },
};

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
  // Campos para checklist dinámico
  tipo_operacion?: 'compra' | 'venta';
  duracion_estimada_dias?: number;
  es_critica?: boolean;
  dependencias?: string[];
  fecha_inicio?: string;
  // Workstream de Due Diligence
  workstream?: DDWorkstream;
  created_at: string;
  updated_at: string;
}

export interface ChecklistFaseProgress {
  fase: string;
  total: number;
  completadas: number;
  enCurso: number;
  pendientes: number;
  porcentaje: number;
  // Nuevos campos
  vencidas?: number;
  diasEstimados?: number;
  tareasCriticas?: number;
}

// Fase dinámica de la base de datos
export interface ChecklistFaseConfig {
  id: string;
  nombre: string;
  tipo_operacion: 'compra' | 'venta' | 'ambos';
  orden: number;
  color: string;
  descripcion?: string;
  activo: boolean;
}

// Template de checklist
export interface ChecklistTemplate {
  id: string;
  fase: string;
  tarea: string;
  descripcion?: string;
  responsable?: string;
  sistema?: string;
  orden: number;
  tipo_operacion: 'compra' | 'venta';
  duracion_estimada_dias?: number;
  es_critica: boolean;
  dependencias?: string[];
  activo: boolean;
}

// Tarea vencida
export interface OverdueTask {
  id: string;
  tarea: string;
  fase: string;
  fecha_limite: string;
  es_critica: boolean;
  dias_vencida: number;
}

// ============================================
// MANDATO ACTIVITY TRACKING
// ============================================
export type MandatoActivityType = 'interaccion' | 'tarea' | 'documento' | 'hora' | 'nota' | 'estado_cambio';

export interface MandatoActivity {
  id: string;
  mandato_id: string;
  activity_type: MandatoActivityType;
  activity_description?: string;
  entity_id?: string;
  created_by?: string;
  created_at: string;
}

export interface MandatoWithInactivity extends Mandato {
  dias_sin_actividad: number;
  ultima_actividad_tipo?: string;
  ultima_actividad_desc?: string;
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

// ============================================
// TEAM TIME TRACKING (Super Admin)
// ============================================
export interface TeamStats {
  total_hours: number;
  billable_hours: number;
  active_users: number;
  average_hours_per_user: number;
  total_entries: number;
  hours_by_user: {
    user_id: string;
    user_name: string;
    hours: number;
    billable_hours: number;
  }[];
  hours_by_mandato: {
    mandato_id: string;
    mandato_name: string;
    hours: number;
  }[];
  hours_by_type: {
    work_type: string;
    hours: number;
  }[];
}

export interface TimeFilterState {
  startDate: Date;
  endDate: Date;
  userId: string | 'all';
  mandatoId: string | 'all';
  status: TimeEntryStatus | 'all';
  workType: TimeEntryWorkType | 'all' | 'Otro';
  onlyBillable: boolean;
}

export interface MandatoInfo {
  id: string;
  descripcion: string;
  tipo: MandatoTipo;
  estado: MandatoEstado;
}

// ============================================
// BILLING & COST TRACKING
// ============================================
export interface BillingRate {
  id: string;
  role: 'super_admin' | 'admin' | 'editor' | 'viewer';
  hourly_rate: number;
  currency: string;
  effective_from: string;
  effective_to?: string;
  description?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface MandatoCostSummary {
  mandatoId: string;
  descripcion: string;
  empresaNombre?: string;
  tipo?: string;
  totalHours: number;
  billableHours: number;
  totalCost: number;
  billableCost: number;
  billablePercentage: number;
}

export interface CostByWorkType {
  workType: string;
  hours: number;
  cost: number;
}

export interface CostByUser {
  userId: string;
  userName: string;
  role: string;
  hours: number;
  rate: number;
  cost: number;
}
