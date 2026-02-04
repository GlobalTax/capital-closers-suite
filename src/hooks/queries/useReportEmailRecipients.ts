import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export type ReportType = 'hours_daily' | 'hours_weekly' | 'pipeline_daily' | 'pipeline_weekly';

export interface ReportEmailRecipient {
  id: string;
  report_type: string;
  email: string;
  name: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export const REPORT_TYPES: { value: ReportType; label: string; description: string }[] = [
  { value: 'hours_daily', label: 'Horas Diario', description: 'Reporte diario de horas del equipo' },
  { value: 'hours_weekly', label: 'Horas Semanal', description: 'Resumen semanal de horas' },
  { value: 'pipeline_daily', label: 'Pipeline Diario', description: 'Estado diario del pipeline' },
  { value: 'pipeline_weekly', label: 'Pipeline Semanal', description: 'Resumen semanal del pipeline' },
];

export function useReportEmailRecipients(reportType?: string) {
  return useQuery({
    queryKey: ['report-email-recipients', reportType],
    queryFn: async () => {
      let query = supabase
        .from('report_email_recipients')
        .select('*')
        .order('created_at', { ascending: true });

      if (reportType) {
        query = query.eq('report_type', reportType);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data as ReportEmailRecipient[];
    },
  });
}

export function useAddReportRecipient() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { report_type: string; email: string; name?: string }) => {
      const { data: result, error } = await supabase
        .from('report_email_recipients')
        .insert({
          report_type: data.report_type,
          email: data.email.toLowerCase().trim(),
          name: data.name || null,
          is_active: true,
        })
        .select()
        .single();

      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['report-email-recipients'] });
      toast.success('Destinatario añadido');
    },
    onError: (error: Error) => {
      if (error.message.includes('unique')) {
        toast.error('Este email ya está registrado para este tipo de reporte');
      } else {
        toast.error('Error al añadir destinatario');
      }
      console.error('Error adding recipient:', error);
    },
  });
}

export function useUpdateReportRecipient() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...data }: { id: string; is_active?: boolean; name?: string }) => {
      const { error } = await supabase
        .from('report_email_recipients')
        .update(data)
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['report-email-recipients'] });
    },
    onError: (error) => {
      toast.error('Error al actualizar destinatario');
      console.error('Error updating recipient:', error);
    },
  });
}

export function useDeleteReportRecipient() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('report_email_recipients')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['report-email-recipients'] });
      toast.success('Destinatario eliminado');
    },
    onError: (error) => {
      toast.error('Error al eliminar destinatario');
      console.error('Error deleting recipient:', error);
    },
  });
}

export function useSendTestReport() {
  return useMutation({
    mutationFn: async (reportType: string) => {
      const { data, error } = await supabase.functions.invoke('daily-hours-report', {
        body: { test: true },
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast.success('Reporte de prueba enviado');
    },
    onError: (error) => {
      toast.error('Error al enviar reporte de prueba');
      console.error('Error sending test report:', error);
    },
  });
}
