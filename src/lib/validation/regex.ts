export const VALIDATION_REGEX = {
  email: /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/,
  phone: /^\+?[0-9\s\-\(\)]+$/,
  // Soporta CIF (A12345678, B1234567A), NIF (12345678A), NIE (X1234567A)
  cif: /^[A-Z0-9][0-9]{7}[A-Z0-9]$/,
  url: /^https?:\/\/.+/,
  uuid: /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
} as const;

export const VALIDATION_MESSAGES = {
  email: 'Email inválido',
  phone: 'Teléfono inválido',
  cif: 'CIF/NIF no válido. Formato: A12345678, 12345678A, X1234567A',
  url: 'URL inválida',
  uuid: 'ID inválido',
} as const;

export function isValidEmail(email: string): boolean {
  return VALIDATION_REGEX.email.test(email);
}

export function isValidPhone(phone: string): boolean {
  return VALIDATION_REGEX.phone.test(phone);
}

export function isValidCIF(cif: string): boolean {
  return VALIDATION_REGEX.cif.test(cif);
}

export function isValidUUID(uuid: string): boolean {
  return VALIDATION_REGEX.uuid.test(uuid);
}

export function isValidURL(url: string): boolean {
  return VALIDATION_REGEX.url.test(url);
}
