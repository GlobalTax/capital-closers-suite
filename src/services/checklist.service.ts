import { BaseService } from "./base.service";
import { supabase } from "@/integrations/supabase/client";
import { DatabaseError } from "@/lib/error-handler";
import type { MandatoChecklistTask, ChecklistFaseProgress } from "@/types";
import type { ChecklistTaskRow } from "@/types/database";

class ChecklistService extends BaseService<MandatoChecklistTask, Partial<MandatoChecklistTask>, Partial<MandatoChecklistTask>> {
  constructor() {
    super('mandato_checklist_tasks');
  }

  protected transform(raw: ChecklistTaskRow): MandatoChecklistTask {
    return {
      id: raw.id,
      mandato_id: raw.mandato_id || '',
      fase: (raw.fase as any) || '1. Preparación',
      tarea: raw.tarea || '',
      descripcion: raw.descripcion || undefined,
      responsable: (raw.responsable as any) || undefined,
      sistema: (raw.sistema as any) || undefined,
      estado: (raw.estado as any) || '⏳ Pendiente',
      fecha_limite: raw.fecha_limite || undefined,
      fecha_completada: raw.fecha_completada || undefined,
      url_relacionada: raw.url_relacionada || undefined,
      notas: raw.notas || undefined,
      orden: raw.orden || 0,
      created_at: raw.created_at || new Date().toISOString(),
      updated_at: raw.updated_at || new Date().toISOString(),
    } as MandatoChecklistTask;
  }

  async getByMandato(mandatoId: string): Promise<MandatoChecklistTask[]> {
    const { data, error } = await supabase
      .from('mandato_checklist_tasks')
      .select('*')
      .eq('mandato_id', mandatoId)
      .order('fase')
      .order('orden');

    if (error) {
      throw new DatabaseError('Error obteniendo checklist del mandato', {
        table: 'mandato_checklist_tasks',
        code: error.code,
      });
    }

    return this.transformMany(data || []);
  }

  async copyTemplateToMandato(mandatoId: string) {
    const { data, error } = await supabase
      .rpc('copy_checklist_template_to_mandato', { p_mandato_id: mandatoId });

    if (error) {
      throw new DatabaseError('Error copiando template al mandato', {
        code: error.code,
      });
    }

    return data;
  }

  calculateFaseProgress(tasks: MandatoChecklistTask[]): ChecklistFaseProgress[] {
    const fases = ["1. Preparación", "2. Marketing", "3. Ofertas"] as const;

    return fases.map(fase => {
      const tasksInFase = tasks.filter(t => t.fase === fase);
      const total = tasksInFase.length;
      const completadas = tasksInFase.filter(t => t.estado === "✅ Completa").length;
      const enCurso = tasksInFase.filter(t => t.estado === "🔄 En curso").length;
      const pendientes = tasksInFase.filter(t => t.estado === "⏳ Pendiente").length;

      return {
        fase,
        total,
        completadas,
        enCurso,
        pendientes,
        porcentaje: total > 0 ? Math.round((completadas / total) * 100) : 0
      };
    });
  }
}

// Singleton instance
const checklistService = new ChecklistService();

// Exported functions
export const fetchChecklistTasks = (mandatoId: string) => checklistService.getByMandato(mandatoId);
export const createChecklistTask = (data: Partial<MandatoChecklistTask>) => checklistService.create(data);
export const updateChecklistTask = (id: string, data: Partial<MandatoChecklistTask>) => checklistService.update(id, data);
export const deleteChecklistTask = (id: string) => checklistService.delete(id);
export const copyTemplateToMandato = (mandatoId: string) => checklistService.copyTemplateToMandato(mandatoId);
export const calculateFaseProgress = (tasks: MandatoChecklistTask[]) => checklistService.calculateFaseProgress(tasks);
