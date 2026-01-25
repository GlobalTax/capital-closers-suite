// ============================================
// RECIPIENT NDA STATUS COMPONENT
// Badge visual del estado NDA del candidato
// ============================================

import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { 
  Mail, 
  Eye, 
  MousePointerClick, 
  Clock, 
  Send, 
  CheckCircle2, 
  FileText,
  Lock,
  Unlock
} from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import type { NDARecipient, NDAStatus } from "@/services/ndaWorkflow.service";

interface RecipientNDAStatusProps {
  recipient: NDARecipient;
  showTimeline?: boolean;
  compact?: boolean;
}

const statusConfig: Record<NDAStatus, { 
  label: string; 
  icon: React.ElementType; 
  variant: "default" | "secondary" | "destructive" | "outline";
  color: string;
}> = {
  not_required: {
    label: "Sin NDA",
    icon: FileText,
    variant: "outline",
    color: "text-muted-foreground",
  },
  pending: {
    label: "NDA Sugerido",
    icon: Clock,
    variant: "secondary",
    color: "text-yellow-600",
  },
  sent: {
    label: "NDA Enviado",
    icon: Send,
    variant: "default",
    color: "text-orange-600",
  },
  signed: {
    label: "NDA Firmado",
    icon: CheckCircle2,
    variant: "default",
    color: "text-green-600",
  },
  expired: {
    label: "NDA Expirado",
    icon: Clock,
    variant: "destructive",
    color: "text-red-600",
  },
  rejected: {
    label: "NDA Rechazado",
    icon: FileText,
    variant: "destructive",
    color: "text-red-600",
  },
};

export function RecipientNDAStatus({ 
  recipient, 
  showTimeline = false,
  compact = false 
}: RecipientNDAStatusProps) {
  const config = statusConfig[recipient.nda_status];
  const Icon = config.icon;

  if (compact) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Badge variant={config.variant} className="gap-1">
              <Icon className="h-3 w-3" />
              {config.label}
            </Badge>
          </TooltipTrigger>
          <TooltipContent>
            <NDATooltipContent recipient={recipient} />
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  if (showTimeline) {
    return <NDATimeline recipient={recipient} />;
  }

  return (
    <div className="flex items-center gap-2">
      <Badge variant={config.variant} className="gap-1">
        <Icon className="h-3 w-3" />
        {config.label}
      </Badge>
      {recipient.nda_sent_at && (
        <span className="text-xs text-muted-foreground">
          {format(new Date(recipient.nda_sent_at), "d MMM", { locale: es })}
        </span>
      )}
    </div>
  );
}

function NDATooltipContent({ recipient }: { recipient: NDARecipient }) {
  return (
    <div className="space-y-1 text-sm">
      {recipient.nda_sent_at && (
        <p>Enviado: {format(new Date(recipient.nda_sent_at), "d MMM yyyy HH:mm", { locale: es })}</p>
      )}
      {recipient.nda_signed_at && (
        <p>Firmado: {format(new Date(recipient.nda_signed_at), "d MMM yyyy HH:mm", { locale: es })}</p>
      )}
      {recipient.nda_language && (
        <p>Idioma: {recipient.nda_language}</p>
      )}
    </div>
  );
}

function NDATimeline({ recipient }: { recipient: NDARecipient }) {
  const steps = [
    {
      key: "teaser_sent",
      label: "Teaser enviado",
      icon: Mail,
      completed: !!recipient.sent_at,
      date: recipient.sent_at,
    },
    {
      key: "teaser_opened",
      label: "Teaser abierto",
      icon: Eye,
      completed: !!recipient.opened_at,
      date: recipient.opened_at,
    },
    {
      key: "nda_sent",
      label: "NDA enviado",
      icon: Send,
      completed: ["sent", "signed"].includes(recipient.nda_status),
      date: recipient.nda_sent_at,
    },
    {
      key: "nda_signed",
      label: "NDA firmado",
      icon: CheckCircle2,
      completed: recipient.nda_status === "signed",
      date: recipient.nda_signed_at,
    },
    {
      key: "cim_access",
      label: "Acceso CIM",
      icon: recipient.cim_access_granted || recipient.nda_status === "signed" ? Unlock : Lock,
      completed: recipient.cim_access_granted || recipient.nda_status === "signed",
      date: recipient.cim_access_granted_at,
    },
  ];

  return (
    <div className="flex items-center gap-1">
      {steps.map((step, index) => {
        const StepIcon = step.icon;
        return (
          <TooltipProvider key={step.key}>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex items-center">
                  <div
                    className={`
                      flex items-center justify-center w-6 h-6 rounded-full border-2 transition-colors
                      ${step.completed 
                        ? "bg-primary border-primary text-primary-foreground" 
                        : "bg-background border-muted-foreground/30 text-muted-foreground"
                      }
                    `}
                  >
                    <StepIcon className="h-3 w-3" />
                  </div>
                  {index < steps.length - 1 && (
                    <div 
                      className={`w-4 h-0.5 ${step.completed ? "bg-primary" : "bg-muted-foreground/30"}`} 
                    />
                  )}
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p className="font-medium">{step.label}</p>
                {step.date && (
                  <p className="text-xs text-muted-foreground">
                    {format(new Date(step.date), "d MMM yyyy HH:mm", { locale: es })}
                  </p>
                )}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        );
      })}
    </div>
  );
}

export function CIMAccessBadge({ recipient }: { recipient: NDARecipient }) {
  const hasAccess = recipient.cim_access_granted || recipient.nda_status === "signed";
  
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge variant={hasAccess ? "default" : "secondary"} className="gap-1">
            {hasAccess ? (
              <>
                <Unlock className="h-3 w-3" />
                Acceso
              </>
            ) : (
              <>
                <Lock className="h-3 w-3" />
                Bloqueado
              </>
            )}
          </Badge>
        </TooltipTrigger>
        <TooltipContent>
          {hasAccess ? (
            <p>Acceso CIM/Data Room habilitado</p>
          ) : (
            <p>Requiere NDA firmado para acceder</p>
          )}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
