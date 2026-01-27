import { useNavigate } from "react-router-dom";
import { ClipboardList, ArrowRight } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface DailyPlanBlockerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  targetDate: string;
  reason?: string;
}

export function DailyPlanBlocker({
  open,
  onOpenChange,
  targetDate,
  reason,
}: DailyPlanBlockerProps) {
  const navigate = useNavigate();
  
  const handleCreatePlan = () => {
    onOpenChange(false);
    navigate('/plan-diario');
  };
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ClipboardList className="h-5 w-5 text-primary" />
            Plan diario requerido
          </DialogTitle>
          <DialogDescription className="pt-2">
            {reason || `Para registrar horas del ${targetDate}, primero debes crear y enviar tu plan diario.`}
          </DialogDescription>
        </DialogHeader>
        
        <div className="bg-muted/50 rounded-lg p-4 my-4">
          <p className="text-sm text-muted-foreground">
            El plan diario te ayuda a organizar tu trabajo y permite a los administradores 
            asignar tareas adicionales si es necesario.
          </p>
        </div>
        
        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleCreatePlan}>
            Crear Plan
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
