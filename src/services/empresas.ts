import { supabase } from "@/integrations/supabase/client";
import { BaseService } from "./base.service";
import { DatabaseError } from "@/lib/error-handler";
import type { Empresa } from "@/types";

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
   * Obtener mandatos de una empresa
   */
  async getMandatos(empresaId: string) {
    const { data, error } = await supabase
      .from('mandato_empresas' as any)
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
  async getContactos(empresaId: string) {
    const { data, error } = await supabase
      .from('contactos' as any)
      .select(`
        *,
        empresa_principal:empresas(*)
      `)
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
export const getEmpresaById = (id: string) => empresaService.getById(id);
export const createEmpresa = (empresa: Partial<Empresa>) => empresaService.create(empresa);
export const updateEmpresa = (id: string, empresa: Partial<Empresa>) => empresaService.update(id, empresa);
export const deleteEmpresa = (id: string) => empresaService.delete(id);
export const getEmpresaMandatos = (empresaId: string) => empresaService.getMandatos(empresaId);
export const getEmpresaContactos = (empresaId: string) => empresaService.getContactos(empresaId);

// Alias for backward compatibility
export const fetchTargets = fetchEmpresas;
export const createTarget = createEmpresa;
export const updateTarget = updateEmpresa;
export const deleteTarget = deleteEmpresa;
