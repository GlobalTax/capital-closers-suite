import { describe, it, expect, vi, beforeEach } from 'vitest';

// Unmock error-handler so we test the real implementation
vi.unmock('@/lib/error-handler');

// Mock use-toast with factory (no external refs)
vi.mock('@/hooks/use-toast', () => {
  const toast = vi.fn();
  return { toast, useToast: () => ({ toast }) };
});

import { handleError, AppError, DatabaseError, ValidationError, AuthenticationError } from '@/lib/error-handler';
import { toast } from '@/hooks/use-toast';

describe('error-handler', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('handleError', () => {
    it('handles AppError with correct toast', () => {
      const error = new DatabaseError('DB connection failed', { table: 'users' });
      handleError(error, 'Loading users');

      expect(toast).toHaveBeenCalledWith(
        expect.objectContaining({
          variant: 'destructive',
          description: error.userMessage,
        })
      );
    });

    it('handles critical AppError with "Error Crítico" title', () => {
      const error = new AppError('System crash', 'SYSTEM_ERROR', 'critical', 'Sistema caído');
      handleError(error);

      expect(toast).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Error Crítico',
          description: 'Sistema caído',
        })
      );
    });

    it('handles regular Error with message', () => {
      const error = new Error('Network timeout');
      handleError(error, 'API call');

      expect(toast).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'API call',
          description: 'Network timeout',
          variant: 'destructive',
        })
      );
    });

    it('handles unknown error types', () => {
      handleError('string error', 'Context');

      expect(toast).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Error',
          variant: 'destructive',
        })
      );
    });

    it('handles null/undefined errors', () => {
      handleError(null);
      expect(toast).toHaveBeenCalled();

      handleError(undefined);
      expect(toast).toHaveBeenCalledTimes(2);
    });
  });

  describe('Error classes', () => {
    it('DatabaseError has correct defaults', () => {
      const err = new DatabaseError('test');
      expect(err.code).toBe('DB_ERROR');
      expect(err.severity).toBe('high');
      expect(err.name).toBe('AppError');
    });

    it('ValidationError has correct defaults', () => {
      const err = new ValidationError('test');
      expect(err.code).toBe('VALIDATION_ERROR');
      expect(err.severity).toBe('medium');
    });

    it('AuthenticationError has correct defaults', () => {
      const err = new AuthenticationError('test');
      expect(err.code).toBe('AUTH_ERROR');
      expect(err.severity).toBe('high');
    });
  });
});
