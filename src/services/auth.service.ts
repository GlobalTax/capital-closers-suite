import { supabase } from '@/integrations/supabase/client';
import { AdminUser } from '@/contexts/AuthContext';

/**
 * Servicio de autenticación con validación robusta
 */

export class AuthService {
  /**
   * Obtiene los datos del usuario admin desde la base de datos
   */
  static async fetchAdminUser(userId: string): Promise<AdminUser | null> {
    try {
      const { data, error } = await supabase
        .from('admin_users')
        .select('*')
        .eq('user_id', userId)
        .eq('is_active', true)
        .maybeSingle();

      if (error) {
        console.error('Error fetching admin user:', error);
        return null;
      }

      return data as AdminUser | null;
    } catch (error) {
      console.error('Exception fetching admin user:', error);
      return null;
    }
  }

  /**
   * Actualiza el timestamp de último login
   */
  static async updateLastLogin(userId: string): Promise<void> {
    try {
      await supabase
        .from('admin_users')
        .update({ last_login: new Date().toISOString() })
        .eq('user_id', userId);
    } catch (error) {
      console.error('Error updating last login:', error);
    }
  }

  /**
   * Valida que el usuario tiene permisos de admin activo
   */
  static async validateAdminAccess(userId: string): Promise<{
    isValid: boolean;
    adminUser: AdminUser | null;
    error: string | null;
  }> {
    const adminUser = await this.fetchAdminUser(userId);

    if (!adminUser) {
      return {
        isValid: false,
        adminUser: null,
        error: 'No tienes permisos para acceder a esta aplicación',
      };
    }

    if (!adminUser.is_active) {
      return {
        isValid: false,
        adminUser: null,
        error: 'Tu cuenta está desactivada. Contacta al administrador.',
      };
    }

    return {
      isValid: true,
      adminUser,
      error: null,
    };
  }

  /**
   * Realiza el login con validación de permisos
   */
  static async login(
    email: string,
    password: string
  ): Promise<{ error: Error | null; adminUser: AdminUser | null }> {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      if (!data.user) {
        throw new Error('No se pudo autenticar el usuario');
      }

      // Validar acceso de admin
      const validation = await this.validateAdminAccess(data.user.id);

      if (!validation.isValid) {
        await supabase.auth.signOut();
        throw new Error(validation.error || 'Acceso denegado');
      }

      // Actualizar último login
      await this.updateLastLogin(data.user.id);

      return { error: null, adminUser: validation.adminUser };
    } catch (error) {
      return { error: error as Error, adminUser: null };
    }
  }

  /**
   * Cierra la sesión del usuario
   */
  static async logout(): Promise<void> {
    await supabase.auth.signOut();
  }

  /**
   * Actualiza la contraseña con re-autenticación
   */
  static async updatePassword(
    email: string,
    userId: string,
    currentPassword: string,
    newPassword: string
  ): Promise<{ error: Error | null; requiresReauth: boolean }> {
    try {
      // Re-autenticar con contraseña actual
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password: currentPassword,
      });

      if (signInError) {
        throw new Error('La contraseña actual es incorrecta');
      }

      // Actualizar a nueva contraseña
      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (updateError) throw updateError;

      // Actualizar flag de needs_credentials
      await supabase
        .from('admin_users')
        .update({ needs_credentials: false })
        .eq('user_id', userId);

      // Forzar logout para requerir re-autenticación
      await supabase.auth.signOut();

      return { error: null, requiresReauth: true };
    } catch (error) {
      return { error: error as Error, requiresReauth: false };
    }
  }

  /**
   * Establece la contraseña inicial (primera vez)
   * Usa función RPC con SECURITY DEFINER para bypasear RLS
   */
  static async setInitialPassword(
    userId: string,
    newPassword: string
  ): Promise<{ error: Error | null }> {
    try {
      // 1. Actualizar contraseña en Supabase Auth
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) {
        // Detectar error específico de contraseña igual
        if (error.message?.includes('same_password') || error.status === 422) {
          return { 
            error: new Error('La nueva contraseña debe ser diferente a tu contraseña temporal. Por favor, elige otra contraseña.') 
          };
        }
        throw error;
      }

      // 2. Usar función RPC con SECURITY DEFINER para actualizar needs_credentials
      // Esto bypasea las políticas RLS restrictivas
      const { data: success, error: rpcError } = await supabase
        .rpc('complete_password_setup');

      if (rpcError) {
        console.error('Error al completar setup de contraseña:', rpcError);
        throw new Error('Error al actualizar el estado de la cuenta. Contacta al administrador.');
      }

      if (!success) {
        console.error('complete_password_setup retornó false');
        throw new Error('No se pudo actualizar el estado de la cuenta. Contacta al administrador.');
      }

      // 3. Logout para forzar re-login con nueva contraseña
      await supabase.auth.signOut();

      return { error: null };
    } catch (error) {
      return { error: error as Error };
    }
  }
}
