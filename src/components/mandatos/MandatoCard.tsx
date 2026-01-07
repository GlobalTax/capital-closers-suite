import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Building2, Calendar, TrendingUp, GripVertical, Clock, AlertTriangle, Euro, Search, FileText, Calculator, Users, Briefcase } from "lucide-react";
import { Mandato } from "@/types";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { MANDATO_CATEGORIA_LABELS, PIPELINE_STAGE_LABELS_SERVICIO } from "@/lib/constants";

interface MandatoCardProps {
  mandato: Mandato;
  checklistProgress?: number;
  hasOverdueTasks?: boolean;
}

const categoriaIcons: Record<string, React.ReactNode> = {
  operacion_ma: <Briefcase className="w-3 h-3" />,
  due_diligence: <Search className="w-3 h-3" />,
  spa_legal: <FileText className="w-3 h-3" />,
  valoracion: <Calculator className="w-3 h-3" />,
  asesoria: <Users className="w-3 h-3" />,
};

export function MandatoCard({ mandato, checklistProgress = 0, hasOverdueTasks = false }: MandatoCardProps) {
  const navigate = useNavigate();
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: mandato.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  // Cast para acceder a campos extendidos
  const extendedMandato = mandato as any;
  const probability = extendedMandato.probability || 50;
  const daysInStage = extendedMandato.days_in_stage || 0;
  const isStagnant = daysInStage > 30;
  const categoria = mandato.categoria || "operacion_ma";
  const isServicio = categoria !== "operacion_ma";
  
  // Calcular días sin actividad
  const lastActivity = extendedMandato.last_activity_at || extendedMandato.created_at;
  const daysSinceActivity = lastActivity 
    ? Math.floor((Date.now() - new Date(lastActivity).getTime()) / (1000 * 60 * 60 * 24))
    : null;
  const isInactive = daysSinceActivity !== null && daysSinceActivity > 14;

  const getProbabilityColor = (prob: number) => {
    if (prob >= 70) return "bg-green-500";
    if (prob >= 40) return "bg-amber-500";
    return "bg-red-500";
  };

  const getCategoriaColor = (cat: string) => {
    switch (cat) {
      case "due_diligence": return "bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300";
      case "spa_legal": return "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300";
      case "valoracion": return "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300";
      case "asesoria": return "bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300";
      default: return "";
    }
  };

  return (
    <Card
      ref={setNodeRef}
      style={style}
      className={cn(
        "p-3 cursor-pointer hover:shadow-md transition-all",
        isDragging && "opacity-50 shadow-lg ring-2 ring-primary",
        isStagnant && "border-l-4 border-l-destructive",
        hasOverdueTasks && "ring-1 ring-destructive/50"
      )}
      onClick={() => navigate(`/mandatos/${mandato.id}`)}
    >
      <div className="space-y-2">
        {/* Header con drag handle */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              {/* Badge de categoría/tipo */}
              {isServicio ? (
                <Badge className={cn("text-xs gap-1", getCategoriaColor(categoria))}>
                  {categoriaIcons[categoria]}
                  {MANDATO_CATEGORIA_LABELS[categoria]?.label || categoria}
                </Badge>
              ) : (
                <Badge variant={mandato.tipo === "venta" ? "default" : "secondary"} className="text-xs">
                  {mandato.tipo === "venta" ? "Venta" : "Compra"}
                </Badge>
              )}
              
              {/* Probability badge (solo para M&A) */}
              {!isServicio && (
                <Badge variant="outline" className="text-xs gap-1">
                  <div className={cn("w-1.5 h-1.5 rounded-full", getProbabilityColor(probability))} />
                  {probability}%
                </Badge>
              )}
              
              {/* Inactivity badge */}
              {isInactive && (
                <Badge variant="destructive" className="text-xs gap-1">
                  <AlertTriangle className="w-3 h-3" />
                  {daysSinceActivity}d
                </Badge>
              )}
              <div
                {...attributes}
                {...listeners}
                className="cursor-grab active:cursor-grabbing ml-auto"
                onClick={(e) => e.stopPropagation()}
              >
                <GripVertical className="w-4 h-4 text-muted-foreground" />
              </div>
            </div>
            <h4 className="font-medium text-sm truncate">
              {mandato.empresa_principal?.nombre || mandato.cliente_externo || "Sin cliente"}
            </h4>
          </div>
        </div>

        {/* Descripción */}
        {mandato.descripcion && (
          <p className="text-xs text-muted-foreground line-clamp-2">
            {mandato.descripcion}
          </p>
        )}

        {/* Progress bar del checklist */}
        {checklistProgress > 0 && (
          <div className="space-y-1">
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Progreso</span>
              <span>{checklistProgress}%</span>
            </div>
            <Progress value={checklistProgress} className="h-1.5" />
          </div>
        )}

        {/* Metadata */}
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <div className="flex items-center gap-3">
            {/* Valor para M&A o Honorarios para servicios */}
            {isServicio ? (
              mandato.honorarios_propuestos && (
                <div className="flex items-center gap-1">
                  <Euro className="w-3 h-3" />
                  <span>{(mandato.honorarios_propuestos / 1000).toFixed(0)}k€</span>
                </div>
              )
            ) : (
              mandato.valor && (
                <div className="flex items-center gap-1">
                  <TrendingUp className="w-3 h-3" />
                  <span>{(mandato.valor / 1000000).toFixed(1)}M€</span>
                </div>
              )
            )}
            
            <div className="flex items-center gap-1">
              <Building2 className="w-3 h-3" />
              <span>{mandato.empresas?.length || 0}</span>
            </div>
          </div>

          {/* Indicadores de alerta */}
          <div className="flex items-center gap-2">
            {hasOverdueTasks && (
              <AlertTriangle className="w-3 h-3 text-destructive" />
            )}
            
            {/* Días en stage */}
            <div className={cn(
              "flex items-center gap-1",
              isStagnant && "text-destructive font-medium"
            )}>
              <Clock className="w-3 h-3" />
              <span>{daysInStage}d</span>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}