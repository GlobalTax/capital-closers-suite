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

/**
 * Normaliza email: trim + lowercase
 */
export function normalizeEmail(email: string): string {
  if (!email) return '';
  return email.trim().toLowerCase();
}

/**
 * Normaliza teléfono para almacenamiento:
 * - Mantiene solo dígitos y + inicial
 * - Resultado: "+34600123456" o "600123456"
 */
export function normalizePhone(phone: string): string {
  if (!phone) return '';
  
  const trimmed = phone.trim();
  if (!trimmed) return '';
  
  // Extraer si empieza con +
  const hasPlus = trimmed.startsWith('+');
  
  // Mantener solo dígitos
  const digits = trimmed.replace(/\D/g, '');
  
  if (!digits) return '';
  
  return hasPlus ? `+${digits}` : digits;
}

/**
 * Normaliza CIF/NIF para almacenamiento:
 * - Trim, uppercase
 * - Elimina espacios, guiones, puntos
 */
export function normalizeCIF(cif: string): string {
  if (!cif) return '';
  return cif.trim().toUpperCase().replace(/[\s\-\.]/g, '');
}

/**
 * Formatea teléfono para WhatsApp API
 * - Si ya tiene prefijo país (ej: +34), lo usa
 * - Si no tiene prefijo, devuelve los dígitos (WhatsApp intentará inferir)
 * - Devuelve null si el formato es inválido
 */
export function formatPhoneForWhatsApp(phone: string): { number: string; hasCountryCode: boolean } | null {
  if (!phone) return null;
  
  const normalized = normalizePhone(phone);
  if (!normalized) return null;
  
  // Obtener solo dígitos para WhatsApp
  const digitsOnly = normalized.replace(/\D/g, '');
  
  // Verificar si tiene código de país (empieza con + o tiene más de 10 dígitos)
  const hasCountryCode = normalized.startsWith('+') || digitsOnly.length > 10;
  
  return {
    number: digitsOnly,
    hasCountryCode
  };
}
