import { MandatoTimeline } from "@/components/mandatos/MandatoTimeline";
import { MandatoTipoEspecifico } from "@/components/mandatos/MandatoTipoEspecifico";
import { InformacionFinancieraEmpresa } from "@/components/mandatos/InformacionFinancieraEmpresa";
import { ContactosClaveCard } from "@/components/mandatos/ContactosClaveCard";
import { ServicioHonorariosCard } from "@/components/mandatos/ServicioHonorariosCard";
import type { Mandato } from "@/types";

interface ResumenTabProps {
  mandato: Mandato;
  onAddContacto: () => void;
  onAsociarContacto: () => void;
}

export function ResumenTab({ mandato, onAddContacto, onAsociarContacto }: ResumenTabProps) {
  const isServicio = mandato.categoria && mandato.categoria !== "operacion_ma";

  return (
    <div className="space-y-6">
      <MandatoTimeline
        fechaInicio={mandato.fecha_inicio}
        fechaCierre={mandato.fecha_cierre}
        estado={mandato.estado}
      />
      
      {/* Mostrar info de honorarios para servicios */}
      {isServicio && <ServicioHonorariosCard mandato={mandato} />}
      
      {/* Mostrar info específica de tipo solo para M&A */}
      {!isServicio && <MandatoTipoEspecifico mandato={mandato} />}
      
      {mandato.empresa_principal && (
        <InformacionFinancieraEmpresa empresa={mandato.empresa_principal} />
      )}
      
      <ContactosClaveCard
        contactos={mandato.contactos || []}
        onAddContacto={onAddContacto}
        onAsociarContacto={onAsociarContacto}
      />
    </div>
  );
}
