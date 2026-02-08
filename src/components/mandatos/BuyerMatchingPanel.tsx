import { useState } from "react";
import { Sparkles, Users, ChevronDown, ChevronUp, ExternalLink, X, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Textarea } from "@/components/ui/textarea";
import { MatchScoreBar } from "./MatchScoreBar";
import {
  useBuyerMatches,
  useGenerateBuyerMatches,
  useUpdateMatchStatus,
  type BuyerMatch,
} from "@/hooks/useBuyerMatching";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";

interface Props {
  mandatoId: string;
}

function ScoreGaugeMini({ score }: { score: number }) {
  const color =
    score >= 70 ? "text-green-500" : score >= 40 ? "text-yellow-500" : "text-destructive";
  return (
    <div className={`flex items-center justify-center w-12 h-12 rounded-full border-2 ${color} border-current font-bold text-sm`}>
      {score}
    </div>
  );
}

export function BuyerMatchingPanel({ mandatoId }: Props) {
  const { data: matches = [], isLoading } = useBuyerMatches(mandatoId);
  const generateMutation = useGenerateBuyerMatches();
  const updateStatusMutation = useUpdateMatchStatus();

  const [minScore, setMinScore] = useState(0);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [dismissDialogMatch, setDismissDialogMatch] = useState<BuyerMatch | null>(null);
  const [dismissReason, setDismissReason] = useState("");

  const filteredMatches = matches.filter((m) => {
    if (m.match_score < minScore) return false;
    if (statusFilter !== "all" && m.status !== statusFilter) return false;
    return true;
  });

  const lastGenerated = matches.length > 0 ? matches[0].generated_at : null;

  const handleDismiss = () => {
    if (!dismissDialogMatch) return;
    updateStatusMutation.mutate({
      matchId: dismissDialogMatch.id,
      status: "dismissed",
      dismissedReason: dismissReason,
    });
    setDismissDialogMatch(null);
    setDismissReason("");
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Users className="w-5 h-5 text-primary" />
            Matching de Compradores IA
          </CardTitle>
          <div className="flex items-center gap-2">
            {lastGenerated && (
              <span className="text-xs text-muted-foreground">
                Último: {formatDistanceToNow(new Date(lastGenerated), { addSuffix: true, locale: es })}
              </span>
            )}
            <Button
              size="sm"
              onClick={() => generateMutation.mutate(mandatoId)}
              disabled={generateMutation.isPending}
            >
              <Sparkles className="w-4 h-4 mr-1" />
              {generateMutation.isPending ? "Analizando..." : "Buscar Compradores"}
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {matches.length > 0 && (
          <div className="flex flex-wrap items-center gap-4 mb-4 pb-4 border-b">
            <div className="flex items-center gap-2 text-sm">
              <span className="text-muted-foreground">Score mín:</span>
              <Slider
                value={[minScore]}
                onValueChange={([v]) => setMinScore(v)}
                max={100}
                step={5}
                className="w-24"
              />
              <span className="w-8 text-xs font-medium">{minScore}</span>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-36 h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="suggested">Sugeridos</SelectItem>
                <SelectItem value="contacted">Contactados</SelectItem>
                <SelectItem value="dismissed">Descartados</SelectItem>
                <SelectItem value="converted">Convertidos</SelectItem>
              </SelectContent>
            </Select>
            <Badge variant="secondary">{filteredMatches.length} resultados</Badge>
          </div>
        )}

        {isLoading ? (
          <p className="text-sm text-muted-foreground py-8 text-center">Cargando matches...</p>
        ) : matches.length === 0 ? (
          <div className="text-center py-12 space-y-3">
            <Users className="w-10 h-10 mx-auto text-muted-foreground/40" />
            <p className="text-sm text-muted-foreground">
              No hay matches generados aún. Pulsa "Buscar Compradores" para analizar la compatibilidad con los compradores corporativos del CRM.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredMatches.map((match) => (
              <MatchCard
                key={match.id}
                match={match}
                onContact={() =>
                  updateStatusMutation.mutate({ matchId: match.id, status: "contacted" })
                }
                onDismiss={() => setDismissDialogMatch(match)}
                isUpdating={updateStatusMutation.isPending}
              />
            ))}
          </div>
        )}

        {/* Dismiss dialog */}
        <AlertDialog
          open={!!dismissDialogMatch}
          onOpenChange={() => setDismissDialogMatch(null)}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Descartar comprador</AlertDialogTitle>
              <AlertDialogDescription>
                ¿Por qué descartas a {dismissDialogMatch?.buyer?.name}?
              </AlertDialogDescription>
            </AlertDialogHeader>
            <Textarea
              placeholder="Motivo del descarte (opcional)"
              value={dismissReason}
              onChange={(e) => setDismissReason(e.target.value)}
            />
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={handleDismiss}>Descartar</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </CardContent>
    </Card>
  );
}

function MatchCard({
  match,
  onContact,
  onDismiss,
  isUpdating,
}: {
  match: BuyerMatch;
  onContact: () => void;
  onDismiss: () => void;
  isUpdating: boolean;
}) {
  const [open, setOpen] = useState(false);

  const statusBadge: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
    suggested: { label: "Sugerido", variant: "secondary" },
    contacted: { label: "Contactado", variant: "default" },
    dismissed: { label: "Descartado", variant: "destructive" },
    converted: { label: "Convertido", variant: "outline" },
  };

  const s = statusBadge[match.status] || statusBadge.suggested;

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <div className="border rounded-lg p-3 hover:bg-muted/30 transition-colors">
        <div className="flex items-start gap-3">
          <ScoreGaugeMini score={match.match_score} />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-medium text-sm truncate">{match.buyer?.name || "Comprador"}</span>
              {match.buyer?.buyer_type && (
                <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                  {match.buyer.buyer_type}
                </Badge>
              )}
              <Badge variant={s.variant} className="text-[10px] px-1.5 py-0">
                {s.label}
              </Badge>
            </div>
            <div className="mt-2">
              <MatchScoreBar fitDimensions={match.fit_dimensions} />
            </div>
          </div>
          <CollapsibleTrigger asChild>
            <Button variant="ghost" size="icon" className="shrink-0 h-7 w-7">
              {open ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </Button>
          </CollapsibleTrigger>
        </div>

        <CollapsibleContent className="mt-3 space-y-3 pt-3 border-t">
          {match.match_reasoning && (
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-1">Razonamiento</p>
              <p className="text-sm">{match.match_reasoning}</p>
            </div>
          )}
          {match.recommended_approach && (
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-1">Approach recomendado</p>
              <p className="text-sm">{match.recommended_approach}</p>
            </div>
          )}
          {match.risk_factors?.length > 0 && (
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-1">Factores de riesgo</p>
              <ul className="text-sm list-disc list-inside space-y-0.5">
                {match.risk_factors.map((r, i) => (
                  <li key={i}>{r}</li>
                ))}
              </ul>
            </div>
          )}
          {match.status === "suggested" && (
            <div className="flex gap-2 pt-1">
              <Button size="sm" variant="default" onClick={onContact} disabled={isUpdating}>
                <MessageSquare className="w-3.5 h-3.5 mr-1" />
                Contactar
              </Button>
              <Button size="sm" variant="outline" onClick={onDismiss} disabled={isUpdating}>
                <X className="w-3.5 h-3.5 mr-1" />
                Descartar
              </Button>
              {match.buyer?.id && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => window.open(`/admin/corporate-buyers`, "_blank")}
                >
                  <ExternalLink className="w-3.5 h-3.5 mr-1" />
                  Ver perfil
                </Button>
              )}
            </div>
          )}
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
}
