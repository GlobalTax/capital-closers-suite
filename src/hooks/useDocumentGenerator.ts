import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import type { DocumentType, NDAData, MandatoVentaData, MandatoCompraData, LOIData, DEFAULT_VALUES } from '@/types/document-generators';
import { generateNDAPdf, previewNDAPdf } from '@/components/documentos/generators/NDAGenerator';
import { generateMandatoVentaPdf, previewMandatoVentaPdf } from '@/components/documentos/generators/MandatoVentaGenerator';
import { generateMandatoCompraPdf, previewMandatoCompraPdf } from '@/components/documentos/generators/MandatoCompraGenerator';
import { generateLOIPdf, previewLOIPdf } from '@/components/documentos/generators/LOIGenerator';
import { format } from 'date-fns';

type DocumentData = NDAData | MandatoVentaData | MandatoCompraData | LOIData;

interface UseDocumentGeneratorReturn {
  isGenerating: boolean;
  isSaving: boolean;
  previewUrl: string | null;
  generatePreview: (type: DocumentType, data: DocumentData) => void;
  downloadDocument: (type: DocumentType, data: DocumentData, filename?: string) => void;
  saveToMandato: (type: DocumentType, data: DocumentData, mandatoId: string, folderId?: string) => Promise<boolean>;
  clearPreview: () => void;
}

export function useDocumentGenerator(): UseDocumentGeneratorReturn {
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const generatePreview = useCallback((type: DocumentType, data: DocumentData) => {
    setIsGenerating(true);
    try {
      // Revocar URL anterior para evitar memory leak
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }

      let url: string;
      switch (type) {
        case 'nda':
          url = previewNDAPdf(data as NDAData);
          break;
        case 'mandato_venta':
          url = previewMandatoVentaPdf(data as MandatoVentaData);
          break;
        case 'mandato_compra':
          url = previewMandatoCompraPdf(data as MandatoCompraData);
          break;
        case 'loi':
          url = previewLOIPdf(data as LOIData);
          break;
        default:
          throw new Error(`Tipo de documento no soportado: ${type}`);
      }
      setPreviewUrl(url);
    } catch (error) {
      console.error('Error generating preview:', error);
      toast({
        title: 'Error',
        description: 'No se pudo generar la vista previa del documento',
        variant: 'destructive',
      });
    } finally {
      setIsGenerating(false);
    }
  }, [previewUrl]);

  const downloadDocument = useCallback((type: DocumentType, data: DocumentData, filename?: string) => {
    try {
      let doc;
      let defaultFilename: string;
      
      switch (type) {
        case 'nda':
          doc = generateNDAPdf(data as NDAData);
          defaultFilename = `NDA_${format(new Date(), 'yyyyMMdd')}.pdf`;
          break;
        case 'mandato_venta':
          doc = generateMandatoVentaPdf(data as MandatoVentaData);
          defaultFilename = `Mandato_Venta_${format(new Date(), 'yyyyMMdd')}.pdf`;
          break;
        case 'mandato_compra':
          doc = generateMandatoCompraPdf(data as MandatoCompraData);
          defaultFilename = `Mandato_Compra_${format(new Date(), 'yyyyMMdd')}.pdf`;
          break;
        case 'loi':
          doc = generateLOIPdf(data as LOIData);
          defaultFilename = `LOI_${format(new Date(), 'yyyyMMdd')}.pdf`;
          break;
        default:
          throw new Error(`Tipo de documento no soportado: ${type}`);
      }
      
      doc.save(filename || defaultFilename);
      
      toast({
        title: 'Documento descargado',
        description: 'El documento se ha descargado correctamente',
      });
    } catch (error) {
      console.error('Error downloading document:', error);
      toast({
        title: 'Error',
        description: 'No se pudo descargar el documento',
        variant: 'destructive',
      });
    }
  }, []);

  const saveToMandato = useCallback(async (
    type: DocumentType, 
    data: DocumentData, 
    mandatoId: string,
    folderId?: string
  ): Promise<boolean> => {
    setIsSaving(true);
    try {
      // Generate PDF
      let doc;
      let filename: string;
      let documentTipo: string;
      
      switch (type) {
        case 'nda':
          doc = generateNDAPdf(data as NDAData);
          filename = `NDA_${format(new Date(), 'yyyyMMdd_HHmmss')}.pdf`;
          documentTipo = 'NDA';
          break;
        case 'mandato_venta':
          doc = generateMandatoVentaPdf(data as MandatoVentaData);
          filename = `Mandato_Venta_${format(new Date(), 'yyyyMMdd_HHmmss')}.pdf`;
          documentTipo = 'Mandato';
          break;
        case 'mandato_compra':
          doc = generateMandatoCompraPdf(data as MandatoCompraData);
          filename = `Mandato_Compra_${format(new Date(), 'yyyyMMdd_HHmmss')}.pdf`;
          documentTipo = 'Mandato';
          break;
        case 'loi':
          doc = generateLOIPdf(data as LOIData);
          filename = `LOI_${format(new Date(), 'yyyyMMdd_HHmmss')}.pdf`;
          documentTipo = 'LOI';
          break;
        default:
          throw new Error(`Tipo de documento no soportado: ${type}`);
      }

      // Convert to blob
      const pdfBlob = doc.output('blob');
      
      // Upload to storage
      const storagePath = `mandatos/${mandatoId}/documentos_generados/${filename}`;
      
      const { error: uploadError } = await supabase.storage
        .from('mandato-documentos')
        .upload(storagePath, pdfBlob, {
          contentType: 'application/pdf',
          upsert: false,
        });

      if (uploadError) {
        throw uploadError;
      }

      // Save to database
      const { error: dbError } = await supabase
        .from('documentos')
        .insert({
          mandato_id: mandatoId,
          folder_id: folderId || null,
          file_name: filename,
          file_size_bytes: pdfBlob.size,
          mime_type: 'application/pdf',
          storage_path: storagePath,
          tipo: documentTipo,
          descripcion: `Documento ${documentTipo} generado automáticamente`,
          version: 1,
          is_latest_version: true,
        });

      if (dbError) {
        throw dbError;
      }

      toast({
        title: 'Documento guardado',
        description: 'El documento se ha guardado en el mandato correctamente',
      });

      return true;
    } catch (error) {
      console.error('Error saving document:', error);
      toast({
        title: 'Error',
        description: 'No se pudo guardar el documento en el mandato',
        variant: 'destructive',
      });
      return false;
    } finally {
      setIsSaving(false);
    }
  }, []);

  const clearPreview = useCallback(() => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    }
  }, [previewUrl]);

  return {
    isGenerating,
    isSaving,
    previewUrl,
    generatePreview,
    downloadDocument,
    saveToMandato,
    clearPreview,
  };
}
