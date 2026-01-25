// ============================================
// CANDIDATE FUNNEL KANBAN
// Board view with columns per stage
// ============================================

import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Mail, 
  Eye, 
  Send, 
  CheckCircle2, 
  FileText, 
  DollarSign 
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { 
  type CandidateWithFunnelStage, 
  type CandidateFunnelStage,
  FUNNEL_STAGES 
} from '@/types/candidateFunnel';

interface CandidateFunnelKanbanProps {
  recipientsByStage: Record<CandidateFunnelStage, CandidateWithFunnelStage[]>;
  onCardClick?: (recipient: CandidateWithFunnelStage) => void;
  isLoading?: boolean;
}

const STAGE_ICONS = {
  teaser_sent: Mail,
  teaser_opened: Eye,
  nda_sent: Send,
  nda_signed: CheckCircle2,
  cim_opened: FileText,
  ioi_received: DollarSign,
};

function KanbanCard({ 
  recipient, 
  onClick 
}: { 
  recipient: CandidateWithFunnelStage; 
  onClick?: () => void;
}) {
  const getTimestamp = () => {
    const timestamps = [
      recipient.ioi_received_at,
      recipient.cim_opened_at,
      recipient.nda_signed_at,
      recipient.nda_sent_at,
      recipient.teaser_opened_at,
      recipient.teaser_sent_at,
    ];
    const latest = timestamps.find(Boolean);
    if (!latest) return null;
    return formatDistanceToNow(new Date(latest), { addSuffix: false, locale: es });
  };

  return (
    <Card 
      className={cn(
        "cursor-pointer transition-all hover:shadow-md hover:border-primary/50",
        "active:scale-[0.98]"
      )}
      onClick={onClick}
    >
      <CardContent className="p-3">
        <div className="space-y-1">
          <p className="font-medium text-sm truncate">
            {recipient.nombre || recipient.email.split('@')[0]}
          </p>
          {recipient.empresa_nombre && (
            <p className="text-xs text-muted-foreground truncate">
              {recipient.empresa_nombre}
            </p>
          )}
          <div className="flex items-center justify-between mt-2">
            {recipient.segment && (
              <Badge variant="outline" className="text-[10px]">
                {recipient.segment}
              </Badge>
            )}
            {recipient.ioi_amount && (
              <Badge variant="secondary" className="text-[10px] bg-pink-100 text-pink-700">
                €{(recipient.ioi_amount / 1000000).toFixed(1)}M
              </Badge>
            )}
          </div>
          {getTimestamp() && (
            <p className="text-[10px] text-muted-foreground text-right">
              {getTimestamp()}
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function KanbanColumn({ 
  stage, 
  recipients,
  onCardClick,
  isLoading,
}: { 
  stage: typeof FUNNEL_STAGES[number];
  recipients: CandidateWithFunnelStage[];
  onCardClick?: (recipient: CandidateWithFunnelStage) => void;
  isLoading?: boolean;
}) {
  const Icon = STAGE_ICONS[stage.key];
  
  return (
    <div className="flex flex-col min-w-[200px] max-w-[250px] shrink-0">
      {/* Column header */}
      <div 
        className="flex items-center gap-2 p-2 rounded-t-lg border-b-2"
        style={{ 
          backgroundColor: stage.bgColor,
          borderColor: stage.color,
        }}
      >
        <Icon className="w-4 h-4" style={{ color: stage.color }} />
        <span className="text-sm font-medium">{stage.shortLabel}</span>
        <Badge variant="secondary" className="ml-auto text-xs">
          {recipients.length}
        </Badge>
      </div>
      
      {/* Cards container */}
      <ScrollArea className="flex-1 p-2 bg-muted/30 rounded-b-lg min-h-[400px] max-h-[600px]">
        <div className="space-y-2">
          {isLoading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-20 bg-muted animate-pulse rounded" />
            ))
          ) : recipients.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-4">
              Sin candidatos
            </p>
          ) : (
            recipients.map(recipient => (
              <KanbanCard 
                key={recipient.id} 
                recipient={recipient}
                onClick={() => onCardClick?.(recipient)}
              />
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  );
}

export function CandidateFunnelKanban({
  recipientsByStage,
  onCardClick,
  isLoading,
}: CandidateFunnelKanbanProps) {
  return (
    <div className="overflow-x-auto pb-4">
      <div className="flex gap-3 min-w-max">
        {FUNNEL_STAGES.map(stage => (
          <KanbanColumn
            key={stage.key}
            stage={stage}
            recipients={recipientsByStage[stage.key] || []}
            onCardClick={onCardClick}
            isLoading={isLoading}
          />
        ))}
      </div>
    </div>
  );
}
