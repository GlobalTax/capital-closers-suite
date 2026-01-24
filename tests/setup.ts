import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Mock de Supabase client (extendido para Task AI y Target Pipeline)
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    auth: {
      signInWithPassword: vi.fn(),
      signOut: vi.fn(),
      getSession: vi.fn(),
      getUser: vi.fn(),
      updateUser: vi.fn(),
      onAuthStateChange: vi.fn(() => ({
        data: { subscription: { unsubscribe: vi.fn() } },
      })),
    },
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn(),
      single: vi.fn(),
      insert: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      delete: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
    })),
    rpc: vi.fn(),
    functions: {
      invoke: vi.fn(),
    },
  },
}));

// Mock de toast (sonner)
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
    warning: vi.fn(),
  },
}));

// Mock de use-toast hook
vi.mock('@/hooks/use-toast', () => ({
  toast: vi.fn(),
  useToast: () => ({ toast: vi.fn() }),
}));

// Mock de error-handler
vi.mock('@/lib/error-handler', () => ({
  handleError: vi.fn(),
}));

// Mock global de fetch para Edge Functions
const originalFetch = global.fetch;
global.fetch = vi.fn();

// Cleanup después de cada test
afterEach(() => {
  vi.clearAllMocks();
});

// Restore fetch después de todos los tests
afterAll(() => {
  global.fetch = originalFetch;
});
