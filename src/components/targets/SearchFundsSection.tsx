import { useState } from 'react';
import { Plus, Building2, Loader2, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { SearchFundCard } from './SearchFundCard';
import { AsociarSearchFundDialog } from './AsociarSearchFundDialog';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import { 
  useSearchFundMatchesForMandato, 
  useUpdateMatchStatus,
  useRemoveMatch,
  useUpdateMatchNotes,
} from '@/hooks/useSearchFundMatches';
import type { MatchStatus } from '@/types/searchFunds';
import type { Mandato } from '@/types';

interface SearchFundsSectionProps {
  mandato: Mandato;
}

export function SearchFundsSection({ mandato }: SearchFundsSectionProps) {
  const [showAsociarDialog, setShowAsociarDialog] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [unlinkConfirm, setUnlinkConfirm] = useState<{ open: boolean; matchId: string }>({ open: false, matchId: '' });

  const { data: matches = [], isLoading } = useSearchFundMatchesForMandato(mandato.id);
  const updateStatusMutation = useUpdateMatchStatus();
  const removeMutation = useRemoveMatch();
  const updateNotesMutation = useUpdateMatchNotes();

  const handleStatusChange = (matchId: string, status: MatchStatus) => {
    updateStatusMutation.mutate({
      matchId,
      status,
      mandatoId: mandato.id,
    });
  };

  const handleRemove = (matchId: string) => {
    setUnlinkConfirm({ open: true, matchId });
  };

  const confirmRemove = () => {
    removeMutation.mutate({
      matchId: unlinkConfirm.matchId,
      mandatoId: mandato.id,
    });
    setUnlinkConfirm({ open: false, matchId: '' });
  };

  const handleNotesChange = (matchId: string, notes: string) => {
    updateNotesMutation.mutate({
      matchId,
      notes,
      mandatoId: mandato.id,
    });
  };

  // Filtrar matches por búsqueda
  const filteredMatches = searchQuery
    ? matches.filter(m => 
        m.fund?.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.fund?.sector_focus?.some(s => s.toLowerCase().includes(searchQuery.toLowerCase()))
      )
    : matches;

  // Obtener EBITDA de la empresa del mandato
  const mandatoEbitda = mandato.empresa_principal?.ebitda || null;
  const mandatoSector = mandato.empresa_principal?.sector || null;

  // Estadísticas rápidas
  const stats = {
    total: matches.length,
    contactados: matches.filter(m => m.status !== 'nuevo').length,
    interesados: matches.filter(m => ['interesado', 'evaluando', 'en_negociacion'].includes(m.status)).length,
  };

  return (
    <div className="space-y-4">
      {/* Header con estadísticas */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h3 className="font-semibold text-foreground flex items-center gap-2">
            <Building2 className="h-5 w-5 text-orange-500" />
            Search Funds
          </h3>
          <div className="flex gap-2">
            <Badge variant="secondary" className="text-xs">
              {stats.total} asociados
            </Badge>
            {stats.contactados > 0 && (
              <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700">
                {stats.contactados} contactados
              </Badge>
            )}
            {stats.interesados > 0 && (
              <Badge variant="outline" className="text-xs bg-green-50 text-green-700">
                {stats.interesados} interesados
              </Badge>
            )}
          </div>
        </div>

        <Button onClick={() => setShowAsociarDialog(true)} size="sm">
          <Plus className="h-4 w-4 mr-1" />
          Añadir SF
        </Button>
      </div>

      {/* Buscador (solo si hay matches) */}
      {matches.length > 3 && (
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar Search Fund..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 h-9"
          />
        </div>
      )}

      {/* Lista de Search Funds */}
      {isLoading ? (
        <div className="flex items-center justify-center h-32">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : filteredMatches.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-muted-foreground border-2 border-dashed rounded-lg">
          <Building2 className="h-10 w-10 mb-3 opacity-50" />
          {matches.length === 0 ? (
            <>
              <p className="font-medium">No hay Search Funds asociados</p>
              <p className="text-sm mt-1">
                Añade Search Funds interesados en este tipo de operación
              </p>
              <Button 
                variant="outline" 
                className="mt-4"
                onClick={() => setShowAsociarDialog(true)}
              >
                <Plus className="h-4 w-4 mr-1" />
                Añadir primer Search Fund
              </Button>
            </>
          ) : (
            <p>No se encontraron resultados para "{searchQuery}"</p>
          )}
        </div>
      ) : (
        <div className="grid gap-3">
          {filteredMatches.map(match => (
            <SearchFundCard
              key={match.id}
              match={match}
              onStatusChange={handleStatusChange}
              onRemove={handleRemove}
              onNotesChange={handleNotesChange}
            />
          ))}
        </div>
      )}

      {/* Dialog para asociar */}
      <AsociarSearchFundDialog
        open={showAsociarDialog}
        onOpenChange={setShowAsociarDialog}
        mandatoId={mandato.id}
        mandatoEbitda={mandatoEbitda}
        mandatoSector={mandatoSector}
      />

      <ConfirmDialog
        open={unlinkConfirm.open}
        onOpenChange={(open) => !open && setUnlinkConfirm({ open: false, matchId: '' })}
        titulo="¿Desvincular este Search Fund del mandato?"
        onConfirmar={confirmRemove}
        textoConfirmar="Desvincular"
        variant="destructive"
      />
    </div>
  );
}
