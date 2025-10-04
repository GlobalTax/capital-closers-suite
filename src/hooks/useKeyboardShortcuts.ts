import { useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useUIStore } from "@/stores/useUIStore";

export function useKeyboardShortcuts() {
  const navigate = useNavigate();
  const location = useLocation();
  const { toggleCommandPalette, closeDrawer, isDrawerOpen } = useUIStore();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // ⌘/Ctrl+K - Abrir Command Palette
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        toggleCommandPalette();
        return;
      }

      // N - Nuevo (contextual)
      if (e.key === "n" && !e.metaKey && !e.ctrlKey && !e.altKey) {
        const activeElement = document.activeElement;
        if (activeElement?.tagName === "INPUT" || activeElement?.tagName === "TEXTAREA") {
          return;
        }

        e.preventDefault();
        const path = location.pathname;
        
        if (path.startsWith("/mandatos")) {
          console.log("Nuevo mandato");
        } else if (path.startsWith("/clientes")) {
          console.log("Nuevo cliente");
        } else if (path.startsWith("/targets")) {
          console.log("Nuevo target");
        } else if (path.startsWith("/tareas")) {
          console.log("Nueva tarea");
        }
        return;
      }

      // / - Focus en búsqueda
      if (e.key === "/" && !e.metaKey && !e.ctrlKey) {
        const activeElement = document.activeElement;
        if (activeElement?.tagName === "INPUT" || activeElement?.tagName === "TEXTAREA") {
          return;
        }

        e.preventDefault();
        const searchInput = document.querySelector('input[type="text"]') as HTMLInputElement;
        if (searchInput) {
          searchInput.focus();
        }
        return;
      }

      // Esc - Cerrar modales/drawer
      if (e.key === "Escape") {
        if (isDrawerOpen) {
          closeDrawer();
        }
        return;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [toggleCommandPalette, closeDrawer, isDrawerOpen, location.pathname]);
}
