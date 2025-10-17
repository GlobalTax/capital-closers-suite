/**
 * Sistema Autónomo de Permisos - Hook Principal
 * 
 * Este hook reemplaza todo el sistema complejo de permisos anterior.
 * Proporciona el rol del usuario y los permisos derivados automáticamente.
 * 
 * Uso:
 * const { canEditMandatos, canManageUsers } = useSimpleAuth();
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import type { SystemPermissions, AdminRole } from '@/types/permissions';

export const useSimpleAuth = (): SystemPermissions => {
  const { user } = useAuth();
  
  const { data: adminData } = useQuery({
    queryKey: ['adminUser', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      
      const { data, error } = await supabase
        .from('admin_users')
        .select('role, is_active')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .single();
      
      if (error) {
        console.error('Error fetching admin user:', error);
        return null;
      }
      
      return data;
    },
    enabled: !!user?.id,
    staleTime: 5 * 60 * 1000, // Cache por 5 minutos
  });
  
  const role = adminData?.role as AdminRole | null;
  const isSuperAdmin = role === 'super_admin';
  const isAdmin = role === 'admin' || isSuperAdmin;
  const isViewer = role === 'viewer';
  
  return {
    role,
    isSuperAdmin,
    isAdmin,
    isViewer,
    
    // Permisos derivados automáticamente del rol
    canManageUsers: isSuperAdmin,
    canViewMandatos: !!role, // todos los autenticados
    canEditMandatos: isAdmin,
    canViewFinancials: isAdmin,
    canEditEmpresas: isAdmin,
    canEditContactos: isAdmin,
    canExportData: isAdmin,
    canManageSettings: isSuperAdmin,
  };
};
