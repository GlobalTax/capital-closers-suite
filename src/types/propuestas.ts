export type PropuestaEstado = 'borrador' | 'enviada' | 'aceptada' | 'rechazada';

export interface PropuestaConcepto {
  concepto: string;
  descripcion?: string;
  importe: number;
}

export interface AreaDD {
  incluido: boolean;
  importe: number;
  alcance: string[];
}

export interface AlcanceDD {
  legal?: AreaDD;
  fiscal?: AreaDD;
  financiera?: AreaDD;
  laboral?: AreaDD;
  otras?: AreaDD;
}

export interface ClausulasAdicionales {
  limitacion_responsabilidad?: boolean;
  confidencialidad?: boolean;
  ley_aplicable?: string;
  jurisdiccion?: string;
}

export interface PropuestaHonorarios {
  id: string;
  mandato_id: string;
  version: number;
  estado: PropuestaEstado;
  titulo: string;
  descripcion?: string;
  importe_total: number;
  estructura?: 'fijo' | 'exito' | 'mixto' | 'horario';
  desglose: PropuestaConcepto[];
  condiciones_pago?: string;
  fecha_emision?: string;
  fecha_vencimiento?: string;
  fecha_respuesta?: string;
  motivo_rechazo?: string;
  notas_internas?: string;
  archivo_pdf_path?: string;
  created_by?: string;
  created_at: string;
  updated_at: string;
  // Campos PSH avanzados
  cliente_cif?: string;
  cliente_domicilio?: string;
  target_nombre?: string;
  target_cif?: string;
  target_domicilio?: string;
  descripcion_transaccion?: string;
  alcance_dd?: AlcanceDD;
  clausulas_adicionales?: ClausulasAdicionales;
  plantilla_tipo?: string;
  firma_cliente?: string;
  firma_firma?: string;
}

export type PropuestaInsert = Omit<PropuestaHonorarios, 'id' | 'created_at' | 'updated_at'>;
export type PropuestaUpdate = Partial<PropuestaInsert>;
