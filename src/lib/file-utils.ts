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

/**
 * Tipos permitidos para teasers (solo PDF y PPTX)
 */
const TEASER_ALLOWED_TYPES = [
  'application/pdf',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
];

const TEASER_MAX_SIZE_MB = 10;

export interface FileValidationResult {
  valid: boolean;
  error?: string;
}

/**
 * Valida un archivo de teaser (solo PDF y PPTX, máximo 10MB)
 */
export function validateTeaserFile(file: File): FileValidationResult {
  // Validar tamaño
  if (file.size > TEASER_MAX_SIZE_MB * 1024 * 1024) {
    return {
      valid: false,
      error: `El archivo supera el tamaño máximo de ${TEASER_MAX_SIZE_MB}MB`
    };
  }
  
  // Validar tipo MIME
  if (!TEASER_ALLOWED_TYPES.includes(file.type)) {
    return {
      valid: false,
      error: 'Solo se permiten archivos PDF o PowerPoint (.pptx)'
    };
  }
  
  return { valid: true };
}

// =============================================================================
// Preview Type Detection Helpers
// =============================================================================

const OFFICE_MIME_TYPES = [
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
  'application/vnd.openxmlformats-officedocument.presentationml.presentation', // .pptx
  'application/msword', // .doc
  'application/vnd.ms-excel', // .xls
  'application/vnd.ms-powerpoint', // .ppt
];

/**
 * Check if MIME type is a PDF
 */
export function isPdf(mimeType: string): boolean {
  return mimeType === 'application/pdf';
}

/**
 * Check if MIME type is an image
 */
export function isImage(mimeType: string): boolean {
  return mimeType.startsWith('image/');
}

/**
 * Check if MIME type is a Microsoft Office document
 */
export function isOfficeDocument(mimeType: string): boolean {
  return OFFICE_MIME_TYPES.includes(mimeType) || 
    mimeType.includes('officedocument') ||
    mimeType.includes('msword') ||
    mimeType.includes('ms-excel') ||
    mimeType.includes('ms-powerpoint');
}

/**
 * Check if a file type can be previewed
 */
export function isPreviewable(mimeType: string): boolean {
  return isPdf(mimeType) || isImage(mimeType) || isOfficeDocument(mimeType);
}

/**
 * Get the preview type for a given MIME type
 */
export function getPreviewType(mimeType: string): 'pdf' | 'image' | 'office' | 'unsupported' {
  if (isPdf(mimeType)) return 'pdf';
  if (isImage(mimeType)) return 'image';
  if (isOfficeDocument(mimeType)) return 'office';
  return 'unsupported';
}
