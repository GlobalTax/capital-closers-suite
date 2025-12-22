import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useMemo } from "react";
import { 
  CalendarEvent, 
  CalendarFilters, 
  CalendarEventType,
  getEventColor,
  getEventBgColor
} from "@/types/calendar";
import { startOfMonth, endOfMonth, parseISO, isAfter, isBefore, isToday } from "date-fns";

interface UseCalendarEventsOptions {
  currentDate: Date;
  filters: CalendarFilters;
}

export function useCalendarEvents({ currentDate, filters }: UseCalendarEventsOptions) {
  const startDate = startOfMonth(currentDate);
  const endDate = endOfMonth(currentDate);

  // Fetch mandatos with dates
  const { data: mandatos, isLoading: loadingMandatos } = useQuery({
    queryKey: ['calendar-mandatos', startDate.toISOString(), endDate.toISOString()],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('mandatos')
        .select(`
          id,
          descripcion,
          tipo,
          estado,
          fecha_inicio,
          fecha_cierre,
          expected_close_date,
          empresa_principal:empresas!mandatos_empresa_principal_id_fkey(nombre)
        `)
        .or(`fecha_inicio.gte.${startDate.toISOString()},fecha_inicio.lte.${endDate.toISOString()},fecha_cierre.gte.${startDate.toISOString()},fecha_cierre.lte.${endDate.toISOString()},expected_close_date.gte.${startDate.toISOString()},expected_close_date.lte.${endDate.toISOString()}`);

      if (error) throw error;
      return data || [];
    },
    staleTime: 5 * 60 * 1000,
  });

  // Fetch checklist tasks with fecha_limite
  const { data: checklistTasks, isLoading: loadingTasks } = useQuery({
    queryKey: ['calendar-checklist-tasks', startDate.toISOString(), endDate.toISOString()],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('mandato_checklist_tasks')
        .select(`
          id,
          tarea,
          fase,
          estado,
          fecha_limite,
          es_critica,
          mandato_id,
          mandato:mandatos!mandato_checklist_tasks_mandato_id_fkey(
            id,
            descripcion,
            tipo,
            empresa_principal:empresas!mandatos_empresa_principal_id_fkey(nombre)
          )
        `)
        .not('fecha_limite', 'is', null)
        .gte('fecha_limite', startDate.toISOString())
        .lte('fecha_limite', endDate.toISOString());

      if (error) throw error;
      return data || [];
    },
    staleTime: 5 * 60 * 1000,
  });

  // Fetch general tasks with fecha_vencimiento
  const { data: tareas, isLoading: loadingTareas } = useQuery({
    queryKey: ['calendar-tareas', startDate.toISOString(), endDate.toISOString()],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tareas')
        .select(`
          id,
          titulo,
          estado,
          fecha_vencimiento,
          mandato_id,
          mandato:mandatos!tareas_mandato_id_fkey(
            id,
            descripcion,
            tipo,
            empresa_principal:empresas!mandatos_empresa_principal_id_fkey(nombre)
          )
        `)
        .not('fecha_vencimiento', 'is', null)
        .gte('fecha_vencimiento', startDate.toISOString())
        .lte('fecha_vencimiento', endDate.toISOString());

      if (error) throw error;
      return data || [];
    },
    staleTime: 5 * 60 * 1000,
  });

  // Process and combine events
  const events = useMemo(() => {
    const allEvents: CalendarEvent[] = [];

    // Process mandatos
    mandatos?.forEach((mandato) => {
      const mandatoNombre = mandato.empresa_principal?.nombre || mandato.descripcion || 'Sin nombre';
      const mandatoTipo = mandato.tipo as 'compra' | 'venta';

      // Filter by tipo
      if (filters.tipoMandato !== 'all' && mandato.tipo !== filters.tipoMandato) return;
      // Filter by estado
      if (filters.estadoMandato !== 'all' && mandato.estado !== filters.estadoMandato) return;

      // Fecha inicio
      if (mandato.fecha_inicio && filters.tipoEvento.includes('inicio_mandato')) {
        allEvents.push({
          id: `inicio-${mandato.id}`,
          title: `Inicio: ${mandatoNombre}`,
          date: parseISO(mandato.fecha_inicio),
          type: 'inicio_mandato',
          mandatoId: mandato.id,
          mandatoNombre,
          mandatoTipo,
          color: getEventColor('inicio_mandato'),
          bgColor: getEventBgColor('inicio_mandato'),
          metadata: { estado: mandato.estado }
        });
      }

      // Expected close date
      if (mandato.expected_close_date && filters.tipoEvento.includes('cierre_esperado')) {
        const closeDate = parseISO(mandato.expected_close_date);
        const isOverdue = isBefore(closeDate, new Date()) && mandato.estado !== 'cerrado';
        
        allEvents.push({
          id: `cierre-esperado-${mandato.id}`,
          title: `Cierre esperado: ${mandatoNombre}`,
          date: closeDate,
          type: 'cierre_esperado',
          mandatoId: mandato.id,
          mandatoNombre,
          mandatoTipo,
          color: getEventColor('cierre_esperado'),
          bgColor: getEventBgColor('cierre_esperado'),
          isOverdue,
          metadata: { estado: mandato.estado }
        });
      }

      // Fecha cierre real
      if (mandato.fecha_cierre && filters.tipoEvento.includes('fin_mandato')) {
        allEvents.push({
          id: `fin-${mandato.id}`,
          title: `Cerrado: ${mandatoNombre}`,
          date: parseISO(mandato.fecha_cierre),
          type: 'fin_mandato',
          mandatoId: mandato.id,
          mandatoNombre,
          mandatoTipo,
          color: getEventColor('fin_mandato'),
          bgColor: getEventBgColor('fin_mandato'),
          isCompleted: true,
          metadata: { estado: mandato.estado }
        });
      }
    });

    // Process checklist tasks
    checklistTasks?.forEach((task) => {
      const mandato = task.mandato as any;
      if (!mandato) return;

      const mandatoNombre = mandato.empresa_principal?.nombre || mandato.descripcion || 'Sin nombre';
      const mandatoTipo = mandato.tipo as 'compra' | 'venta';

      // Filter by tipo
      if (filters.tipoMandato !== 'all' && mandato.tipo !== filters.tipoMandato) return;

      const eventType: CalendarEventType = task.es_critica ? 'tarea_critica' : 'tarea_checklist';
      if (!filters.tipoEvento.includes(eventType)) return;

      const isCompleted = task.estado === '✅ Completa';
      if (!filters.showCompleted && isCompleted) return;

      const taskDate = parseISO(task.fecha_limite!);
      const isOverdue = isBefore(taskDate, new Date()) && !isCompleted;

      allEvents.push({
        id: `checklist-${task.id}`,
        title: task.tarea,
        date: taskDate,
        type: eventType,
        mandatoId: mandato.id,
        mandatoNombre,
        mandatoTipo,
        taskId: task.id,
        fase: task.fase,
        color: getEventColor(eventType),
        bgColor: getEventBgColor(eventType),
        isCompleted,
        isOverdue,
        metadata: { fase: task.fase, es_critica: task.es_critica }
      });
    });

    // Process general tasks
    tareas?.forEach((tarea) => {
      const mandato = tarea.mandato as any;
      
      if (mandato && filters.tipoMandato !== 'all' && mandato.tipo !== filters.tipoMandato) return;
      if (!filters.tipoEvento.includes('tarea_general')) return;

      const isCompleted = tarea.estado === 'completada';
      if (!filters.showCompleted && isCompleted) return;

      const taskDate = parseISO(tarea.fecha_vencimiento!);
      const isOverdue = isBefore(taskDate, new Date()) && !isCompleted;

      const mandatoNombre = mandato?.empresa_principal?.nombre || mandato?.descripcion || undefined;

      allEvents.push({
        id: `tarea-${tarea.id}`,
        title: tarea.titulo,
        date: taskDate,
        type: 'tarea_general',
        mandatoId: tarea.mandato_id || undefined,
        mandatoNombre,
        mandatoTipo: mandato?.tipo as 'compra' | 'venta' | undefined,
        color: getEventColor('tarea_general'),
        bgColor: getEventBgColor('tarea_general'),
        isCompleted,
        isOverdue,
      });
    });

    return allEvents.sort((a, b) => a.date.getTime() - b.date.getTime());
  }, [mandatos, checklistTasks, tareas, filters]);

  // Get events for a specific date
  const getEventsForDate = (date: Date): CalendarEvent[] => {
    return events.filter(event => 
      event.date.getDate() === date.getDate() &&
      event.date.getMonth() === date.getMonth() &&
      event.date.getFullYear() === date.getFullYear()
    );
  };

  // Get upcoming events (next 7 days)
  const upcomingEvents = useMemo(() => {
    const today = new Date();
    const nextWeek = new Date(today);
    nextWeek.setDate(nextWeek.getDate() + 7);

    return events.filter(event => 
      isAfter(event.date, today) && isBefore(event.date, nextWeek)
    ).slice(0, 10);
  }, [events]);

  // Get overdue events
  const overdueEvents = useMemo(() => {
    return events.filter(event => event.isOverdue);
  }, [events]);

  return {
    events,
    getEventsForDate,
    upcomingEvents,
    overdueEvents,
    isLoading: loadingMandatos || loadingTasks || loadingTareas,
  };
}
