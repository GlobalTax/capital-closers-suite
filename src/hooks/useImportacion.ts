/**
 * Hook para manejar importaciones masivas
 */

import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import type { ParsedCSV } from "@/services/importacion/csvParser";

export type ImportType = 'mandatos' | 'contactos' | 'empresas';
export type DuplicateStrategy = 'skip' | 'update' | 'create_new';

export interface ImportConfig {
  autoCrearEmpresas: boolean;
  estrategiaDuplicados: DuplicateStrategy;
  sincronizarBrevo: boolean;
  validarCIF: boolean;
}

export interface ImportResult {
  name: string;
  status: 'success' | 'error' | 'skipped';
  message: string;
  rowIndex: number;
}

export interface ImportStats {
  total: number;
  successful: number;
  failed: number;
  skipped: number;
}

export const useImportacion = () => {
  const [importing, setImporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [results, setResults] = useState<ImportResult[]>([]);
  const [importLogId, setImportLogId] = useState<string | null>(null);
  const { toast } = useToast();

  const createImportLog = async (
    importType: ImportType,
    totalRecords: number,
    fileName: string,
    config: ImportConfig
  ): Promise<string> => {
    const { data, error } = await supabase
      .from('import_logs')
      .insert({
        import_type: importType,
        total_records: totalRecords,
        file_name: fileName,
        config: config as any,
        status: 'in_progress'
      })
      .select()
      .single();

    if (error) throw error;
    return data.id;
  };

  const updateImportLog = async (
    logId: string,
    stats: ImportStats,
    status: 'completed' | 'failed',
    errors?: any[]
  ) => {
    await supabase
      .from('import_logs')
      .update({
        successful: stats.successful,
        failed: stats.failed,
        skipped: stats.skipped,
        status,
        completed_at: new Date().toISOString(),
        errors: errors || []
      })
      .eq('id', logId);
  };

  const rollbackImport = async (logId: string) => {
    try {
      const { data, error } = await supabase.rpc('rollback_import', {
        p_import_log_id: logId
      }) as { data: any; error: any };

      if (error) throw error;

      const result = data as {
        deleted_mandatos: number;
        deleted_contactos: number;
        deleted_empresas: number;
      };

      toast({
        title: "✅ Importación revertida",
        description: `Se eliminaron ${result.deleted_mandatos} mandatos, ${result.deleted_contactos} contactos y ${result.deleted_empresas} empresas.`,
      });

      return result;
    } catch (error: any) {
      toast({
        title: "❌ Error al revertir",
        description: error.message,
        variant: "destructive"
      });
      throw error;
    }
  };

  const calculateStats = (results: ImportResult[]): ImportStats => {
    return {
      total: results.length,
      successful: results.filter(r => r.status === 'success').length,
      failed: results.filter(r => r.status === 'error').length,
      skipped: results.filter(r => r.status === 'skipped').length
    };
  };

  const resetImport = () => {
    setResults([]);
    setProgress(0);
    setImportLogId(null);
  };

  return {
    importing,
    setImporting,
    progress,
    setProgress,
    results,
    setResults,
    importLogId,
    setImportLogId,
    createImportLog,
    updateImportLog,
    rollbackImport,
    calculateStats,
    resetImport
  };
};
