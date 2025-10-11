import { supabase } from "@/integrations/supabase/client";
import { DatabaseError, ValidationError, AppError } from "@/lib/error-handler";
import type { PostgrestError } from "@supabase/supabase-js";

/**
 * Base Service abstracto para todas las entidades
 * Proporciona funcionalidad común de CRUD y manejo de errores
 */
export abstract class BaseService<T, CreateDto = Partial<T>, UpdateDto = Partial<T>> {
  constructor(protected tableName: string) {}

  /**
   * Ejecuta una query de Supabase con manejo de errores
   */
  protected async query<R>(
    fn: () => Promise<{ data: R | null; error: PostgrestError | null }>
  ): Promise<R> {
    try {
      const { data, error } = await fn();

      if (error) {
        throw new DatabaseError(`Error en tabla ${this.tableName}`, {
          table: this.tableName,
          code: error.code,
          message: error.message,
          details: error.details,
        });
      }

      if (data === null) {
        throw new DatabaseError(`No se obtuvieron datos de ${this.tableName}`);
      }

      return data;
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new DatabaseError(`Error inesperado en ${this.tableName}`, {
        originalError: error,
      });
    }
  }

  /**
   * Transforma datos crudos de la BD al tipo de la aplicación
   * Debe ser implementado por cada servicio específico
   */
  protected abstract transform(raw: any): T;

  /**
   * Transforma array de datos crudos
   */
  protected transformMany(rawData: any[]): T[] {
    return rawData.map(item => this.transform(item));
  }

  /**
   * Valida datos antes de crear/actualizar
   * Puede ser sobrescrito por servicios específicos
   */
  protected validate(data: CreateDto | UpdateDto): void {
    if (!data || typeof data !== 'object') {
      throw new ValidationError('Datos inválidos', { data });
    }
  }

  /**
   * Obtener todos los registros
   */
  async getAll(): Promise<T[]> {
    const { data, error } = await supabase
      .from(this.tableName as any)
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      throw new DatabaseError(`Error al obtener ${this.tableName}`, {
        table: this.tableName,
        code: error.code,
        message: error.message,
      });
    }

    return this.transformMany((data || []) as any[]);
  }

  /**
   * Obtener un registro por ID
   */
  async getById(id: string): Promise<T | null> {
    if (!id) {
      throw new ValidationError('ID requerido');
    }

    const { data, error } = await supabase
      .from(this.tableName as any)
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null; // No encontrado
      }
      throw new DatabaseError(`Error al obtener ${this.tableName}`, {
        table: this.tableName,
        code: error.code,
      });
    }

    return this.transform(data);
  }

  /**
   * Crear un nuevo registro
   */
  async create(data: CreateDto): Promise<T> {
    this.validate(data);

    const { data: insertedData, error } = await supabase
      .from(this.tableName as any)
      .insert(data as any)
      .select()
      .single();

    if (error) {
      throw new DatabaseError(`Error al crear ${this.tableName}`, {
        table: this.tableName,
        code: error.code,
      });
    }

    return this.transform(insertedData);
  }

  /**
   * Actualizar un registro existente
   */
  async update(id: string, data: UpdateDto): Promise<T> {
    if (!id) {
      throw new ValidationError('ID requerido');
    }

    this.validate(data);

    const { data: updatedData, error } = await supabase
      .from(this.tableName as any)
      .update(data as any)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new DatabaseError(`Error al actualizar ${this.tableName}`, {
        table: this.tableName,
        code: error.code,
      });
    }

    return this.transform(updatedData);
  }

  /**
   * Eliminar un registro
   */
  async delete(id: string): Promise<void> {
    if (!id) {
      throw new ValidationError('ID requerido');
    }

    const { error } = await supabase
      .from(this.tableName as any)
      .delete()
      .eq('id', id);

    if (error) {
      throw new DatabaseError(`Error al eliminar ${this.tableName}`, {
        table: this.tableName,
        code: error.code,
      });
    }
  }

  /**
   * Soft delete (marcar como eliminado)
   */
  async softDelete(id: string, userId?: string): Promise<T> {
    if (!id) {
      throw new ValidationError('ID requerido');
    }

    const updateData: any = {
      is_deleted: true,
      deleted_at: new Date().toISOString(),
    };

    if (userId) {
      updateData.deleted_by = userId;
    }

    const { data, error } = await supabase
      .from(this.tableName as any)
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new DatabaseError(`Error al eliminar ${this.tableName}`, {
        table: this.tableName,
        code: error.code,
      });
    }

    return this.transform(data);
  }
}
