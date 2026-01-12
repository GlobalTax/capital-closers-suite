import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Target, TrendingUp, Users, DollarSign, Save, Loader2 } from "lucide-react";
import type { TargetScoring } from "@/types";
import { cn } from "@/lib/utils";

interface TargetScoringPanelProps {
  scoring?: TargetScoring | null;
  matchScore?: number;
  onSave: (scoring: Partial<TargetScoring>) => void;
  isSaving?: boolean;
}

export function TargetScoringPanel({
  scoring,
  matchScore = 0,
  onSave,
  isSaving = false,
}: TargetScoringPanelProps) {
  const [localScoring, setLocalScoring] = useState({
    fit_estrategico: scoring?.fit_estrategico ?? 50,
    fit_financiero: scoring?.fit_financiero ?? 50,
    fit_cultural: scoring?.fit_cultural ?? 50,
    notas: scoring?.notas ?? "",
  });

  // Sync with external scoring
  useEffect(() => {
    if (scoring) {
      setLocalScoring({
        fit_estrategico: scoring.fit_estrategico ?? 50,
        fit_financiero: scoring.fit_financiero ?? 50,
        fit_cultural: scoring.fit_cultural ?? 50,
        notas: scoring.notas ?? "",
      });
    }
  }, [scoring]);

  const scoreTotal = Math.round(
    (localScoring.fit_estrategico + localScoring.fit_financiero + localScoring.fit_cultural) / 3
  );

  const getScoreColor = (score: number) => {
    if (score >= 70) return "text-green-600";
    if (score >= 40) return "text-amber-600";
    return "text-red-600";
  };

  const getScoreBgColor = (score: number) => {
    if (score >= 70) return "bg-green-500";
    if (score >= 40) return "bg-amber-500";
    return "bg-red-500";
  };

  const handleSave = () => {
    onSave(localScoring);
  };

  const hasChanges =
    localScoring.fit_estrategico !== (scoring?.fit_estrategico ?? 50) ||
    localScoring.fit_financiero !== (scoring?.fit_financiero ?? 50) ||
    localScoring.fit_cultural !== (scoring?.fit_cultural ?? 50) ||
    localScoring.notas !== (scoring?.notas ?? "");

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Target className="h-4 w-4 text-orange-500" />
            Scoring del Target
          </CardTitle>
          <div className="flex items-center gap-2">
            <Badge className={cn("text-xs", getScoreColor(scoreTotal))} variant="outline">
              Total: {scoreTotal}%
            </Badge>
            {matchScore > 0 && (
              <Badge variant="secondary" className="text-xs">
                Match: {matchScore}%
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Sliders */}
        <div className="space-y-4">
          {/* Fit Estratégico */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-3.5 w-3.5 text-muted-foreground" />
                <span>Fit Estratégico</span>
              </div>
              <span className={cn("font-medium", getScoreColor(localScoring.fit_estrategico))}>
                {localScoring.fit_estrategico}%
              </span>
            </div>
            <Slider
              value={[localScoring.fit_estrategico]}
              onValueChange={([value]) =>
                setLocalScoring((s) => ({ ...s, fit_estrategico: value }))
              }
              max={100}
              step={5}
              className="w-full"
            />
          </div>

          {/* Fit Financiero */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <DollarSign className="h-3.5 w-3.5 text-muted-foreground" />
                <span>Fit Financiero</span>
              </div>
              <span className={cn("font-medium", getScoreColor(localScoring.fit_financiero))}>
                {localScoring.fit_financiero}%
              </span>
            </div>
            <Slider
              value={[localScoring.fit_financiero]}
              onValueChange={([value]) =>
                setLocalScoring((s) => ({ ...s, fit_financiero: value }))
              }
              max={100}
              step={5}
              className="w-full"
            />
          </div>

          {/* Fit Cultural */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <Users className="h-3.5 w-3.5 text-muted-foreground" />
                <span>Fit Cultural</span>
              </div>
              <span className={cn("font-medium", getScoreColor(localScoring.fit_cultural))}>
                {localScoring.fit_cultural}%
              </span>
            </div>
            <Slider
              value={[localScoring.fit_cultural]}
              onValueChange={([value]) =>
                setLocalScoring((s) => ({ ...s, fit_cultural: value }))
              }
              max={100}
              step={5}
              className="w-full"
            />
          </div>
        </div>

        {/* Score total visual */}
        <div className="p-3 rounded-lg bg-muted/50">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Score Total</span>
            <span className={cn("text-lg font-medium", getScoreColor(scoreTotal))}>
              {scoreTotal}%
            </span>
          </div>
          <Progress value={scoreTotal} className="h-2" />
        </div>

        {/* Notas */}
        <div className="space-y-2">
          <label className="text-sm text-muted-foreground">Notas de evaluación</label>
          <Textarea
            placeholder="Añade notas sobre la evaluación de este target..."
            value={localScoring.notas}
            onChange={(e) => setLocalScoring((s) => ({ ...s, notas: e.target.value }))}
            rows={2}
          />
        </div>

        {/* Botón guardar */}
        <div className="flex justify-end">
          <Button size="sm" onClick={handleSave} disabled={!hasChanges || isSaving}>
            {isSaving ? (
              <Loader2 className="h-4 w-4 mr-1 animate-spin" />
            ) : (
              <Save className="h-4 w-4 mr-1" />
            )}
            Guardar
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
