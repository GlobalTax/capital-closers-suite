import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Sparkles, CheckCircle, Quote, RefreshCw, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { CompanyMeeting } from "@/services/companyMeetings.service";

interface MeetingAISummaryProps {
  meeting: CompanyMeeting;
  onRegenerate: () => void;
  isRegenerating: boolean;
}

interface ActionItem {
  title: string;
  responsible?: string;
  deadline?: string;
}

export function MeetingAISummary({ meeting, onRegenerate, isRegenerating }: MeetingAISummaryProps) {
  if (!meeting.ai_summary) return null;

  const actionItems = (meeting.ai_action_items || []) as unknown as ActionItem[];
  const keyQuotes = meeting.ai_key_quotes || [];

  return (
    <div className="rounded-lg border border-purple-200 bg-purple-50/50 dark:border-purple-800 dark:bg-purple-950/20 p-4 space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-purple-600 dark:text-purple-400" />
          <Badge variant="secondary" className="bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300 text-xs">
            Resumen IA
          </Badge>
          {meeting.ai_processed_at && (
            <span className="text-xs text-muted-foreground">
              {format(new Date(meeting.ai_processed_at), "d MMM yyyy, HH:mm", { locale: es })}
            </span>
          )}
        </div>
        <Button
          size="sm"
          variant="ghost"
          onClick={onRegenerate}
          disabled={isRegenerating}
          className="h-7 text-xs text-purple-600 hover:text-purple-700 dark:text-purple-400"
        >
          {isRegenerating ? (
            <Loader2 className="h-3 w-3 mr-1 animate-spin" />
          ) : (
            <RefreshCw className="h-3 w-3 mr-1" />
          )}
          Regenerar
        </Button>
      </div>

      {/* Summary */}
      <p className="text-sm leading-relaxed">{meeting.ai_summary}</p>

      {/* Action Items */}
      {actionItems.length > 0 && (
        <div className="space-y-1.5">
          <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
            Acciones pendientes
          </h4>
          <ul className="space-y-1">
            {actionItems.map((item, i) => (
              <li key={i} className="flex items-start gap-2 text-sm">
                <CheckCircle className="h-3.5 w-3.5 mt-0.5 text-purple-500 flex-shrink-0" />
                <div>
                  <span>{item.title}</span>
                  {(item.responsible || item.deadline) && (
                    <span className="text-xs text-muted-foreground ml-1">
                      ({[item.responsible, item.deadline].filter(Boolean).join(" · ")})
                    </span>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Key Quotes */}
      {keyQuotes.length > 0 && (
        <div className="space-y-1.5">
          <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
            Citas destacadas
          </h4>
          {keyQuotes.map((quote, i) => (
            <blockquote
              key={i}
              className="border-l-2 border-purple-300 dark:border-purple-700 pl-3 text-sm italic text-muted-foreground"
            >
              <Quote className="h-3 w-3 inline mr-1 opacity-50" />
              {quote}
            </blockquote>
          ))}
        </div>
      )}
    </div>
  );
}
