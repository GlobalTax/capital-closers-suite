import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  Rocket, 
  ChevronDown, 
  ChevronUp, 
  RotateCcw,
  ArrowRight,
  Check,
  PartyPopper
} from 'lucide-react';
import { useOnboarding } from '@/hooks/useOnboarding';
import { ONBOARDING_STEPS } from '@/config/onboardingSteps';
import { cn } from '@/lib/utils';

export function OnboardingWidget() {
  const navigate = useNavigate();
  const { state, isLoading, resetOnboarding, isResetting } = useOnboarding();
  const [isExpanded, setIsExpanded] = useState(true);
  const [isHidden, setIsHidden] = useState(false);

  // Don't render if loading or explicitly hidden
  if (isLoading || isHidden) return null;

  // Show completion message if all steps done
  if (state.isComplete) {
    return (
      <Card className="border-green-200 dark:border-green-900 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/30">
        <CardContent className="py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-green-100 dark:bg-green-900/50 flex items-center justify-center">
                <PartyPopper className="h-5 w-5 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="font-medium text-green-800 dark:text-green-200">
                  ¡Onboarding completado!
                </p>
                <p className="text-sm text-green-600 dark:text-green-400">
                  Has completado todos los pasos iniciales
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => setIsHidden(true)}
              >
                Ocultar
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => resetOnboarding()}
                disabled={isResetting}
              >
                <RotateCcw className="h-4 w-4 mr-1" />
                Reiniciar
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-primary/20 bg-gradient-to-r from-primary/5 to-blue-500/5">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
              <Rocket className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-lg">Primeros Pasos</CardTitle>
              <p className="text-sm text-muted-foreground">
                Completa estos pasos para sacar el máximo provecho del CRM
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {state.completedSteps > 0 && (
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => resetOnboarding()}
                disabled={isResetting}
                className="text-muted-foreground"
              >
                <RotateCcw className="h-4 w-4" />
              </Button>
            )}
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
            >
              {isExpanded ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>
        
        {/* Progress bar */}
        <div className="mt-4 space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Progreso</span>
            <Badge variant="secondary">
              {state.progressPercentage}% ({state.completedSteps}/{state.totalSteps})
            </Badge>
          </div>
          <Progress value={state.progressPercentage} className="h-2" />
        </div>
      </CardHeader>
      
      {isExpanded && (
        <CardContent className="pt-0">
          <div className="space-y-3">
            {ONBOARDING_STEPS.map((step, index) => {
              const stepState = state.steps.find(s => s.id === step.id);
              const isCompleted = stepState?.completed || false;
              const Icon = step.icon;
              
              return (
                <div 
                  key={step.id}
                  className={cn(
                    "flex items-center gap-4 p-3 rounded-lg border transition-colors",
                    isCompleted 
                      ? "bg-muted/50 border-muted" 
                      : "bg-background hover:bg-accent/50"
                  )}
                >
                  {/* Checkbox visual */}
                  <div className="shrink-0">
                    <Checkbox 
                      checked={isCompleted} 
                      disabled
                      className={cn(
                        "h-5 w-5",
                        isCompleted && "bg-green-500 border-green-500 data-[state=checked]:bg-green-500"
                      )}
                    />
                  </div>
                  
                  {/* Icon */}
                  <div className={cn(
                    "h-9 w-9 rounded-full flex items-center justify-center shrink-0",
                    isCompleted 
                      ? "bg-green-100 dark:bg-green-900/30" 
                      : "bg-primary/10"
                  )}>
                    <Icon className={cn(
                      "h-4 w-4",
                      isCompleted 
                        ? "text-green-600 dark:text-green-400" 
                        : "text-primary"
                    )} />
                  </div>
                  
                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <p className={cn(
                      "font-medium text-sm",
                      isCompleted && "line-through text-muted-foreground"
                    )}>
                      {step.title}
                    </p>
                    <p className="text-xs text-muted-foreground line-clamp-1">
                      {step.description}
                    </p>
                  </div>
                  
                  {/* Action button */}
                  <div className="shrink-0">
                    {isCompleted ? (
                      <Badge variant="secondary" className="gap-1">
                        <Check className="h-3 w-3" />
                        Completado
                      </Badge>
                    ) : (
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => navigate(step.actionRoute)}
                        className="whitespace-nowrap"
                      >
                        {step.actionLabel}
                        <ArrowRight className="h-3 w-3 ml-1" />
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      )}
    </Card>
  );
}
