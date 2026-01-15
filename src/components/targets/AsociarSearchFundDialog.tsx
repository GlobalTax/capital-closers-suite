import { useState, useMemo } from 'react';
import { Search, Building2, TrendingUp, MapPin, Check, Loader2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Checkbox } from '@/components/ui/checkbox';
import { useSearchFunds, useMatchedFundIds, useMatchSearchFund } from '@/hooks/useSearchFundMatches';
import type { SearchFund } from '@/types/searchFunds';

interface AsociarSearchFundDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mandatoId: string;
  mandatoEbitda?: number | null;
  mandatoSector?: string | null;
}

function formatCurrency(value: number | null): string {
  if (value === null || value === undefined) return '-';
  if (value >= 1000000) {
    return `€${(value / 1000000).toFixed(1)}M`;
  }
  if (value >= 1000) {
    return `€${(value / 1000).toFixed(0)}K`;
  }
  return `€${value.toLocaleString('es-ES')}`;
}

// Calcular score de compatibilidad
function calculateMatchScore(fund: SearchFund, mandatoEbitda?: number | null, mandatoSector?: string | null): number {
  let score = 0;
  let factors = 0;

  // Match por EBITDA
  if (mandatoEbitda && (fund.ebitda_min || fund.ebitda_max)) {
    factors++;
    const inRange = 
      (!fund.ebitda_min || mandatoEbitda >= fund.ebitda_min) &&
      (!fund.ebitda_max || mandatoEbitda <= fund.ebitda_max);
    if (inRange) score += 50;
  }

  // Match por sector (sector_focus es un array)
  if (mandatoSector && fund.sector_focus && fund.sector_focus.length > 0) {
    factors++;
    const sectorLower = mandatoSector.toLowerCase();
    const sectorMatch = fund.sector_focus.some(s => 
      s.toLowerCase().includes(sectorLower) || sectorLower.includes(s.toLowerCase())
    );
    if (sectorMatch) score += 50;
  }

  // Si no hay factores de comparación, dar score neutral
  if (factors === 0) return 50;

  return Math.round((score / factors) * 2);
}

