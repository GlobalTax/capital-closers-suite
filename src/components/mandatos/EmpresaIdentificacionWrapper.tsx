import { Building2, Link2, Plus } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { EmpresaIdentificacionCard } from "./EmpresaIdentificacionCard";
import type { Mandato } from "@/types";

interface EmpresaIdentificacionWrapperProps {
  mandato: Mandato;
  onUpdate?: (empresaId: string, field: string, value: string | null) => Promise<void>;
  onVincularEmpresa: () => void;
}

export function EmpresaIdentificacionWrapper({
  mandato,
  onUpdate,
  onVincularEmpresa,
}: EmpresaIdentificacionWrapperProps) {
  // Si tiene empresa vinculada, mostrar tarjeta editable
  if (mandato.empresa_principal) {
    return (
      <EmpresaIdentificacionCard
        empresa={mandato.empresa_principal}
        onUpdate={onUpdate}
      />
    );
  }

  // Estado vacío: sin empresa vinculada
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Building2 className="h-4 w-4" />
          Información de la Empresa
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col items-center justify-center py-6 text-center space-y-4">
          <div className="rounded-full bg-muted p-3">
            <Building2 className="h-6 w-6 text-muted-foreground" />
          </div>
          <div className="space-y-1">
            <p className="text-sm font-medium">Sin empresa vinculada</p>
            <p className="text-xs text-muted-foreground max-w-[250px]">
              Este mandato no tiene una empresa asociada. Vincula una para ver y editar su información.
            </p>
          </div>
          <Button onClick={onVincularEmpresa} variant="outline" size="sm">
            <Link2 className="h-4 w-4 mr-2" />
            Vincular Empresa
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
