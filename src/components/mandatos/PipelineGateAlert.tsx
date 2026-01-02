// ============================================
// COMPONENT: PipelineGateAlert - Alerta de requisitos pendientes
// ============================================

import { AlertCircle, X, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

interface FailedRequirement {
  id: string;
  label: string;
  resolveLink?: string;
  resolveLabel?: string;
}

interface PipelineGateAlertProps {
  failedRequirements: FailedRequirement[];
  onResolve: (link: string) => void;
  onDismiss?: () => void;
}

export function PipelineGateAlert({ 
  failedRequirements, 
  onResolve,
  onDismiss 
}: PipelineGateAlertProps) {
  if (!failedRequirements.length) return null;

  return (
    <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 dark:border-amber-800 dark:bg-amber-950/50 mt-2">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
          <span className="text-sm font-medium text-amber-800 dark:text-amber-200">
            Requisitos pendientes
          </span>
        </div>
        {onDismiss && (
          <Button 
            variant="ghost" 
            size="sm" 
            className="h-6 w-6 p-0 text-amber-600 hover:text-amber-800"
            onClick={onDismiss}
          >
            <X className="h-3 w-3" />
          </Button>
        )}
      </div>
      
      <ul className="space-y-1.5">
        {failedRequirements.map(req => (
          <li 
            key={req.id} 
            className="flex items-center justify-between text-sm gap-2"
          >
            <span className="text-muted-foreground flex items-center gap-1.5 flex-1">
              <X className="h-3 w-3 text-red-500 flex-shrink-0" />
              <span className="truncate">{req.label}</span>
            </span>
            {req.resolveLink && (
              <Button 
                variant="link" 
                size="sm" 
                className="h-auto p-0 text-xs text-amber-700 dark:text-amber-300 hover:text-amber-900 flex-shrink-0"
                onClick={() => onResolve(req.resolveLink!)}
              >
                {req.resolveLabel || 'Resolver'}
                <ArrowRight className="h-3 w-3 ml-1" />
              </Button>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
