import { useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useUIStore } from "@/stores/useUIStore";

export function useKeyboardShortcuts() {
  const navigate = useNavigate();
  const location = useLocation();
  const { 
    toggleCommandPalette, 
    closeDrawer, 
    isDrawerOpen, 
    openAITaskDialog,
    isAITaskDialogOpen,
    closeAITaskDialog
  } = useUIStore();
  const gKeyPressed = useRef(false);
  const gKeyTimer = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeElement = document.activeElement;
      const isTyping = activeElement?.tagName === "INPUT" || activeElement?.tagName === "TEXTAREA";

      // ⌘/Ctrl+K - Abrir Command Palette
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        toggleCommandPalette();
        return;
      }

      // ⌘/Ctrl+Shift+T - Abrir AI Task Dialog (funciona incluso mientras escribe)
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key.toLowerCase() === "t") {
        e.preventDefault();
        openAITaskDialog();
        return;
      }

      // Ignorar atajos si está escribiendo
      if (isTyping) return;

      // G + tecla - Navegación rápida (estilo Vim/GitHub)
      if (e.key === "g" && !e.metaKey && !e.ctrlKey && !e.altKey) {
        gKeyPressed.current = true;
        gKeyTimer.current = setTimeout(() => {
          gKeyPressed.current = false;
        }, 500);
        return;
      }

      if (gKeyPressed.current) {
        e.preventDefault();
        gKeyPressed.current = false;
        clearTimeout(gKeyTimer.current);

        switch (e.key) {
          case "m":
            navigate("/mandatos");
            break;
          case "c":
            navigate("/contactos");
            break;
          case "e":
            navigate("/empresas");
            break;
          case "t":
            navigate("/tareas");
            break;
          case "d":
            navigate("/documentos");
            break;
          case "r":
            navigate("/reportes");
            break;
          case "h":
            navigate("/");
            break;
        }
        return;
      }

      // F - Toggle panel de filtros
      if (e.key === "f" && !e.metaKey && !e.ctrlKey && !e.altKey) {
        e.preventDefault();
        const filterButton = document.querySelector('[data-filter-toggle]') as HTMLButtonElement;
        if (filterButton) {
          filterButton.click();
        }
        return;
      }

      // N - Nuevo (contextual)
      if (e.key === "n" && !e.metaKey && !e.ctrlKey && !e.altKey) {
        e.preventDefault();
        const path = location.pathname;
        
        if (path.startsWith("/mandatos")) {
          navigate("/mandatos?nuevo=true");
        } else if (path.startsWith("/contactos")) {
          navigate("/contactos?nuevo=true");
        } else if (path.startsWith("/empresas")) {
          navigate("/empresas?nuevo=true");
        } else if (path.startsWith("/tareas")) {
          navigate("/tareas?nuevo=true");
        }
        return;
      }

      // / - Focus en búsqueda
      if (e.key === "/" && !e.metaKey && !e.ctrlKey) {
        e.preventDefault();
        const searchInput = document.querySelector('input[type="text"]') as HTMLInputElement;
        if (searchInput) {
          searchInput.focus();
        }
        return;
      }

      // Esc - Cerrar modales/drawer
      if (e.key === "Escape") {
        if (isAITaskDialogOpen) {
          closeAITaskDialog();
          return;
        }
        if (isDrawerOpen) {
          closeDrawer();
        }
        return;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      clearTimeout(gKeyTimer.current);
    };
  }, [toggleCommandPalette, closeDrawer, isDrawerOpen, location.pathname, navigate, openAITaskDialog, isAITaskDialogOpen, closeAITaskDialog]);
}
