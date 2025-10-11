import { MandatoTimeline } from "@/components/mandatos/MandatoTimeline";
import { MandatoTipoEspecifico } from "@/components/mandatos/MandatoTipoEspecifico";
import { InformacionFinancieraEmpresa } from "@/components/mandatos/InformacionFinancieraEmpresa";
import { ContactosClaveCard } from "@/components/mandatos/ContactosClaveCard";
import type { Mandato } from "@/types";

interface ResumenTabProps {
  mandato: Mandato;
  onAddContacto: () => void;
}

export function ResumenTab({ mandato, onAddContacto }: ResumenTabProps) {
  return (
    <div className="space-y-6">
      <MandatoTimeline
        fechaInicio={mandato.fecha_inicio}
        fechaCierre={mandato.fecha_cierre}
        estado={mandato.estado}
      />
      
      <MandatoTipoEspecifico mandato={mandato} />
      
      {mandato.empresa_principal && (
        <InformacionFinancieraEmpresa empresa={mandato.empresa_principal} />
      )}
      
      <ContactosClaveCard
        contactos={mandato.contactos || []}
        onAddContacto={onAddContacto}
      />
    </div>
  );
}
