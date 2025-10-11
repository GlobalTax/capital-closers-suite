import { BaseService } from "./base.service";
import { supabase } from "@/integrations/supabase/client";
import { DatabaseError } from "@/lib/error-handler";
import type { InteraccionRow, InteraccionInsert, InteraccionUpdate } from "@/types/database";

export interface Interaccion {
  id: string;
  contacto_id?: string;
  empresa_id?: string;
  mandato_id?: string;
  tipo: 'llamada' | 'email' | 'reunion' | 'nota' | 'whatsapp' | 'linkedin' | 'visita';
  titulo: string;
  descripcion?: string;
  fecha: string;
  duracion_minutos?: number;
  resultado?: 'positivo' | 'neutral' | 'negativo' | 'pendiente_seguimiento';
  siguiente_accion?: string;
  fecha_siguiente_accion?: string;
  documentos_adjuntos?: any[];
  created_by?: string;
  created_at: string;
  updated_at: string;
}

class InteraccionService extends BaseService<Interaccion, InteraccionInsert, InteraccionUpdate> {
  constructor() {
    super('interacciones');
  }

  protected transform(raw: InteraccionRow): Interaccion {
    return {
      id: raw.id,
      contacto_id: raw.contacto_id || undefined,
      empresa_id: raw.empresa_id || undefined,
      mandato_id: raw.mandato_id || undefined,
      tipo: raw.tipo as Interaccion['tipo'],
      titulo: raw.titulo || '',
      descripcion: raw.descripcion || undefined,
      fecha: raw.fecha || new Date().toISOString(),
      duracion_minutos: raw.duracion_minutos || undefined,
      resultado: raw.resultado as Interaccion['resultado'] || undefined,
      siguiente_accion: raw.siguiente_accion || undefined,
      fecha_siguiente_accion: raw.fecha_siguiente_accion || undefined,
      documentos_adjuntos: raw.documentos_adjuntos ? JSON.parse(JSON.stringify(raw.documentos_adjuntos)) : undefined,
      created_by: raw.created_by || undefined,
      created_at: raw.created_at || new Date().toISOString(),
      updated_at: raw.updated_at || new Date().toISOString(),
    };
  }

  async getByContacto(contactoId: string): Promise<Interaccion[]> {
    const { data, error } = await supabase
      .from('interacciones')
      .select('*')
      .eq('contacto_id', contactoId)
      .order('fecha', { ascending: false });

    if (error) {
      throw new DatabaseError('Error obteniendo interacciones del contacto', {
        table: 'interacciones',
        code: error.code,
      });
    }

    return this.transformMany(data || []);
  }

  async getByEmpresa(empresaId: string): Promise<Interaccion[]> {
    const { data, error } = await supabase
      .from('interacciones')
      .select('*')
      .eq('empresa_id', empresaId)
      .order('fecha', { ascending: false });

    if (error) {
      throw new DatabaseError('Error obteniendo interacciones de la empresa', {
        table: 'interacciones',
        code: error.code,
      });
    }

    return this.transformMany(data || []);
  }

  async getByMandato(mandatoId: string): Promise<Interaccion[]> {
    const { data, error } = await supabase
      .from('interacciones')
      .select('*')
      .eq('mandato_id', mandatoId)
      .order('fecha', { ascending: false });

    if (error) {
      throw new DatabaseError('Error obteniendo interacciones del mandato', {
        table: 'interacciones',
        code: error.code,
      });
    }

    return this.transformMany(data || []);
  }

  async getRecientes(limit: number = 10): Promise<Interaccion[]> {
    const { data, error } = await supabase
      .from('interacciones')
      .select('*')
      .order('fecha', { ascending: false })
      .limit(limit);

    if (error) {
      throw new DatabaseError('Error obteniendo interacciones recientes', {
        table: 'interacciones',
        code: error.code,
      });
    }

    return this.transformMany(data || []);
  }

  async getProximasAcciones(): Promise<Interaccion[]> {
    const { data, error } = await supabase
      .from('interacciones')
      .select('*')
      .not('fecha_siguiente_accion', 'is', null)
      .gte('fecha_siguiente_accion', new Date().toISOString().split('T')[0])
      .order('fecha_siguiente_accion', { ascending: true });

    if (error) {
      throw new DatabaseError('Error obteniendo próximas acciones', {
        table: 'interacciones',
        code: error.code,
      });
    }

    return this.transformMany(data || []);
  }
}

// Singleton instance
const interaccionService = new InteraccionService();

// Exported functions
export const fetchInteraccionesByContacto = (contactoId: string) => interaccionService.getByContacto(contactoId);
export const fetchInteraccionesByEmpresa = (empresaId: string) => interaccionService.getByEmpresa(empresaId);
export const fetchInteraccionesByMandato = (mandatoId: string) => interaccionService.getByMandato(mandatoId);
export const createInteraccion = (data: InteraccionInsert) => interaccionService.create(data);
export const updateInteraccion = (id: string, data: InteraccionUpdate) => interaccionService.update(id, data);
export const deleteInteraccion = (id: string) => interaccionService.delete(id);
export const getInteraccionesRecientes = (limit?: number) => interaccionService.getRecientes(limit);
export const getProximasAcciones = () => interaccionService.getProximasAcciones();
