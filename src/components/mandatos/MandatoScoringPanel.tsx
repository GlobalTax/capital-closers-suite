import { useState } from "react";
import { Sparkles, ChevronDown, ChevronUp, AlertTriangle, CheckCircle2, Lightbulb, ArrowRight, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ConfidenceBadge } from "@/components/tasks/ConfidenceBadge";
import { ScoringGauge } from "./ScoringGauge";
import { useMandatoScoringHistory, useScoreMandato } from "@/hooks/useMandatoScoring";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";

interface MandatoScoringPanelProps {
  mandatoId: string;
  currentProbability: number | null;
}

export function MandatoScoringPanel({ mandatoId, currentProbability }: MandatoScoringPanelProps) {
  const [analysisOpen, setAnalysisOpen] = useState(false);
  const { data: history = [], isLoading: historyLoading } = useMandatoScoringHistory(mandatoId);
  const scoreMutation = useScoreMandato();

  const latestScoring = history[0];
  const probability = currentProbability ?? 0;

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-500" />
            Scoring IA
          </CardTitle>
          <Button
            size="sm"
            variant="outline"
            onClick={() => scoreMutation.mutate(mandatoId)}
            disabled={scoreMutation.isPending}
            className="h-8 text-xs"
          >
            <Sparkles className="w-3.5 h-3.5 mr-1.5" />
            {scoreMutation.isPending ? "Analizando..." : "Recalcular"}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Gauge + confidence */}
        <div className="flex items-center gap-4">
          <ScoringGauge value={probability} size={120} />
          <div className="flex flex-col gap-2">
            {latestScoring && (
              <>
                <ConfidenceBadge confidence={latestScoring.ai_confidence} size="sm" />
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {formatDistanceToNow(new Date(latestScoring.created_at), { addSuffix: true, locale: es })}
                </span>
              </>
            )}
            {!latestScoring && !historyLoading && (
              <span className="text-xs text-muted-foreground">Sin scoring aún</span>
            )}
          </div>
        </div>

        {/* Analysis section */}
        {latestScoring && (
          <Collapsible open={analysisOpen} onOpenChange={setAnalysisOpen}>
            <CollapsibleTrigger asChild>
              <Button variant="ghost" size="sm" className="w-full justify-between h-8 text-xs">
                Análisis detallado
                {analysisOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="space-y-3 pt-2">
              {/* Positive signals */}
              {latestScoring.positive_signals?.length > 0 && (
                <div>
                  <h4 className="text-xs font-medium text-green-600 dark:text-green-400 mb-1.5 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Señales positivas
                  </h4>
                  <ul className="space-y-1">
                    {latestScoring.positive_signals.map((s: string, i: number) => (
                      <li key={i} className="text-xs text-muted-foreground pl-5">• {s}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Risk factors */}
              {latestScoring.risk_factors?.length > 0 && (
                <div>
                  <h4 className="text-xs font-medium text-amber-600 dark:text-amber-400 mb-1.5 flex items-center gap-1">
                    <AlertTriangle className="w-3.5 h-3.5" /> Factores de riesgo
                  </h4>
                  <ul className="space-y-1">
                    {latestScoring.risk_factors.map((r: string, i: number) => (
                      <li key={i} className="text-xs text-muted-foreground pl-5">• {r}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Recommendations */}
              {latestScoring.recommendations?.length > 0 && (
                <div>
                  <h4 className="text-xs font-medium text-blue-600 dark:text-blue-400 mb-1.5 flex items-center gap-1">
                    <Lightbulb className="w-3.5 h-3.5" /> Recomendaciones
                  </h4>
                  <ul className="space-y-1">
                    {latestScoring.recommendations.map((r: string, i: number) => (
                      <li key={i} className="text-xs text-muted-foreground pl-5">• {r}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Reasoning */}
              {latestScoring.reasoning && (
                <div className="bg-muted/50 rounded-md p-3">
                  <p className="text-xs text-muted-foreground leading-relaxed">{latestScoring.reasoning}</p>
                </div>
              )}
            </CollapsibleContent>
          </Collapsible>
        )}

        {/* History timeline */}
        {history.length > 1 && (
          <div className="border-t pt-3">
            <h4 className="text-xs font-medium mb-2">Historial</h4>
            <div className="space-y-1.5">
              {history.slice(0, 5).map((entry) => {
                const delta = entry.new_probability - (entry.previous_probability ?? 0);
                return (
                  <div key={entry.id} className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">
                      {formatDistanceToNow(new Date(entry.created_at), { addSuffix: true, locale: es })}
                    </span>
                    <div className="flex items-center gap-1.5">
                      <span className="text-muted-foreground">{entry.previous_probability ?? "—"}%</span>
                      <ArrowRight className="w-3 h-3 text-muted-foreground" />
                      <span className="font-medium">{entry.new_probability}%</span>
                      <span className={`text-[10px] font-medium ${delta > 0 ? "text-green-500" : delta < 0 ? "text-red-500" : "text-muted-foreground"}`}>
                        ({delta > 0 ? "+" : ""}{delta})
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
