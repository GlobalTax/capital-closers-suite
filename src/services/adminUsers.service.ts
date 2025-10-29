import { supabase } from "@/integrations/supabase/client";
import { BaseService } from "./base.service";
import { handleError } from "@/lib/error-handler";

export interface AdminUser {
  id: string;
  user_id: string;
  email: string | null;
  full_name: string | null;
  role: 'super_admin' | 'admin' | 'editor' | 'viewer';
  is_active: boolean;
  needs_credentials: boolean;
  last_login: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateAdminUserDto {
  email: string;
  full_name: string;
  role: 'super_admin' | 'admin' | 'editor' | 'viewer';
}

export interface UpdateAdminUserDto {
  full_name?: string;
  role?: 'super_admin' | 'admin' | 'editor' | 'viewer';
  is_active?: boolean;
}

class AdminUsersService extends BaseService<AdminUser, CreateAdminUserDto, UpdateAdminUserDto> {
  constructor() {
    super('admin_users');
  }

  protected transform(raw: any): AdminUser {
    return raw as AdminUser;
  }

  /**
   * Crear usuario temporal con contraseña autogenerada usando Edge Function
   */
  async createTemporaryUser(data: CreateAdminUserDto): Promise<{
    user_id: string;
    email: string;
    temporary_password: string;
    message: string;
  }> {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        throw new Error('No hay sesión activa');
      }

      const response = await supabase.functions.invoke('create-admin-user', {
        body: {
          email: data.email,
          full_name: data.full_name,
          role: data.role,
        },
      });

      if (response.error) {
        // Intentar extraer mensaje específico del contexto del error
        const errorMessage = response.error.context?.body?.error || response.error.message || 'Error al crear usuario';
        throw new Error(errorMessage);
      }

      return response.data;
    } catch (error) {
      handleError(error, 'Error al crear usuario temporal');
      throw error;
    }
  }

  /**
   * Desactivar usuario (soft delete)
   */
  async deactivateUser(userId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('admin_users')
        .update({ is_active: false, updated_at: new Date().toISOString() })
        .eq('user_id', userId);

      if (error) throw error;
    } catch (error) {
      handleError(error, 'Error al desactivar usuario');
      throw error;
    }
  }

  /**
   * Reactivar usuario
   */
  async reactivateUser(userId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('admin_users')
        .update({ is_active: true, updated_at: new Date().toISOString() })
        .eq('user_id', userId);

      if (error) throw error;
    } catch (error) {
      handleError(error, 'Error al reactivar usuario');
      throw error;
    }
  }

  /**
   * Obtener usuarios activos solamente
   */
  async getActiveUsers(): Promise<AdminUser[]> {
    try {
      const { data, error } = await supabase
        .from('admin_users')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as AdminUser[];
    } catch (error) {
      handleError(error, 'Error al cargar usuarios activos');
      return [];
    }
  }

  /**
   * Obtener historial de auditoría de un usuario
   */
  async getUserAuditLog(userId: string): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from('admin_audit_log')
        .select('*')
        .eq('target_user_id', userId)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      return data || [];
    } catch (error) {
      handleError(error, 'Error al cargar historial de auditoría');
      return [];
    }
  }

  /**
   * Reenviar credenciales temporales a un usuario
   */
  async resendCredentials(userId: string): Promise<{
    user_id: string;
    email: string;
    temporary_password: string;
    action_link: string | null;
    email_sent: boolean;
    message: string;
  }> {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        throw new Error('No hay sesión activa');
      }

      const response = await supabase.functions.invoke('resend-admin-credentials', {
        body: { user_id: userId },
      });

      if (response.error) {
        throw new Error(response.error.message || 'Error al reenviar credenciales');
      }

      return response.data;
    } catch (error) {
      handleError(error, 'Error al reenviar credenciales');
      throw error;
    }
  }

  /**
   * Eliminar usuario permanentemente (hard delete)
   * Elimina el usuario de auth.users y admin_users
   */
  async deleteUser(userId: string): Promise<{
    success: boolean;
    message: string;
    deleted_user: {
      user_id: string;
      email: string;
      full_name: string;
      role: string;
    };
  }> {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        throw new Error('No hay sesión activa');
      }

      const response = await supabase.functions.invoke('delete-admin-user', {
        body: { user_id: userId },
      });

      if (response.error) {
        const errorMessage = response.error.context?.body?.error || response.error.message || 'Error al eliminar usuario';
        throw new Error(errorMessage);
      }

      return response.data;
    } catch (error) {
      handleError(error, 'Error al eliminar usuario');
      throw error;
    }
  }
}

export const adminUsersService = new AdminUsersService();
