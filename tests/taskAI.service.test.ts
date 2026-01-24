import { describe, it, expect, vi, beforeEach } from 'vitest';
import { parseTaskInput, createTasksFromAI, mapParsedTaskToTarea } from '@/services/taskAI.service';
import { supabase } from '@/integrations/supabase/client';
import type { ParsedTask } from '@/types/taskAI';

describe('taskAI.service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Mock session
    vi.mocked(supabase.auth.getSession).mockResolvedValue({
      data: { session: { access_token: 'test-token' } },
      error: null,
    } as any);
  });

  describe('parseTaskInput', () => {
    it('should throw user-friendly error on 429 rate limit', async () => {
      vi.mocked(global.fetch).mockResolvedValue({
        ok: false,
        status: 429,
        json: () => Promise.resolve({}),
      } as Response);

      await expect(parseTaskInput('crear tarea')).rejects.toThrow(
        'Límite de solicitudes excedido'
      );
    });

    it('should throw user-friendly error on 402 credits exhausted', async () => {
      vi.mocked(global.fetch).mockResolvedValue({
        ok: false,
        status: 402,
        json: () => Promise.resolve({}),
      } as Response);

      await expect(parseTaskInput('crear tarea')).rejects.toThrow(
        'Créditos agotados'
      );
    });

    it('should throw generic error on other status codes', async () => {
      vi.mocked(global.fetch).mockResolvedValue({
        ok: false,
        status: 500,
        json: () => Promise.resolve({ error: 'Internal server error' }),
      } as Response);

      await expect(parseTaskInput('crear tarea')).rejects.toThrow(
        'Internal server error'
      );
    });

    it('should return parsed tasks on success', async () => {
      const mockResponse = {
        success: true,
        tasks: [{ title: 'Test Task', priority: 'alta' }],
        reasoning: 'Parsed correctly',
        team_members: [],
      };

      vi.mocked(global.fetch).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      } as Response);

      const result = await parseTaskInput('crear tarea test');
      expect(result.success).toBe(true);
      expect(result.tasks).toHaveLength(1);
      expect(result.reasoning).toBe('Parsed correctly');
    });

    it('should use anon key when no session exists', async () => {
      vi.mocked(supabase.auth.getSession).mockResolvedValue({
        data: { session: null },
        error: null,
      } as any);

      vi.mocked(global.fetch).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ success: true, tasks: [], reasoning: '' }),
      } as Response);

      await parseTaskInput('test');

      expect(global.fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
          }),
        })
      );
    });
  });

  describe('createTasksFromAI', () => {
    const mockTask: ParsedTask = {
      title: 'Tarea de prueba',
      description: 'Descripción',
      priority: 'alta',
      due_date: null,
      assigned_to_name: null,
      assigned_to_id: null,
      context_type: 'general',
      context_hint: null,
      estimated_minutes: 30,
      suggested_fase: null,
    };

    it('should return error when no userId provided', async () => {
      const result = await createTasksFromAI([mockTask], 'test input', '');
      
      expect(result.success).toBe(false);
      expect(result.created).toBe(0);
      expect(result.errors).toContain('Usuario no autenticado');
    });

    it('should create task and log event on success', async () => {
      const mockInsertedTask = { id: 'task-123' };
      
      // Mock insert -> select -> single chain
      const mockSingle = vi.fn().mockResolvedValue({
        data: mockInsertedTask,
        error: null,
      });
      const mockSelect = vi.fn().mockReturnValue({ single: mockSingle });
      const mockInsert = vi.fn().mockReturnValue({ select: mockSelect });
      
      // Mock for tareas insert
      vi.mocked(supabase.from).mockImplementation((table: string) => {
        if (table === 'tareas') {
          return { insert: mockInsert } as any;
        }
        if (table === 'task_events') {
          return { insert: vi.fn().mockResolvedValue({ error: null }) } as any;
        }
        return {} as any;
      });

      const result = await createTasksFromAI([mockTask], 'test input', 'user-123');

      expect(result.success).toBe(true);
      expect(result.created).toBe(1);
      expect(result.errors).toHaveLength(0);
    });

    it('should handle partial failures gracefully', async () => {
      let callCount = 0;
      
      vi.mocked(supabase.from).mockImplementation((table: string) => {
        if (table === 'tareas') {
          callCount++;
          if (callCount === 1) {
            // First task succeeds
            return {
              insert: vi.fn().mockReturnValue({
                select: vi.fn().mockReturnValue({
                  single: vi.fn().mockResolvedValue({
                    data: { id: 'task-1' },
                    error: null,
                  }),
                }),
              }),
            } as any;
          } else {
            // Second task fails
            return {
              insert: vi.fn().mockReturnValue({
                select: vi.fn().mockReturnValue({
                  single: vi.fn().mockResolvedValue({
                    data: null,
                    error: { message: 'Constraint violation' },
                  }),
                }),
              }),
            } as any;
          }
        }
        if (table === 'task_events') {
          return { insert: vi.fn().mockResolvedValue({ error: null }) } as any;
        }
        return {} as any;
      });

      const result = await createTasksFromAI(
        [mockTask, { ...mockTask, title: 'Segunda tarea' }],
        'test input',
        'user-123'
      );

      expect(result.created).toBe(1);
      expect(result.errors).toHaveLength(1);
      expect(result.success).toBe(false);
    });

    it('should handle unexpected errors', async () => {
      vi.mocked(supabase.from).mockImplementation(() => {
        throw new Error('Network error');
      });

      const result = await createTasksFromAI([mockTask], 'test', 'user-123');

      expect(result.success).toBe(false);
      expect(result.errors).toContain('Error inesperado creando "Tarea de prueba"');
    });
  });

  describe('mapParsedTaskToTarea', () => {
    it('should map ParsedTask to TaskCreationPayload correctly', () => {
      const parsed: ParsedTask = {
        title: 'Revisar contrato',
        description: 'Revisar términos',
        priority: 'urgente',
        due_date: '2024-12-31',
        assigned_to_name: null,
        assigned_to_id: 'user-456',
        context_type: 'mandato',
        context_hint: 'Mandato X',
        estimated_minutes: 60,
        suggested_fase: 'due_diligence',
      };

      const result = mapParsedTaskToTarea(parsed, 'input text', 'user-123');

      expect(result.titulo).toBe('Revisar contrato');
      expect(result.descripcion).toBe('Revisar términos');
      expect(result.estado).toBe('pendiente');
      expect(result.prioridad).toBe('urgente');
      expect(result.fecha_vencimiento).toBe('2024-12-31');
      expect(result.ai_generated).toBe(true);
      expect(result.ai_confidence).toBe(0.85);
      expect(result.asignado_a).toBe('user-456');
      expect(result.creado_por).toBe('user-123');
      expect(result.source_text).toBe('input text');
      expect(result.tipo).toBe('individual');
    });

    it('should use userId as fallback when assigned_to_id is null', () => {
      const parsed: ParsedTask = {
        title: 'Tarea sin asignar',
        description: '',
        priority: 'media',
        due_date: null,
        assigned_to_name: null,
        assigned_to_id: null,
        context_type: 'general',
        context_hint: null,
        estimated_minutes: 15,
        suggested_fase: null,
      };

      const result = mapParsedTaskToTarea(parsed, 'test', 'user-789');

      expect(result.asignado_a).toBe('user-789');
    });

    it('should handle undefined description correctly', () => {
      const parsed: ParsedTask = {
        title: 'Tarea mínima',
        description: '',
        priority: 'baja',
        due_date: null,
        assigned_to_name: null,
        assigned_to_id: null,
        context_type: 'general',
        context_hint: null,
        estimated_minutes: 10,
        suggested_fase: null,
      };

      const result = mapParsedTaskToTarea(parsed, 'test');

      expect(result.descripcion).toBeUndefined();
      expect(result.fecha_vencimiento).toBeUndefined();
    });
  });
});
