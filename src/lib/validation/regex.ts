export const VALIDATION_REGEX = {
  email: /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/,
  phone: /^\+?[0-9\s\-\(\)]+$/,
  cif: /^[A-Z][0-9]{8}$/,
  url: /^https?:\/\/.+/,
  uuid: /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
} as const;

export const VALIDATION_MESSAGES = {
  email: 'Email inválido',
  phone: 'Teléfono inválido',
  cif: 'CIF inválido (formato: A12345678)',
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
