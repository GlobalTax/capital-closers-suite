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

// Mapeo flexible de nombres de columnas
const columnAliases: Record<string, string[]> = {
  titulo: ['titulo', 'título', 'name', 'nombre', 'oportunidad', 'deal_name', 'deal'],
  tipo: ['tipo', 'type', 'deal_type', 'transaction_type'],
  empresa_nombre: ['empresa_nombre', 'empresa', 'company', 'company_name', 'cliente', 'client'],
  empresa_cif: ['empresa_cif', 'cif', 'tax_id', 'vat'],
  valor: ['valor', 'value', 'amount', 'importe', 'price'],
  estado: ['estado', 'status', 'phase', 'fase', 'stage'],
  fecha_inicio: ['fecha_inicio', 'fecha', 'start_date', 'date', 'created'],
  descripcion: ['descripcion', 'descripción', 'description', 'notes', 'notas']
};

// Función para encontrar el valor de una columna usando aliases
const getColumnValue = (row: Record<string, string>, field: string): string | undefined => {
  const aliases = columnAliases[field] || [field];
  
  for (const alias of aliases) {
    // Buscar ignorando mayúsculas/minúsculas
    const key = Object.keys(row).find(k => k.toLowerCase() === alias.toLowerCase());
    if (key && row[key]) {
      return row[key].trim();
    }
  }
  
  return undefined;
};

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

// Validación de mandatos con mapeo flexible de columnas
export const validateMandatoRow = (row: Record<string, string>): ValidationResult => {
  const errors: ValidationError[] = [];

  // Obtener valores usando aliases
  const titulo = getColumnValue(row, 'titulo');
  const tipo = getColumnValue(row, 'tipo');
  const empresaNombre = getColumnValue(row, 'empresa_nombre');
  const empresaCif = getColumnValue(row, 'empresa_cif');
  const valor = getColumnValue(row, 'valor');
  const fechaInicio = getColumnValue(row, 'fecha_inicio');
  const estado = getColumnValue(row, 'estado');

  // Campos requeridos con mensajes más claros
  if (!titulo || titulo.length < 2) {
    errors.push({
      field: 'titulo',
      message: '❌ Falta la columna "titulo" o está vacía. Sugerencia: usa columnas como "titulo", "nombre" o "deal_name"',
      severity: 'error'
    });
  }

  if (!tipo || !['compra', 'venta'].includes(tipo.toLowerCase())) {
    errors.push({
      field: 'tipo',
      message: '❌ El tipo debe ser "venta" o "compra" (mayúsculas/minúsculas no importan)',
      severity: 'error'
    });
  }

  if (!empresaNombre || empresaNombre.length < 2) {
    errors.push({
      field: 'empresa_nombre',
      message: '❌ Falta el nombre de la empresa. Sugerencia: usa columnas como "empresa_nombre", "empresa" o "company"',
      severity: 'error'
    });
  }

  // Validaciones opcionales pero útiles
  if (empresaCif && !validateCIF(empresaCif)) {
    errors.push({
      field: 'empresa_cif',
      message: '⚠️ El CIF no tiene formato válido (ej: B12345678). Se importará igualmente.',
      severity: 'warning'
    });
  }

  if (valor) {
    const valorNum = parseFloat(valor.replace(/[^0-9.-]/g, ''));
    if (isNaN(valorNum) || valorNum < 0) {
      errors.push({
        field: 'valor',
        message: '❌ El valor debe ser un número positivo',
        severity: 'error'
      });
    }
  }

  if (fechaInicio && !validateDate(fechaInicio)) {
    errors.push({
      field: 'fecha_inicio',
      message: '⚠️ La fecha no es válida. Formato recomendado: YYYY-MM-DD (ej: 2024-01-15)',
      severity: 'warning'
    });
  }

  // Validar estado si existe
  const estadosValidos = ['prospecto', 'en_negociacion', 'ganado', 'perdido', 'cancelado'];
  if (estado && !estadosValidos.includes(estado.toLowerCase().replace(/\s+/g, '_'))) {
    errors.push({
      field: 'estado',
      message: `⚠️ Estado no reconocido. Válidos: ${estadosValidos.join(', ')}. Se usará "prospecto" por defecto.`,
      severity: 'warning'
    });
  }

  return {
    isValid: errors.filter(e => e.severity === 'error').length === 0,
    errors
  };
};

// Regex más tolerante para email (case-insensitive, permite subdominios)
const EMAIL_REGEX_TOLERANT = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/i;

/**
 * Validación TOLERANTE de contactos
 * - Válido si tiene email válido O (nombre + empresa)
 * - Auto-trim y lowercase en emails
 * - Warnings no bloquean la importación
 */
export const validateContactoRowTolerant = (
  row: Record<string, string>
): ValidationResult => {
  const errors: ValidationError[] = [];

  // Limpiar email antes de validar
  const email = (row.email || '').trim().toLowerCase();
  const nombre = (row.nombre || '').trim();
  const empresa = (row.empresa_nombre || '').trim();

  // Regla principal: es válido si tiene email válido O (nombre + empresa)
  const hasValidEmail = email.length > 0 && EMAIL_REGEX_TOLERANT.test(email);
  const hasNameAndCompany = nombre.length >= 2 && empresa.length >= 2;

  if (!hasValidEmail && !hasNameAndCompany) {
    errors.push({
      field: 'email',
      message: 'Se requiere email válido O (nombre + empresa con mín. 2 caracteres cada uno)',
      severity: 'error'
    });
  }

  // Validaciones secundarias (warnings, NO bloquean)
  if (email && !hasValidEmail) {
    errors.push({
      field: 'email',
      message: `Email "${email}" tiene formato inválido (se intentará importar igualmente)`,
      severity: 'warning'
    });
  }

  // Validar teléfono (warning)
  if (row.telefono) {
    const phone = row.telefono.replace(/[\s\-\(\)]/g, '');
    if (phone.length > 0 && phone.length < 9) {
      errors.push({
        field: 'telefono',
        message: 'Teléfono muy corto (se importará igualmente)',
        severity: 'warning'
      });
    }
  }

  // Validar LinkedIn URL (warning)
  if (row.linkedin && !row.linkedin.includes('linkedin')) {
    errors.push({
      field: 'linkedin',
      message: 'URL de LinkedIn no parece válida (se importará igualmente)',
      severity: 'warning'
    });
  }

  return {
    isValid: errors.filter(e => e.severity === 'error').length === 0,
    errors
  };
};

// Validación ESTRICTA de contactos (mantener para compatibilidad)
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
  } else if (!validateEmail(row.email.trim().toLowerCase())) {
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
