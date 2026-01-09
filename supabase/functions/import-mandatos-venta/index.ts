import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const mandatosData = [
  { codigo: "V-213", empresa: "OTEC", proyecto: "Proyecto Zenit" },
  { codigo: "V-256", empresa: "SELK SEL. DE SUM. IND. S.L.", proyecto: "Proyecto Olande" },
  { codigo: "V-278", empresa: "PROTIDENT S.L.", proyecto: "Proyecto Turia" },
  { codigo: "V-334", empresa: "CARTONAJES SAN PASCUAL", proyecto: "Proyecto Box" },
  { codigo: "V-338", empresa: "MDS HIGH QUALITY PREVENTION", proyecto: "Proyecto Abertis" },
  { codigo: "V-350", empresa: "PAVIMENTOS INDUSTRIALES PAVIRAT S.L.", proyecto: "Proyecto Firme" },
  { codigo: "V-43", empresa: "CARGESTION S.L.", proyecto: "Proyecto Gest" },
  { codigo: "V-59", empresa: "DORGRAF SL", proyecto: "Proyecto Graft" },
  { codigo: "V-109", empresa: "JAMONES SIERRA VERDE S.L.", proyecto: "Proyecto Harvest" },
  { codigo: "V-153", empresa: "LOGISTEL ACCESORIOS DE EMPRESA S.L.", proyecto: "Proyecto Kits" },
  { codigo: "V-155", empresa: "GEVE VINOS S.L.", proyecto: "Proyecto Wino" },
  { codigo: "V-156", empresa: "TUCSEGUR ALARMAS SL", proyecto: "Proyecto Aegis" },
  { codigo: "V-194", empresa: "COLABORA INGENERIOS", proyecto: "Proyecto Haul" },
  { codigo: "V-241", empresa: "GEINSUR SERVICIOS INTEGRALES SL", proyecto: "Proyecto Manteno" },
  { codigo: "V-296", empresa: "MACONSA SL", proyecto: "Proyecto Alvor" },
  { codigo: "V-309", empresa: "FASTER WEAR SL", proyecto: "Proyecto Velo" },
  { codigo: "V-329", empresa: "AQUORE", proyecto: "Proyecto Hidra" },
  { codigo: "V-333", empresa: "ALUJAVI SL", proyecto: "Proyecto Ventia" },
  { codigo: "V-352", empresa: "COSAMO PACKAGING SL", proyecto: "Proyecto Kappa" },
  { codigo: "V-382", empresa: "HORMIGONES SIERRA SL", proyecto: "Proyecto Eclipse" },
  { codigo: "V-422", empresa: "ENERGYEAR", proyecto: "Proyecto Sol" },
  { codigo: "V-424", empresa: "MQ DENT", proyecto: "Proyecto DELTA" },
  { codigo: "V-419", empresa: "VALLDAURADENT", proyecto: "Proyecto Zircon" },
  { codigo: "V-312", empresa: "MENYBER GLOBAL SERVICES", proyecto: "Proyecto Stratalis" },
  { codigo: "V-349", empresa: "BACUS BIER S.L", proyecto: "Proyecto Malta" },
  { codigo: "V-359", empresa: "JJM LOGÍSTICA", proyecto: "Proyecto Crossway" },
  { codigo: "V-372", empresa: "ARALIA GLOBAL SL", proyecto: "Proyecto Alarion" },
  { codigo: "V-373", empresa: "EXARISER", proyecto: "Proyecto Demox" },
  { codigo: "V-377", empresa: "REUSASSER SL", proyecto: "Proyecto Impero" },
  { codigo: "V-392", empresa: "FORJAS ESTILO ESPAÑOL SL", proyecto: "Proyecto URBAN" },
  { codigo: "V-400", empresa: "HERRERA-AURIA TELECOM", proyecto: null },
  { codigo: "V-405", empresa: "ADDINGPLUS", proyecto: null },
  { codigo: "V-406", empresa: "MATORFE SL", proyecto: "Proyecto Ferro" },
  { codigo: "V-407", empresa: "LOUIS ARMANND OPTICS SL", proyecto: "Proyecto EYE" },
  { codigo: "V-411", empresa: "CLÍNICA PIZARRO MONTENEGRO", proyecto: "Proyecto CEDAR" },
  { codigo: "V-412", empresa: "ABACO SUYTEC SA", proyecto: "Proyecto Tork" },
  { codigo: "V-414", empresa: "CONSTRUCCIONES Y APLICACIONES CRISAN", proyecto: "Proyecto Solid" },
  { codigo: "V-395", empresa: "ESV", proyecto: "Proyecto SECUR" },
  { codigo: "V-364", empresa: "FB INTEC", proyecto: "Proyecto Destra" },
  { codigo: "V-401", empresa: "EXCAVACIONS PETIT", proyecto: "Proyecto Tierra" },
  { codigo: "V-417", empresa: "EDIM VALLES", proyecto: "Proyecto Shield" },
  { codigo: "V-423", empresa: "RIVER SUMINISTROS Y EQUIPAMIENTO", proyecto: "Proyecto Tent" },
  { codigo: "V-427", empresa: "DENTAL GONZALO Y LAGUNAS", proyecto: "Proyecto ATLAS" },
  { codigo: "V-432", empresa: "RIALDENT", proyecto: "Proyecto True" },
  { codigo: "V-57", empresa: "WELDING COPPER", proyecto: "Proyecto Sonffa" },
  { codigo: "V-371", empresa: "AISLAMIENTOS CARTEYA", proyecto: "Proyecto Poli" },
  { codigo: "V-415", empresa: "CUINA SOLUCIÓ", proyecto: "Proyecto REY" },
  { codigo: "V-420", empresa: "TECNIFICACIÓN INDUSTRIAL IBERIA", proyecto: null },
  { codigo: "V-223", empresa: "UNIFORMES LANCELOT SL", proyecto: "Proyecto Vestia" },
  { codigo: "V-433", empresa: "SCHELLHAMMER BUSINESS SCHOOL", proyecto: "Proyecto Master" },
  { codigo: "V-434", empresa: "SISG SOLUCIONES INTEGRALES COCINAS INDUSTRIALES", proyecto: null },
];

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const results = {
      empresasCreadas: 0,
      mandatosCreados: 0,
      errores: [] as string[],
    };

    // Process each mandato
    for (const item of mandatosData) {
      try {
        // 1. Create or find empresa
        const { data: existingEmpresa } = await supabase
          .from("empresas")
          .select("id")
          .ilike("nombre", item.empresa)
          .maybeSingle();

        let empresaId: string;

        if (existingEmpresa) {
          empresaId = existingEmpresa.id;
        } else {
          const { data: newEmpresa, error: empresaError } = await supabase
            .from("empresas")
            .insert({
              nombre: item.empresa,
              sector: "Por clasificar",
            })
            .select("id")
            .single();

          if (empresaError) {
            results.errores.push(`Error creando empresa ${item.empresa}: ${empresaError.message}`);
            continue;
          }
          empresaId = newEmpresa.id;
          results.empresasCreadas++;
        }

        // 2. Check if mandato with this codigo already exists
        const { data: existingMandato } = await supabase
          .from("mandatos")
          .select("id")
          .eq("codigo", item.codigo)
          .maybeSingle();

        if (existingMandato) {
          results.errores.push(`Mandato ${item.codigo} ya existe, omitido`);
          continue;
        }

        // 3. Create mandato
        const { error: mandatoError } = await supabase
          .from("mandatos")
          .insert({
            codigo: item.codigo,
            tipo: "venta",
            categoria: "operacion_ma",
            nombre_proyecto: item.proyecto || null,
            empresa_principal_id: empresaId,
            estado: "activo",
            pipeline_stage: "prospeccion",
          });

        if (mandatoError) {
          results.errores.push(`Error creando mandato ${item.codigo}: ${mandatoError.message}`);
          continue;
        }
        results.mandatosCreados++;
      } catch (err) {
        results.errores.push(`Error procesando ${item.codigo}: ${err instanceof Error ? err.message : String(err)}`);
      }
    }

    return new Response(JSON.stringify(results), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : String(error) }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
