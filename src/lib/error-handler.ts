import { toast } from "@/hooks/use-toast";

export class AppError extends Error {
  constructor(
    message: string,
    public code: string,
    public severity: 'low' | 'medium' | 'high' | 'critical',
    public userMessage?: string,
    public metadata?: Record<string, any>
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export class DatabaseError extends AppError {
  constructor(message: string, metadata?: Record<string, any>) {
    super(
      message,
      'DB_ERROR',
      'high',
      'Error al acceder a los datos. Por favor, intenta de nuevo.',
      metadata
    );
  }
}

export class ValidationError extends AppError {
  constructor(message: string, metadata?: Record<string, any>) {
    super(
      message,
      'VALIDATION_ERROR',
      'medium',
      'Los datos proporcionados no son válidos.',
      metadata
    );
  }
}

export class AuthenticationError extends AppError {
  constructor(message: string, metadata?: Record<string, any>) {
    super(
      message,
      'AUTH_ERROR',
      'high',
      'Error de autenticación. Por favor, inicia sesión nuevamente.',
      metadata
    );
  }
}

export function handleError(error: unknown, context?: string) {
  if (error instanceof AppError) {
    // Log estructurado
    console.error(`[${error.severity.toUpperCase()}] ${context || 'Error'}:`, {
      code: error.code,
      message: error.message,
      metadata: error.metadata,
    });
    
    // Mostrar mensaje al usuario
    toast({
      title: error.severity === 'critical' ? 'Error Crítico' : 'Error',
      description: error.userMessage || error.message,
      variant: 'destructive',
    });
  } else if (error instanceof Error) {
    console.error(`[ERROR] ${context || 'Unknown'}:`, error.message, error);
    
    // Mostrar el mensaje real del error, no uno genérico
    const errorMessage = error.message || 'Ha ocurrido un error inesperado.';
    toast({
      title: context || 'Error',
      description: errorMessage,
      variant: 'destructive',
    });
  } else {
    console.error(`[ERROR] ${context || 'Unknown'}:`, error);
    toast({
      title: 'Error',
      description: 'Ha ocurrido un error inesperado. Por favor, intenta de nuevo.',
      variant: 'destructive',
    });
  }
}
