import { Card, CardContent } from "@/components/ui/card";
import { BillingForecastRow } from "@/hooks/useBillingForecast";
import { Euro, Target, CalendarClock, CheckCircle2 } from "lucide-react";

interface Props {
  mandatos: BillingForecastRow[];
}

function fmt(n: number | null | undefined): string {
  if (!n) return "—";
  return n.toLocaleString("es-ES", { maximumFractionDigits: 0 }) + " €";
}

export function BillingForecastSummary({ mandatos }: Props) {
  const activos = mandatos.filter((m) => m.estado === "activo");
  
  const totalHonorariosAceptados = activos.reduce(
    (sum, m) => sum + (m.honorarios_aceptados ?? m.honorarios_propuestos ?? 0),
    0
  );
  
  const totalPonderado = activos.reduce((sum, m) => {
    const fee = m.honorarios_aceptados ?? m.honorarios_propuestos ?? 0;
    const prob = (m.probability ?? 10) / 100;
    return sum + fee * prob;
  }, 0);

  const totalFacturado = mandatos.reduce(
    (sum, m) => sum + (m.fee_facturado ?? 0),
    0
  );

  const conFecha = activos.filter((m) => m.fecha_cierre || m.expected_close_date);

  const kpis = [
    {
      label: "Honorarios Activos",
      value: fmt(totalHonorariosAceptados),
      icon: Euro,
      description: "Total honorarios aceptados/propuestos",
    },
    {
      label: "Forecast Ponderado",
      value: fmt(totalPonderado),
      icon: Target,
      description: "Honorarios × probabilidad de cierre",
    },
    {
      label: "Ya Facturado",
      value: fmt(totalFacturado),
      icon: CheckCircle2,
      description: "Total facturado a fecha",
    },
    {
      label: "Con Fecha Cierre",
      value: `${conFecha.length} / ${activos.length}`,
      icon: CalendarClock,
      description: "Mandatos activos con fecha estimada",
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {kpis.map((kpi) => (
        <Card key={kpi.label}>
          <CardContent className="pt-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-muted-foreground">{kpi.label}</p>
                <p className="text-2xl font-bold mt-1">{kpi.value}</p>
                <p className="text-xs text-muted-foreground mt-1">{kpi.description}</p>
              </div>
              <kpi.icon className="h-5 w-5 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
