import { BaseService } from "./base.service";
import { supabase } from "@/integrations/supabase/client";
import { DatabaseError } from "@/lib/error-handler";
import type { Tarea } from "@/types";
import type { TareaRow, TareaInsert, TareaUpdate } from "@/types/database";

class TareaService extends BaseService<Tarea, TareaInsert, TareaUpdate> {
  constructor() {
    super('tareas');
  }

  protected transform(raw: TareaRow): Tarea {
    return {
      id: raw.id,
      titulo: raw.titulo || '',
      descripcion: raw.descripcion || undefined,
      estado: (raw.estado as any) || 'pendiente',
      prioridad: (raw.prioridad as any) || 'media',
      fecha_vencimiento: raw.fecha_vencimiento || undefined,
      asignado_a: raw.asignado_a || undefined,
      mandato_id: raw.mandato_id || undefined,
      order_index: raw.order_index ?? 0,
      tipo: ((raw as any).tipo as any) || 'individual',
      creado_por: (raw as any).creado_por || undefined,
      compartido_con: (raw as any).compartido_con || [],
      es_visible_equipo: (raw as any).es_visible_equipo || false,
      created_at: raw.created_at || new Date().toISOString(),
      updated_at: raw.updated_at || new Date().toISOString(),
    } as Tarea;
  }

  async getAll(): Promise<Tarea[]> {
    const { data, error } = await supabase
      .from('tareas')
      .select('*')
      .order('order_index', { ascending: true })
      .order('created_at', { ascending: false });

    if (error) {
      throw new DatabaseError('Error obteniendo tareas', {
        table: 'tareas',
        code: error.code,
      });
    }

    return this.transformMany(data || []);
  }

  async getByMandato(mandatoId: string): Promise<Tarea[]> {
    const { data, error } = await supabase
      .from('tareas')
      .select('*')
      .eq('mandato_id', mandatoId)
      .order('order_index', { ascending: true })
      .order('fecha_vencimiento', { ascending: true });

    if (error) {
      throw new DatabaseError('Error obteniendo tareas del mandato', {
        table: 'tareas',
        code: error.code,
      });
    }

    return this.transformMany(data || []);
  }

  async getByResponsable(userId: string): Promise<Tarea[]> {
    const { data, error } = await supabase
      .from('tareas')
      .select('*')
      .eq('asignado_a', userId)
      .order('order_index', { ascending: true })
      .order('fecha_vencimiento', { ascending: true });

    if (error) {
      throw new DatabaseError('Error obteniendo tareas del usuario', {
        table: 'tareas',
        code: error.code,
      });
    }

    return this.transformMany(data || []);
  }

  async getPendientes(): Promise<Tarea[]> {
    const { data, error } = await supabase
      .from('tareas')
      .select('*')
      .in('estado', ['pendiente', 'en_progreso'])
      .order('order_index', { ascending: true })
      .order('fecha_vencimiento', { ascending: true });

    if (error) {
      throw new DatabaseError('Error obteniendo tareas pendientes', {
        table: 'tareas',
        code: error.code,
      });
    }

    return this.transformMany(data || []);
  }
}

// Singleton instance
const tareaService = new TareaService();

// Exported functions
export const fetchTareas = () => tareaService.getAll();
export const getTareaById = (id: string) => tareaService.getById(id);
export const createTarea = (data: TareaInsert) => tareaService.create(data);
export const updateTarea = (id: string, data: TareaUpdate) => tareaService.update(id, data);
export const deleteTarea = (id: string) => tareaService.delete(id);
export const getTareasByMandato = (mandatoId: string) => tareaService.getByMandato(mandatoId);
export const getTareasByResponsable = (userId: string) => tareaService.getByResponsable(userId);
export const getTareasPendientes = () => tareaService.getPendientes();