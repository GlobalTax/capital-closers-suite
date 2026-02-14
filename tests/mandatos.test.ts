import { describe, it, expect, vi, beforeEach } from 'vitest';
import { supabase } from '@/integrations/supabase/client';
import { fetchMandatos, createMandato, updateMandato, deleteMandato } from '@/services/mandatos';
import { DatabaseError } from '@/lib/error-handler';

// Re-mock error-handler to NOT mock DatabaseError (we need the real class)
vi.mock('@/lib/error-handler', async () => {
  const actual = await vi.importActual<typeof import('@/lib/error-handler')>('@/lib/error-handler');
  return {
    ...actual,
    handleError: vi.fn(),
  };
});

describe('mandatos service', () => {
  const mockFrom = supabase.from as ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('fetchMandatos', () => {
    it('returns mandatos on success', async () => {
      const mockData = [{ id: '1', tipo: 'venta' }];
      const chain = {
        select: vi.fn().mockReturnThis(),
        or: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
      };
      // Last order call resolves the promise
      chain.order.mockResolvedValueOnce({ data: mockData, error: null });
      // First order call returns chain for chaining
      chain.order.mockImplementationOnce(() => chain);
      
      // Reset and set up properly
      chain.order = vi.fn()
        .mockReturnValueOnce(chain) // first .order() returns chain
        .mockResolvedValueOnce({ data: mockData, error: null }); // second .order() resolves
      
      mockFrom.mockReturnValue(chain);

      const result = await fetchMandatos();
      expect(mockFrom).toHaveBeenCalledWith('mandatos');
      expect(result).toEqual(mockData);
    });

    it('throws DatabaseError on supabase error', async () => {
      const chain = {
        select: vi.fn().mockReturnThis(),
        or: vi.fn().mockReturnThis(),
        order: vi.fn()
          .mockReturnValueOnce({ order: vi.fn().mockResolvedValueOnce({ data: null, error: { message: 'fail', code: '42P01' } }) }),
      };
      // Simpler approach
      const innerChain = {
        select: vi.fn().mockReturnThis(),
        or: vi.fn().mockReturnThis(),
        order: vi.fn(),
      };
      innerChain.order.mockReturnValueOnce(innerChain);
      innerChain.order.mockResolvedValueOnce({ data: null, error: { message: 'fail', code: '42P01' } });
      
      mockFrom.mockReturnValue(innerChain);

      await expect(fetchMandatos()).rejects.toThrow(DatabaseError);
    });
  });

  describe('createMandato', () => {
    it('calls insert and returns created mandato', async () => {
      const newMandato = { tipo: 'venta', estado: 'activo' };
      const created = { id: 'new-id', ...newMandato };
      const chain = {
        insert: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: created, error: null }),
      };
      mockFrom.mockReturnValue(chain);

      const result = await createMandato(newMandato);
      expect(chain.insert).toHaveBeenCalledWith(newMandato);
      expect(result).toEqual(created);
    });

    it('throws DatabaseError on insert error', async () => {
      const chain = {
        insert: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: null, error: { message: 'duplicate' } }),
      };
      mockFrom.mockReturnValue(chain);

      await expect(createMandato({ tipo: 'venta' })).rejects.toThrow(DatabaseError);
    });
  });

  describe('updateMandato', () => {
    it('calls update with correct id', async () => {
      const updated = { id: '550e8400-e29b-41d4-a716-446655440000', tipo: 'compra' };
      const chain = {
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: updated, error: null }),
      };
      mockFrom.mockReturnValue(chain);

      const result = await updateMandato('550e8400-e29b-41d4-a716-446655440000', { tipo: 'compra' });
      expect(chain.update).toHaveBeenCalledWith({ tipo: 'compra' });
      expect(chain.eq).toHaveBeenCalledWith('id', '550e8400-e29b-41d4-a716-446655440000');
      expect(result).toEqual(updated);
    });

    it('throws on invalid UUID', async () => {
      await expect(updateMandato('invalid', {})).rejects.toThrow(DatabaseError);
    });
  });

  describe('deleteMandato', () => {
    it('calls delete with correct id', async () => {
      const chain = {
        delete: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({ error: null }),
      };
      mockFrom.mockReturnValue(chain);

      await deleteMandato('550e8400-e29b-41d4-a716-446655440000');
      expect(chain.delete).toHaveBeenCalled();
      expect(chain.eq).toHaveBeenCalledWith('id', '550e8400-e29b-41d4-a716-446655440000');
    });

    it('throws on invalid UUID', async () => {
      await expect(deleteMandato('')).rejects.toThrow(DatabaseError);
    });
  });
});
