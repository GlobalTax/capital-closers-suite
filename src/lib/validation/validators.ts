import { z } from "zod";
import { ValidationError } from "../error-handler";

/**
 * Valida datos con un schema de Zod y lanza error si falla
 */
export function validateOrThrow<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): T {
  const result = schema.safeParse(data);
  
  if (!result.success) {
    const errors = result.error.errors.map(e => `${e.path.join('.')}: ${e.message}`);
    throw new ValidationError(
      'Datos inválidos',
      { errors, data }
    );
  }
  
  return result.data;
}

/**
 * Valida datos con un schema de Zod de forma segura (sin lanzar error)
 */
export function validateSafe<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): { success: true; data: T } | { success: false; errors: string[] } {
  const result = schema.safeParse(data);
  
  if (!result.success) {
    const errors = result.error.errors.map(e => `${e.path.join('.')}: ${e.message}`);
    return { success: false, errors };
  }
  
  return { success: true, data: result.data };
}

/**
 * Valida múltiples campos y retorna todos los errores
 */
export function validateMultiple<T extends Record<string, any>>(
  schemas: { [K in keyof T]: z.ZodSchema<T[K]> },
  data: T
): { success: true; data: T } | { success: false; errors: Record<string, string[]> } {
  const errors: Record<string, string[]> = {};
  const validatedData: Partial<T> = {};
  let hasErrors = false;

  for (const key in schemas) {
    const result = schemas[key].safeParse(data[key]);
    
    if (!result.success) {
      errors[key] = result.error.errors.map(e => e.message);
      hasErrors = true;
    } else {
      validatedData[key] = result.data;
    }
  }

  if (hasErrors) {
    return { success: false, errors };
  }

  return { success: true, data: validatedData as T };
}
