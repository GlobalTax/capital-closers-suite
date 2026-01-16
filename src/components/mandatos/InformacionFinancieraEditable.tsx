import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { TrendingUp, DollarSign, Users, CreditCard, Wallet, Calendar, ExternalLink } from "lucide-react";
import { Link } from "react-router-dom";
import { Empresa } from "@/types";
import { formatCurrency, formatPercentage } from "@/lib/mandato-utils";
import { InlineEditNumber } from "@/components/shared/InlineEdit";

interface InformacionFinancieraEditableProps {
  empresa?: Empresa;
  loading?: boolean;
  onUpdate?: (empresaId: string, field: string, value: number | null) => Promise<void>;
}

export function InformacionFinancieraEditable({ empresa, loading, onUpdate }: InformacionFinancieraEditableProps) {
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Skeleton key={i} className="h-20" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!empresa) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Información Financiera
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Asocia una empresa para ver y editar datos financieros.
          </p>
        </CardContent>
      </Card>
    );
  }

  const margenEbitda = empresa.facturacion && empresa.ebitda 
    ? (empresa.ebitda / empresa.facturacion) * 100 
    : null;

  const handleSave = async (field: string, value: number | null) => {
    if (onUpdate && empresa.id) {
      await onUpdate(empresa.id, field, value);
    }
  };

  const editableKpis = [
    {
      label: 'Facturación',
      field: 'facturacion',
      value: empresa.facturacion,
      icon: DollarSign,
      editable: true,
      format: formatCurrency,
    },
    {
      label: 'EBITDA',
      field: 'ebitda',
      value: empresa.ebitda,
      icon: TrendingUp,
      editable: true,
      format: formatCurrency,
    },
    {
      label: 'Margen EBITDA',
      field: 'margen',
      value: margenEbitda,
      icon: TrendingUp,
      editable: false,
      format: formatPercentage,
    },
    {
      label: 'Empleados',
      field: 'empleados',
      value: empresa.empleados,
      icon: Users,
      editable: true,
      format: (v: number | null) => v?.toString() || '-',
    },
    {
      label: 'Deuda',
      field: 'deuda',
      value: empresa.deuda,
      icon: CreditCard,
      editable: true,
      format: formatCurrency,
    },
    {
      label: 'Capital Circulante',
      field: 'capital_circulante',
      value: empresa.capital_circulante,
      icon: Wallet,
      editable: true,
      format: formatCurrency,
    },
  ];

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Información Financiera
          </CardTitle>
          <div className="flex items-center gap-4">
            {empresa.año_datos_financieros && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Calendar className="h-4 w-4" />
                <InlineEditNumber
                  value={empresa.año_datos_financieros}
                  onSave={(v) => handleSave('año_datos_financieros', v)}
                  className="font-medium"
                  placeholder="Año"
                />
              </div>
            )}
            {!empresa.año_datos_financieros && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Calendar className="h-4 w-4" />
                <InlineEditNumber
                  value={null}
                  onSave={(v) => handleSave('año_datos_financieros', v)}
                  className="text-muted-foreground"
                  placeholder="Añadir año"
                />
              </div>
            )}
          </div>
        </div>
        <Link 
          to={`/empresas/${empresa.id}`}
          className="text-sm text-primary hover:underline flex items-center gap-1 mt-1"
        >
          {empresa.nombre}
          <ExternalLink className="h-3 w-3" />
        </Link>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {editableKpis.map((kpi) => (
            <div key={kpi.field} className="space-y-2">
              <div className="flex items-center gap-2 text-muted-foreground">
                <kpi.icon className="h-4 w-4" />
                <p className="text-sm">{kpi.label}</p>
              </div>
              {kpi.editable && onUpdate ? (
                <InlineEditNumber
                  value={kpi.value ?? null}
                  onSave={(v) => handleSave(kpi.field, v)}
                  format={kpi.format as (v: number | null) => string}
                  className="text-lg font-medium"
                  placeholder="—"
                />
              ) : (
                <p className="text-lg font-medium">
                  {kpi.value != null ? kpi.format(kpi.value) : '—'}
                </p>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
