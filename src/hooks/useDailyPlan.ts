import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/hooks/useAuth";
import { addDays, format, isWeekend } from "date-fns";
import { toast } from "sonner";
import * as dailyPlansService from "@/services/dailyPlans.service";
import type { DailyPlanWithItems, NewDailyPlanItem } from "@/types/dailyPlans";

export function useDailyPlan(date?: Date) {
  const { user } = useAuth();
  const [plan, setPlan] = useState<DailyPlanWithItems | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [autoCreateTasks, setAutoCreateTasks] = useState(true);
  
  // Default to tomorrow if no date provided
  const targetDate = date || addDays(new Date(), 1);
  
  const loadPlan = useCallback(async () => {
    if (!user?.id || isWeekend(targetDate)) return;
    
    try {
      setLoading(true);
      const planData = await dailyPlansService.getOrCreatePlan(user.id, targetDate);
      setPlan(planData);
    } catch (error) {
      console.error('Error loading plan:', error);
      toast.error('Error al cargar el plan');
    } finally {
      setLoading(false);
    }
  }, [user?.id, format(targetDate, 'yyyy-MM-dd')]);
  
  useEffect(() => {
    loadPlan();
  }, [loadPlan]);
  
  const addItem = async (item: NewDailyPlanItem) => {
    if (!plan) return;
    
    try {
      setSaving(true);
      const newItem = await dailyPlansService.addPlanItem(plan.id, item);
      setPlan(prev => prev ? {
        ...prev,
        items: [...prev.items, newItem]
      } : null);
      toast.success('Tarea añadida');
    } catch (error) {
      console.error('Error adding item:', error);
      toast.error('Error al añadir tarea');
    } finally {
      setSaving(false);
    }
  };
  
  const updateItem = async (
    itemId: string, 
    updates: Partial<NewDailyPlanItem & { completed?: boolean }>
  ) => {
    try {
      setSaving(true);
      const updatedItem = await dailyPlansService.updatePlanItem(itemId, updates);
      setPlan(prev => prev ? {
        ...prev,
        items: prev.items.map(item => 
          item.id === itemId ? updatedItem : item
        )
      } : null);
    } catch (error) {
      console.error('Error updating item:', error);
      toast.error('Error al actualizar tarea');
    } finally {
      setSaving(false);
    }
  };
  
  const deleteItem = async (itemId: string) => {
    try {
      setSaving(true);
      await dailyPlansService.deletePlanItem(itemId);
      setPlan(prev => prev ? {
        ...prev,
        items: prev.items.filter(item => item.id !== itemId)
      } : null);
      toast.success('Tarea eliminada');
    } catch (error) {
      console.error('Error deleting item:', error);
      toast.error('Error al eliminar tarea');
    } finally {
      setSaving(false);
    }
  };
  
  const updateNotes = async (notes: string) => {
    if (!plan) return;
    
    try {
      setSaving(true);
      const updated = await dailyPlansService.updatePlanNotes(plan.id, notes);
      setPlan(prev => prev ? { ...prev, ...updated } : null);
    } catch (error) {
      console.error('Error updating notes:', error);
      toast.error('Error al guardar notas');
    } finally {
      setSaving(false);
    }
  };
  
  const totalMinutes = plan?.items.reduce((sum, item) => sum + item.estimated_minutes, 0) || 0;
  const totalHours = totalMinutes / 60;
  
  const MIN_HOURS = 8;
  
  const submitPlan = async () => {
    if (!plan) return;
    
    if (plan.items.length === 0) {
      toast.error('Debes añadir al menos una tarea');
      return;
    }
    
    // Validate minimum 8 hours
    if (totalHours < MIN_HOURS) {
      toast.error(`El plan debe tener al menos ${MIN_HOURS} horas. Actualmente: ${totalHours.toFixed(1)}h`);
      return;
    }
    
    try {
      setSaving(true);
      const { plan: updated, tasksCreated } = await dailyPlansService.submitPlan(plan.id, autoCreateTasks);
      setPlan(prev => prev ? { ...prev, ...updated } : null);
      
      if (autoCreateTasks && tasksCreated > 0) {
        toast.success(`Plan enviado y ${tasksCreated} ${tasksCreated === 1 ? 'tarea creada' : 'tareas creadas'} ✓`);
      } else {
        toast.success('Plan enviado ✓');
      }
    } catch (error) {
      console.error('Error submitting plan:', error);
      toast.error('Error al enviar plan');
    } finally {
      setSaving(false);
    }
  };
  
  return {
    plan,
    loading,
    saving,
    addItem,
    updateItem,
    deleteItem,
    updateNotes,
    submitPlan,
    refresh: loadPlan,
    totalMinutes,
    totalHours,
    minHours: MIN_HOURS,
    hoursRemaining: Math.max(0, MIN_HOURS - totalHours),
    canEdit: plan?.status !== 'rejected',
    isSubmitted: plan?.status === 'submitted' || plan?.status === 'approved',
    autoCreateTasks,
    setAutoCreateTasks,
  };
}
