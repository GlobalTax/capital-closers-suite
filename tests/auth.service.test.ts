import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AuthService } from '@/services/auth.service';
import { supabase } from '@/integrations/supabase/client';

describe('AuthService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('login', () => {
    it('should login successfully with valid credentials and active admin', async () => {
      // Mock successful auth
      vi.mocked(supabase.auth.signInWithPassword).mockResolvedValue({
        data: {
          user: { id: 'user-123', email: 'test@example.com' },
          session: { access_token: 'token' },
        },
        error: null,
      } as any);

      // Mock admin user lookup - active admin
      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValue({
          data: {
            id: 'admin-123',
            user_id: 'user-123',
            email: 'test@example.com',
            role: 'admin',
            is_active: true,
          },
          error: null,
        }),
        update: vi.fn().mockReturnThis(),
      } as any);

      const result = await AuthService.login('test@example.com', 'password123');

      expect(result.error).toBeNull();
      expect(result.adminUser).toBeDefined();
      expect(result.adminUser?.role).toBe('admin');
      expect(supabase.auth.signInWithPassword).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123',
      });
    });

    it('should deny access when user is not in admin_users table', async () => {
      vi.mocked(supabase.auth.signInWithPassword).mockResolvedValue({
        data: {
          user: { id: 'user-123' },
          session: { access_token: 'token' },
        },
        error: null,
      } as any);

      // Mock empty admin_users lookup
      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
      } as any);

      vi.mocked(supabase.auth.signOut).mockResolvedValue({ error: null });

      const result = await AuthService.login('test@example.com', 'password123');

      expect(result.error).toBeDefined();
      expect(result.error?.message).toContain('permisos');
      expect(result.adminUser).toBeNull();
      expect(supabase.auth.signOut).toHaveBeenCalled();
    });

    it('should deny access when admin user is inactive', async () => {
      vi.mocked(supabase.auth.signInWithPassword).mockResolvedValue({
        data: {
          user: { id: 'user-123' },
          session: { access_token: 'token' },
        },
        error: null,
      } as any);

      // The query filters by is_active: true, so inactive users return null
      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
      } as any);

      vi.mocked(supabase.auth.signOut).mockResolvedValue({ error: null });

      const result = await AuthService.login('test@example.com', 'password123');

      expect(result.error).toBeDefined();
      expect(result.adminUser).toBeNull();
      expect(supabase.auth.signOut).toHaveBeenCalled();
    });

    it('should handle auth errors from Supabase', async () => {
      vi.mocked(supabase.auth.signInWithPassword).mockResolvedValue({
        data: { user: null, session: null },
        error: { message: 'Invalid login credentials', status: 400 },
      } as any);

      const result = await AuthService.login('test@example.com', 'wrongpassword');

      expect(result.error).toBeDefined();
      expect(result.error?.message).toBe('Invalid login credentials');
      expect(result.adminUser).toBeNull();
    });
  });

  describe('validateAdminAccess', () => {
    it('should return isValid true for active admin', async () => {
      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValue({
          data: {
            id: 'admin-123',
            role: 'super_admin',
            is_active: true,
          },
          error: null,
        }),
      } as any);

      const result = await AuthService.validateAdminAccess('user-123');

      expect(result.isValid).toBe(true);
      expect(result.adminUser).toBeDefined();
      expect(result.error).toBeNull();
    });

    it('should return isValid false when no admin record exists', async () => {
      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
      } as any);

      const result = await AuthService.validateAdminAccess('user-123');

      expect(result.isValid).toBe(false);
      expect(result.adminUser).toBeNull();
      expect(result.error).toContain('permisos');
    });
  });
});
