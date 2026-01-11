import { useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";

interface ScrollRestorationOptions {
  /** Elemento scrollable (default: window) */
  scrollContainer?: React.RefObject<HTMLElement>;
  /** Clave adicional para diferenciar estados */
  key?: string;
  /** Delay antes de restaurar scroll (ms) */
  delay?: number;
}

const STORAGE_KEY_PREFIX = "scroll-pos-";

/**
 * Hook para persistir y restaurar la posición de scroll.
 * Guarda la posición cuando el usuario navega fuera y la restaura al volver.
 */
export function useScrollRestoration(options: ScrollRestorationOptions = {}) {
  const { scrollContainer, key: extraKey, delay = 100 } = options;
  const location = useLocation();
  const hasRestoredRef = useRef(false);
  
  // Clave única basada en la ruta
  const storageKey = `${STORAGE_KEY_PREFIX}${location.pathname}${extraKey ? `-${extraKey}` : ""}`;

  // Guardar posición de scroll antes de navegar
  useEffect(() => {
    const saveScrollPosition = () => {
      const scrollY = scrollContainer?.current 
        ? scrollContainer.current.scrollTop 
        : window.scrollY;
      
      if (scrollY > 0) {
        sessionStorage.setItem(storageKey, String(scrollY));
      }
    };

    // Guardar al hacer scroll (debounced)
    let timeoutId: ReturnType<typeof setTimeout>;
    const handleScroll = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(saveScrollPosition, 150);
    };

    const target = scrollContainer?.current || window;
    target.addEventListener("scroll", handleScroll, { passive: true });

    // Guardar al salir de la página
    return () => {
      target.removeEventListener("scroll", handleScroll);
      clearTimeout(timeoutId);
      saveScrollPosition();
    };
  }, [storageKey, scrollContainer]);

  // Restaurar posición de scroll al montar
  useEffect(() => {
    if (hasRestoredRef.current) return;
    
    const savedPosition = sessionStorage.getItem(storageKey);
    
    if (savedPosition) {
      const scrollY = parseInt(savedPosition, 10);
      
      // Delay para asegurar que el contenido esté renderizado
      const timeoutId = setTimeout(() => {
        if (scrollContainer?.current) {
          scrollContainer.current.scrollTo({ top: scrollY, behavior: "instant" });
        } else {
          window.scrollTo({ top: scrollY, behavior: "instant" });
        }
        hasRestoredRef.current = true;
      }, delay);

      return () => clearTimeout(timeoutId);
    }
  }, [storageKey, scrollContainer, delay]);

  // Función para limpiar la posición guardada
  const clearSavedPosition = () => {
    sessionStorage.removeItem(storageKey);
  };

  // Función para forzar scroll al top
  const scrollToTop = () => {
    clearSavedPosition();
    if (scrollContainer?.current) {
      scrollContainer.current.scrollTo({ top: 0, behavior: "smooth" });
    } else {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  return {
    clearSavedPosition,
    scrollToTop,
  };
}
