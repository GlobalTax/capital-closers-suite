import { Card } from "@/components/ui/card";
import { TrendingUp, DollarSign, Target, Award } from "lucide-react";
import type { TVDashboardData } from "@/hooks/useTVDashboard";

interface TVMetricsProps {
  data: TVDashboardData;
}

export function TVMetrics({ data }: TVMetricsProps) {
  const totalLeads = 
    data.nuevosLeads.length +
    data.enContacto.length +
    data.calificados.length;

  const totalMandatos = 
    data.mandatosActivos.length +
    data.enNegociacion.length;

  const totalValorPipeline = [
    ...data.nuevosLeads,
    ...data.enContacto,
    ...data.calificados,
    ...data.mandatosActivos,
    ...data.enNegociacion
  ].reduce((sum, item) => sum + (item.valor || 0), 0);

  const totalValorCerrado = data.cerrados.reduce((sum, item) => sum + (item.valor || 0), 0);

  const tasaConversion = totalLeads > 0 
    ? ((data.cerrados.length / (totalLeads + totalMandatos + data.cerrados.length)) * 100).toFixed(1)
    : 0;

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6 animate-fade-in">
      {/* Total Leads Activos */}
      <Card className="p-6 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950/20 dark:to-blue-900/20 border-2">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground mb-1">
              Leads Activos
            </p>
            <p className="text-4xl font-bold text-blue-600 dark:text-blue-400">
              {totalLeads}
            </p>
          </div>
          <div className="w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center">
            <Target className="w-8 h-8 text-white" />
          </div>
        </div>
      </Card>

      {/* Valor Pipeline */}
      <Card className="p-6 bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950/20 dark:to-green-900/20 border-2">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground mb-1">
              Valor en Pipeline
            </p>
            <p className="text-3xl font-bold text-green-600 dark:text-green-400">
              {new Intl.NumberFormat('es-ES', { 
                style: 'currency', 
                currency: 'EUR',
                notation: 'compact',
                maximumFractionDigits: 1
              }).format(totalValorPipeline)}
            </p>
          </div>
          <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center">
            <DollarSign className="w-8 h-8 text-white" />
          </div>
        </div>
      </Card>

      {/* Mandatos en Proceso */}
      <Card className="p-6 bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-950/20 dark:to-orange-900/20 border-2">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground mb-1">
              Mandatos en Proceso
            </p>
            <p className="text-4xl font-bold text-orange-600 dark:text-orange-400">
              {totalMandatos}
            </p>
          </div>
          <div className="w-16 h-16 bg-orange-500 rounded-full flex items-center justify-center">
            <TrendingUp className="w-8 h-8 text-white" />
          </div>
        </div>
      </Card>

      {/* Tasa de Conversión */}
      <Card className="p-6 bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950/20 dark:to-purple-900/20 border-2">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground mb-1">
              Tasa de Conversión
            </p>
            <p className="text-4xl font-bold text-purple-600 dark:text-purple-400">
              {tasaConversion}%
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              {data.cerrados.length} cerrados
            </p>
          </div>
          <div className="w-16 h-16 bg-purple-500 rounded-full flex items-center justify-center">
            <Award className="w-8 h-8 text-white" />
          </div>
        </div>
      </Card>
    </div>
  );
}
