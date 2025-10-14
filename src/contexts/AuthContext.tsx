import React, { createContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

export type AdminRole = 'super_admin' | 'admin' | 'editor' | 'viewer';

export interface AdminUser {
  id: string;
  user_id: string;
  email: string | null;
  full_name: string | null;
  role: AdminRole;
  is_active: boolean;
  needs_credentials: boolean;
  last_login: string | null;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  adminUser: AdminUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<{ error: Error | null }>;
  logout: () => Promise<void>;
  updatePassword: (currentPassword: string, newPassword: string) => Promise<{ error: Error | null; requiresReauth: boolean }>;
  setInitialPassword: (newPassword: string) => Promise<{ error: Error | null }>;
  refreshAdminUser: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [adminUser, setAdminUser] = useState<AdminUser | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchAdminUser = async (userId: string) => {
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
  };

  const updateLastLogin = async (userId: string) => {
    await supabase
      .from('admin_users')
      .update({ last_login: new Date().toISOString() })
      .eq('user_id', userId);
  };

  const refreshAdminUser = async () => {
    if (user) {
      const adminData = await fetchAdminUser(user.id);
      setAdminUser(adminData);
    }
  };

  useEffect(() => {
    let timeoutId: NodeJS.Timeout;
    
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);

        if (session?.user) {
          setTimeout(() => {
            fetchAdminUser(session.user.id).then(adminData => {
              setAdminUser(adminData);
              
              if (event === 'SIGNED_IN') {
                updateLastLogin(session.user.id);
              }
            });
          }, 0);
        } else {
          setAdminUser(null);
        }
        
        setLoading(false);
      }
    );

    // THEN check for existing session
    const initAuth = async () => {
      try {
        // Set a 10-second timeout
        const timeoutPromise = new Promise((_, reject) => {
          timeoutId = setTimeout(() => reject(new Error('Auth timeout')), 10000);
        });

        const sessionPromise = supabase.auth.getSession();
        
        const { data: { session } } = await Promise.race([
          sessionPromise,
          timeoutPromise
        ]) as any;

        clearTimeout(timeoutId);
        
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          const adminData = await fetchAdminUser(session.user.id);
          setAdminUser(adminData);
        }
        
        setLoading(false);
      } catch (error) {
        console.error('Auth initialization error:', error);
        setLoading(false);
      }
    };

    initAuth();

    return () => {
      clearTimeout(timeoutId);
      subscription.unsubscribe();
    };
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      // Check if user is active admin
      if (data.user) {
        const adminData = await fetchAdminUser(data.user.id);
        
        if (!adminData) {
          await supabase.auth.signOut();
          throw new Error('No tienes permisos para acceder a esta aplicación');
        }

        if (!adminData.is_active) {
          await supabase.auth.signOut();
          throw new Error('Tu cuenta está desactivada. Contacta al administrador.');
        }

        setAdminUser(adminData);
        await updateLastLogin(data.user.id);
      }

      return { error: null };
    } catch (error) {
      return { error: error as Error };
    }
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setAdminUser(null);
  };

  const updatePassword = async (currentPassword: string, newPassword: string) => {
    try {
      if (!user?.email) {
        throw new Error('No hay usuario autenticado');
      }

      // Re-authenticate with current password to verify it
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: currentPassword,
      });

      if (signInError) {
        throw new Error('La contraseña actual es incorrecta');
      }

      // Update to new password
      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (updateError) throw updateError;

      // Update needs_credentials flag
      await supabase
        .from('admin_users')
        .update({ needs_credentials: false })
        .eq('user_id', user.id);

      // Force logout to require re-authentication with new password
      await supabase.auth.signOut();
      
      return { error: null, requiresReauth: true };
    } catch (error) {
      return { error: error as Error, requiresReauth: false };
    }
  };

  const setInitialPassword = async (newPassword: string) => {
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) throw error;

      if (user) {
        await supabase
          .from('admin_users')
          .update({ needs_credentials: false })
          .eq('user_id', user.id);
        
        // Update local state BEFORE logout to prevent modal from reopening
        setAdminUser(prev => prev ? { ...prev, needs_credentials: false } : null);
      }

      // Logout to force re-login with new password
      await supabase.auth.signOut();
      
      return { error: null };
    } catch (error) {
      return { error: error as Error };
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        adminUser,
        loading,
        login,
        logout,
        updatePassword,
        setInitialPassword,
        refreshAdminUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
