import { useState } from 'react';
import { Globe, Send, Building2, MapPin, ChevronRight } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { OutreachDrawer } from './OutreachDrawer';
import type { SearchFundWithStats } from '@/hooks/useSearchFundsWithStats';

interface SearchFundGridCardProps {
  fund: SearchFundWithStats;
  onNavigate: (fundId: string) => void;
  isDiscarded?: boolean;
}

const STATUS_BADGES: Record<string, { label: string; className: string }> = {
  searching: { label: 'Buscando', className: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' },
  acquired: { label: 'Adquirido', className: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' },
  inactive: { label: 'Inactivo', className: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400' },
  paused: { label: 'Pausado', className: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' },
};

function formatCurrency(value: number | null): string {
  if (value === null) return '-';
  if (value >= 1_000_000) return `€${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `€${(value / 1_000).toFixed(0)}K`;
  return `€${value.toLocaleString()}`;
}

function formatRange(min: number | null, max: number | null): string {
  if (min === null && max === null) return '-';
  if (min === null) return `≤${formatCurrency(max)}`;
  if (max === null) return `≥${formatCurrency(min)}`;
  return `${formatCurrency(min)} - ${formatCurrency(max)}`;
}

export function SearchFundGridCard({ fund, onNavigate, isDiscarded = false }: SearchFundGridCardProps) {
  const [outreachOpen, setOutreachOpen] = useState(false);
  const statusBadge = STATUS_BADGES[fund.status || 'inactive'] || STATUS_BADGES.inactive;

  const handleCardClick = () => {
    onNavigate(fund.id);
  };

  const handleOutreachClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setOutreachOpen(true);
  };

  const handleWebsiteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (fund.website) {
      window.open(fund.website, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <>
      <Card 
        className="group cursor-pointer hover:shadow-md transition-all hover:border-primary/30"
        onClick={handleCardClick}
      >
        <CardContent className="p-4">
          {/* Header */}
          <div className="flex items-start justify-between gap-2 mb-3">
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold truncate group-hover:text-primary transition-colors">
                {fund.name}
              </h3>
              {fund.primary_contact && (
                <p className="text-xs text-muted-foreground truncate">
                  {fund.primary_contact.full_name}
                  {fund.primary_contact.role && ` · ${fund.primary_contact.role}`}
                </p>
              )}
            </div>
            <Badge className={statusBadge.className}>{statusBadge.label}</Badge>
          </div>

          {/* Ticket Size */}
          <div className="text-sm mb-3">
            <span className="text-muted-foreground">EBITDA: </span>
            <span className="font-medium">{formatRange(fund.ebitda_min, fund.ebitda_max)}</span>
          </div>

          {/* Sectors */}
          <div className="flex flex-wrap gap-1 mb-3">
            {fund.sector_focus?.slice(0, 2).map((sector, idx) => (
              <Badge key={idx} variant="secondary" className="text-xs">
                {sector}
              </Badge>
            ))}
            {fund.sector_focus && fund.sector_focus.length > 2 && (
              <Badge variant="outline" className="text-xs">
                +{fund.sector_focus.length - 2}
              </Badge>
            )}
            {(!fund.sector_focus || fund.sector_focus.length === 0) && (
              <span className="text-xs text-muted-foreground">Sin sectores definidos</span>
            )}
          </div>

          {/* Footer: Country + Mandatos + Actions */}
          <div className="flex items-center justify-between pt-3 border-t">
            <div className="flex items-center gap-3 text-sm text-muted-foreground">
              {fund.country_base && (
                <span className="flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5" />
                  {fund.country_base}
                </span>
              )}
              {fund.mandato_count > 0 && (
                <span className="flex items-center gap-1">
                  <Building2 className="w-3.5 h-3.5" />
                  {fund.mandato_count}
                </span>
              )}
            </div>

            <div className="flex items-center gap-1">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    disabled={!fund.website}
                    onClick={handleWebsiteClick}
                  >
                    <Globe className="w-4 h-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  {fund.website ? 'Visitar web' : 'Sin web disponible'}
                </TooltipContent>
              </Tooltip>

              {!isDiscarded && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={handleOutreachClick}
                    >
                      <Send className="w-4 h-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Contactar</TooltipContent>
                </Tooltip>
              )}

              <ChevronRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
          </div>
        </CardContent>
      </Card>

      <OutreachDrawer
        fund={fund}
        open={outreachOpen}
        onOpenChange={setOutreachOpen}
      />
    </>
  );
}
