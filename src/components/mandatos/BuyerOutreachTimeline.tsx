import { Mail, Linkedin, Phone, FileText, Send, MessageCircle, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useBuyerOutreach } from "@/hooks/useBuyerOutreach";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";

const channelIcons: Record<string, React.ElementType> = {
  email: Mail,
  linkedin: Linkedin,
  phone: Phone,
  other: MessageCircle,
};

const typeLabels: Record<string, { label: string; color: string }> = {
  contacto: { label: "Contacto", color: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200" },
  teaser: { label: "Teaser", color: "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200" },
  nda: { label: "NDA", color: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200" },
  followup: { label: "Seguimiento", color: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200" },
};

const statusLabels: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  draft: { label: "Borrador", variant: "outline" },
  sent: { label: "Enviado", variant: "default" },
  replied: { label: "Respondido", variant: "secondary" },
  bounced: { label: "Rebotado", variant: "destructive" },
};

interface Props {
  matchId: string;
}

export function BuyerOutreachTimeline({ matchId }: Props) {
  const { data: outreach = [], isLoading } = useBuyerOutreach(matchId);

  if (isLoading) {
    return <p className="text-xs text-muted-foreground py-2">Cargando historial...</p>;
  }

  if (outreach.length === 0) {
    return (
      <p className="text-xs text-muted-foreground py-2 text-center">
        Sin interacciones registradas
      </p>
    );
  }

  return (
    <div className="space-y-2">
      <p className="text-xs font-medium text-muted-foreground flex items-center gap-1">
        <Clock className="w-3 h-3" /> Historial de outreach
      </p>
      <div className="space-y-1.5">
        {outreach.map((item) => {
          const Icon = channelIcons[item.channel] || MessageCircle;
          const typeInfo = typeLabels[item.outreach_type] || typeLabels.contacto;
          const statusInfo = statusLabels[item.status] || statusLabels.sent;

          return (
            <div
              key={item.id}
              className="flex items-start gap-2 p-2 rounded-md bg-muted/40 text-sm"
            >
              <Icon className="w-3.5 h-3.5 mt-0.5 text-muted-foreground shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className={`text-[10px] px-1.5 py-0 rounded-full font-medium ${typeInfo.color}`}>
                    {typeInfo.label}
                  </span>
                  <Badge variant={statusInfo.variant} className="text-[10px] px-1.5 py-0">
                    {statusInfo.label}
                  </Badge>
                  {item.sent_at && (
                    <span className="text-[10px] text-muted-foreground">
                      {formatDistanceToNow(new Date(item.sent_at), { addSuffix: true, locale: es })}
                    </span>
                  )}
                </div>
                {item.subject && (
                  <p className="text-xs mt-0.5 truncate">{item.subject}</p>
                )}
                {item.notes && (
                  <p className="text-xs text-muted-foreground mt-0.5 truncate">{item.notes}</p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
