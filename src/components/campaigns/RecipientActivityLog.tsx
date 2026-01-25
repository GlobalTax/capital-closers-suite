// ============================================
// RECIPIENT ACTIVITY LOG
// Timeline de eventos NDA y engagement
// ============================================

import { useNDAActivityLog } from "@/hooks/useNDAWorkflow";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { 
  Mail, 
  Eye, 
  MousePointerClick, 
  Clock, 
  Send, 
  CheckCircle2, 
  Unlock, 
  FileText,
  AlertCircle,
  User
} from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import type { NDARecipient } from "@/services/ndaWorkflow.service";

interface RecipientActivityLogProps {
  recipient: NDARecipient;
  className?: string;
}

const eventConfig: Record<string, { 
  label: string; 
  icon: React.ElementType; 
  color: string;
}> = {
  engagement_detected: {
    label: "Engagement detectado",
    icon: Eye,
    color: "text-blue-500",
  },
  nda_suggested: {
    label: "NDA sugerido automáticamente",
    icon: Clock,
    color: "text-yellow-500",
  },
  nda_sent: {
    label: "NDA enviado",
    icon: Send,
    color: "text-orange-500",
  },
  nda_opened: {
    label: "NDA abierto",
    icon: Eye,
    color: "text-blue-500",
  },
  nda_signed: {
    label: "NDA firmado",
    icon: CheckCircle2,
    color: "text-green-500",
  },
  nda_expired: {
    label: "NDA expirado",
    icon: AlertCircle,
    color: "text-red-500",
  },
  nda_rejected: {
    label: "NDA rechazado",
    icon: AlertCircle,
    color: "text-red-500",
  },
  cim_access_granted: {
    label: "Acceso CIM concedido",
    icon: Unlock,
    color: "text-purple-500",
  },
  cim_accessed: {
    label: "CIM accedido",
    icon: FileText,
    color: "text-purple-500",
  },
  manual_override: {
    label: "Acción manual",
    icon: User,
    color: "text-gray-500",
  },
};

export function RecipientActivityLog({ recipient, className }: RecipientActivityLogProps) {
  const { data: events, isLoading } = useNDAActivityLog(recipient.id);

  // Build combined timeline from recipient data + events
  const timeline = buildTimeline(recipient, events || []);

  if (isLoading) {
    return (
      <div className={`space-y-3 ${className}`}>
        {[1, 2, 3].map(i => (
          <div key={i} className="flex gap-3">
            <Skeleton className="h-8 w-8 rounded-full" />
            <div className="space-y-1 flex-1">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-1/2" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (timeline.length === 0) {
    return (
      <div className={`text-center py-8 text-muted-foreground ${className}`}>
        <Clock className="h-8 w-8 mx-auto mb-2 opacity-50" />
        <p>No hay actividad registrada</p>
      </div>
    );
  }

  return (
    <ScrollArea className={`h-[300px] ${className}`}>
      <div className="space-y-0 pr-4">
        {timeline.map((event, index) => {
          const config = eventConfig[event.type] || {
            label: event.type,
            icon: FileText,
            color: "text-gray-500",
          };
          const Icon = config.icon;

          return (
            <div key={event.id} className="flex gap-3 pb-4 relative">
              {/* Connector line */}
              {index < timeline.length - 1 && (
                <div className="absolute left-4 top-8 w-0.5 h-full bg-border -translate-x-1/2" />
              )}
              
              {/* Icon */}
              <div className={`
                flex items-center justify-center w-8 h-8 rounded-full border-2 bg-background z-10
                ${config.color} border-current
              `}>
                <Icon className="h-4 w-4" />
              </div>
              
              {/* Content */}
              <div className="flex-1 pt-0.5">
                <p className="font-medium text-sm">{config.label}</p>
                <p className="text-xs text-muted-foreground">
                  {format(new Date(event.timestamp), "d MMM yyyy, HH:mm", { locale: es })}
                </p>
                {event.metadata && Object.keys(event.metadata).length > 0 && (
                  <div className="mt-1 text-xs text-muted-foreground">
                    {formatMetadata(event.metadata)}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </ScrollArea>
  );
}

interface TimelineEvent {
  id: string;
  type: string;
  timestamp: string;
  metadata: Record<string, unknown>;
}

function buildTimeline(
  recipient: NDARecipient, 
  events: Array<{ id: string; event_type: string; created_at: string; metadata: Record<string, unknown> }>
): TimelineEvent[] {
  const timeline: TimelineEvent[] = [];

  // Add teaser events from recipient
  if (recipient.sent_at) {
    timeline.push({
      id: "teaser_sent",
      type: "teaser_sent",
      timestamp: recipient.sent_at,
      metadata: {},
    });
  }

  if (recipient.opened_at) {
    timeline.push({
      id: "teaser_opened",
      type: "engagement_detected",
      timestamp: recipient.opened_at,
      metadata: { trigger: "email_opened" },
    });
  }

  if (recipient.clicked_at) {
    timeline.push({
      id: "teaser_clicked",
      type: "engagement_detected",
      timestamp: recipient.clicked_at,
      metadata: { trigger: "link_clicked" },
    });
  }

  // Add NDA tracking events
  events.forEach(event => {
    timeline.push({
      id: event.id,
      type: event.event_type,
      timestamp: event.created_at,
      metadata: event.metadata,
    });
  });

  // Add CIM access from recipient
  if (recipient.cim_access_granted_at) {
    timeline.push({
      id: "cim_granted",
      type: "cim_access_granted",
      timestamp: recipient.cim_access_granted_at,
      metadata: { manual: true },
    });
  }

  // Sort by timestamp
  timeline.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

  // Deduplicate based on type and close timestamps (within 1 minute)
  const deduplicated: TimelineEvent[] = [];
  timeline.forEach(event => {
    const lastEvent = deduplicated[deduplicated.length - 1];
    if (lastEvent && 
        lastEvent.type === event.type &&
        Math.abs(new Date(lastEvent.timestamp).getTime() - new Date(event.timestamp).getTime()) < 60000) {
      // Skip duplicate
      return;
    }
    deduplicated.push(event);
  });

  return deduplicated;
}

function formatMetadata(metadata: Record<string, unknown>): string {
  const parts: string[] = [];

  if (metadata.trigger === "email_opened") {
    parts.push("Email abierto");
  } else if (metadata.trigger === "link_clicked") {
    parts.push("Click en enlace");
  }

  if (metadata.language) {
    parts.push(`Idioma: ${metadata.language}`);
  }

  if (metadata.manual_confirmation) {
    parts.push("Confirmación manual");
  }

  if (metadata.manual_override || metadata.manual) {
    parts.push("Acción manual");
  }

  if (metadata.action === "revoke_cim_access") {
    parts.push("Acceso revocado");
  }

  return parts.join(" • ");
}

// Add config for teaser_sent
eventConfig["teaser_sent"] = {
  label: "Teaser enviado",
  icon: Mail,
  color: "text-blue-500",
};
