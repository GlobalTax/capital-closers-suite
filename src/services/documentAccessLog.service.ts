import { supabase } from "@/integrations/supabase/client";

export type AccessType = 'download' | 'preview' | 'share';

export interface DocumentAccessLog {
  id: string;
  documento_id: string;
  documento_nombre: string | null;
  user_id: string;
  user_email: string | null;
  access_type: AccessType;
  ip_address: string | null;
  user_agent: string | null;
  accessed_at: string;
}

export const documentAccessLogService = {
  /**
   * Registra un acceso a documento (async, no bloquea descarga)
   */
  async logAccess(
    documentoId: string, 
    documentoNombre?: string,
    accessType: AccessType = 'download'
  ): Promise<string | null> {
    try {
      const { data, error } = await supabase.rpc('log_document_access', {
        p_documento_id: documentoId,
        p_documento_nombre: documentoNombre || null,
        p_access_type: accessType,
      });

      if (error) {
        console.error('Error logging document access:', error);
        return null;
      }

      return data;
    } catch (err) {
      console.error('Error logging document access:', err);
      return null;
    }
  },

  /**
   * Obtener historial de accesos de un documento
   */
  async getDocumentHistory(documentoId: string): Promise<DocumentAccessLog[]> {
    const { data, error } = await supabase
      .from('document_access_logs')
      .select('*')
      .eq('documento_id', documentoId)
      .order('accessed_at', { ascending: false });

    if (error) throw error;
    return (data || []) as unknown as DocumentAccessLog[];
  },

  /**
   * Obtener logs paginados para la vista de auditoría
   */
  async fetchAccessLogs(
    page = 1,
    pageSize = 50,
    filters: { dateFrom?: string; dateTo?: string; userId?: string; search?: string } = {}
  ) {
    let query = supabase
      .from('document_access_logs')
      .select('*', { count: 'exact' })
      .order('accessed_at', { ascending: false });

    if (filters.dateFrom) {
      query = query.gte('accessed_at', filters.dateFrom);
    }
    if (filters.dateTo) {
      query = query.lte('accessed_at', `${filters.dateTo}T23:59:59`);
    }
    if (filters.userId) {
      query = query.eq('user_id', filters.userId);
    }
    if (filters.search) {
      query = query.or(`documento_nombre.ilike.%${filters.search}%,user_email.ilike.%${filters.search}%`);
    }

    const offset = (page - 1) * pageSize;
    query = query.range(offset, offset + pageSize - 1);

    const { data, error, count } = await query;
    if (error) throw error;

    return {
      logs: (data || []) as unknown as DocumentAccessLog[],
      total: count || 0,
      totalPages: Math.ceil((count || 0) / pageSize),
    };
  },
};
