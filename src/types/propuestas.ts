export type PropuestaEstado = 'borrador' | 'enviada' | 'aceptada' | 'rechazada';

export interface PropuestaConcepto {
  concepto: string;
  descripcion?: string;
  importe: number;
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
}

export type PropuestaInsert = Omit<PropuestaHonorarios, 'id' | 'created_at' | 'updated_at'>;
export type PropuestaUpdate = Partial<PropuestaInsert>;
