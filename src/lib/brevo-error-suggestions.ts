/**
 * Mapeo de errores comunes de Brevo a sugerencias útiles
 */

interface ErrorSuggestion {
  pattern: string;
  title: string;
  suggestion: string;
  severity: 'low' | 'medium' | 'high';
}

const ERROR_PATTERNS: ErrorSuggestion[] = [
  {
    pattern: 'mandatory attributes missing',
    title: 'Atributos obligatorios faltantes',
    suggestion: 'Brevo requiere campos obligatorios que no están mapeados. Revisa la configuración de Companies/Contacts en Brevo CRM y asegúrate de que los campos requeridos estén siendo enviados.',
    severity: 'high',
  },
  {
    pattern: 'duplicate_parameter',
    title: 'Registro duplicado',
    suggestion: 'Este registro ya existe en Brevo. El sistema debería actualizar en lugar de crear. Verifica si el brevo_id está correctamente guardado.',
    severity: 'medium',
  },
  {
    pattern: 'invalid email',
    title: 'Email inválido',
    suggestion: 'El email del contacto no es válido o está malformado. Actualiza el email en el CRM antes de reintentar.',
    severity: 'medium',
  },
  {
    pattern: 'Network error',
    title: 'Error de red',
    suggestion: 'Error de conexión con la API de Brevo. Puede ser un problema temporal. Reintenta en unos minutos.',
    severity: 'low',
  },
  {
    pattern: 'BREVO_API_KEY',
    title: 'API Key no configurada',
    suggestion: 'La API key de Brevo no está configurada en las variables de entorno. Contacta al administrador.',
    severity: 'high',
  },
  {
    pattern: 'rate limit',
    title: 'Límite de rate excedido',
    suggestion: 'Se ha excedido el límite de peticiones a Brevo. Espera unos minutos antes de procesar más items.',
    severity: 'medium',
  },
  {
    pattern: 'unauthorized',
    title: 'No autorizado',
    suggestion: 'La API key de Brevo es inválida o ha expirado. Verifica las credenciales en la configuración.',
    severity: 'high',
  },
  {
    pattern: 'contact not found',
    title: 'Contacto no encontrado',
    suggestion: 'El contacto no existe en Brevo. Puede haber sido eliminado. Considera crear uno nuevo.',
    severity: 'medium',
  },
  {
    pattern: 'company not found',
    title: 'Empresa no encontrada',
    suggestion: 'La empresa no existe en Brevo. Puede haber sido eliminada. Considera crear una nueva.',
    severity: 'medium',
  },
  {
    pattern: 'deal not found',
    title: 'Deal no encontrado',
    suggestion: 'El deal no existe en Brevo. Puede haber sido eliminado. Considera crear uno nuevo.',
    severity: 'medium',
  },
  {
    pattern: 'pipeline not found',
    title: 'Pipeline no encontrado',
    suggestion: 'El pipeline configurado no existe en Brevo. Verifica la configuración del pipeline en Brevo CRM.',
    severity: 'high',
  },
];

export interface ParsedError {
  originalMessage: string;
  title: string;
  suggestion: string;
  severity: 'low' | 'medium' | 'high';
  isKnown: boolean;
}

export function parseBrevoError(errorMessage: string | null): ParsedError {
  if (!errorMessage) {
    return {
      originalMessage: '',
      title: 'Sin error',
      suggestion: 'No hay mensaje de error disponible.',
      severity: 'low',
      isKnown: false,
    };
  }

  const lowerMessage = errorMessage.toLowerCase();
  
  for (const pattern of ERROR_PATTERNS) {
    if (lowerMessage.includes(pattern.pattern.toLowerCase())) {
      return {
        originalMessage: errorMessage,
        title: pattern.title,
        suggestion: pattern.suggestion,
        severity: pattern.severity,
        isKnown: true,
      };
    }
  }

  return {
    originalMessage: errorMessage,
    title: 'Error desconocido',
    suggestion: 'Este error no está documentado. Revisa el mensaje completo y contacta soporte si persiste.',
    severity: 'medium',
    isKnown: false,
  };
}

export function getSeverityColor(severity: 'low' | 'medium' | 'high'): string {
  switch (severity) {
    case 'high':
      return 'text-red-500';
    case 'medium':
      return 'text-amber-500';
    case 'low':
      return 'text-blue-500';
  }
}

export function getSeverityBgColor(severity: 'low' | 'medium' | 'high'): string {
  switch (severity) {
    case 'high':
      return 'bg-red-500/10';
    case 'medium':
      return 'bg-amber-500/10';
    case 'low':
      return 'bg-blue-500/10';
  }
}
