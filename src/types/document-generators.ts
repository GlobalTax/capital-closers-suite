// ============================================
// SISTEMA DE GENERACIÓN DE DOCUMENTOS - TIPOS
// ============================================

export type DocumentType = 'nda' | 'mandato_venta' | 'mandato_compra' | 'loi' | 'psh';

export interface BaseDocumentData {
  fecha: string;
  lugar: string;
}

// ========== NDA ==========
export interface NDAData extends BaseDocumentData {
  // Parte reveladora
  empresa_nombre: string;
  empresa_cif: string;
  empresa_domicilio: string;
  empresa_representante: string;
  empresa_cargo_representante?: string;
  
  // Parte receptora
  contraparte_nombre: string;
  contraparte_cif: string;
  contraparte_domicilio: string;
  contraparte_representante: string;
  contraparte_cargo_representante?: string;
  
  // Cláusulas
  duracion_meses: number;
  penalizacion_euros?: number;
  jurisdiccion: string;
  ley_aplicable: string;
  
  // Operación
  descripcion_operacion: string;
  tipo_operacion: 'compra' | 'venta' | 'inversion';
  nombre_proyecto?: string;
}

// ========== MANDATO DE VENTA ==========
export interface MandatoVentaData extends BaseDocumentData {
  // Asesor
  asesor_nombre: string;
  asesor_cif: string;
  asesor_domicilio: string;
  asesor_representante: string;
  
  // Cliente vendedor
  cliente_nombre: string;
  cliente_cif: string;
  cliente_domicilio: string;
  cliente_representante: string;
  cliente_cargo_representante?: string;
  
  // Empresa objetivo (target)
  target_nombre: string;
  target_cif?: string;
  target_sector?: string;
  target_descripcion?: string;
  
  // Condiciones del mandato
  exclusividad: boolean;
  duracion_meses: number;
  renovacion_automatica: boolean;
  preaviso_dias: number;
  
  // Valoración
  valoracion_indicativa_min?: number;
  valoracion_indicativa_max?: number;
  valoracion_metodo?: string;
  
  // Honorarios
  honorario_fijo?: number;
  honorario_exito_porcentaje: number;
  honorario_minimo?: number;
  gastos_provision?: number;
  
  // Servicios incluidos
  servicios: string[];
  
  // Legal
  jurisdiccion: string;
  ley_aplicable: string;
}

// ========== MANDATO DE COMPRA ==========
export interface MandatoCompraData extends BaseDocumentData {
  // Asesor
  asesor_nombre: string;
  asesor_cif: string;
  asesor_domicilio: string;
  asesor_representante: string;
  
  // Cliente comprador
  cliente_nombre: string;
  cliente_cif: string;
  cliente_domicilio: string;
  cliente_representante: string;
  cliente_cargo_representante?: string;
  
  // Criterios de búsqueda
  sectores_objetivo: string[];
  geografia_objetivo: string[];
  facturacion_min?: number;
  facturacion_max?: number;
  ebitda_min?: number;
  ebitda_max?: number;
  empleados_min?: number;
  empleados_max?: number;
  caracteristicas_deseadas?: string[];
  exclusiones?: string[];
  
  // Condiciones del mandato
  exclusividad: boolean;
  duracion_meses: number;
  renovacion_automatica: boolean;
  preaviso_dias: number;
  
  // Presupuesto inversión
  inversion_min?: number;
  inversion_max?: number;
  estructura_preferida?: string; // 100%, mayoría, minoría
  
  // Honorarios
  honorario_fijo?: number;
  honorario_exito_porcentaje: number;
  honorario_minimo?: number;
  gastos_provision?: number;
  
  // Servicios incluidos
  servicios: string[];
  
  // Legal
  jurisdiccion: string;
  ley_aplicable: string;
}

// ========== LOI - CARTA DE INTENCIONES ==========
export interface LOIData extends BaseDocumentData {
  // Comprador
  comprador_nombre: string;
  comprador_cif: string;
  comprador_domicilio: string;
  comprador_representante: string;
  
  // Vendedor
  vendedor_nombre: string;
  vendedor_cif: string;
  vendedor_domicilio: string;
  vendedor_representante: string;
  
