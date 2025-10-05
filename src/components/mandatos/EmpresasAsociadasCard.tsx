import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Building2, MapPin, Users, TrendingUp, DollarSign, StickyNote } from "lucide-react";
import { MandatoEmpresa } from "@/types";
import { getRolColor, formatCurrency } from "@/lib/mandato-utils";

interface EmpresasAsociadasCardProps {
  empresas: MandatoEmpresa[];
  onAddEmpresa: () => void;
  loading?: boolean;
}

export function EmpresasAsociadasCard({ empresas, onAddEmpresa, loading }: EmpresasAsociadasCardProps) {
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2].map((i) => (
              <Skeleton key={i} className="h-32" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <Building2 className="h-5 w-5" />
          Empresas Asociadas
        </CardTitle>
        <Button onClick={onAddEmpresa} size="sm">
          <Building2 className="h-4 w-4 mr-2" />
          Añadir Empresa
        </Button>
      </CardHeader>
      <CardContent>
        {empresas.length === 0 ? (
          <div className="text-center py-12">
            <Building2 className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
            <p className="text-sm text-muted-foreground mb-4">
              No hay empresas asociadas a este mandato
            </p>
            <Button onClick={onAddEmpresa} variant="outline" size="sm">
              Añadir primera empresa
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {empresas.map((me) => (
              <div key={me.id} className="border rounded-lg p-4 space-y-3 hover:bg-accent/50 transition-colors">
                {/* Header */}
                <div className="flex items-start justify-between">
                  <div className="flex gap-3">
                    <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <Building2 className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <h4 className="font-semibold">{me.empresa?.nombre}</h4>
                      {me.empresa?.cif && (
                        <p className="text-xs text-muted-foreground">CIF: {me.empresa.cif}</p>
                      )}
                    </div>
                  </div>
                  <Badge className={getRolColor(me.rol)}>
                    {me.rol}
                  </Badge>
                </div>

                {/* Info básica */}
                <div className="grid grid-cols-2 gap-2 text-sm">
                  {me.empresa?.sector && (
                    <div className="flex items-center gap-1 text-muted-foreground">
                      <Building2 className="h-3 w-3" />
                      {me.empresa.sector}
                      {me.empresa.subsector && ` - ${me.empresa.subsector}`}
                    </div>
                  )}
                  {me.empresa?.ubicacion && (
                    <div className="flex items-center gap-1 text-muted-foreground">
                      <MapPin className="h-3 w-3" />
                      {me.empresa.ubicacion}
                    </div>
                  )}
                </div>

                {/* Métricas */}
                {(me.empresa?.empleados || me.empresa?.facturacion || me.empresa?.ebitda) && (
                  <div className="grid grid-cols-3 gap-3 pt-2 border-t">
                    {me.empresa.empleados && (
                      <div>
                        <div className="flex items-center gap-1 text-xs text-muted-foreground mb-1">
                          <Users className="h-3 w-3" />
                          Empleados
                        </div>
                        <p className="text-sm font-medium">{me.empresa.empleados}</p>
                      </div>
                    )}
                    {me.empresa.facturacion && (
                      <div>
                        <div className="flex items-center gap-1 text-xs text-muted-foreground mb-1">
                          <DollarSign className="h-3 w-3" />
                          Facturación
                        </div>
                        <p className="text-sm font-medium">{formatCurrency(me.empresa.facturacion)}</p>
                      </div>
                    )}
                    {me.empresa.ebitda && (
                      <div>
                        <div className="flex items-center gap-1 text-xs text-muted-foreground mb-1">
                          <TrendingUp className="h-3 w-3" />
                          EBITDA
                        </div>
                        <p className="text-sm font-medium">{formatCurrency(me.empresa.ebitda)}</p>
                      </div>
                    )}
                  </div>
                )}

                {/* Notas */}
                {me.notas && (
                  <div className="flex gap-2 p-2 bg-muted rounded text-sm">
                    <StickyNote className="h-4 w-4 text-muted-foreground flex-shrink-0 mt-0.5" />
                    <p className="text-muted-foreground">{me.notas}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
