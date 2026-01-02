import { BaseService } from "./base.service";
import { supabase } from "@/integrations/supabase/client";
import { DatabaseError } from "@/lib/error-handler";
import type { Documento } from "@/types";
import type { DocumentoRow, DocumentoInsert, DocumentoUpdate } from "@/types/database";
import type { PaginatedResult } from "@/types/pagination";
import { calculatePagination, DEFAULT_PAGE_SIZE } from "@/types/pagination";

class DocumentoService extends BaseService<Documento, DocumentoInsert, DocumentoUpdate> {
  constructor() {
    super('documentos');
  }

  protected transform(raw: DocumentoRow): Documento {
    return {
      id: raw.id,
      file_name: raw.file_name || '',
      file_size_bytes: raw.file_size_bytes || 0,
      mime_type: raw.mime_type || '',
      storage_path: raw.storage_path || '',
      tipo: (raw.tipo as any) || 'Otro',
      mandato_id: raw.mandato_id || undefined,
      tags: raw.tags || undefined,
      uploaded_by: raw.uploaded_by || undefined,
      created_at: raw.created_at || new Date().toISOString(),
      updated_at: raw.updated_at || new Date().toISOString(),
    } as Documento;
  }

  /**
   * Obtener documentos con paginación server-side
   */
  async getAllPaginated(
    page: number = 1,
    pageSize: number = DEFAULT_PAGE_SIZE
  ): Promise<PaginatedResult<Documento>> {
    const offset = (page - 1) * pageSize;

    const { data, error, count } = await supabase
      .from('documentos')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + pageSize - 1);

    if (error) {
      throw new DatabaseError('Error obteniendo documentos paginados', {
        table: 'documentos',
        code: error.code,
      });
    }

    return {
      data: this.transformMany(data || []),
      ...calculatePagination(count || 0, page, pageSize),
    };
  }

  async getByMandato(mandatoId: string): Promise<Documento[]> {
    const { data, error } = await supabase
      .from('documentos')
      .select('*')
      .eq('mandato_id', mandatoId)
      .order('created_at', { ascending: false });

    if (error) {
      throw new DatabaseError('Error obteniendo documentos del mandato', {
        table: 'documentos',
        code: error.code,
      });
    }

    return this.transformMany(data || []);
  }

  async getByContacto(contactoId: string) {
    const { data, error } = await supabase
      .from('contacto_documentos')
      .select(`
        *,
        documento:documentos(*)
      `)
      .eq('contacto_id', contactoId)
      .order('fecha_compartido', { ascending: false });

    if (error) {
      throw new DatabaseError('Error obteniendo documentos del contacto', {
        table: 'contacto_documentos',
        code: error.code,
      });
    }

    return data || [];
  }

  async getByEmpresa(empresaId: string) {
    const { data, error } = await supabase
      .from('empresa_documentos')
      .select(`
        *,
        documento:documentos(*)
      `)
      .eq('empresa_id', empresaId)
      .order('fecha_compartido', { ascending: false });

    if (error) {
      throw new DatabaseError('Error obteniendo documentos de la empresa', {
        table: 'empresa_documentos',
        code: error.code,
      });
    }

    return data || [];
  }

  async vincularContacto(contactoId: string, documentoId: string, notas?: string) {
    const { data, error } = await supabase
      .from('contacto_documentos')
      .insert({ contacto_id: contactoId, documento_id: documentoId, notas })
      .select()
      .single();

    if (error) {
      throw new DatabaseError('Error vinculando documento a contacto', {
        code: error.code,
      });
    }

    return data;
  }

  async desvincularContacto(contactoId: string, documentoId: string) {
    const { error } = await supabase
      .from('contacto_documentos')
      .delete()
      .eq('contacto_id', contactoId)
      .eq('documento_id', documentoId);

    if (error) {
      throw new DatabaseError('Error desvinculando documento de contacto', {
        code: error.code,
      });
    }
  }

  async vincularEmpresa(empresaId: string, documentoId: string, notas?: string) {
    const { data, error } = await supabase
      .from('empresa_documentos')
      .insert({ empresa_id: empresaId, documento_id: documentoId, notas })
      .select()
      .single();

    if (error) {
      throw new DatabaseError('Error vinculando documento a empresa', {
        code: error.code,
      });
    }

    return data;
  }

  async desvincularEmpresa(empresaId: string, documentoId: string) {
    const { error } = await supabase
      .from('empresa_documentos')
      .delete()
      .eq('empresa_id', empresaId)
      .eq('documento_id', documentoId);

    if (error) {
      throw new DatabaseError('Error desvinculando documento de empresa', {
        code: error.code,
      });
    }
  }
}

// Singleton instance
const documentoService = new DocumentoService();

// Exported functions
export const fetchDocumentos = () => documentoService.getAll();
export const fetchDocumentosPaginated = (page: number, pageSize: number) => 
  documentoService.getAllPaginated(page, pageSize);
export const getDocumentoById = (id: string) => documentoService.getById(id);
export const createDocumento = (data: DocumentoInsert) => documentoService.create(data);
export const deleteDocumento = (id: string) => documentoService.delete(id);
export const getContactoDocumentos = (contactoId: string) => documentoService.getByContacto(contactoId);
export const getEmpresaDocumentos = (empresaId: string) => documentoService.getByEmpresa(empresaId);
export const vincularDocumentoContacto = (contactoId: string, documentoId: string, notas?: string) => 
  documentoService.vincularContacto(contactoId, documentoId, notas);
export const desvincularDocumentoContacto = (contactoId: string, documentoId: string) => 
  documentoService.desvincularContacto(contactoId, documentoId);
export const vincularDocumentoEmpresa = (empresaId: string, documentoId: string, notas?: string) => 
  documentoService.vincularEmpresa(empresaId, documentoId, notas);
export const desvincularDocumentoEmpresa = (empresaId: string, documentoId: string) => 
  documentoService.desvincularEmpresa(empresaId, documentoId);
