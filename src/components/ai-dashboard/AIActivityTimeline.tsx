import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2, CheckCircle2, XCircle, ChevronDown, ChevronUp, Clock } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";

interface ActivityRow {
  id: string;
  created_at: string;
  module: string;
  model: string | null;
  input_tokens: number | null;
  output_tokens: number | null;
  estimated_cost_usd: number | null;
  success: boolean;
  error_message: string | null;
  entity_type: string | null;
  entity_id: string | null;
  duration_ms: number | null;
}

interface Props {
  data: ActivityRow[];
  isLoading: boolean;
}

export function AIActivityTimeline({ data, isLoading }: Props) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Clock className="h-5 w-5" />
          Actividad reciente
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[400px]">
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : data.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              No hay actividad de IA registrada aún
            </p>
          ) : (
            <div className="space-y-2">
              {data.map(row => {
                const isExpanded = expandedId === row.id;
                const tokens = (row.input_tokens || 0) + (row.output_tokens || 0);
                return (
                  <div
                    key={row.id}
                    className="border rounded-md p-3 text-sm hover:bg-muted/50 transition-colors cursor-pointer"
                    onClick={() => setExpandedId(isExpanded ? null : row.id)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {row.success ? (
                          <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                        ) : (
                          <XCircle className="h-4 w-4 text-destructive shrink-0" />
                        )}
                        <span className="font-medium">{row.module}</span>
                        {row.model && (
                          <Badge variant="outline" className="font-mono text-[10px]">{row.model}</Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        <span>{tokens.toLocaleString()} tk</span>
                        {row.estimated_cost_usd != null && <span>${row.estimated_cost_usd.toFixed(4)}</span>}
                        <span>{formatDistanceToNow(new Date(row.created_at), { addSuffix: true, locale: es })}</span>
                        {isExpanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                      </div>
                    </div>
                    {isExpanded && (
                      <div className="mt-2 pt-2 border-t text-xs text-muted-foreground space-y-1">
                        <p>Duración: {row.duration_ms ? `${row.duration_ms} ms` : "—"}</p>
                        <p>Tokens IN: {row.input_tokens ?? 0} / OUT: {row.output_tokens ?? 0}</p>
                        {row.entity_type && <p>Entidad: {row.entity_type} ({row.entity_id})</p>}
                        {row.error_message && (
                          <p className="text-destructive">Error: {row.error_message}</p>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
