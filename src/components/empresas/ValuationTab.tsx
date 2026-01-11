import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  TrendingUp, 
  Search, 
  Link2, 
  FileText,
  AlertCircle,
  RefreshCw
} from "lucide-react";
import { ValuationCard, ValuationCardSkeleton } from "./ValuationCard";
import { SectorComparables } from "./SectorComparables";
import { 
  useEmpresaValuations, 
  useSectorMultiples, 
  useSectorMultiple,
  useLinkValuation,
  useUnlinkValuation,
  useSearchValuations
} from "@/hooks/useValuations";
import type { Empresa } from "@/types";

interface ValuationTabProps {
  empresa: Empresa;
}

export function ValuationTab({ empresa }: ValuationTabProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [showSearch, setShowSearch] = useState(false);

  const { 
    data: valuations, 
    isLoading: loadingValuations,
    refetch: refetchValuations
  } = useEmpresaValuations(empresa.id, empresa.cif, empresa.nombre);

  const { data: sectorMultiples, isLoading: loadingMultiples } = useSectorMultiples();
  
  // Get sector multiple for the empresa's sector
  const { data: empresaSectorMultiple } = useSectorMultiple(empresa.sector);

  const { data: searchResults } = useSearchValuations(searchQuery);
  
  const linkMutation = useLinkValuation();
  const unlinkMutation = useUnlinkValuation();

  const hasValuations = valuations && valuations.length > 0;
  const latestValuation = hasValuations ? valuations[0] : null;

  const handleLink = (valuationId: string) => {
    linkMutation.mutate({ valuationId, empresaId: empresa.id });
    setShowSearch(false);
    setSearchQuery("");
  };

  const handleUnlink = (valuationId: string) => {
    unlinkMutation.mutate(valuationId);
  };

  if (loadingValuations) {
    return (
      <div className="space-y-6">
        <ValuationCardSkeleton />
        <Skeleton className="h-64" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Actions */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h3 className="text-lg font-medium flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-purple-600" />
            Valoraciones
          </h3>
          {hasValuations && (
            <Badge variant="secondary">{valuations.length} encontrada(s)</Badge>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => refetchValuations()}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Actualizar
          </Button>
          {!hasValuations && (
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setShowSearch(!showSearch)}
            >
              <Link2 className="h-4 w-4 mr-2" />
              Vincular Valoración
            </Button>
          )}
        </div>
      </div>

      {/* Search for linking */}
      {showSearch && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Buscar Valoración para Vincular</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por empresa, CIF o email..."
                className="pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            
            {searchResults && searchResults.length > 0 && (
              <div className="max-h-64 overflow-y-auto space-y-2">
                {searchResults.map((result) => (
                  <div 
                    key={result.id}
                    className="p-3 border rounded-lg flex items-center justify-between hover:bg-muted/50"
                  >
                    <div>
                      <p className="font-medium">{result.company_name}</p>
                      <p className="text-sm text-muted-foreground">
                        {result.cif} • {result.industry} • {result.final_valuation ? `€${(result.final_valuation / 1000000).toFixed(1)}M` : 'Sin valoración'}
                      </p>
                    </div>
                    <Button 
                      size="sm"
                      onClick={() => handleLink(result.id)}
                      disabled={linkMutation.isPending}
                    >
                      <Link2 className="h-4 w-4 mr-1" />
                      Vincular
                    </Button>
                  </div>
                ))}
              </div>
            )}
            
            {searchQuery.length >= 2 && (!searchResults || searchResults.length === 0) && (
              <p className="text-sm text-muted-foreground text-center py-4">
                No se encontraron valoraciones sin vincular
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Main Content */}
      {hasValuations ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Latest Valuation Card */}
          <div className="space-y-4">
            <ValuationCard
              valuation={latestValuation!}
              sectorMultiple={empresaSectorMultiple}
              onUnlink={handleUnlink}
              isUnlinking={unlinkMutation.isPending}
            />

            {/* Valuation History */}
            {valuations.length > 1 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Historial de Valoraciones</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {valuations.slice(1).map((val) => (
                      <div 
                        key={val.id}
                        className="p-3 border rounded-lg flex items-center justify-between"
                      >
                        <div>
                          <p className="font-medium">
                            €{val.final_valuation ? (val.final_valuation / 1000000).toFixed(1) + 'M' : '-'}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(val.created_at).toLocaleDateString('es-ES')}
                          </p>
                        </div>
                        <Badge variant="outline">
                          {val.ebitda_multiple_used?.toFixed(1) || '-'}x
                        </Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sector Comparables */}
          <SectorComparables
            multiples={sectorMultiples || []}
            currentSector={latestValuation?.industry}
            currentMultiple={latestValuation?.ebitda_multiple_used}
            isLoading={loadingMultiples}
          />
        </div>
      ) : (
        <Card className="border-dashed">
          <CardContent className="py-12">
            <div className="text-center space-y-4">
              <div className="mx-auto h-16 w-16 rounded-full bg-muted flex items-center justify-center">
                <FileText className="h-8 w-8 text-muted-foreground" />
              </div>
              <div>
                <h3 className="font-medium text-lg">No hay valoraciones vinculadas</h3>
                <p className="text-muted-foreground text-sm mt-1">
                  Esta empresa no tiene valoraciones asociadas.
                  {empresa.cif && " Se buscó automáticamente por CIF."}
                </p>
              </div>
              <div className="flex items-center justify-center gap-2">
                <Button 
                  variant="outline"
                  onClick={() => setShowSearch(true)}
                >
                  <Search className="h-4 w-4 mr-2" />
                  Buscar y Vincular
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Sector Comparables when no valuations */}
      {!hasValuations && sectorMultiples && sectorMultiples.length > 0 && (
        <SectorComparables
          multiples={sectorMultiples}
          currentSector={empresa.sector}
          isLoading={loadingMultiples}
        />
      )}
    </div>
  );
}
