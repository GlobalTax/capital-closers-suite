/**
 * Loading phases indicator for enrichment
 */

import { cn } from "@/lib/utils";
import { Check, Search, Globe, Sparkles, Target, GitMerge, Loader2 } from "lucide-react";
import type { LoadingPhase } from "@/types/enrichment";

const PHASES: {
  key: LoadingPhase;
  label: string;
  icon: React.ElementType;
}[] = [
  { key: 'searching', label: 'Buscando fuentes...', icon: Search },
  { key: 'scraping', label: 'Extrayendo contenido...', icon: Globe },
  { key: 'extracting', label: 'Analizando datos...', icon: Sparkles },
  { key: 'classifying', label: 'Clasificando sector...', icon: Target },
  { key: 'checking_duplicates', label: 'Verificando duplicados...', icon: GitMerge },
];

interface EnrichmentLoadingPhasesProps {
  currentPhase: LoadingPhase;
}

export function EnrichmentLoadingPhases({ currentPhase }: EnrichmentLoadingPhasesProps) {
  const currentIndex = PHASES.findIndex(p => p.key === currentPhase);

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col items-center gap-4">
        <div className="relative">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
            <Loader2 className="w-8 h-8 text-primary animate-spin" />
          </div>
        </div>
        <div className="text-center">
          <h3 className="font-medium text-lg">Enriqueciendo datos</h3>
          <p className="text-sm text-muted-foreground">
            Consultando fuentes verificadas...
          </p>
        </div>
      </div>

      <div className="space-y-3">
        {PHASES.map((phase, index) => {
          const Icon = phase.icon;
          const isCompleted = index < currentIndex;
          const isCurrent = index === currentIndex;
          const isPending = index > currentIndex;

          return (
            <div
              key={phase.key}
              className={cn(
                "flex items-center gap-3 p-3 rounded-lg transition-all",
                isCompleted && "bg-green-50 dark:bg-green-950/20",
                isCurrent && "bg-primary/10 ring-1 ring-primary/20",
                isPending && "opacity-50"
              )}
            >
              <div
                className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center shrink-0",
                  isCompleted && "bg-green-500 text-white",
                  isCurrent && "bg-primary text-primary-foreground",
                  isPending && "bg-muted text-muted-foreground"
                )}
              >
                {isCompleted ? (
                  <Check className="w-4 h-4" />
                ) : isCurrent ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Icon className="w-4 h-4" />
                )}
              </div>
              <span
                className={cn(
                  "text-sm font-medium",
                  isCompleted && "text-green-700 dark:text-green-400",
                  isCurrent && "text-primary",
                  isPending && "text-muted-foreground"
                )}
              >
                {phase.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
