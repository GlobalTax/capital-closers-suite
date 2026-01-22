import React, { createContext, useEffect, useState, useCallback, useRef } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { AuthService } from '@/services/auth.service';
import type { AdminRole } from '@/types/permissions';

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
  
  // Track if we've already processed initial session to avoid race conditions
  const initializedRef = useRef(false);
  const processingRef = useRef(false);

  const refreshAdminUser = useCallback(async () => {
    if (user) {
      const adminData = await AuthService.fetchAdminUserWithRetry(user.id);
      setAdminUser(adminData);
    }
  }, [user]);

  useEffect(() => {
    let mounted = true;

    const handleAuthChange = async (
      event: string,
      currentSession: Session | null
    ) => {
      if (!mounted || processingRef.current) return;
      
      processingRef.current = true;

      try {
        setSession(currentSession);
        setUser(currentSession?.user ?? null);

        if (currentSession?.user) {
          // Use retry logic for fetching admin user
          const adminData = await AuthService.fetchAdminUserWithRetry(
            currentSession.user.id
          );
          
          if (mounted) {
            setAdminUser(adminData);

            // Only update last login on actual sign in, not on token refresh
            if (event === 'SIGNED_IN' && !initializedRef.current) {
              AuthService.updateLastLogin(currentSession.user.id);
            }
          }
        } else {
          if (mounted) {
            setAdminUser(null);
          }
        }
      } finally {
        if (mounted) {
          setLoading(false);
          initializedRef.current = true;
          processingRef.current = false;
        }
      }
    };

    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, currentSession) => {
        // Use setTimeout to avoid Supabase deadlock warning
        setTimeout(() => {
          handleAuthChange(event, currentSession);
        }, 0);
      }
    );

    // Check for existing session
    supabase.auth.getSession().then(({ data: { session: existingSession } }) => {
      if (!mounted) return;
      
      if (existingSession) {
        // Let onAuthStateChange handle the session
        // This avoids race conditions
      } else {
        // No session, we can stop loading
        setLoading(false);
        initializedRef.current = true;
      }
    });

    // Safety timeout - if nothing happens in 8 seconds, stop loading
    const safetyTimeout = setTimeout(() => {
      if (mounted && loading) {
        console.warn('[Auth] Safety timeout triggered - stopping loading state');
        setLoading(false);
      }
    }, 8000);

    return () => {
      mounted = false;
      clearTimeout(safetyTimeout);
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
    setUser(null);
    setSession(null);
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

    const result = await AuthService.setInitialPassword(user.id, newPassword);
    
    // Solo actualizar estado local si la operación fue exitosa
    if (!result.error) {
      setAdminUser(prev => prev ? { ...prev, needs_credentials: false } : null);
    }
    
    return result;
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
