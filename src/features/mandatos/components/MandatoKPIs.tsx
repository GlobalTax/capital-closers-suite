import { ColorfulFinancialKPI } from "@/components/empresas/ColorfulFinancialKPI";
import { TrendingUp, DollarSign, Building2, Calendar, AlertCircle, CheckCircle, XCircle } from "lucide-react";
import type { Mandato } from "@/types";
import { formatCurrency } from "@/lib/mandato-utils";

interface MandatoKPIsProps {
  mandato: Mandato;
}

export function MandatoKPIs({ mandato }: MandatoKPIsProps) {
  const getEstadoConfig = (estado: string) => {
    const configs: Record<string, { color: 'green' | 'orange' | 'red' | 'blue' | 'yellow'; icon: any; label: string }> = {
      prospecto: { color: 'yellow', icon: AlertCircle, label: 'Prospecto' },
      activo: { color: 'green', icon: CheckCircle, label: 'Activo' },
      en_negociacion: { color: 'orange', icon: AlertCircle, label: 'En Negociación' },
      cerrado: { color: 'blue', icon: CheckCircle, label: 'Cerrado' },
      cancelado: { color: 'red', icon: XCircle, label: 'Cancelado' },
    };
    return configs[estado] || configs.activo;
  };

  const estadoConfig = getEstadoConfig(mandato.estado);

  // Calcular días restantes
  const diasRestantes = mandato.fecha_cierre 
    ? Math.ceil((new Date(mandato.fecha_cierre).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
    : null;

  const fechaCierreColor = diasRestantes && diasRestantes < 30 ? 'orange' : 'blue';

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <ColorfulFinancialKPI
        label="Estado"
        value={estadoConfig.label}
        subtitle={`Tipo: ${mandato.tipo === 'compra' ? 'Compra' : 'Venta'}`}
        icon={estadoConfig.icon}
        colorScheme={estadoConfig.color}
      />

      <ColorfulFinancialKPI
        label="Valor"
        value={formatCurrency(mandato.valor)}
        icon={DollarSign}
        colorScheme="purple"
      />

      <ColorfulFinancialKPI
        label="Empresa"
        value={mandato.empresa_principal?.nombre || "Sin asignar"}
        subtitle={mandato.empresa_principal?.sector}
        icon={Building2}
        colorScheme="blue"
      />

      <ColorfulFinancialKPI
        label="Fecha Cierre"
        value={
          mandato.fecha_cierre
            ? new Date(mandato.fecha_cierre).toLocaleDateString("es-ES", { 
                day: '2-digit', 
                month: 'short', 
                year: 'numeric' 
              })
            : "Sin definir"
        }
        subtitle={diasRestantes && diasRestantes > 0 ? `Faltan ${diasRestantes} días` : undefined}
        icon={Calendar}
        colorScheme={fechaCierreColor}
      />
    </div>
  );
}