  // Objeto de la transacción
  target_nombre: string;
  target_cif?: string;
  target_descripcion?: string;
  porcentaje_adquisicion: number; // 100, 51, etc.
  
  // Precio
  precio_indicativo: number;
  estructura_pago?: string; // al cierre, diferido, earn-out
  ajustes_precio?: string[];
  
  // Due Diligence
  dd_plazo_dias: number;
  dd_alcance: string[];
  
  // Exclusividad
  exclusividad: boolean;
  exclusividad_dias?: number;
  
  // Condiciones
  condiciones_suspensivas?: string[];
  
  // Plazos
  validez_dias: number;
  cierre_estimado?: string;
  
  // Carácter
  vinculante: boolean;
  clausulas_vinculantes?: string[]; // confidencialidad, exclusividad
  
  // Legal
  jurisdiccion: string;
  ley_aplicable: string;
}

// ========== UTILIDADES ==========
export interface DocumentGeneratorConfig {
  type: DocumentType;
  label: string;
  description: string;
  icon: string;
  requiredFields: string[];
}

export const DOCUMENT_CONFIGS: DocumentGeneratorConfig[] = [
  {
    type: 'nda',
    label: 'NDA / Acuerdo de Confidencialidad',
    description: 'Acuerdo de confidencialidad entre partes para proteger información sensible',
    icon: 'Shield',
    requiredFields: ['empresa_nombre', 'contraparte_nombre', 'duracion_meses'],
  },
  {
    type: 'mandato_venta',
    label: 'Mandato de Venta',
    description: 'Contrato de mandato para la venta de una empresa o participaciones',
    icon: 'FileText',
    requiredFields: ['cliente_nombre', 'target_nombre', 'honorario_exito_porcentaje'],
  },
  {
    type: 'mandato_compra',
    label: 'Mandato de Compra',
    description: 'Contrato de mandato para la búsqueda y adquisición de empresas',
    icon: 'Search',
    requiredFields: ['cliente_nombre', 'sectores_objetivo', 'honorario_exito_porcentaje'],
  },
  {
    type: 'loi',
    label: 'LOI / Carta de Intenciones',
    description: 'Carta de intenciones para formalizar el interés en una transacción',
    icon: 'Mail',
    requiredFields: ['comprador_nombre', 'vendedor_nombre', 'precio_indicativo'],
  },
];

// Valores por defecto para prellenar formularios
export const DEFAULT_VALUES = {
  asesor_nombre: 'Accountex Advisory, S.L.',
  asesor_cif: 'B12345678',
  asesor_domicilio: 'Calle Example 123, 28001 Madrid',
  asesor_representante: 'Juan García López',
  jurisdiccion: 'Juzgados y Tribunales de Madrid',
  ley_aplicable: 'Legislación española',
  duracion_meses: 12,
  preaviso_dias: 30,
  honorario_exito_porcentaje: 3,
  dd_plazo_dias: 45,
  validez_dias: 30,
  exclusividad_dias: 60,
};

export const SERVICIOS_MANDATO_VENTA = [
  'Análisis y valoración de la compañía',
  'Preparación de documentación comercial (Teaser, Cuaderno de Venta)',
  'Identificación y contacto de potenciales compradores',
  'Coordinación del proceso de Due Diligence',
  'Asesoramiento en la negociación',
  'Coordinación del cierre de la operación',
];

export const SERVICIOS_MANDATO_COMPRA = [
  'Definición del perfil de adquisición',
  'Búsqueda activa de oportunidades',
  'Análisis preliminar de targets',
  'Valoración indicativa de oportunidades',
  'Coordinación del proceso de Due Diligence',
  'Asesoramiento en la negociación',
  'Coordinación del cierre de la operación',
];

export const DD_ALCANCE_OPTIONS = [
  'Due Diligence Financiero',
  'Due Diligence Fiscal',
  'Due Diligence Legal',
  'Due Diligence Laboral',
  'Due Diligence Comercial',
  'Due Diligence Operativo',
  'Due Diligence Medioambiental',
  'Due Diligence Tecnológico',
];
