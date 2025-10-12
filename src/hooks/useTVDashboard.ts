import { useQuery } from "@tanstack/react-query";
import {
  fetchNuevosLeads,
  fetchLeadsEnContacto,
  fetchLeadsCalificados,
  fetchMandatosActivos,
  fetchMandatosEnNegociacion,
  fetchMandatosCerrados,
  type UnifiedLead
} from "@/services/dashboardTV";

export interface TVDashboardData {
  nuevosLeads: UnifiedLead[];
  enContacto: UnifiedLead[];
  calificados: UnifiedLead[];
  mandatosActivos: UnifiedLead[];
  enNegociacion: UnifiedLead[];
  cerrados: UnifiedLead[];
}

export function useTVDashboard(refreshInterval: number = 60000) {
  return useQuery({
    queryKey: ['tv-dashboard'],
    queryFn: async (): Promise<TVDashboardData> => {
      const [
        nuevosLeads,
        enContacto,
        calificados,
        mandatosActivos,
        enNegociacion,
        cerrados
      ] = await Promise.all([
        fetchNuevosLeads(),
        fetchLeadsEnContacto(),
        fetchLeadsCalificados(),
        fetchMandatosActivos(),
        fetchMandatosEnNegociacion(),
        fetchMandatosCerrados()
      ]);

      return {
        nuevosLeads,
        enContacto,
        calificados,
        mandatosActivos,
        enNegociacion,
        cerrados
      };
    },
    staleTime: 30000, // 30 segundos
    refetchInterval: refreshInterval,
    refetchOnWindowFocus: true
  });
}
