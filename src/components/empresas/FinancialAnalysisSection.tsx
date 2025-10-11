import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { TrendingUp, TrendingDown } from "lucide-react";

interface FinancialAnalysisSectionProps {
  revenue?: number;
  ebitda?: number;
  deuda?: number;
  margenEbitda?: number;
}

export function FinancialAnalysisSection({
  revenue,
  ebitda,
  deuda,
  margenEbitda,
}: FinancialAnalysisSectionProps) {
  const ratios = [
    {
      label: "Margen EBITDA",
      value: margenEbitda ? `${margenEbitda.toFixed(1)}%` : "N/A",
      progress: margenEbitda || 0,
      color: margenEbitda && margenEbitda > 15 ? "bg-green-500" : margenEbitda && margenEbitda > 10 ? "bg-yellow-500" : "bg-red-500",
      trend: margenEbitda && margenEbitda > 15 ? "up" : "down",
    },
    {
      label: "Deuda/EBITDA",
      value: deuda && ebitda ? `${(deuda / ebitda).toFixed(1)}x` : "N/A",
      progress: deuda && ebitda ? Math.min((deuda / ebitda) * 20, 100) : 0,
      color: deuda && ebitda && (deuda / ebitda) < 3 ? "bg-green-500" : deuda && ebitda && (deuda / ebitda) < 5 ? "bg-yellow-500" : "bg-red-500",
      trend: deuda && ebitda && (deuda / ebitda) < 3 ? "up" : "down",
    },
  ];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Ratios Financieros</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {ratios.map((ratio) => (
            <div key={ratio.label} className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-gray-700">{ratio.label}</span>
                  {ratio.trend === "up" ? (
                    <TrendingUp className="h-4 w-4 text-green-600" />
                  ) : (
                    <TrendingDown className="h-4 w-4 text-red-600" />
                  )}
                </div>
                <span className="text-sm font-semibold text-gray-900">{ratio.value}</span>
              </div>
              <Progress value={ratio.progress} className="h-2" />
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
