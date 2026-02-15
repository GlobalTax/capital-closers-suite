import { useState, useCallback, useRef, useEffect } from "react";
import { toast } from "sonner";

interface UndoableActionOptions {
  /** Acción a ejecutar después del delay */
  action: () => Promise<void> | void;
  /** Mensaje a mostrar en el toast */
  message: string;
  /** Mensaje cuando se deshace */
  undoMessage?: string;
  /** Duración en ms antes de ejecutar (default: 5000) */
  duration?: number;
  /** Callback opcional cuando se deshace */
  onUndo?: () => void;
}

interface UndoableActionReturn {
  executeWithUndo: (options: UndoableActionOptions) => void;
  isPending: boolean;
  cancel: () => void;
}

/**
 * Hook para ejecutar acciones con posibilidad de deshacer.
 * Muestra un toast con botón de deshacer.
 * La acción real se ejecuta después del delay si no se cancela.
 */
export function useUndoableAction(): UndoableActionReturn {
  const [isPending, setIsPending] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const toastIdRef = useRef<string | number | null>(null);

  // Cancelar acción pendiente al desmontar el componente
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };
  }, []);

  const cancel = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    if (toastIdRef.current) {
      toast.dismiss(toastIdRef.current);
      toastIdRef.current = null;
    }
    setIsPending(false);
  }, []);

  const executeWithUndo = useCallback((options: UndoableActionOptions) => {
    const { 
      action, 
      message, 
      undoMessage = "Acción deshecha", 
      duration = 5000,
      onUndo 
    } = options;

    // Cancelar cualquier acción pendiente anterior
    cancel();
    setIsPending(true);

    // Mostrar toast con botón de deshacer
    toastIdRef.current = toast(message, {
      duration: duration,
      action: {
        label: "Deshacer",
        onClick: () => {
          cancel();
          onUndo?.();
          toast.success(undoMessage, { duration: 2000 });
        },
      },
      classNames: {
        toast: "group relative overflow-hidden",
        actionButton: "bg-primary text-primary-foreground hover:bg-primary/90",
      },
    });

    // Programar ejecución de la acción
    timeoutRef.current = setTimeout(async () => {
      try {
        await action();
      } catch (error) {
        toast.error("Error al ejecutar la acción");
        console.error("Error en acción undoable:", error);
      } finally {
        setIsPending(false);
        timeoutRef.current = null;
      }
    }, duration);
  }, [cancel]);

  return {
    executeWithUndo,
    isPending,
    cancel,
  };
}
