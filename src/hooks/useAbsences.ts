import { useState, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { startOfMonth, endOfMonth, addMonths, subMonths } from "date-fns";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import {
  getAbsencesForRange,
  getAbsenceForDate,
  addAbsence,
  removeAbsence,
  type AbsenceType,
  type UserAbsence,
} from "@/services/absences.service";

export function useAbsences(selectedDate: Date) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Get range for current, previous and next month (for calendar view)
  const rangeStart = startOfMonth(subMonths(selectedDate, 1));
  const rangeEnd = endOfMonth(addMonths(selectedDate, 1));

  // Fetch absences for extended range
  const { data: absences = [], isLoading } = useQuery({
    queryKey: ['user-absences', user?.id, rangeStart.toISOString(), rangeEnd.toISOString()],
    queryFn: () => getAbsencesForRange(user!.id, rangeStart, rangeEnd),
    enabled: !!user?.id,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  // Get absence for currently selected date
  const absenceForSelectedDate = absences.find(
    (a) => a.absence_date === selectedDate.toISOString().split('T')[0]
  );

  // Get dates array for calendar modifiers
  const absenceDates = absences.map((a) => new Date(a.absence_date));

  // Add absence mutation
  const addAbsenceMutation = useMutation({
    mutationFn: async ({ date, type, notes }: { date: Date; type: AbsenceType; notes?: string }) => {
      if (!user?.id) throw new Error('Usuario no autenticado');
      return addAbsence(user.id, date, type, notes);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-absences'] });
      toast.success('Ausencia registrada');
    },
    onError: (error: Error) => {
      console.error('Error adding absence:', error);
      if (error.message?.includes('duplicate') || error.message?.includes('unique')) {
        toast.error('Ya existe una ausencia para este día');
      } else {
        toast.error('Error al registrar ausencia');
      }
    },
  });

  // Remove absence mutation
  const removeAbsenceMutation = useMutation({
    mutationFn: async (date: Date) => {
      if (!user?.id) throw new Error('Usuario no autenticado');
      return removeAbsence(user.id, date);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-absences'] });
      toast.success('Ausencia eliminada');
    },
    onError: (error: Error) => {
      console.error('Error removing absence:', error);
      toast.error('Error al eliminar ausencia');
    },
  });

  return {
    absences,
    absenceDates,
    absenceForSelectedDate,
    isLoading,
    addAbsence: addAbsenceMutation.mutate,
    removeAbsence: removeAbsenceMutation.mutate,
    isAdding: addAbsenceMutation.isPending,
    isRemoving: removeAbsenceMutation.isPending,
  };
}

// Standalone hook for checking single date absence
export function useAbsenceForDate(date: Date) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['user-absence', user?.id, date.toISOString().split('T')[0]],
    queryFn: () => getAbsenceForDate(user!.id, date),
    enabled: !!user?.id,
    staleTime: 1000 * 60 * 5,
  });
}
