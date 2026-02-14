import { supabase } from "@/integrations/supabase/client";
import type { ResultadoBusqueda } from "@/types";

/** Escapa caracteres especiales de LIKE (% y _) para evitar inyección de wildcards */
function escapeLike(term: string): string {
  return term.replace(/%/g, '\\%').replace(/_/g, '\\_');
}

export const searchGlobal = async (query: string): Promise<ResultadoBusqueda[]> => {
  const sanitized = escapeLike(query.toLowerCase());
  const searchTerm = `%${sanitized}%`;

  try {
    // Ejecutar las 3 búsquedas en paralelo
    const [mandatosResult, contactosResult, empresasResult] = await Promise.all([
      supabase
        .from('mandatos')
        .select('id, descripcion, empresa_principal:empresas(nombre)')
        .or(`descripcion.ilike.${searchTerm}`)
        .limit(5),
      supabase
        .from('contactos')
        .select('id, nombre, apellidos, email, cargo, telefono')
        .or(`nombre.ilike.${searchTerm},apellidos.ilike.${searchTerm},email.ilike.${searchTerm},telefono.ilike.${searchTerm},cargo.ilike.${searchTerm}`)
        .limit(5),
      supabase
        .from('empresas')
        .select('id, nombre, sector')
        .ilike('nombre', searchTerm)
        .limit(5),
    ]);

    const results: ResultadoBusqueda[] = [];

    if (mandatosResult.data) {
      mandatosResult.data.forEach((m: any) => {
        results.push({
          tipo: "mandato",
          id: m.id,
          titulo: m.empresa_principal?.nombre || m.id,
          subtitulo: m.descripcion,
          ruta: `/mandatos/${m.id}`,
        });
      });
    }

    if (contactosResult.data) {
      contactosResult.data.forEach((c: any) => {
        results.push({
          tipo: "contacto",
          id: c.id,
          titulo: `${c.nombre} ${c.apellidos || ''}`.trim(),
          subtitulo: c.cargo || c.email,
          ruta: `/contactos/${c.id}`,
        });
      });
    }

    if (empresasResult.data) {
      empresasResult.data.forEach((e: any) => {
        results.push({
          tipo: "empresa",
          id: e.id,
          titulo: e.nombre,
          subtitulo: e.sector,
          ruta: `/empresas/${e.id}`,
        });
      });
    }

    return results;
  } catch (error) {
    console.error("Error en búsqueda global:", error);
    return [];
  }
};
