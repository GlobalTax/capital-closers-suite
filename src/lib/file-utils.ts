import { 
  FileText, 
  FileType, 
  FileSpreadsheet, 
  Presentation, 
  Image, 
  Archive, 
  File,
  type LucideIcon
} from "lucide-react";
import type { FileCategory } from "@/types";

/**
 * Obtiene el icono de Lucide apropiado según el tipo MIME del archivo
 */
export function getFileIcon(mimeType: string): LucideIcon {
  if (mimeType.includes('pdf')) return FileText;
  if (mimeType.includes('word') || mimeType.includes('document')) return FileType;
  if (mimeType.includes('excel') || mimeType.includes('spreadsheet')) return FileSpreadsheet;
  if (mimeType.includes('powerpoint') || mimeType.includes('presentation')) return Presentation;
  if (mimeType.includes('image')) return Image;
  if (mimeType.includes('zip') || mimeType.includes('rar') || mimeType.includes('compressed')) return Archive;
  return File;
}

/**
 * Formatea el tamaño del archivo en un formato legible
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

/**
 * Valida un archivo antes de subirlo
 */
export function validateFile(file: File, maxSizeMB: number = 10): void {
  // Validar tamaño
  if (file.size > maxSizeMB * 1024 * 1024) {
    throw new Error(`El archivo es demasiado grande. Tamaño máximo: ${maxSizeMB}MB`);
  }
  
  // Tipos de archivo permitidos
  const allowedTypes = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/webp',
    'image/gif',
    'application/zip',
    'application/x-rar-compressed',
    'text/plain',
    'text/csv'
  ];
  
  if (!allowedTypes.includes(file.type)) {
    throw new Error(`Tipo de archivo no permitido: ${file.type}`);
  }
}

/**
 * Determina la categoría del archivo según su tipo MIME
 */
export function getCategoryFromMimeType(mimeType: string): FileCategory {
  if (mimeType.includes('pdf') || mimeType.includes('word') || mimeType.includes('document') || mimeType.includes('text')) {
    return 'documento';
  }
  if (mimeType.includes('excel') || mimeType.includes('spreadsheet') || mimeType.includes('csv')) {
    return 'hoja_calculo';
  }
  if (mimeType.includes('powerpoint') || mimeType.includes('presentation')) {
    return 'presentacion';
  }
  if (mimeType.includes('image')) {
    return 'imagen';
  }
  return 'otro';
}

/**
 * Genera un nombre de archivo único para evitar colisiones
 */
export function generateUniqueFileName(originalName: string): string {
  const timestamp = Date.now();
  const randomString = Math.random().toString(36).substring(2, 8);
  const extension = originalName.split('.').pop();
  const nameWithoutExt = originalName.replace(/\.[^/.]+$/, '');
  const sanitizedName = nameWithoutExt.replace(/[^a-zA-Z0-9]/g, '_');
  
  return `${sanitizedName}_${timestamp}_${randomString}.${extension}`;
}
