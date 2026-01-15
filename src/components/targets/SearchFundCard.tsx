import { useState } from 'react';
import { 
  ExternalLink, 
  MoreHorizontal, 
  Trash2, 
  Globe,
  Building2,
  TrendingUp,
  MapPin,
  Calendar,
  MessageSquare,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { Textarea } from '@/components/ui/textarea';
import type { SearchFundMatch, MatchStatus } from '@/types/searchFunds';
import { MATCH_STATUS_LABELS, MATCH_STATUS_COLORS } from '@/types/searchFunds';

interface SearchFundCardProps {
  match: SearchFundMatch;
  onStatusChange: (matchId: string, status: MatchStatus) => void;
  onRemove: (matchId: string) => void;
  onNotesChange?: (matchId: string, notes: string) => void;
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

export function SearchFundCard({ 
  match, 
  onStatusChange, 
  onRemove,
  onNotesChange,
}: SearchFundCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [localNotes, setLocalNotes] = useState(match.notes || '');
  const [isEditingNotes, setIsEditingNotes] = useState(false);

  const fund = match.fund;
  if (!fund) return null;

  const matchStatus = (match.status || 'nuevo') as MatchStatus;
  const statusColor = MATCH_STATUS_COLORS[matchStatus] || MATCH_STATUS_COLORS.nuevo;
  const statusLabel = MATCH_STATUS_LABELS[matchStatus] || match.status;

  const handleSaveNotes = () => {
    if (onNotesChange) {
      onNotesChange(match.id, localNotes);
    }
    setIsEditingNotes(false);
  };

  const ebitdaRange = fund.ebitda_min || fund.ebitda_max
    ? `${formatCurrency(fund.ebitda_min)} - ${formatCurrency(fund.ebitda_max)}`
    : null;

  const dealRange = fund.deal_size_min || fund.deal_size_max
    ? `${formatCurrency(fund.deal_size_min)} - ${formatCurrency(fund.deal_size_max)}`
    : null;

  // Formatear sector_focus (es un array)
  const sectorDisplay = Array.isArray(fund.sector_focus) 
    ? fund.sector_focus.slice(0, 2).join(', ') + (fund.sector_focus.length > 2 ? '...' : '')
    : fund.sector_focus;

  return (
    <Card className="overflow-hidden hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-semibold text-foreground truncate">
                {fund.name}
              </h3>
              {fund.status === 'searching' && (
                <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 text-xs">
                  Buscando
                </Badge>
              )}
              {fund.status === 'acquired' && (
                <Badge variant="outline" className="bg-gray-100 text-gray-600 text-xs">
                  Adquirido
                </Badge>
              )}
            </div>
            
            <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
              {fund.country_base && (
                <span className="flex items-center gap-1">
                  <MapPin className="h-3.5 w-3.5" />
                  {fund.country_base}
                </span>
              )}
              {sectorDisplay && (
                <span className="flex items-center gap-1">
                  <Building2 className="h-3.5 w-3.5" />
                  {sectorDisplay}
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Select
              value={matchStatus}
              onValueChange={(value) => onStatusChange(match.id, value as MatchStatus)}
            >
              <SelectTrigger className={`h-8 w-36 text-xs ${statusColor}`}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(MATCH_STATUS_LABELS).map(([value, label]) => (
                  <SelectItem key={value} value={value} className="text-xs">
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {fund.website && (
                  <DropdownMenuItem asChild>
                    <a href={fund.website} target="_blank" rel="noopener noreferrer">
                      <Globe className="h-4 w-4 mr-2" />
                      Visitar web
                    </a>
                  </DropdownMenuItem>
                )}
                {fund.source_url && (
                  <DropdownMenuItem asChild>
                    <a href={fund.source_url} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="h-4 w-4 mr-2" />
                      Ver fuente
                    </a>
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  className="text-destructive focus:text-destructive"
                  onClick={() => onRemove(match.id)}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Desvincular
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Criterios de inversión */}
        <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
          {ebitdaRange && (
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <TrendingUp className="h-3.5 w-3.5 text-primary" />
              <span className="text-xs">EBITDA:</span>
              <span className="font-medium text-foreground">{ebitdaRange}</span>
            </div>
          )}
          {dealRange && (
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <span className="text-xs">Deal size:</span>
              <span className="font-medium text-foreground">{dealRange}</span>
            </div>
          )}
        </div>

        {/* Fechas de seguimiento */}
        <div className="mt-3 flex flex-wrap gap-3 text-xs text-muted-foreground">
          {match.contacted_at && (
            <span className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              Contactado: {format(new Date(match.contacted_at), 'dd MMM yyyy', { locale: es })}
            </span>
          )}
          {match.teaser_sent_at && (
            <Badge variant="outline" className="text-xs bg-orange-50 text-orange-700 border-orange-200">
              Teaser enviado
            </Badge>
          )}
          {match.nda_sent_at && (
            <Badge variant="outline" className="text-xs bg-purple-50 text-purple-700 border-purple-200">
              NDA firmado
            </Badge>
          )}
        </div>

        {/* Sección expandible - Detalles y Notas */}
        <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
          <CollapsibleTrigger asChild>
            <Button 
              variant="ghost" 
              size="sm" 
              className="w-full mt-3 text-xs text-muted-foreground hover:text-foreground"
            >
              {isExpanded ? (
                <>
                  <ChevronUp className="h-3.5 w-3.5 mr-1" />
                  Ocultar detalles
                </>
              ) : (
                <>
                  <ChevronDown className="h-3.5 w-3.5 mr-1" />
                  Ver más detalles
                </>
              )}
            </Button>
          </CollapsibleTrigger>
          
          <CollapsibleContent className="mt-3 space-y-3">
            {/* Información adicional del fondo */}
            {(fund.description || fund.investment_style || fund.geography_focus) && (
              <div className="p-3 bg-muted/50 rounded-lg space-y-2">
                <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Detalles del fondo
                </h4>
                {fund.description && (
                  <p className="text-sm text-muted-foreground">{fund.description}</p>
                )}
                {fund.investment_style && (
                  <div className="text-sm">
                    <span className="text-muted-foreground">Estilo: </span>
                    <span className="font-medium">{fund.investment_style}</span>
                  </div>
                )}
                {fund.geography_focus && fund.geography_focus.length > 0 && (
                  <div className="text-sm">
                    <span className="text-muted-foreground">Geografía: </span>
                    <span className="font-medium">{fund.geography_focus.join(', ')}</span>
                  </div>
                )}
                {fund.sector_focus && fund.sector_focus.length > 0 && (
                  <div className="text-sm">
                    <span className="text-muted-foreground">Sectores: </span>
                    <span className="font-medium">{fund.sector_focus.join(', ')}</span>
                  </div>
                )}
              </div>
            )}

            {/* Notas */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wide flex items-center gap-1">
                  <MessageSquare className="h-3.5 w-3.5" />
                  Notas
                </h4>
                {!isEditingNotes && onNotesChange && (
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="h-6 text-xs"
                    onClick={() => setIsEditingNotes(true)}
                  >
                    Editar
                  </Button>
                )}
              </div>
              
              {isEditingNotes ? (
                <div className="space-y-2">
                  <Textarea
                    value={localNotes}
                    onChange={(e) => setLocalNotes(e.target.value)}
                    placeholder="Añadir notas sobre este Search Fund..."
                    className="min-h-[80px] text-sm"
                  />
                  <div className="flex gap-2 justify-end">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => {
                        setLocalNotes(match.notes || '');
                        setIsEditingNotes(false);
                      }}
                    >
                      Cancelar
                    </Button>
                    <Button size="sm" onClick={handleSaveNotes}>
                      Guardar
                    </Button>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  {match.notes || 'Sin notas'}
                </p>
              )}
            </div>
          </CollapsibleContent>
        </Collapsible>
      </CardContent>
    </Card>
  );
}
