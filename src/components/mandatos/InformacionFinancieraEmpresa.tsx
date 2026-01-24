import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { TrendingUp, DollarSign, Users } from "lucide-react";
import { Empresa } from "@/types";
import { formatCurrency, formatPercentage } from "@/lib/mandato-utils";

interface InformacionFinancieraEmpresaProps {
  empresa?: Empresa;
  loading?: boolean;
}

export function InformacionFinancieraEmpresa({ empresa, loading }: InformacionFinancieraEmpresaProps) {
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-20" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!empresa) return null;

  const margenEbitda = empresa.facturacion && empresa.ebitda 
    ? (empresa.ebitda / empresa.facturacion) * 100 
    : null;

  const kpis = [
    {
      label: 'Facturación',
      value: formatCurrency(empresa.facturacion),
      icon: DollarSign,
      show: !!empresa.facturacion,
    },
    {
      label: 'EBITDA',
      value: formatCurrency(empresa.ebitda),
      icon: TrendingUp,
      show: !!empresa.ebitda,
    },
    {
      label: 'Margen EBITDA',
      value: formatPercentage(margenEbitda),
      icon: TrendingUp,
      show: !!margenEbitda,
    },
    {
      label: 'Empleados',
      value: empresa.empleados?.toString() || '-',
      icon: Users,
      show: !!empresa.empleados,
    },
  ].filter(kpi => kpi.show);

  if (kpis.length === 0) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5" />
          Información Financiera de la Empresa
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {kpis.map((kpi, idx) => (
            <div key={idx} className="space-y-2">
              <div className="flex items-center gap-2 text-muted-foreground">
                <kpi.icon className="h-4 w-4" />
                <p className="text-sm">{kpi.label}</p>
              </div>
              <p className="text-lg font-medium">{kpi.value}</p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
