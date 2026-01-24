import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import type { Mandato, Documento, Tarea } from "@/types";
import { handleError } from "@/lib/error-handler";
import { toast } from "@/hooks/use-toast";
import { useMandato } from "./queries/useMandatos";

export function useMandatoDetalle(mandatoId: string | undefined) {
  const navigate = useNavigate();
  const [documentos, setDocumentos] = useState<Documento[]>([]);
  const [tareas, setTareas] = useState<Tarea[]>([]);
  const [loadingExtras, setLoadingExtras] = useState(true);
  
  // Usar React Query para el mandato principal
  const { 
    data: mandato, 
    isLoading: loadingMandato, 
    error,
    refetch: refetchMandato 
  } = useMandato(mandatoId);

  // Cargar datos relacionados (documentos y tareas)
  const cargarDatosRelacionados = useCallback(async () => {
    if (!mandatoId) return;
    
    try {
      setLoadingExtras(true);
      
      // Cargar documentos
      const { data: docsData, error: docsError } = await supabase
        .from("documentos")
        .select("*")
        .eq("mandato_id", mandatoId)
        .order("created_at", { ascending: false });

      if (docsError) throw docsError;
      setDocumentos((docsData || []) as Documento[]);

      // Cargar tareas
      const { data: tareasData, error: tareasError } = await supabase
        .from("tareas")
        .select("*")
        .eq("mandato_id", mandatoId)
        .order("created_at", { ascending: false });

      if (tareasError) throw tareasError;
      setTareas((tareasData || []) as Tarea[]);
    } catch (error) {
      handleError(error, "Carga de datos relacionados del mandato");
    } finally {
      setLoadingExtras(false);
    }
  }, [mandatoId]);

  useEffect(() => {
    cargarDatosRelacionados();
  }, [cargarDatosRelacionados]);

  // Cambiar estado del mandato
  const handleEstadoChange = async (nuevoEstado: string) => {
    if (!mandatoId) return;
    
    try {
      const { error } = await supabase
        .from("mandatos")
        .update({ estado: nuevoEstado })
        .eq("id", mandatoId);

      if (error) throw error;

      toast({
        title: "Estado actualizado",
        description: `El estado del mandato ha sido actualizado a ${nuevoEstado}`,
      });

      await refetchMandato();
    } catch (error) {
      handleError(error, "Actualización de estado del mandato");
    }
  };

  // Eliminar mandato
  const handleEliminar = async () => {
    if (!mandatoId) return;
    
    try {
      console.log('[useMandatoDetalle] Eliminando mandato:', mandatoId);
      
      const { error } = await supabase
        .from("mandatos")
        .delete()
        .eq("id", mandatoId);

      if (error) {
        console.error('[useMandatoDetalle] Error Supabase:', {
          code: error.code,
          message: error.message,
          details: error.details,
        });
        
        // Detectar error específico de permisos
        if (error.code === '42501') {
          throw new Error('No tienes permisos para eliminar este mandato');
        }
        throw error;
      }

      toast({
        title: "Mandato eliminado",
        description: "El mandato ha sido eliminado correctamente",
      });

      // Navegar al listado manteniendo el filtro de tipo
      const tipo = mandato?.tipo || 'venta';
      navigate(`/mandatos?tipo=${tipo}`);
    } catch (error: any) {
      console.error('[useMandatoDetalle] Error eliminando:', error);
      handleError(error, "Eliminación de mandato");
      throw error; // Re-throw para que el dialog lo capture
    }
  };

  // Valores computados
  const tareasAbiertas = tareas.filter(t => t.estado !== "completada");
  const targetsCount = (mandato as any)?.empresas?.length || 0;
  const documentosCount = documentos.length;
  const tareasPendientes = tareas.filter(t => t.estado === "pendiente").length;

  return {
    // Data
    mandato,
    documentos,
    tareas,
    
    // Loading states
    loading: loadingMandato || loadingExtras,
    loadingMandato,
    loadingExtras,
    error,
    
    // Actions
    refetch: async () => {
      await refetchMandato();
      await cargarDatosRelacionados();
    },
    handleEstadoChange,
    handleEliminar,
    refetchDocumentos: cargarDatosRelacionados,
    refetchTareas: cargarDatosRelacionados,
    
    // Computed values
    tareasAbiertas,
    targetsCount,
    documentosCount,
    tareasPendientes,
  };
}
