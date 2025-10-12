import { TVColumn } from "./TVColumn";
import { Inbox, Phone, CheckCircle, Briefcase, Handshake, Trophy } from "lucide-react";
import type { TVDashboardData } from "@/hooks/useTVDashboard";

interface TVKanbanBoardProps {
  data: TVDashboardData;
}

export function TVKanbanBoard({ data }: TVKanbanBoardProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 h-full animate-fade-in">
      <TVColumn
        title="Nuevos Leads"
        leads={data.nuevosLeads}
        color="yellow"
        icon={Inbox}
      />
      <TVColumn
        title="En Contacto"
        leads={data.enContacto}
        color="blue"
        icon={Phone}
      />
      <TVColumn
        title="Calificados"
        leads={data.calificados}
        color="green"
        icon={CheckCircle}
      />
      <TVColumn
        title="Mandato Activo"
        leads={data.mandatosActivos}
        color="purple"
        icon={Briefcase}
      />
      <TVColumn
        title="En Negociación"
        leads={data.enNegociacion}
        color="orange"
        icon={Handshake}
      />
      <TVColumn
        title="Cerrado Ganado"
        leads={data.cerrados}
        color="emerald"
        icon={Trophy}
      />
    </div>
  );
}
