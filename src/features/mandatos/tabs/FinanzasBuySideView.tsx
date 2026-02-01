import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FinancialStatementsCard } from "@/components/financials/FinancialStatementsCard";
import { PriceCalculatorCard } from "@/components/pricing/PriceCalculatorCard";
import { TargetFinancialsComparison } from "@/components/mandatos/buyside/TargetFinancialsComparison";
import { useTargetPipeline } from "@/hooks/useTargetPipeline";
import { Building2, ChartBar, Target } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate, useLocation } from "react-router-dom";

interface FinanzasBuySideViewProps {
  mandatoId: string;
}

export function FinanzasBuySideView({ mandatoId }: FinanzasBuySideViewProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { targets, isLoading } = useTargetPipeline(mandatoId);
  const [selectedTargetId, setSelectedTargetId] = useState<string | null>(null);

  // Filtrar targets que tienen empresa asociada
  const targetsConEmpresa = useMemo(() => {
    return targets.filter(t => t.empresa_id);
  }, [targets]);

  // Obtener target seleccionado
  const selectedTarget = useMemo(() => {
    if (!selectedTargetId && targetsConEmpresa.length > 0) {
      return targetsConEmpresa[0];
    }
    return targetsConEmpresa.find(t => t.id === selectedTargetId) || null;
  }, [selectedTargetId, targetsConEmpresa]);

  // Navegación a pestaña targets
  const goToTargets = () => {
    // Cambiar a la pestaña targets (está en la misma página)
    const targetTab = document.querySelector('[data-state="inactive"][value="targets"]') as HTMLElement;
    if (targetTab) {
      targetTab.click();
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="py-12">
            <div className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Empty state si no hay targets
  if (targetsConEmpresa.length === 0) {
    return (
      <Card>
        <CardContent className="py-16">
          <div className="flex flex-col items-center justify-center text-center space-y-4">
            <div className="p-4 rounded-full bg-muted">
              <ChartBar className="h-10 w-10 text-muted-foreground" />
            </div>
            <div className="space-y-2">
              <h3 className="text-lg font-semibold">No hay targets para analizar</h3>
              <p className="text-muted-foreground max-w-md">
                Añade targets al mandato y vincúlalos a empresas para ver sus estados financieros y calcular valoraciones.
              </p>
            </div>
            <Button onClick={goToTargets} variant="outline" className="mt-4">
              <Target className="w-4 h-4 mr-2" />
              Ir a pestaña Targets
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Selector de Target */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Finanzas de Targets
            </CardTitle>
            <Select
              value={selectedTarget?.id || ""}
              onValueChange={(value) => setSelectedTargetId(value)}
            >
              <SelectTrigger className="w-full sm:w-[280px]">
                <SelectValue placeholder="Seleccionar target..." />
              </SelectTrigger>
              <SelectContent>
                {targetsConEmpresa.map((target) => (
                  <SelectItem key={target.id} value={target.id}>
                    <div className="flex items-center gap-2">
                      <Building2 className="h-4 w-4 text-muted-foreground" />
                      <span>{target.empresa?.nombre || "Sin nombre"}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
      </Card>

      {/* Comparativa Financiera de todos los targets */}
      {targetsConEmpresa.length > 1 && (
        <TargetFinancialsComparison 
          targets={targetsConEmpresa.map(t => ({
            id: t.id,
            empresa_id: t.empresa_id,
            empresa: t.empresa,
            match_score: t.match_score,
          }))}
          selectedTargetId={selectedTarget?.id}
          onSelectTarget={(targetId) => setSelectedTargetId(targetId)}
        />
      )}

      {/* Estados Financieros del Target Seleccionado */}
      {selectedTarget && selectedTarget.empresa_id && (
        <>
          <FinancialStatementsCard 
            empresaId={selectedTarget.empresa_id} 
            empresaNombre={selectedTarget.empresa?.nombre || "Target"} 
          />
          
          {/* Calculadora de Precio para el Target */}
          <PriceCalculatorCard
            empresaId={selectedTarget.empresa_id}
            mandatoId={mandatoId}
          />
        </>
      )}
    </div>
  );
}
