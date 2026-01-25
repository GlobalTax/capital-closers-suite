import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  fetchEmailQueue,
  fetchQueueStats,
  enqueueEmail,
  cancelEmail,
  retryEmail,
  bulkRetryFailed,
  clearOldEmails,
  processQueue,
  getEmailById,
  type EmailQueueItem,
  type EnqueueEmailParams,
  type QueueStats,
  type QueueFilters,
} from "@/services/emailQueue.service";

const QUEUE_KEY = "email-queue";
const STATS_KEY = "email-queue-stats";

/**
 * Hook for fetching email queue with filters and pagination
 */
export function useEmailQueue(
  filters: QueueFilters = {},
  page = 0,
  pageSize = 50
) {
  return useQuery({
    queryKey: [QUEUE_KEY, filters, page, pageSize],
    queryFn: () => fetchEmailQueue(filters, page, pageSize),
    staleTime: 30000, // 30 seconds
  });
}

/**
 * Hook for fetching queue statistics
 */
export function useQueueStats() {
  return useQuery({
    queryKey: [STATS_KEY],
    queryFn: fetchQueueStats,
    staleTime: 60000, // 1 minute
    refetchInterval: 60000, // Auto-refresh every minute
  });
}

/**
 * Hook for fetching a single email by ID
 */
export function useEmailById(emailId: string | null) {
  return useQuery({
    queryKey: [QUEUE_KEY, emailId],
    queryFn: () => emailId ? getEmailById(emailId) : null,
    enabled: !!emailId,
  });
}

/**
 * Hook for enqueueing a new email
 */
export function useEnqueueEmail() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (params: EnqueueEmailParams) => enqueueEmail(params),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUEUE_KEY] });
      queryClient.invalidateQueries({ queryKey: [STATS_KEY] });
      toast.success("Email añadido a la cola");
    },
    onError: (error: Error) => {
      console.error("Error enqueueing email:", error);
      toast.error(`Error al encolar email: ${error.message}`);
    },
  });
}

/**
 * Hook for cancelling a pending email
 */
export function useCancelEmail() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (emailId: string) => cancelEmail(emailId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUEUE_KEY] });
      queryClient.invalidateQueries({ queryKey: [STATS_KEY] });
      toast.success("Email cancelado");
    },
    onError: (error: Error) => {
      console.error("Error cancelling email:", error);
      toast.error(`Error al cancelar: ${error.message}`);
    },
  });
}

/**
 * Hook for retrying a failed email
 */
export function useRetryEmail() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (emailId: string) => retryEmail(emailId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUEUE_KEY] });
      queryClient.invalidateQueries({ queryKey: [STATS_KEY] });
      toast.success("Email marcado para reintento");
    },
    onError: (error: Error) => {
      console.error("Error retrying email:", error);
      toast.error(`Error al reintentar: ${error.message}`);
    },
  });
}

/**
 * Hook for bulk retrying failed emails
 */
export function useBulkRetryFailed() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (queueType?: string) => bulkRetryFailed(queueType),
    onSuccess: (count) => {
      queryClient.invalidateQueries({ queryKey: [QUEUE_KEY] });
      queryClient.invalidateQueries({ queryKey: [STATS_KEY] });
      toast.success(`${count} emails marcados para reintento`);
    },
    onError: (error: Error) => {
      console.error("Error bulk retrying:", error);
      toast.error(`Error: ${error.message}`);
    },
  });
}

/**
 * Hook for clearing old emails
 */
export function useClearOldEmails() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (daysOld?: number) => clearOldEmails(daysOld),
    onSuccess: (count) => {
      queryClient.invalidateQueries({ queryKey: [QUEUE_KEY] });
      queryClient.invalidateQueries({ queryKey: [STATS_KEY] });
      toast.success(`${count} emails eliminados`);
    },
    onError: (error: Error) => {
      console.error("Error clearing emails:", error);
      toast.error(`Error: ${error.message}`);
    },
  });
}

/**
 * Hook for manually processing the queue
 */
export function useProcessQueue() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (options?: {
      batchSize?: number;
      processRetries?: boolean;
      queueType?: string;
    }) => processQueue(options),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: [QUEUE_KEY] });
      queryClient.invalidateQueries({ queryKey: [STATS_KEY] });
      
      if (result.success) {
        toast.success(
          `Procesados: ${result.processed} | Enviados: ${result.sent} | Fallidos: ${result.failed}`
        );
      } else {
        toast.error(`Error procesando cola: ${result.error}`);
      }
    },
    onError: (error: Error) => {
      console.error("Error processing queue:", error);
      toast.error(`Error: ${error.message}`);
    },
  });
}

// Re-export types
export type { EmailQueueItem, EnqueueEmailParams, QueueStats, QueueFilters };
