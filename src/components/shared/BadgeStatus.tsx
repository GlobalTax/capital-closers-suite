import { Badge } from "@/components/ui/badge";
import type { MandatoEstado, NivelInteres, TareaEstado, TareaPrioridad, TargetEstado } from "@/types";

type StatusType = MandatoEstado | NivelInteres | TareaEstado | TareaPrioridad | TargetEstado;

interface BadgeStatusProps {
  status: StatusType;
  type?: "mandato" | "interes" | "tarea" | "prioridad" | "target";
}

export function BadgeStatus({ status, type = "mandato" }: BadgeStatusProps) {
  const getVariant = (): "default" | "secondary" | "outline" | "destructive" => {
    if (type === "mandato") {
      const mandatoVariants: Record<MandatoEstado, "default" | "secondary" | "outline" | "destructive"> = {
        "en_progreso": "default",
        "negociacion": "secondary",
        "due_diligence": "outline",
        "cerrado": "default",
        "cancelado": "destructive",
      };
      return mandatoVariants[status as MandatoEstado] || "default";
    }

    if (type === "interes") {
      const interesVariants: Record<NivelInteres, "default" | "secondary" | "outline"> = {
        Alto: "default",
        Medio: "secondary",
        Bajo: "outline",
      };
      return interesVariants[status as NivelInteres] || "default";
    }

    if (type === "tarea") {
      const tareaVariants: Record<TareaEstado, "default" | "secondary" | "outline"> = {
        "completada": "default",
        "en_progreso": "secondary",
        "pendiente": "outline",
      };
      return tareaVariants[status as TareaEstado] || "outline";
    }

    if (type === "prioridad") {
      const prioridadVariants: Record<TareaPrioridad, "default" | "secondary" | "destructive"> = {
        "alta": "destructive",
        "media": "secondary",
        "baja": "default",
      };
      return prioridadVariants[status as TareaPrioridad] || "default";
    }

    if (type === "target") {
      const targetVariants: Record<TargetEstado, "default" | "secondary" | "outline" | "destructive"> = {
        "pendiente": "outline",
        "contactada": "secondary",
        "interesada": "default",
        "rechazada": "destructive",
        "en_dd": "default",
        "oferta": "default",
        "cerrada": "default",
      };
      return targetVariants[status as TargetEstado] || "outline";
    }

    return "default";
  };

  const getDisplayText = () => {
    if (type === "mandato") {
      const mandatoTexts: Record<MandatoEstado, string> = {
        "en_progreso": "En Progreso",
        "negociacion": "Negociación",
        "due_diligence": "Due Diligence",
        "cerrado": "Cerrado",
        "cancelado": "Cancelado",
      };
      return mandatoTexts[status as MandatoEstado] || status;
    }

    if (type === "tarea") {
      const tareaTexts: Record<TareaEstado, string> = {
        "completada": "Completada",
        "en_progreso": "En Progreso",
        "pendiente": "Pendiente",
      };
      return tareaTexts[status as TareaEstado] || status;
    }

    if (type === "prioridad") {
      const prioridadTexts: Record<TareaPrioridad, string> = {
        "alta": "Alta",
        "media": "Media",
        "baja": "Baja",
      };
      return prioridadTexts[status as TareaPrioridad] || status;
    }

    if (type === "target") {
      const targetTexts: Record<TargetEstado, string> = {
        "pendiente": "Pendiente",
        "contactada": "Contactada",
        "interesada": "Interesada",
        "rechazada": "Rechazada",
        "en_dd": "Due Diligence",
        "oferta": "Oferta",
        "cerrada": "Cerrada",
      };
      return targetTexts[status as TargetEstado] || status;
    }

    return status;
  };

  return <Badge variant={getVariant()}>{getDisplayText()}</Badge>;
}
