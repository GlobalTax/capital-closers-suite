import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CashFlowChart } from "@/components/mandatos/CashFlowChart";
import { TransactionTable } from "@/components/mandatos/TransactionTable";
import { TransactionForm } from "@/components/mandatos/TransactionForm";
import { useMandatoTransactions } from "@/hooks/useMandatoTransactions";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

interface FinanzasTabProps {
  mandatoId: string;
}

export function FinanzasTab({ mandatoId }: FinanzasTabProps) {
  const { transactions, isLoading, createTransaction, deleteTransaction } = useMandatoTransactions(mandatoId);
  const [showForm, setShowForm] = useState(false);

  const handleSubmit = async (data: any) => {
    await createTransaction(data);
    setShowForm(false);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Flujo de Caja</CardTitle>
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
