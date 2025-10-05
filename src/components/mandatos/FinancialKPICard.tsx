import { TrendingUp, TrendingDown } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

interface FinancialKPICardProps {
  title: string;
  value: number;
  currency?: string;
  trend?: "up" | "down" | "neutral";
  trendValue?: number;
  variant?: "income" | "expense" | "balance" | "count";
  loading?: boolean;
}

export function FinancialKPICard({
  title,
  value,
  currency = "€",
  trend,
  trendValue,
  variant = "balance",
  loading,
}: FinancialKPICardProps) {
  const formatValue = () => {
    if (variant === "count") {
      return value.toString();
    }
    return `${value.toLocaleString("es-ES", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })} ${currency}`;
  };

  const getValueColor = () => {
    switch (variant) {
      case "income":
        return "text-green-600";
      case "expense":
        return "text-red-600";
      case "balance":
        return value >= 0 ? "text-green-600" : "text-red-600";
      default:
        return "text-foreground";
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <Skeleton className="h-4 w-32" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-8 w-40" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="animate-fade-in">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-baseline gap-2">
          <p className={cn("text-2xl font-semibold", getValueColor())}>
            {formatValue()}
          </p>
          {trend && trendValue !== undefined && (
            <span
              className={cn(
                "text-xs flex items-center gap-1",
                trend === "up" ? "text-green-600" : "text-red-600"
              )}
            >
              {trend === "up" ? (
                <TrendingUp className="w-3 h-3" />
              ) : (
                <TrendingDown className="w-3 h-3" />
              )}
              {Math.abs(trendValue)}%
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
