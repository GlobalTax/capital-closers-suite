import { supabase } from "@/integrations/supabase/client";
import { BaseService } from "./base.service";
import { DatabaseError } from "@/lib/error-handler";
import type { Empresa } from "@/types";
import type { PaginatedResult } from "@/types/pagination";
import { calculatePagination, DEFAULT_PAGE_SIZE } from "@/types/pagination";

/**
 * Servicio de empresas usando BaseService
 */
class EmpresaService extends BaseService<Empresa> {
  constructor() {
    super('empresas');
  }

  /**
   * Transformación de datos de BD a tipo de aplicación
   */
  protected transform(raw: any): Empresa {
    return {
      id: raw.id,
      nombre: raw.nombre,
      cif: raw.cif,
      sector: raw.sector,
      sitio_web: raw.sitio_web,
      empleados: raw.empleados ? Number(raw.empleados) : null,
      facturacion: raw.facturacion ? Number(raw.facturacion) : null,
      ebitda: raw.ebitda ? Number(raw.ebitda) : null,
      ubicacion: raw.ubicacion,
      descripcion: raw.descripcion,
      es_target: raw.es_target || false,
      potencial_search_fund: raw.potencial_search_fund || false,
      created_at: raw.created_at,
      updated_at: raw.updated_at,
    } as Empresa;
  }

  /**
   * Obtener empresas filtradas por tipo
   */
  async getAll(esTarget?: boolean): Promise<Empresa[]> {
    let query = supabase
      .from(this.tableName as any)
      .select('*')
      .order('created_at', { ascending: false });

    if (esTarget !== undefined) {
      query = query.eq('es_target', esTarget);
    }

    const { data, error } = await query;

    if (error) {
      throw new DatabaseError('Error al obtener empresas', {
        table: this.tableName,
        code: error.code,
        esTarget,
      });
    }

    return this.transformMany((data || []) as any[]);
  }

  /**
   * Obtener empresas con paginación server-side
   */
  async getAllPaginated(
    page: number = 1,
    pageSize: number = DEFAULT_PAGE_SIZE,
    esTarget?: boolean
  ): Promise<PaginatedResult<Empresa>> {
    const offset = (page - 1) * pageSize;

    let query = supabase
      .from(this.tableName as any)
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + pageSize - 1);

    if (esTarget !== undefined) {
      query = query.eq('es_target', esTarget);
    }

    const { data, error, count } = await query;

    if (error) {
      throw new DatabaseError('Error al obtener empresas paginadas', {
        table: this.tableName,
        code: error.code,
        esTarget,
      });
    }

    return {
      data: this.transformMany((data || []) as any[]),
      ...calculatePagination(count || 0, page, pageSize),
    };
  }

  /**
   * Obtener mandatos de una empresa
   */
  async getMandatos(empresaId: string) {
    const { data, error } = await supabase
      .from('mandato_empresas')
      .select(`
        mandato_id,
        mandatos:mandato_id (
          id,
          tipo,
          estado,
          valor,
          fecha_inicio,
          fecha_cierre,
          descripcion
        )
      `)
      .eq('empresa_id', empresaId);

    if (error) {
      throw new DatabaseError('Error al obtener mandatos de empresa', {
        empresaId,
        code: error.code,
      });
    }

    return (data || []).map((item: any) => item.mandatos).filter(Boolean);
  }

  /**
   * Obtener contactos de una empresa
   */
  async getContactos(empresaId: string): Promise<any[]> {
    const { data, error } = await supabase
      .from('contactos')
      .select('*')
      .eq('empresa_principal_id', empresaId)
      .order('created_at', { ascending: false });

    if (error) {
      throw new DatabaseError('Error al obtener contactos de empresa', {
        empresaId,
        code: error.code,
      });
    }

    return data || [];
  }
}

// Exportar instancia singleton del servicio
const empresaService = new EmpresaService();

// Exportar métodos para mantener compatibilidad con código existente
export const fetchEmpresas = (esTarget?: boolean) => empresaService.getAll(esTarget);
export const fetchEmpresasPaginated = (page: number, pageSize: number, esTarget?: boolean) => 
  empresaService.getAllPaginated(page, pageSize, esTarget);
export const getEmpresaById = (id: string) => empresaService.getById(id);
export const createEmpresa = (empresa: Partial<Empresa>) => empresaService.create(empresa);
export const updateEmpresa = (id: string, empresa: Partial<Empresa>) => empresaService.update(id, empresa);
export const deleteEmpresa = (id: string) => empresaService.delete(id);
export const getEmpresaMandatos = (empresaId: string) => empresaService.getMandatos(empresaId);
export const getEmpresaContactos = (empresaId: string) => empresaService.getContactos(empresaId);

/**
 * Buscar empresas similares por nombre (para detección de duplicados)
 */
export async function findSimilarEmpresas(
  nombre: string,
  cif?: string,
  web?: string
): Promise<{ id: string; nombre: string; sector?: string; similarity: number }[]> {
  if (!nombre || nombre.length < 2) return [];

  const searchTerm = nombre.toLowerCase().trim();
  
  // Build OR conditions for search
  let query = supabase
    .from('empresas')
    .select('id, nombre, sector, cif, sitio_web')
    .or(`nombre.ilike.%${searchTerm}%`)
    .limit(5);

  const { data, error } = await query;

  if (error) {
    console.error('Error finding similar empresas:', error);
    return [];
  }

  // Calculate similarity and sort
  const results = (data || []).map((emp) => {
    const empName = emp.nombre.toLowerCase();
    let similarity = 0;

    // Exact match
    if (empName === searchTerm) {
      similarity = 100;
    }
    // Starts with
    else if (empName.startsWith(searchTerm) || searchTerm.startsWith(empName)) {
      similarity = 90;
    }
    // Contains
    else if (empName.includes(searchTerm) || searchTerm.includes(empName)) {
      similarity = 70;
    }
    // Partial match
    else {
      const words = searchTerm.split(/\s+/);
      const matchingWords = words.filter(w => empName.includes(w));
      similarity = (matchingWords.length / words.length) * 60;
    }

    // Boost if CIF matches
    if (cif && emp.cif && emp.cif.toLowerCase() === cif.toLowerCase()) {
      similarity = 100;
    }

    // Boost if website matches
    if (web && emp.sitio_web) {
      const webDomain = web.replace(/https?:\/\//, '').replace(/www\./, '').split('/')[0];
      const empDomain = emp.sitio_web.replace(/https?:\/\//, '').replace(/www\./, '').split('/')[0];
      if (webDomain === empDomain) {
        similarity = Math.max(similarity, 95);
      }
    }

    return {
      id: emp.id,
      nombre: emp.nombre,
      sector: emp.sector || undefined,
      similarity: Math.round(similarity),
    };
  });

  return results
    .filter(r => r.similarity >= 50)
    .sort((a, b) => b.similarity - a.similarity);
}

// Alias for backward compatibility
export const fetchTargets = fetchEmpresas;
export const createTarget = createEmpresa;
export const updateTarget = updateEmpresa;
export const deleteTarget = deleteEmpresa;
