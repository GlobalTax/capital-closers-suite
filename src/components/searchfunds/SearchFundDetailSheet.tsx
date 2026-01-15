import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Globe,
  Building2,
  TrendingUp,
  MapPin,
  Calendar,
  ExternalLink,
  FileText,
  Briefcase,
  DollarSign,
  Target,
  Clock,
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import type { SearchFund } from '@/types/searchFunds';
import { MATCH_STATUS_LABELS, MATCH_STATUS_COLORS, type MatchStatus } from '@/types/searchFunds';
import { useNavigate } from 'react-router-dom';

interface SearchFundDetailSheetProps {
  fund: SearchFund | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function formatCurrency(value: number | null): string {
  if (value === null) return '-';
  if (value >= 1_000_000) return `€${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `€${(value / 1_000).toFixed(0)}K`;
  return `€${value.toLocaleString()}`;
}

function formatRange(min: number | null, max: number | null): string {
  if (min === null && max === null) return 'Sin definir';
  if (min === null) return `Hasta ${formatCurrency(max)}`;
  if (max === null) return `Desde ${formatCurrency(min)}`;
  return `${formatCurrency(min)} - ${formatCurrency(max)}`;
}

const STATUS_BADGES: Record<string, { label: string; className: string }> = {
  searching: { label: 'Buscando', className: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' },
  acquired: { label: 'Adquirido', className: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' },
  inactive: { label: 'Inactivo', className: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400' },
  paused: { label: 'Pausado', className: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' },
};

export function SearchFundDetailSheet({ fund, open, onOpenChange }: SearchFundDetailSheetProps) {
  const navigate = useNavigate();

  // Fetch associated mandates
  const { data: associatedMandates } = useQuery({
    queryKey: ['sf-fund-mandates', fund?.id],
    queryFn: async () => {
      if (!fund?.id) return [];

      // Get matches for this fund
      const { data: matches, error: matchesError } = await supabase
        .from('sf_matches')
        .select('*')
        .eq('fund_id', fund.id)
        .eq('crm_entity_type', 'mandato');

      if (matchesError) throw matchesError;
      if (!matches || matches.length === 0) return [];

      // Get mandato details
      const mandatoIds = matches.map(m => m.crm_entity_id);
      const { data: mandatos, error: mandatosError } = await supabase
        .from('mandatos')
        .select('id, codigo, estado, tipo')
        .in('id', mandatoIds);

      if (mandatosError) throw mandatosError;

      // Combine data
      return matches.map(match => {
        const mandato = mandatos?.find(m => m.id === match.crm_entity_id);
        return {
          ...match,
          mandato,
        };
      });
    },
    enabled: !!fund?.id && open,
  });

  if (!fund) return null;

  const statusBadge = STATUS_BADGES[fund.status || 'inactive'] || STATUS_BADGES.inactive;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-xl overflow-hidden flex flex-col">
        <SheetHeader className="pb-4">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <SheetTitle className="text-xl font-semibold truncate">
                {fund.name}
              </SheetTitle>
              <div className="flex items-center gap-2 mt-2">
                <Badge className={statusBadge.className}>{statusBadge.label}</Badge>
                {fund.country_base && (
                  <Badge variant="outline" className="gap-1">
                    <MapPin className="w-3 h-3" />
                    {fund.country_base}
                  </Badge>
                )}
              </div>
            </div>
            {fund.website && (
              <Button
                variant="outline"
                size="sm"
                className="shrink-0"
                onClick={() => window.open(fund.website!, '_blank')}
              >
                <Globe className="w-4 h-4 mr-1" />
                Web
              </Button>
            )}
          </div>
        </SheetHeader>

        <ScrollArea className="flex-1 -mx-6 px-6">
          <div className="space-y-6 pb-6">
            {/* Description */}
            {fund.description && (
              <div>
                <p className="text-sm text-muted-foreground">{fund.description}</p>
              </div>
            )}

            {/* Investment Criteria */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Target className="w-4 h-4 text-primary" />
                  Criterios de Inversión
                </CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">EBITDA</span>
                  <p className="font-medium">{formatRange(fund.ebitda_min, fund.ebitda_max)}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Deal Size</span>
                  <p className="font-medium">{formatRange(fund.deal_size_min, fund.deal_size_max)}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Revenue</span>
                  <p className="font-medium">{formatRange(fund.revenue_min, fund.revenue_max)}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Estilo</span>
                  <p className="font-medium">{fund.investment_style || '-'}</p>
                </div>
              </CardContent>
            </Card>

            {/* Sector Focus */}
            {fund.sector_focus && fund.sector_focus.length > 0 && (
              <div>
                <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-primary" />
                  Sectores de Interés
                </h4>
                <div className="flex flex-wrap gap-1.5">
                  {fund.sector_focus.map((sector, idx) => (
                    <Badge key={idx} variant="secondary" className="text-xs">
                      {sector}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Sector Exclusions */}
            {fund.sector_exclusions && fund.sector_exclusions.length > 0 && (
              <div>
                <h4 className="text-sm font-medium mb-2 text-muted-foreground">Sectores Excluidos</h4>
                <div className="flex flex-wrap gap-1.5">
                  {fund.sector_exclusions.map((sector, idx) => (
                    <Badge key={idx} variant="outline" className="text-xs text-muted-foreground">
                      {sector}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Geography */}
            {fund.geography_focus && fund.geography_focus.length > 0 && (
              <div>
                <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-primary" />
                  Geografía
                </h4>
                <div className="flex flex-wrap gap-1.5">
                  {fund.geography_focus.map((geo, idx) => (
                    <Badge key={idx} variant="outline" className="text-xs">
                      {geo}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            <Separator />

            {/* Associated Mandates */}
            <div>
              <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
                <Briefcase className="w-4 h-4 text-primary" />
                Mandatos Asociados ({associatedMandates?.length || 0})
              </h4>
              
              {associatedMandates && associatedMandates.length > 0 ? (
                <div className="space-y-2">
                  {associatedMandates.map((item) => (
                    <Card
                      key={item.id}
                      className="cursor-pointer hover:bg-accent/50 transition-colors"
                      onClick={() => {
                        onOpenChange(false);
                        navigate(`/mandatos/${item.crm_entity_id}`);
                      }}
                    >
                      <CardContent className="p-3">
                        <div className="flex items-center justify-between gap-2">
                          <div className="min-w-0">
                            <p className="font-medium text-sm truncate">
                              {item.mandato?.codigo || 'Sin código'}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {item.mandato?.tipo} - {item.mandato?.estado}
                            </p>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <Badge className={MATCH_STATUS_COLORS[item.status as MatchStatus] || 'bg-gray-100'}>
                              {MATCH_STATUS_LABELS[item.status as MatchStatus] || item.status}
                            </Badge>
                            <ExternalLink className="w-3.5 h-3.5 text-muted-foreground" />
                          </div>
                        </div>
                        {item.last_interaction_at && (
                          <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            Última actividad: {format(new Date(item.last_interaction_at), 'dd MMM yyyy', { locale: es })}
                          </p>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No hay mandatos asociados
                </p>
              )}
            </div>

            {/* Internal Notes */}
            {fund.notes_internal && (
              <>
                <Separator />
                <div>
                  <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
                    <FileText className="w-4 h-4 text-primary" />
                    Notas Internas
                  </h4>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                    {fund.notes_internal}
                  </p>
                </div>
              </>
            )}

            {/* Metadata */}
            <div className="text-xs text-muted-foreground pt-4 border-t">
              {fund.founded_year && <p>Fundado: {fund.founded_year}</p>}
              <p>Creado: {format(new Date(fund.created_at), 'dd/MM/yyyy', { locale: es })}</p>
              {fund.updated_at !== fund.created_at && (
                <p>Actualizado: {format(new Date(fund.updated_at), 'dd/MM/yyyy', { locale: es })}</p>
              )}
            </div>
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
