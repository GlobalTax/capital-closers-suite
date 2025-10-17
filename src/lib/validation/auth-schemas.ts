import { z } from 'zod';

// ============================================================================
// SCHEMAS DE AUTENTICACIÓN
// ============================================================================

/**
 * Schema para validación de email
 */
export const emailSchema = z
  .string()
  .trim()
  .email('Email inválido')
  .max(254, 'El email no puede superar 254 caracteres')
  .refine(
    (email) => {
      // Evitar emails de prueba comunes
      const testEmails = ['test', 'fake', 'ejemplo', 'example'];
      return !testEmails.some((term) => email.toLowerCase().includes(term));
    },
    { message: 'El email no puede contener términos de prueba' }
  );

/**
 * Schema para contraseñas seguras
 * Requisitos:
 * - Mínimo 12 caracteres
 * - Al menos una mayúscula
 * - Al menos una minúscula
 * - Al menos un número
 * - Al menos un carácter especial
 */
export const passwordSchema = z
  .string()
  .min(12, 'La contraseña debe tener al menos 12 caracteres')
  .max(128, 'La contraseña no puede superar 128 caracteres')
  .regex(/[A-Z]/, 'Debe contener al menos una letra mayúscula')
  .regex(/[a-z]/, 'Debe contener al menos una letra minúscula')
  .regex(/[0-9]/, 'Debe contener al menos un número')
  .regex(/[^A-Za-z0-9]/, 'Debe contener al menos un carácter especial (!@#$%^&*)')
  .refine(
    (password) => {
      // Evitar contraseñas débiles comunes
      const weakPasswords = [
        'password123',
        'Password123!',
        '123456789abc',
        'qwerty123456',
        'admin123456!',
      ];
      return !weakPasswords.includes(password);
    },
    { message: 'Esta contraseña es demasiado común, elige una más segura' }
  );

/**
 * Schema para nombres completos
 */
export const fullNameSchema = z
  .string()
  .trim()
  .min(2, 'El nombre debe tener al menos 2 caracteres')
  .max(100, 'El nombre no puede superar 100 caracteres')
  .regex(/^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s'-]+$/, 'El nombre solo puede contener letras, espacios, guiones y apóstrofes');

/**
 * Schema para roles de administrador
 */
export const adminRoleSchema = z.enum(['super_admin', 'admin', 'editor', 'viewer'], {
  required_error: 'Debes seleccionar un rol',
  invalid_type_error: 'Rol inválido',
});

// ============================================================================
// SCHEMAS DE FORMULARIOS DE AUTENTICACIÓN
// ============================================================================

/**
 * Schema para login
 */
export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'La contraseña es requerida'),
});

export type LoginFormValues = z.infer<typeof loginSchema>;

/**
 * Schema para crear nuevo usuario administrativo
 */
export const adminUserSchema = z.object({
  email: emailSchema,
  full_name: fullNameSchema,
  role: adminRoleSchema,
});

export type AdminUserFormValues = z.infer<typeof adminUserSchema>;

/**
 * Schema para editar usuario administrativo
 */
export const editAdminUserSchema = z.object({
  full_name: fullNameSchema.optional(),
  role: adminRoleSchema.optional(),
  is_active: z.boolean().optional(),
});

export type EditAdminUserFormValues = z.infer<typeof editAdminUserSchema>;

/**
 * Schema para cambio de contraseña
 */
export const passwordChangeSchema = z
  .object({
    currentPassword: z.string().min(1, 'La contraseña actual es requerida'),
    newPassword: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'Las contraseñas no coinciden',
    path: ['confirmPassword'],
  })
  .refine((data) => data.currentPassword !== data.newPassword, {
    message: 'La nueva contraseña debe ser diferente a la actual',
    path: ['newPassword'],
  });

export type PasswordChangeFormValues = z.infer<typeof passwordChangeSchema>;

/**
 * Schema para establecer contraseña inicial
 */
export const setInitialPasswordSchema = z
  .object({
    password: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Las contraseñas no coinciden',
    path: ['confirmPassword'],
  });

export type SetInitialPasswordFormValues = z.infer<typeof setInitialPasswordSchema>;

/**
 * Schema para invitación de usuario
 */
export const inviteUserSchema = z.object({
  email: emailSchema,
  full_name: fullNameSchema,
  role: adminRoleSchema,
});

export type InviteUserFormValues = z.infer<typeof inviteUserSchema>;

/**
 * Schema para aceptar invitación
 */
export const acceptInvitationSchema = z
  .object({
    token: z.string().min(1, 'Token de invitación requerido'),
    password: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Las contraseñas no coinciden',
    path: ['confirmPassword'],
  });

export type AcceptInvitationFormValues = z.infer<typeof acceptInvitationSchema>;

// ============================================================================
// FUNCIONES DE VALIDACIÓN REUTILIZABLES
// ============================================================================

/**
 * Valida si un email es válido
 */
export function isValidEmail(email: string): boolean {
  try {
    emailSchema.parse(email);
    return true;
  } catch {
    return false;
  }
}

/**
 * Valida si una contraseña cumple los requisitos de seguridad
 */
export function isValidPassword(password: string): boolean {
  try {
    passwordSchema.parse(password);
    return true;
  } catch {
    return false;
  }
}

/**
 * Obtiene los errores de validación de contraseña como array
 */
export function getPasswordValidationErrors(password: string): string[] {
  const errors: string[] = [];

  if (password.length < 12) {
    errors.push('Mínimo 12 caracteres');
  }
  if (!/[A-Z]/.test(password)) {
    errors.push('Falta una mayúscula');
  }
  if (!/[a-z]/.test(password)) {
    errors.push('Falta una minúscula');
  }
  if (!/[0-9]/.test(password)) {
    errors.push('Falta un número');
  }
  if (!/[^A-Za-z0-9]/.test(password)) {
    errors.push('Falta un carácter especial');
  }

  return errors;
}

/**
 * Calcula la fortaleza de una contraseña (0-100)
 */
export function calculatePasswordStrength(password: string): number {
  let strength = 0;

  // Longitud
  if (password.length >= 12) strength += 25;
  else if (password.length >= 8) strength += 15;

  // Mayúsculas
  if (/[A-Z]/.test(password)) strength += 15;

  // Minúsculas
  if (/[a-z]/.test(password)) strength += 15;

  // Números
  if (/[0-9]/.test(password)) strength += 15;

  // Caracteres especiales
  if (/[^A-Za-z0-9]/.test(password)) strength += 15;

  // Variedad de caracteres
  const uniqueChars = new Set(password.split('')).size;
  if (uniqueChars >= 10) strength += 15;
  else if (uniqueChars >= 6) strength += 10;

  return Math.min(strength, 100);
}
