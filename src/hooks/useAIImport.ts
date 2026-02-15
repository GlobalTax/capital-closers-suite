import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface ExtractedEmpresa {
  nombre: string | null;
  cif: string | null;
  sector: string | null;
  sitio_web: string | null;
  empleados: number | null;
  facturacion: number | null;
  ebitda: number | null;
  direccion: string | null;
  pais: string | null;
}

interface ExtractedContacto {
  nombre: string | null;
  apellidos: string | null;
  email: string | null;
  telefono: string | null;
  cargo: string | null;
  linkedin: string | null;
}

export interface ExtractedData {
  empresa: ExtractedEmpresa;
  contacto: ExtractedContacto;
}

interface AIImportState {
  isProcessing: boolean;
  extractedData: ExtractedData | null;
  imagePreview: string | null;
  error: string | null;
}

export function useAIImport() {
  const [state, setState] = useState<AIImportState>({
    isProcessing: false,
    extractedData: null,
    imagePreview: null,
    error: null,
  });

  const processImage = async (file: File) => {
    setState(prev => ({ ...prev, isProcessing: true, error: null, extractedData: null }));

    try {
      // Crear preview
      const reader = new FileReader();
      const base64Promise = new Promise<string>((resolve, reject) => {
        reader.onload = () => {
          const result = reader.result as string;
          const base64 = result.split(',')[1];
          resolve(base64);
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      const base64 = await base64Promise;
      setState(prev => ({ ...prev, imagePreview: `data:${file.type};base64,${base64}` }));

      // Llamar a la edge function
      const { data, error } = await supabase.functions.invoke('extract-data-from-image', {
        body: { imageBase64: base64 }
      });

      if (error) {
        throw new Error(error.message || 'Error al procesar la imagen');
      }

      if (!data.success) {
        throw new Error(data.error || 'No se pudieron extraer datos');
      }

      setState(prev => ({ 
        ...prev, 
        extractedData: data.data,
        isProcessing: false 
      }));

      toast.success('Datos extraídos correctamente');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Error desconocido';
      setState(prev => ({ ...prev, error: message, isProcessing: false }));
      toast.error(`Error: ${message}`);
    }
  };

  const updateExtractedData = (data: ExtractedData) => {
    setState(prev => ({ ...prev, extractedData: data }));
  };

  const createEmpresa = async (): Promise<string | null> => {
    if (!state.extractedData?.empresa.nombre) {
      toast.error('El nombre de la empresa es obligatorio');
      return null;
    }

    try {
      // Verificar duplicados por CIF o nombre
      let duplicateQuery = supabase
        .from('empresas')
        .select('id, nombre');

      const cif = state.extractedData.empresa.cif;
      const nombre = state.extractedData.empresa.nombre;
      const safeName = nombre.replace(/%/g, '\\%').replace(/_/g, '\\_');

      if (cif) {
        duplicateQuery = duplicateQuery.or(`cif.eq.${cif},nombre.ilike.${safeName}`);
      } else {
        duplicateQuery = duplicateQuery.ilike('nombre', safeName);
      }

      const { data: existing } = await duplicateQuery
        .limit(1)
        .maybeSingle();

      if (existing) {
        toast.error(`Ya existe una empresa similar: ${existing.nombre}`);
        return null;
      }

      const { data, error } = await supabase
        .from('empresas')
        .insert({
          nombre: state.extractedData.empresa.nombre,
          cif: state.extractedData.empresa.cif,
          sector: state.extractedData.empresa.sector,
          sitio_web: state.extractedData.empresa.sitio_web,
          empleados: state.extractedData.empresa.empleados,
          facturacion: state.extractedData.empresa.facturacion,
          ebitda: state.extractedData.empresa.ebitda,
          direccion: state.extractedData.empresa.direccion,
          pais: state.extractedData.empresa.pais,
        })
        .select('id')
        .single();

      if (error) throw error;

      toast.success('Empresa creada correctamente');
      return data.id;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Error al crear empresa';
      toast.error(message);
      return null;
    }
  };

  const createContacto = async (empresaId?: string): Promise<string | null> => {
    if (!state.extractedData?.contacto.nombre) {
      toast.error('El nombre del contacto es obligatorio');
      return null;
    }

    try {
      // Verificar duplicados por email
      if (state.extractedData.contacto.email) {
        const { data: existing } = await supabase
          .from('contactos')
          .select('id, nombre')
          .eq('email', state.extractedData.contacto.email)
          .limit(1)
          .maybeSingle();

        if (existing) {
          toast.error(`Ya existe un contacto con ese email: ${existing.nombre}`);
          return null;
        }
      }

      const { data, error } = await supabase
        .from('contactos')
        .insert({
          nombre: state.extractedData.contacto.nombre,
          apellidos: state.extractedData.contacto.apellidos,
          email: state.extractedData.contacto.email,
          telefono: state.extractedData.contacto.telefono,
          cargo: state.extractedData.contacto.cargo,
          linkedin: state.extractedData.contacto.linkedin,
          empresa_id: empresaId || null,
        })
        .select('id')
        .single();

      if (error) throw error;

      toast.success('Contacto creado correctamente');
      return data.id;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Error al crear contacto';
      toast.error(message);
      return null;
    }
  };

  const createBoth = async (): Promise<{ empresaId: string | null; contactoId: string | null }> => {
    const empresaId = await createEmpresa();
    const contactoId = await createContacto(empresaId || undefined);
    return { empresaId, contactoId };
  };

  const logImport = async (params: {
    imageUrl: string;
    empresaId?: string | null;
    contactoId?: string | null;
  }) => {
    try {
      await supabase.from('ai_imports').insert({
        image_url: params.imageUrl,
        extracted_data: state.extractedData || {},
        empresa_id: params.empresaId,
        contacto_id: params.contactoId,
        status: 'completed',
      });
    } catch (error) {
      console.error('Error logging import:', error);
    }
  };

  const reset = () => {
    setState({
      isProcessing: false,
      extractedData: null,
      imagePreview: null,
      error: null,
    });
  };

  return {
    ...state,
    processImage,
    updateExtractedData,
    createEmpresa,
    createContacto,
    createBoth,
    logImport,
    reset,
  };
}
