/**
 * Validador de datos de importación
 */

export interface ValidationError {
  field: string;
  message: string;
  severity: 'error' | 'warning';
}

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
}

// Regex patterns
const EMAIL_REGEX = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;
const PHONE_E164_REGEX = /^\+?[1-9]\d{1,14}$/;
const CIF_REGEX = /^[A-Z]\d{8}$/;
const URL_REGEX = /^https?:\/\/.+/;

export const validateEmail = (email: string): boolean => {
  return EMAIL_REGEX.test(email);
};

export const validatePhone = (phone: string): boolean => {
  if (!phone) return true; // Optional field
  return PHONE_E164_REGEX.test(phone);
};

export const validateCIF = (cif: string): boolean => {
  if (!cif) return true; // Optional field
  return CIF_REGEX.test(cif.toUpperCase());
};

export const validateURL = (url: string): boolean => {
  if (!url) return true; // Optional field
  return URL_REGEX.test(url);
};

export const validateDate = (dateStr: string): boolean => {
  if (!dateStr) return true; // Optional field
  const date = new Date(dateStr);
  return !isNaN(date.getTime());
};

export const validateNumber = (numStr: string): boolean => {
  if (!numStr) return true; // Optional field
  return !isNaN(parseFloat(numStr));
};

// Validación de mandatos
export const validateMandatoRow = (row: Record<string, string>): ValidationResult => {
  const errors: ValidationError[] = [];

  // Campos requeridos
  if (!row.titulo || row.titulo.trim().length < 2) {
    errors.push({
      field: 'titulo',
      message: 'El título es requerido (mínimo 2 caracteres)',
      severity: 'error'
    });
  }

  if (!row.tipo || !['compra', 'venta'].includes(row.tipo.toLowerCase())) {
    errors.push({
      field: 'tipo',
      message: 'El tipo debe ser "compra" o "venta"',
      severity: 'error'
    });
  }

  if (!row.empresa_nombre || row.empresa_nombre.trim().length < 2) {
    errors.push({
      field: 'empresa_nombre',
      message: 'El nombre de empresa es requerido',
      severity: 'error'
    });
  }

  // Validación de CIF si existe
  if (row.empresa_cif && !validateCIF(row.empresa_cif)) {
    errors.push({
      field: 'empresa_cif',
      message: 'El CIF debe tener formato válido (ej: B12345678)',
      severity: 'warning'
    });
  }

  // Validación de valores numéricos
  if (row.valor && !validateNumber(row.valor)) {
    errors.push({
      field: 'valor',
      message: 'El valor debe ser un número válido',
      severity: 'error'
    });
  }

  // Validación de fechas
  if (row.fecha_inicio && !validateDate(row.fecha_inicio)) {
    errors.push({
      field: 'fecha_inicio',
      message: 'La fecha de inicio no es válida',
      severity: 'warning'
    });
  }

  return {
    isValid: errors.filter(e => e.severity === 'error').length === 0,
    errors
  };
};

// Validación de contactos
export const validateContactoRow = (row: Record<string, string>): ValidationResult => {
  const errors: ValidationError[] = [];

  // Campos requeridos
  if (!row.nombre || row.nombre.trim().length < 2) {
    errors.push({
      field: 'nombre',
      message: 'El nombre es requerido (mínimo 2 caracteres)',
      severity: 'error'
    });
  }

  if (!row.email) {
    errors.push({
      field: 'email',
      message: 'El email es requerido',
      severity: 'error'
    });
  } else if (!validateEmail(row.email)) {
    errors.push({
      field: 'email',
      message: 'El email no tiene formato válido',
      severity: 'error'
    });
  }

  // Validación de teléfono
  if (row.telefono && !validatePhone(row.telefono)) {
    errors.push({
      field: 'telefono',
      message: 'El teléfono debe estar en formato E.164 (ej: +34600000000)',
      severity: 'warning'
    });
  }

  // Validación de LinkedIn URL
  if (row.linkedin && !validateURL(row.linkedin)) {
    errors.push({
      field: 'linkedin',
      message: 'La URL de LinkedIn no es válida',
      severity: 'warning'
    });
  }

  return {
    isValid: errors.filter(e => e.severity === 'error').length === 0,
    errors
  };
};

// Validación de empresas
export const validateEmpresaRow = (row: Record<string, string>): ValidationResult => {
  const errors: ValidationError[] = [];

  // Campos requeridos
  if (!row.nombre || row.nombre.trim().length < 2) {
    errors.push({
      field: 'nombre',
      message: 'El nombre es requerido (mínimo 2 caracteres)',
      severity: 'error'
    });
  }

  if (!row.sector || row.sector.trim().length < 2) {
    errors.push({
      field: 'sector',
      message: 'El sector es requerido',
      severity: 'error'
    });
  }

  // Validación de CIF
  if (row.cif && !validateCIF(row.cif)) {
    errors.push({
      field: 'cif',
      message: 'El CIF debe tener formato válido (ej: B12345678)',
      severity: 'warning'
    });
  }

  // Validación de números
  if (row.facturacion && !validateNumber(row.facturacion)) {
    errors.push({
      field: 'facturacion',
      message: 'La facturación debe ser un número válido',
      severity: 'error'
    });
  }

  if (row.empleados && !validateNumber(row.empleados)) {
    errors.push({
      field: 'empleados',
      message: 'El número de empleados debe ser válido',
      severity: 'error'
    });
  }

  // Validación de URL
  if (row.sitio_web && !validateURL(row.sitio_web)) {
    errors.push({
      field: 'sitio_web',
      message: 'La URL del sitio web no es válida',
      severity: 'warning'
    });
  }

  return {
    isValid: errors.filter(e => e.severity === 'error').length === 0,
    errors
  };
};
