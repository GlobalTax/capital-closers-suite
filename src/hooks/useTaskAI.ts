import { useState, useCallback } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { parseTaskInput, createTasksFromAI } from '@/services/taskAI.service';
import type { ParsedTask, TaskAIResponse } from '@/types/taskAI';
import { toast } from 'sonner';

interface UseTaskAIReturn {
  parseInput: (text: string) => Promise<TaskAIResponse | null>;
  createTasks: (tasks: ParsedTask[], sourceText: string, targetType?: 'tarea' | 'checklist') => Promise<boolean>;
  parsedTasks: ParsedTask[];
  reasoning: string;
  isLoading: boolean;
  isParsing: boolean;
  isCreating: boolean;
  error: string | null;
  reset: () => void;
}

export function useTaskAI(): UseTaskAIReturn {
  const queryClient = useQueryClient();
  const [parsedTasks, setParsedTasks] = useState<ParsedTask[]>([]);
  const [reasoning, setReasoning] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  const parseMutation = useMutation({
    mutationFn: parseTaskInput,
    onSuccess: (data) => {
      if (data.success && data.tasks) {
        setParsedTasks(data.tasks);
        setReasoning(data.reasoning || '');
        setError(null);
      } else {
        setError(data.error || 'Error desconocido');
        setParsedTasks([]);
      }
    },
    onError: (err: Error) => {
      setError(err.message);
      setParsedTasks([]);
      toast.error(err.message);
    },
  });

  const createMutation = useMutation({
    mutationFn: async ({ tasks, sourceText, targetType }: { 
      tasks: ParsedTask[]; 
      sourceText: string; 
      targetType: 'tarea' | 'checklist';
    }) => {
      return createTasksFromAI(tasks, sourceText, targetType);
    },
    onSuccess: (result) => {
      if (result.success) {
        toast.success(`${result.created} tarea${result.created > 1 ? 's' : ''} creada${result.created > 1 ? 's' : ''} con IA`);
        queryClient.invalidateQueries({ queryKey: ['tareas'] });
        setParsedTasks([]);
        setReasoning('');
      } else {
        result.errors.forEach(e => toast.error(e));
      }
    },
    onError: (err: Error) => {
      toast.error(err.message);
    },
  });

  const parseInput = useCallback(async (text: string): Promise<TaskAIResponse | null> => {
    if (!text.trim()) {
      setError('Por favor, escribe algo para analizar');
      return null;
    }
    
    try {
      const result = await parseMutation.mutateAsync(text);
      return result;
    } catch {
      return null;
    }
  }, [parseMutation]);

  const createTasks = useCallback(async (
    tasks: ParsedTask[], 
    sourceText: string,
    targetType: 'tarea' | 'checklist' = 'tarea'
  ): Promise<boolean> => {
    if (tasks.length === 0) {
      toast.error('No hay tareas para crear');
      return false;
    }

    const result = await createMutation.mutateAsync({ tasks, sourceText, targetType });
    return result.success;
  }, [createMutation]);

  const reset = useCallback(() => {
    setParsedTasks([]);
    setReasoning('');
    setError(null);
  }, []);

  return {
    parseInput,
    createTasks,
    parsedTasks,
    reasoning,
    isLoading: parseMutation.isPending || createMutation.isPending,
    isParsing: parseMutation.isPending,
    isCreating: createMutation.isPending,
    error,
    reset,
  };
}
