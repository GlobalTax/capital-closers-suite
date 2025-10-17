/**
 * Sistema Autónomo de Permisos - Tipos
 * 
 * Define los 3 roles únicos y los 8 permisos funcionales del sistema.
 * Los permisos se derivan automáticamente del rol del usuario.
 */

export type AdminRole = 'super_admin' | 'admin' | 'viewer';

export interface SystemPermissions {
  // Rol actual del usuario
  role: AdminRole | null;
  
  // Verificaciones de rol
  isSuperAdmin: boolean;
  isAdmin: boolean;
  isViewer: boolean;
  
  // Permisos funcionales (8 permisos core)
  canManageUsers: boolean;        // Solo super_admin
  canViewMandatos: boolean;       // Todos los autenticados
  canEditMandatos: boolean;       // admin + super_admin
  canViewFinancials: boolean;     // admin + super_admin
  canEditEmpresas: boolean;       // admin + super_admin
  canEditContactos: boolean;      // admin + super_admin
  canExportData: boolean;         // admin + super_admin
  canManageSettings: boolean;     // Solo super_admin
}
