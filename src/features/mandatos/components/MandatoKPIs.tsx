import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import type { Mandato } from "@/types";
import { Calendar, DollarSign, Building2, TrendingUp, Percent, Clock, ListTodo, AlertTriangle } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { cn } from "@/lib/utils";

interface MandatoKPIsProps {
  mandato: Mandato;
  checklistProgress?: number;
  overdueTasks?: number;
}

export function MandatoKPIs({ mandato, checklistProgress = 0, overdueTasks = 0 }: MandatoKPIsProps) {
  const getBadgeVariant = (estado: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      prospecto: "secondary",
      activo: "default",
      en_negociacion: "outline",
      cerrado: "default",
      cancelado: "destructive",
    };
    return variants[estado] || "default";
  };

  const getPipelineStageLabel = (stage?: string) => {
    const labels: Record<string, string> = {
      prospeccion: "Prospección",
      loi: "LOI",
      due_diligence: "Due Diligence",
      negociacion: "Negociación",
      cierre: "Cierre",
    };
    return labels[stage || "prospeccion"] || stage || "Prospección";
  };

  const getPipelineStageColor = (stage?: string) => {
    const colors: Record<string, string> = {
      prospeccion: "bg-blue-500",
      loi: "bg-purple-500",
      due_diligence: "bg-amber-500",
      negociacion: "bg-orange-500",
      cierre: "bg-green-500",
    };
    return colors[stage || "prospeccion"] || "bg-muted";
  };

  // Cast para acceder a campos extendidos
  const extendedMandato = mandato as any;
  const probability = extendedMandato.probability || 50;
  const weightedValue = extendedMandato.weighted_value || Math.round((mandato.valor || 0) * probability / 100);
  const daysInStage = extendedMandato.days_in_stage || 0;
  const pipelineStage = extendedMandato.pipeline_stage || "prospeccion";
  const expectedCloseDate = extendedMandato.expected_close_date;

  const isStagnant = daysInStage > 30;

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
      {/* Estado y Pipeline */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Estado</CardTitle>
          <Badge variant={getBadgeVariant(mandato.estado)}>
            {mandato.estado}
          </Badge>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2">
            <div className={cn("w-2 h-2 rounded-full", getPipelineStageColor(pipelineStage))} />
            <span className="text-sm">{getPipelineStageLabel(pipelineStage)}</span>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            {mandato.tipo === "compra" ? "Compra" : "Venta"}
          </p>
        </CardContent>
      </Card>

      {/* Valor */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Valor</CardTitle>
          <DollarSign className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {mandato.valor ? `€${(mandato.valor / 1000000).toFixed(1)}M` : "N/A"}
          </div>
          <p className="text-xs text-muted-foreground">
            Ponderado: €{(weightedValue / 1000000).toFixed(1)}M
          </p>
        </CardContent>
      </Card>

      {/* Probabilidad */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Probabilidad</CardTitle>
          <Percent className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{probability}%</div>
          <Progress value={probability} className="h-2 mt-2" />
        </CardContent>
      </Card>

      {/* Días en Stage */}
      <Card className={cn(isStagnant && "border-destructive")}>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Días en Stage</CardTitle>
          {isStagnant ? (
            <AlertTriangle className="h-4 w-4 text-destructive" />
          ) : (
            <Clock className="h-4 w-4 text-muted-foreground" />
          )}
        </CardHeader>
        <CardContent>
          <div className={cn("text-2xl font-bold", isStagnant && "text-destructive")}>
            {daysInStage}
          </div>
          <p className="text-xs text-muted-foreground">
            {isStagnant ? "⚠️ Deal estancado" : "días"}
          </p>
        </CardContent>
      </Card>

      {/* Progreso Checklist */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Checklist</CardTitle>
          <ListTodo className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{checklistProgress}%</div>
          <Progress value={checklistProgress} className="h-2 mt-2" />
          {overdueTasks > 0 && (
            <p className="text-xs text-destructive mt-1">
              {overdueTasks} tarea{overdueTasks > 1 ? "s" : ""} vencida{overdueTasks > 1 ? "s" : ""}
            </p>
          )}
        </CardContent>
      </Card>

      {/* Fecha Esperada Cierre */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Cierre Esperado</CardTitle>
          <Calendar className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <p className="text-sm font-medium">
            {expectedCloseDate
              ? format(new Date(expectedCloseDate), "dd MMM yyyy", { locale: es })
              : mandato.fecha_cierre 
                ? format(new Date(mandato.fecha_cierre), "dd MMM yyyy", { locale: es })
                : "Sin definir"}
          </p>
          {mandato.empresa_principal?.nombre && (
            <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
              <Building2 className="h-3 w-3" />
              {mandato.empresa_principal.nombre}
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
