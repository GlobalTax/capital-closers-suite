import { MandatoTimeline } from "@/components/mandatos/MandatoTimeline";
import { MandatoTipoEspecifico } from "@/components/mandatos/MandatoTipoEspecifico";
import { InformacionFinancieraEditable } from "@/components/mandatos/InformacionFinancieraEditable";
import { ContactosClaveCard } from "@/components/mandatos/ContactosClaveCard";
import { ServicioHonorariosCard } from "@/components/mandatos/ServicioHonorariosCard";
import { EmpresaIdentificacionWrapper } from "@/components/mandatos/EmpresaIdentificacionWrapper";
import { DealSheetCard } from "@/features/mandatos/components/DealSheetCard";
import type { Mandato } from "@/types";

interface ResumenTabProps {
  mandato: Mandato;
  onAddContacto: () => void;
  onAsociarContacto: () => void;
  onUpdateEmpresa?: (empresaId: string, field: string, value: number | null) => Promise<void>;
  onUpdateEmpresaText?: (empresaId: string, field: string, value: string | null) => Promise<void>;
  onVincularEmpresa: () => void;
  onEditMandato?: () => void;
}

export function ResumenTab({ 
  mandato, 
  onAddContacto, 
  onAsociarContacto, 
  onUpdateEmpresa, 
  onUpdateEmpresaText,
  onVincularEmpresa,
  onEditMandato
}: ResumenTabProps) {
  const isServicio = mandato.categoria && mandato.categoria !== "operacion_ma";

  return (
    <div className="space-y-6">
      <MandatoTimeline
        fechaInicio={mandato.fecha_inicio}
        fechaCierre={mandato.fecha_cierre}
        estado={mandato.estado}
      />
      
      {/* Deal Sheet - solo para operaciones M&A */}
      {!isServicio && (
        <DealSheetCard 
          mandatoId={mandato.id} 
          mandatoNombre={mandato.codigo}
        />
      )}
      
      {/* Mostrar info de honorarios para servicios */}
      {isServicio && <ServicioHonorariosCard mandato={mandato} />}
      
      {/* Mostrar info específica de tipo solo para M&A */}
      {!isServicio && <MandatoTipoEspecifico mandato={mandato} onEdit={onEditMandato} />}
      
      {/* Información identificativa de la empresa (o estado vacío) */}
      <EmpresaIdentificacionWrapper
        mandato={mandato}
        onUpdate={onUpdateEmpresaText}
        onVincularEmpresa={onVincularEmpresa}
      />
      
      {/* Información financiera editable - solo si hay empresa */}
      {mandato.empresa_principal && (
        <InformacionFinancieraEditable 
          empresa={mandato.empresa_principal} 
          onUpdate={onUpdateEmpresa}
        />
      )}
      
      <ContactosClaveCard
        contactos={mandato.contactos || []}
        onAddContacto={onAddContacto}
        onAsociarContacto={onAsociarContacto}
      />
    </div>
  );
}