export function AsociarSearchFundDialog({
  open,
  onOpenChange,
  mandatoId,
  mandatoEbitda,
  mandatoSector,
}: AsociarSearchFundDialogProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFunds, setSelectedFunds] = useState<Set<string>>(new Set());

  const { data: searchFunds = [], isLoading: isLoadingFunds } = useSearchFunds({ 
    status: 'searching',
    search: searchQuery || undefined,
  });
  const { data: matchedIds = [], isLoading: isLoadingMatched } = useMatchedFundIds(mandatoId);
  const matchMutation = useMatchSearchFund();

  // Filtrar fondos ya asociados y ordenar por score
  const availableFunds = useMemo(() => {
    const matchedSet = new Set(matchedIds);
    return searchFunds
      .filter(fund => !matchedSet.has(fund.id))
      .map(fund => ({
        ...fund,
        matchScore: calculateMatchScore(fund, mandatoEbitda, mandatoSector),
      }))
      .sort((a, b) => b.matchScore - a.matchScore);
  }, [searchFunds, matchedIds, mandatoEbitda, mandatoSector]);

  const handleToggleFund = (fundId: string) => {
    setSelectedFunds(prev => {
      const next = new Set(prev);
      if (next.has(fundId)) {
        next.delete(fundId);
      } else {
        next.add(fundId);
      }
      return next;
    });
  };

  const handleAssociate = async () => {
    if (selectedFunds.size === 0) return;

    try {
      // Asociar todos los fondos seleccionados
      await Promise.all(
        Array.from(selectedFunds).map(fundId =>
          matchMutation.mutateAsync({ fundId, mandatoId })
        )
      );
      setSelectedFunds(new Set());
      onOpenChange(false);
    } catch (error) {
      console.error('Error associating funds:', error);
    }
  };

  const isLoading = isLoadingFunds || isLoadingMatched;

  // Format sector_focus array for display
  const formatSectorDisplay = (sectors: string[] | null) => {
    if (!sectors || sectors.length === 0) return null;
    return sectors.slice(0, 2).join(', ') + (sectors.length > 2 ? '...' : '');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-primary" />
            Asociar Search Funds
          </DialogTitle>
          <DialogDescription>
            Selecciona los Search Funds que quieres asociar a este mandato.
            Los fondos están ordenados por compatibilidad con los criterios del mandato.
          </DialogDescription>
        </DialogHeader>

        {/* Buscador */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nombre..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>

        {/* Info del mandato */}
        {(mandatoEbitda || mandatoSector) && (
          <div className="flex gap-3 p-3 bg-muted/50 rounded-lg text-sm">
            <span className="text-muted-foreground">Criterios del mandato:</span>
            {mandatoEbitda && (
              <Badge variant="secondary">
                EBITDA: {formatCurrency(mandatoEbitda)}
              </Badge>
            )}
            {mandatoSector && (
              <Badge variant="secondary">
                Sector: {mandatoSector}
              </Badge>
            )}
          </div>
        )}

        {/* Lista de fondos */}
        <ScrollArea className="h-[400px] pr-4">
          {isLoading ? (
            <div className="flex items-center justify-center h-32">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : availableFunds.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-32 text-muted-foreground">
              <Building2 className="h-8 w-8 mb-2 opacity-50" />
              <p>No hay Search Funds disponibles</p>
              <p className="text-xs">Todos los fondos activos ya están asociados</p>
            </div>
          ) : (
            <div className="space-y-2">
              {availableFunds.map(fund => {
                const isSelected = selectedFunds.has(fund.id);
                const ebitdaRange = fund.ebitda_min || fund.ebitda_max
                  ? `${formatCurrency(fund.ebitda_min)} - ${formatCurrency(fund.ebitda_max)}`
                  : null;

                const sectorDisplay = formatSectorDisplay(fund.sector_focus);

                return (
                  <div
                    key={fund.id}
                    className={`
                      p-3 rounded-lg border cursor-pointer transition-colors
                      ${isSelected 
                        ? 'border-primary bg-primary/5' 
                        : 'border-border hover:border-primary/50 hover:bg-muted/30'
                      }
                    `}
                    onClick={() => handleToggleFund(fund.id)}
                  >
                    <div className="flex items-start gap-3">
                      <Checkbox
                        checked={isSelected}
                        onCheckedChange={() => handleToggleFund(fund.id)}
                        className="mt-1"
                      />
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-medium truncate">{fund.name}</span>
                          {fund.matchScore >= 80 && (
                            <Badge className="bg-green-100 text-green-700 text-xs">
                              Alta compatibilidad
                            </Badge>
                          )}
                          {fund.matchScore >= 50 && fund.matchScore < 80 && (
                            <Badge variant="secondary" className="text-xs">
                              Compatible
                            </Badge>
                          )}
                        </div>
                        
                        <div className="flex flex-wrap gap-3 mt-1 text-xs text-muted-foreground">
                          {fund.country_base && (
                            <span className="flex items-center gap-1">
                              <MapPin className="h-3 w-3" />
                              {fund.country_base}
                            </span>
                          )}
                          {sectorDisplay && (
                            <span className="flex items-center gap-1">
                              <Building2 className="h-3 w-3" />
                              {sectorDisplay}
                            </span>
                          )}
                          {ebitdaRange && (
                            <span className="flex items-center gap-1">
                              <TrendingUp className="h-3 w-3" />
                              EBITDA: {ebitdaRange}
                            </span>
                          )}
                        </div>
                      </div>

                      {isSelected && (
                        <Check className="h-5 w-5 text-primary shrink-0" />
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </ScrollArea>

        {/* Footer */}
        <div className="flex items-center justify-between pt-4 border-t">
          <span className="text-sm text-muted-foreground">
            {selectedFunds.size} seleccionado{selectedFunds.size !== 1 ? 's' : ''}
          </span>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button 
              onClick={handleAssociate}
              disabled={selectedFunds.size === 0 || matchMutation.isPending}
            >
              {matchMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Asociando...
                </>
              ) : (
                `Asociar ${selectedFunds.size > 0 ? `(${selectedFunds.size})` : ''}`
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
