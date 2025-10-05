import { useMemo } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { format, parseISO } from "date-fns";
import { es } from "date-fns/locale";
import type { MandatoTransaction } from "@/types";

interface CashFlowChartProps {
  transactions: MandatoTransaction[];
}

interface ChartData {
  month: string;
  ingresos: number;
  gastos: number;
  balance: number;
}

export function CashFlowChart({ transactions }: CashFlowChartProps) {
  const chartData = useMemo(() => {
    const monthlyData: Record<string, ChartData> = {};

    transactions.forEach((transaction) => {
      const monthKey = format(parseISO(transaction.transaction_date), "MMM yyyy", {
        locale: es,
      });

      if (!monthlyData[monthKey]) {
        monthlyData[monthKey] = {
          month: monthKey,
          ingresos: 0,
          gastos: 0,
          balance: 0,
        };
      }

      if (transaction.transaction_type === "ingreso") {
        monthlyData[monthKey].ingresos += transaction.amount;
      } else {
        monthlyData[monthKey].gastos += transaction.amount;
      }
    });

    // Calcular balance acumulado
    const sortedData = Object.values(monthlyData).sort((a, b) => {
      return new Date(a.month).getTime() - new Date(b.month).getTime();
    });

    let accumulatedBalance = 0;
    sortedData.forEach((data) => {
      accumulatedBalance += data.ingresos - data.gastos;
      data.balance = accumulatedBalance;
    });

    return sortedData;
  }, [transactions]);

  if (chartData.length === 0) {
    return (
      <div className="flex items-center justify-center h-[300px] text-muted-foreground">
        No hay datos suficientes para mostrar el gráfico
      </div>
    );
  }

  const formatCurrency = (value: number) => {
    return `${value.toLocaleString("es-ES", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    })}€`;
  };

  return (
    <div className="w-full h-[300px] animate-fade-in">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
          <XAxis
            dataKey="month"
            className="text-sm text-muted-foreground"
            tick={{ fontSize: 12 }}
          />
          <YAxis
            className="text-sm text-muted-foreground"
            tick={{ fontSize: 12 }}
            tickFormatter={formatCurrency}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "hsl(var(--background))",
              border: "1px solid hsl(var(--border))",
              borderRadius: "var(--radius)",
            }}
            formatter={(value: number) => formatCurrency(value)}
            labelStyle={{ color: "hsl(var(--foreground))" }}
          />
          <Legend
            wrapperStyle={{
              paddingTop: "20px",
            }}
          />
          <Line
            type="monotone"
            dataKey="ingresos"
            name="Ingresos"
            stroke="hsl(var(--chart-1))"
            strokeWidth={2}
            dot={{ fill: "hsl(var(--chart-1))", r: 4 }}
            activeDot={{ r: 6 }}
          />
          <Line
            type="monotone"
            dataKey="gastos"
            name="Gastos"
            stroke="hsl(var(--chart-2))"
            strokeWidth={2}
            dot={{ fill: "hsl(var(--chart-2))", r: 4 }}
            activeDot={{ r: 6 }}
          />
          <Line
            type="monotone"
            dataKey="balance"
            name="Balance Neto"
            stroke="hsl(var(--chart-3))"
            strokeWidth={3}
            dot={{ fill: "hsl(var(--chart-3))", r: 5 }}
            activeDot={{ r: 7 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
