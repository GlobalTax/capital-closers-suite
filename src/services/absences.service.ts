import { supabase } from "@/integrations/supabase/client";
import { DatabaseError } from "@/lib/error-handler";
import { format } from "date-fns";

export type AbsenceType = 'vacation' | 'sick_leave' | 'personal' | 'other';

export interface UserAbsence {
  id: string;
  user_id: string;
  absence_date: string;
  absence_type: AbsenceType;
  notes: string | null;
  approved_by: string | null;
  created_at: string;
  updated_at: string;
}

// Get absences for a user within a date range
export async function getAbsencesForRange(
  userId: string,
  startDate: Date,
  endDate: Date
): Promise<UserAbsence[]> {
  const { data, error } = await supabase
    .from('user_absences')
    .select('*')
    .eq('user_id', userId)
    .gte('absence_date', format(startDate, 'yyyy-MM-dd'))
    .lte('absence_date', format(endDate, 'yyyy-MM-dd'))
    .order('absence_date');

  if (error) throw new DatabaseError('Error al obtener ausencias', { supabaseError: error, table: 'user_absences' });
  return data as UserAbsence[];
}

// Get absence for a specific date
export async function getAbsenceForDate(
  userId: string,
  date: Date
): Promise<UserAbsence | null> {
  const dateStr = format(date, 'yyyy-MM-dd');

  const { data, error } = await supabase
    .from('user_absences')
    .select('*')
    .eq('user_id', userId)
    .eq('absence_date', dateStr)
    .maybeSingle();

  if (error) throw new DatabaseError('Error al obtener ausencia', { supabaseError: error, table: 'user_absences' });
  return data as UserAbsence | null;
}

// Check if a specific date is marked as absence
export async function isAbsenceDate(
  userId: string,
  date: Date
): Promise<{ isAbsence: boolean; absenceType?: AbsenceType }> {
  const absence = await getAbsenceForDate(userId, date);
  
  if (absence) {
    return { isAbsence: true, absenceType: absence.absence_type };
  }
  return { isAbsence: false };
}

// Add an absence
export async function addAbsence(
  userId: string,
  date: Date,
  type: AbsenceType,
  notes?: string
): Promise<UserAbsence> {
  const dateStr = format(date, 'yyyy-MM-dd');

  const { data, error } = await supabase
    .from('user_absences')
    .insert({
      user_id: userId,
      absence_date: dateStr,
      absence_type: type,
      notes: notes || null,
    })
    .select()
    .single();

  if (error) throw new DatabaseError('Error al crear ausencia', { supabaseError: error, table: 'user_absences' });
  return data as UserAbsence;
}

// Remove an absence
export async function removeAbsence(
  userId: string,
  date: Date
): Promise<void> {
  const dateStr = format(date, 'yyyy-MM-dd');

  const { error } = await supabase
    .from('user_absences')
    .delete()
    .eq('user_id', userId)
    .eq('absence_date', dateStr);

  if (error) throw new DatabaseError('Error al eliminar ausencia', { supabaseError: error, table: 'user_absences' });
}

// Get absence labels for display
export function getAbsenceLabel(type: AbsenceType): { label: string; emoji: string } {
  const labels: Record<AbsenceType, { label: string; emoji: string }> = {
    vacation: { label: 'Vacaciones', emoji: '🏖️' },
    sick_leave: { label: 'Baja médica', emoji: '🤒' },
    personal: { label: 'Asunto personal', emoji: '👤' },
    other: { label: 'Otro', emoji: '📅' },
  };
  return labels[type] || labels.other;
}
