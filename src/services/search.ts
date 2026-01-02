import { supabase } from "@/integrations/supabase/client";
import type { ResultadoBusqueda } from "@/types";

export const searchGlobal = async (query: string): Promise<ResultadoBusqueda[]> => {
  const searchTerm = `%${query.toLowerCase()}%`;
  const results: ResultadoBusqueda[] = [];

  try {
    // Buscar mandatos
    const { data: mandatos } = await supabase
      .from('mandatos')
      .select('id, descripcion, empresa_principal:empresas(nombre)')
      .or(`descripcion.ilike.${searchTerm}`)
      .limit(5);

    if (mandatos) {
      mandatos.forEach((m: any) => {
        results.push({
          tipo: "mandato",
          id: m.id,
          titulo: m.empresa_principal?.nombre || m.id,
          subtitulo: m.descripcion,
          ruta: `/mandatos/${m.id}`,
        });
      });
    }

    // Buscar contactos (incluye teléfono y cargo)
    const { data: contactos } = await supabase
      .from('contactos')
      .select('id, nombre, apellidos, email, cargo, telefono')
      .or(`nombre.ilike.${searchTerm},apellidos.ilike.${searchTerm},email.ilike.${searchTerm},telefono.ilike.${searchTerm},cargo.ilike.${searchTerm}`)
      .limit(5);

    if (contactos) {
      contactos.forEach((c: any) => {
        results.push({
          tipo: "contacto",
          id: c.id,
          titulo: `${c.nombre} ${c.apellidos || ''}`.trim(),
          subtitulo: c.cargo || c.email,
          ruta: `/contactos/${c.id}`,
        });
      });
    }

    // Buscar empresas
    const { data: empresas } = await supabase
      .from('empresas')
      .select('id, nombre, sector')
      .ilike('nombre', searchTerm)
      .limit(5);

    if (empresas) {
      empresas.forEach((e: any) => {
        results.push({
          tipo: "empresa",
          id: e.id,
          titulo: e.nombre,
          subtitulo: e.sector,
          ruta: `/empresas/${e.id}`,
        });
      });
    }
  } catch (error) {
    console.error("Error en búsqueda global:", error);
  }

  return results;
};
