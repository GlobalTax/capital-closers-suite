import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { MandatoTransaction } from "@/types";
import { toast } from "sonner";

export interface TransactionFilters {
  dateRange?: "7d" | "30d" | "all";
  type?: string;
  status?: string;
}

export function useMandatoTransactions(mandatoId: string, filters?: TransactionFilters) {
  const queryClient = useQueryClient();

  // Fetch transactions
  const { data: transactions = [], isLoading } = useQuery({
    queryKey: ["mandato-transactions", mandatoId, filters],
    queryFn: async () => {
      let query = supabase
        .from("mandato_transactions")
        .select("*")
        .eq("mandato_id", mandatoId)
        .order("transaction_date", { ascending: false });

      // Apply filters
      if (filters?.dateRange && filters.dateRange !== "all") {
        const daysAgo = filters.dateRange === "7d" ? 7 : 30;
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - daysAgo);
        query = query.gte("transaction_date", startDate.toISOString().split("T")[0]);
      }

      if (filters?.type) {
        query = query.eq("transaction_type", filters.type as any);
      }

      if (filters?.status) {
        query = query.eq("status", filters.status as any);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as MandatoTransaction[];
    },
  });

  // Calculate financial totals
  const totals = {
    totalIngresos: transactions
      .filter((t) => t.transaction_type === "ingreso" && t.status === "completada")
      .reduce((sum, t) => sum + t.amount, 0),
    totalGastos: transactions
      .filter((t) => t.transaction_type !== "ingreso" && t.status === "completada")
      .reduce((sum, t) => sum + t.amount, 0),
    get balanceNeto() {
      return this.totalIngresos - this.totalGastos;
    },
    transaccionesCount: transactions.length,
  };

  // Create transaction
  const createTransaction = useMutation({
    mutationFn: async (data: Omit<MandatoTransaction, "id" | "created_at" | "updated_at">) => {
      const { data: result, error } = await supabase
        .from("mandato_transactions")
        .insert(data)
        .select()
        .single();

      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["mandato-transactions", mandatoId] });
      toast.success("Transacción creada correctamente");
    },
    onError: (error) => {
      console.error("Error creating transaction:", error);
      toast.error("Error al crear la transacción");
    },
  });

  // Delete transaction
  const deleteTransaction = useMutation({
    mutationFn: async (transactionId: string) => {
      const { error } = await supabase
        .from("mandato_transactions")
        .delete()
        .eq("id", transactionId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["mandato-transactions", mandatoId] });
      toast.success("Transacción eliminada");
    },
    onError: (error) => {
      console.error("Error deleting transaction:", error);
      toast.error("Error al eliminar la transacción");
    },
  });

  return {
    transactions,
    totals,
    isLoading,
    createTransaction: createTransaction.mutateAsync,
    deleteTransaction: deleteTransaction.mutateAsync,
    isCreating: createTransaction.isPending,
    isDeleting: deleteTransaction.isPending,
  };
}
