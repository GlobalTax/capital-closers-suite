import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { Mandato } from "@/types";
import { Calendar, DollarSign, Building2, TrendingUp } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface MandatoKPIsProps {
  mandato: Mandato;
}

export function MandatoKPIs({ mandato }: MandatoKPIsProps) {
  const getBadgeVariant = (estado: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      prospecto: "secondary",
      activo: "default",
      en_negociacion: "outline",
      cerrado: "default",
      cancelado: "destructive",
    };
    return variants[estado] || "default";
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Estado</CardTitle>
          <Badge variant={getBadgeVariant(mandato.estado)}>
            {mandato.estado}
          </Badge>
        </CardHeader>
        <CardContent>
          <p className="text-xs text-muted-foreground">
            Tipo: {mandato.tipo === "compra" ? "Compra" : "Venta"}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Valor</CardTitle>
          <DollarSign className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {mandato.valor ? `€${mandato.valor.toLocaleString()}` : "N/A"}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Empresa</CardTitle>
          <Building2 className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <p className="text-sm font-medium">
            {mandato.empresa_principal?.nombre || "N/A"}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Fecha Cierre</CardTitle>
          <Calendar className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <p className="text-sm">
            {mandato.fecha_cierre
              ? format(new Date(mandato.fecha_cierre), "dd MMM yyyy", { locale: es })
              : "Sin definir"}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
