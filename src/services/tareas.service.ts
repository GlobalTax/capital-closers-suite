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
      created_at: raw.created_at || new Date().toISOString(),
      updated_at: raw.updated_at || new Date().toISOString(),
    } as Tarea;
  }

  async getByMandato(mandatoId: string): Promise<Tarea[]> {
    const { data, error } = await supabase
      .from('tareas')
      .select('*')
      .eq('mandato_id', mandatoId)
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
