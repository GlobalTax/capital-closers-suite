import { TVColumn } from "./TVColumn";
import * as LucideIcons from "lucide-react";
import type { TVDashboardData } from "@/hooks/useTVDashboard";
import { useTVDashboardConfig } from "@/hooks/useTVDashboardConfig";
import type { UnifiedLead } from "@/services/dashboardTV";

interface TVKanbanBoardProps {
  data: TVDashboardData;
}

export function TVKanbanBoard({ data }: TVKanbanBoardProps) {
  const { columns, isLoading } = useTVDashboardConfig();

  const getLeadsForColumn = (fase_tipo: 'lead' | 'mandato', fase_id: string): UnifiedLead[] => {
    if (fase_tipo === 'lead') {
      switch (fase_id) {
        case 'new':
          return data.nuevosLeads;
        case 'contacted':
          return data.enContacto;
        case 'qualified':
          return data.calificados;
        default:
          return [];
      }
    } else {
      switch (fase_id) {
        case 'activo':
          return data.mandatosActivos;
        case 'en_negociacion':
          return data.enNegociacion;
        case 'cerrado':
          return data.cerrados;
        default:
          return [];
      }
    }
  };

  const getIcon = (iconName: string) => {
    return (LucideIcons as any)[iconName] || LucideIcons.Circle;
  };

  if (isLoading) {
    return <div className="flex items-center justify-center h-full">Cargando configuración...</div>;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 h-full animate-fade-in">
      {columns.map((col) => (
        <TVColumn
          key={col.id}
          title={col.columna_tv}
          leads={getLeadsForColumn(col.fase_tipo, col.fase_id)}
          color={col.color}
          icon={getIcon(col.icono)}
        />
      ))}
    </div>
  );
}
