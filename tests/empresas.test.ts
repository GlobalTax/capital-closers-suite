import { describe, it, expect, vi, beforeEach } from 'vitest';
import { supabase } from '@/integrations/supabase/client';
import { empresaService } from '@/services/empresas';
import { DatabaseError } from '@/lib/error-handler';

// Re-mock to keep real DatabaseError class
vi.mock('@/lib/error-handler', async () => {
  const actual = await vi.importActual<typeof import('@/lib/error-handler')>('@/lib/error-handler');
  return {
    ...actual,
    handleError: vi.fn(),
  };
});

describe('empresas service', () => {
  const mockFrom = supabase.from as ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getAll', () => {
    it('returns empresas on success', async () => {
      const mockData = [{ id: '1', nombre: 'Test Corp', created_at: '2024-01-01' }];
      const chain = {
        select: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({ data: mockData, error: null }),
        eq: vi.fn().mockReturnThis(),
      };
      mockFrom.mockReturnValue(chain);

      const result = await empresaService.getAll();
      expect(mockFrom).toHaveBeenCalledWith('empresas');
      expect(result.length).toBe(1);
      expect(result[0].nombre).toBe('Test Corp');
    });

    it('filters by esTarget when provided', async () => {
      const chain = {
        select: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({ data: [], error: null }),
      };
      mockFrom.mockReturnValue(chain);

      await empresaService.getAll(true);
      expect(chain.eq).toHaveBeenCalledWith('es_target', true);
    });

    it('throws DatabaseError on error', async () => {
      const chain = {
        select: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({ data: null, error: { code: '42P01', message: 'fail' } }),
      };
      mockFrom.mockReturnValue(chain);

      await expect(empresaService.getAll()).rejects.toThrow(DatabaseError);
    });
  });

  describe('create', () => {
    it('creates and returns empresa', async () => {
      const created = { id: 'new', nombre: 'New Corp', created_at: '2024-01-01' };
      const chain = {
        insert: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: created, error: null }),
      };
      mockFrom.mockReturnValue(chain);

      const result = await empresaService.create({ nombre: 'New Corp' } as any);
      expect(result.nombre).toBe('New Corp');
    });
  });

  describe('update', () => {
    it('updates and returns empresa', async () => {
      const updated = { id: '1', nombre: 'Updated Corp', created_at: '2024-01-01' };
      const chain = {
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: updated, error: null }),
      };
      mockFrom.mockReturnValue(chain);

      const result = await empresaService.update('1', { nombre: 'Updated Corp' } as any);
      expect(result.nombre).toBe('Updated Corp');
    });

    it('throws on empty id', async () => {
      await expect(empresaService.update('', {} as any)).rejects.toThrow();
    });
  });

  describe('delete', () => {
    it('deletes successfully', async () => {
      const chain = {
        delete: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({ error: null }),
      };
      mockFrom.mockReturnValue(chain);

      await expect(empresaService.delete('1')).resolves.toBeUndefined();
    });

    it('throws on empty id', async () => {
      await expect(empresaService.delete('')).rejects.toThrow();
    });
  });
});
