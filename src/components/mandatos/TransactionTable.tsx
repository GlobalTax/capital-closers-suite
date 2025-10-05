import { format } from "date-fns";
import { es } from "date-fns/locale";
import { MoreHorizontal, Eye, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { MandatoTransaction, TransactionType, TransactionStatus } from "@/types";
import { cn } from "@/lib/utils";

interface TransactionTableProps {
  transactions: MandatoTransaction[];
  onDelete?: (id: string) => void;
  loading?: boolean;
}

const TRANSACTION_TYPE_LABELS: Record<TransactionType, { label: string; color: string }> = {
  ingreso: { label: "Ingreso", color: "text-green-600 bg-green-50 dark:bg-green-950" },
  gasto: { label: "Gasto", color: "text-red-600 bg-red-50 dark:bg-red-950" },
  honorario: { label: "Honorario", color: "text-blue-600 bg-blue-50 dark:bg-blue-950" },
  due_diligence: { label: "Due Diligence", color: "text-purple-600 bg-purple-50 dark:bg-purple-950" },
  ajuste_valoracion: { label: "Ajuste Valoración", color: "text-orange-600 bg-orange-50 dark:bg-orange-950" },
  comision: { label: "Comisión", color: "text-cyan-600 bg-cyan-50 dark:bg-cyan-950" },
  otro: { label: "Otro", color: "text-gray-600 bg-gray-50 dark:bg-gray-950" },
};

const STATUS_VARIANTS: Record<TransactionStatus, "default" | "secondary" | "destructive"> = {
  completada: "default",
  pendiente: "secondary",
  cancelada: "destructive",
};

export function TransactionTable({ transactions, onDelete, loading }: TransactionTableProps) {
  const formatCurrency = (amount: number, currency: string = "€") => {
    return `${amount.toLocaleString("es-ES", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })} ${currency}`;
  };

  if (loading) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        Cargando transacciones...
      </div>
    );
  }

  if (transactions.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No hay transacciones registradas
      </div>
    );
  }

  return (
    <div className="rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Fecha</TableHead>
            <TableHead>Tipo</TableHead>
            <TableHead>Descripción</TableHead>
            <TableHead>Categoría</TableHead>
            <TableHead className="text-right">Importe</TableHead>
            <TableHead>Estado</TableHead>
            <TableHead className="w-[50px]"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {transactions.map((transaction) => {
            const typeConfig = TRANSACTION_TYPE_LABELS[transaction.transaction_type];
            return (
              <TableRow key={transaction.id}>
                <TableCell className="font-medium">
                  {format(new Date(transaction.transaction_date), "dd MMM yyyy", {
                    locale: es,
                  })}
                </TableCell>
                <TableCell>
                  <Badge className={cn("font-medium", typeConfig.color)} variant="outline">
                    {typeConfig.label}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div>
                    <p className="font-medium">{transaction.description}</p>
                    {transaction.reference_number && (
                      <p className="text-xs text-muted-foreground">
                        Ref: {transaction.reference_number}
                      </p>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  {transaction.category ? (
                    <span className="text-sm text-muted-foreground">
                      {transaction.category}
                    </span>
                  ) : (
                    <span className="text-sm text-muted-foreground italic">-</span>
                  )}
                </TableCell>
                <TableCell className="text-right font-semibold">
                  <span
                    className={cn(
                      transaction.transaction_type === "ingreso"
                        ? "text-green-600"
                        : transaction.transaction_type === "gasto"
                        ? "text-red-600"
                        : ""
                    )}
                  >
                    {transaction.transaction_type === "ingreso" ? "+" : "-"}
                    {formatCurrency(transaction.amount, transaction.currency)}
                  </span>
                </TableCell>
                <TableCell>
                  <Badge variant={STATUS_VARIANTS[transaction.status]}>
                    {transaction.status === "completada"
                      ? "Completada"
                      : transaction.status === "pendiente"
                      ? "Pendiente"
                      : "Cancelada"}
                  </Badge>
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreHorizontal className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="bg-background">
                      <DropdownMenuItem>
                        <Eye className="w-4 h-4 mr-2" />
                        Ver Detalles
                      </DropdownMenuItem>
                      {onDelete && (
                        <DropdownMenuItem
                          className="text-destructive"
                          onClick={() => onDelete(transaction.id)}
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Eliminar
                        </DropdownMenuItem>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
