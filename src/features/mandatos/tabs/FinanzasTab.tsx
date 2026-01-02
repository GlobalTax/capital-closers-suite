import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CashFlowChart } from "@/components/mandatos/CashFlowChart";
import { TransactionTable } from "@/components/mandatos/TransactionTable";
import { TransactionForm } from "@/components/mandatos/TransactionForm";
import { useMandatoTransactions } from "@/hooks/useMandatoTransactions";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { FinancialStatementsCard } from "@/components/financials/FinancialStatementsCard";
import { supabase } from "@/integrations/supabase/client";

interface FinanzasTabProps {
  mandatoId: string;
}

interface EmpresaInfo {
  id: string;
  nombre: string;
}

export function FinanzasTab({ mandatoId }: FinanzasTabProps) {
  const { transactions, isLoading, createTransaction, deleteTransaction } = useMandatoTransactions(mandatoId);
  const [showForm, setShowForm] = useState(false);
  const [empresaPrincipal, setEmpresaPrincipal] = useState<EmpresaInfo | null>(null);

  // Obtener empresa principal asociada al mandato
  useEffect(() => {
    async function fetchEmpresaPrincipal() {
      const { data } = await supabase
        .from('mandato_empresas')
        .select('empresa_id, empresas(id, nombre)')
        .eq('mandato_id', mandatoId)
        .limit(1)
        .single();

      if (data?.empresas) {
        const empresa = data.empresas as unknown as EmpresaInfo;
        setEmpresaPrincipal({ id: empresa.id, nombre: empresa.nombre });
      }
    }
    fetchEmpresaPrincipal();
  }, [mandatoId]);

  const handleSubmit = async (data: any) => {
    await createTransaction(data);
    setShowForm(false);
  };

  return (
    <div className="space-y-6">
      {/* Estados Financieros de la Empresa */}
      {empresaPrincipal && (
        <FinancialStatementsCard 
          empresaId={empresaPrincipal.id} 
          empresaNombre={empresaPrincipal.nombre} 
        />
      )}

      {/* Transacciones del Mandato */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Flujo de Caja del Mandato</CardTitle>
          <Button onClick={() => setShowForm(!showForm)} size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Nueva Transacción
          </Button>
        </CardHeader>
        <CardContent>
          {showForm && (
            <div className="mb-6">
              <TransactionForm
                mandatoId={mandatoId}
                onSubmit={handleSubmit}
                onCancel={() => setShowForm(false)}
              />
            </div>
          )}
          <CashFlowChart transactions={transactions} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Transacciones</CardTitle>
        </CardHeader>
        <CardContent>
          <TransactionTable
            transactions={transactions}
            loading={isLoading}
            onDelete={deleteTransaction}
          />
        </CardContent>
      </Card>
    </div>
  );
}
