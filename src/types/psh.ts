// PSH (Propuesta de Servicios y Honorarios) Types

export interface AlcanceAreaDD {
  incluido: boolean;
  importe: number;
  alcance: string[];
}

export interface AlcanceDD {
  legal?: AlcanceAreaDD;
  fiscal?: AlcanceAreaDD;
  financiera?: AlcanceAreaDD;
  laboral?: AlcanceAreaDD;
  otras?: AlcanceAreaDD;
}

export interface ClausulasAdicionales {
  limitacion_responsabilidad?: boolean;
  confidencialidad?: boolean;
  ley_aplicable?: string;
  jurisdiccion?: string;
}

export interface PSHPlantilla {
  id: string;
  nombre: string;
  tipo_servicio: string;
  descripcion?: string;
  alcance_default: AlcanceDD;
  clausulas_default: ClausulasAdicionales;
  condiciones_pago_default?: string;
  is_active: boolean;
  display_order: number;
  created_at: string;
  updated_at: string;
}

export type TipoServicioPSH = 'due_diligence' | 'spa' | 'dd_spa' | 'valoracion' | 'asesoria';

export const AREAS_DD = {
  legal: {
    label: 'Due Diligence Legal',
    alcanceOpciones: [
      'Aspectos societarios y corporativos',
      'Contratación mercantil',
      'Activos y derechos',
      'Litigios y contingencias',
      'Propiedad intelectual e industrial',
    ],
  },
  fiscal: {
    label: 'Due Diligence Fiscal',
    alcanceOpciones: [
      'Impuesto sobre Sociedades',
      'IVA e impuestos indirectos',
      'Retenciones e ingresos a cuenta',
      'Inspecciones fiscales',
      'Operaciones vinculadas',
      'Contingencias fiscales',
    ],
  },
  financiera: {
    label: 'Due Diligence Financiera',
    alcanceOpciones: [
      'Estados financieros históricos',
      'Análisis de ingresos y márgenes',
      'Identificación de ajustes de EBITDA',
      'Deuda financiera neta',
      'Capital circulante',
      'Contingencias fuera de balance',
    ],
  },
  laboral: {
    label: 'Due Diligence Laboral',
    alcanceOpciones: [
      'Estructura de plantilla',
      'Contratos de trabajo',
      'Condiciones retributivas',
      'Seguridad Social',
      'Procedimientos laborales',
      'Contratos de alta dirección',
    ],
  },
} as const;

export type AreaDD = keyof typeof AREAS_DD;

export const CLAUSULAS_DEFAULT: ClausulasAdicionales = {
  limitacion_responsabilidad: true,
  confidencialidad: true,
  ley_aplicable: 'española',
  jurisdiccion: 'Barcelona',
};

export const CONDICIONES_PAGO_PRESETS = [
  { label: '60/40 Estándar', value: '60% a la firma de la propuesta. 40% al inicio de la negociación contractual o cierre de la operación.' },
  { label: '50/50', value: '50% a la firma. 50% a la entrega del informe.' },
  { label: '30/30/40', value: '30% al inicio. 30% al completar la Due Diligence. 40% al cierre.' },
  { label: '100% al cierre', value: '100% de los honorarios a la firma del contrato de compraventa.' },
];
