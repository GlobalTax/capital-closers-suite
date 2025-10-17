import React, { createContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { AuthService } from '@/services/auth.service';

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

  const refreshAdminUser = async () => {
    if (user) {
      const adminData = await AuthService.fetchAdminUser(user.id);
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
            AuthService.fetchAdminUser(session.user.id).then(adminData => {
              setAdminUser(adminData);
              
              if (event === 'SIGNED_IN') {
                AuthService.updateLastLogin(session.user.id);
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
          const adminData = await AuthService.fetchAdminUser(session.user.id);
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
    const { error, adminUser: adminData } = await AuthService.login(email, password);
    
    if (adminData) {
      setAdminUser(adminData);
    }
    
    return { error };
  };

  const logout = async () => {
    await AuthService.logout();
    setAdminUser(null);
  };

  const updatePassword = async (currentPassword: string, newPassword: string) => {
    if (!user?.email) {
      return { error: new Error('No hay usuario autenticado'), requiresReauth: false };
    }

    return await AuthService.updatePassword(user.email, user.id, currentPassword, newPassword);
  };

  const setInitialPassword = async (newPassword: string) => {
    if (!user) {
      return { error: new Error('No hay usuario autenticado') };
    }

    // Actualizar estado local ANTES de logout para prevenir que el modal se reabra
    setAdminUser(prev => prev ? { ...prev, needs_credentials: false } : null);
    
    return await AuthService.setInitialPassword(user.id, newPassword);
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
