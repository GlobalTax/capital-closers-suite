import { toast } from "sonner";

export interface SignedUrlError {
  status?: number;
  message?: string;
  code?: string;
}

/**
 * Maneja errores de signed URL con logging consistente y toast específico
 */
export function handleSignedUrlError(
  error: SignedUrlError, 
  context: string = 'SignedUrl'
): void {
  console.error(`[${context}] Error:`, error);
  
  const status = error.status;
  const code = error.code;
  const message = error.message?.toLowerCase() || '';
  
  // Clasificar por código de error
  if (status === 403 || message.includes('403') || message.includes('acceso denegado') || message.includes('permisos')) {
    toast.error("No tienes permisos para ver este documento");
    return;
  }
  
  if (status === 404 || code === 'NOT_FOUND' || message.includes('not found') || message.includes('no existe')) {
    toast.error("El archivo no existe");
    return;
  }
  
  if (status === 401 || message.includes('401') || message.includes('no autorizado') || message.includes('token')) {
    toast.error("Sesión expirada, por favor inicia sesión");
    return;
  }
  
  // Error genérico
  toast.error("Error al generar enlace de vista previa");
}

/**
 * Parsea respuesta de error de Edge Function
 */
export function parseEdgeFunctionError(error: any): SignedUrlError {
  return {
    status: error?.status,
    message: error?.message || error?.error,
    code: error?.code,
  };
}
