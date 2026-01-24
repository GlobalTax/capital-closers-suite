import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Phone, FileText, Shield, Building2 } from 'lucide-react';
import { MATCH_STATUS_LABELS, MATCH_STATUS_COLORS, type MatchStatus } from '@/types/searchFunds';

interface OutreachTimelineItemProps {
  match: {
    id: string;
    status: string | null;
    notes: string | null;
    contacted_at: string | null;
    teaser_sent_at: string | null;
    nda_sent_at: string | null;
  };
  mandatoCode?: string;
  empresaName?: string;
  onClick?: () => void;
}

export function OutreachTimelineItem({
  match,
  mandatoCode,
  empresaName,
  onClick,
}: OutreachTimelineItemProps) {
  const formatDate = (date: string | null) => {
    if (!date) return null;
    return format(new Date(date), "d MMM yyyy", { locale: es });
  };

  const milestones = [
    {
      icon: Phone,
      label: 'Contactado',
      date: match.contacted_at,
      color: 'text-blue-600',
    },
    {
      icon: FileText,
      label: 'Teaser enviado',
      date: match.teaser_sent_at,
      color: 'text-orange-600',
    },
    {
      icon: Shield,
      label: 'NDA firmado',
      date: match.nda_sent_at,
      color: 'text-purple-600',
    },
  ].filter((m) => m.date);

  const status = (match.status || 'nuevo') as MatchStatus;

  return (
    <Card
      className="cursor-pointer hover:bg-muted/50 transition-colors"
      onClick={onClick}
    >
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            {/* Header */}
            <div className="flex items-center gap-2 mb-3">
              <Building2 className="w-4 h-4 text-muted-foreground shrink-0" />
              <span className="font-medium text-sm truncate">
                {mandatoCode || 'Mandato'}
              </span>
              {empresaName && (
                <>
                  <span className="text-muted-foreground">•</span>
                  <span className="text-sm text-muted-foreground truncate">
                    {empresaName}
                  </span>
                </>
              )}
            </div>

            {/* Timeline */}
            {milestones.length > 0 && (
              <div className="space-y-1.5 mb-3">
                {milestones.map((milestone, idx) => (
                  <div key={idx} className="flex items-center gap-2 text-xs">
                    <milestone.icon className={`w-3.5 h-3.5 ${milestone.color}`} />
                    <span className="text-muted-foreground">{milestone.label}:</span>
                    <span className="font-medium">{formatDate(milestone.date)}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Notes */}
            {match.notes && (
              <p className="text-xs text-muted-foreground line-clamp-2 italic">
                "{match.notes}"
              </p>
            )}
          </div>

          {/* Status Badge */}
          <Badge className={MATCH_STATUS_COLORS[status]}>
            {MATCH_STATUS_LABELS[status] || status}
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
}
