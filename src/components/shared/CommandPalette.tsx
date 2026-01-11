import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import { useUIStore } from "@/stores/useUIStore";
import { searchGlobal } from "@/services/search";
import type { ResultadoBusqueda } from "@/types";
import {
  FileText,
  Users,
  Building2,
  ListTodo,
  FolderOpen,
  BarChart3,
  Plus,
  Clock,
  Sun,
  Moon,
  Settings,
} from "lucide-react";
import { KeyboardHint } from "./KeyboardHint";
import { useTheme } from "next-themes";

export function CommandPalette() {
  const navigate = useNavigate();
  const { isCommandPaletteOpen, closeCommandPalette } = useUIStore();
  const { theme, setTheme } = useTheme();
  const [query, setQuery] = useState("");
  const [resultados, setResultados] = useState<ResultadoBusqueda[]>([]);
  const [loading, setLoading] = useState(false);
  const [recentActions, setRecentActions] = useState<string[]>([]);

  // Cargar acciones recientes
  useEffect(() => {
    try {
      const stored = localStorage.getItem("recentCommandActions");
      if (stored) {
        setRecentActions(JSON.parse(stored));
      }
    } catch (error) {
      console.error("Error loading recent actions:", error);
    }
  }, [isCommandPaletteOpen]);

  const trackAction = (actionPath: string) => {
    const updated = [actionPath, ...recentActions.filter(a => a !== actionPath)].slice(0, 5);
    setRecentActions(updated);
    localStorage.setItem("recentCommandActions", JSON.stringify(updated));
  };

  useEffect(() => {
    const buscar = async () => {
      if (query.length < 2) {
        setResultados([]);
        return;
      }

      setLoading(true);
      try {
        const results = await searchGlobal(query);
        setResultados(results);
      } catch (error) {
        console.error("Error en búsqueda:", error);
      } finally {
        setLoading(false);
      }
    };

    const debounce = setTimeout(buscar, 300);
    return () => clearTimeout(debounce);
  }, [query]);

  const handleSelect = (callback: () => void, actionPath?: string) => {
    if (actionPath) {
      trackAction(actionPath);
    }
    callback();
    closeCommandPalette();
    setQuery("");
    setResultados([]);
  };

  const getIconForType = (tipo: ResultadoBusqueda["tipo"]) => {
    switch (tipo) {
      case "mandato":
        return FileText;
      case "contacto":
        return Users;
      case "empresa":
        return Building2;
      default:
        return FileText;
    }
  };

  const mandatosResults = resultados.filter((r) => r.tipo === "mandato");
  const contactosResults = resultados.filter((r) => r.tipo === "contacto");
  const empresasResults = resultados.filter((r) => r.tipo === "empresa");

  return (
    <CommandDialog open={isCommandPaletteOpen} onOpenChange={closeCommandPalette}>
      <CommandInput
        placeholder="Buscar mandatos, contactos, empresas..."
        value={query}
        onValueChange={setQuery}
      />
      <CommandList>
        <CommandEmpty>
          {loading ? "Buscando..." : "No se encontraron resultados"}
        </CommandEmpty>

        {query.length < 2 && (
          <>
            {/* Acciones recientes */}
            {recentActions.length > 0 && (
              <>
                <CommandGroup heading="Recientes">
                  {recentActions.slice(0, 3).map((action) => {
                    const actionConfig = getActionConfig(action);
                    if (!actionConfig) return null;
                    return (
                      <CommandItem
                        key={action}
                        onSelect={() => handleSelect(() => navigate(action), action)}
                      >
                        <Clock className="mr-2 h-4 w-4 text-muted-foreground" />
                        <span>{actionConfig.label}</span>
                      </CommandItem>
                    );
                  })}
                </CommandGroup>
                <CommandSeparator />
              </>
            )}

            <CommandGroup heading="Navegación">
              <CommandItem onSelect={() => handleSelect(() => navigate("/mandatos"), "/mandatos")}>
                <FileText className="mr-2 h-4 w-4" />
                <span className="flex-1">Mandatos</span>
                <KeyboardHint shortcut="G M" />
              </CommandItem>
              <CommandItem onSelect={() => handleSelect(() => navigate("/contactos"), "/contactos")}>
                <Users className="mr-2 h-4 w-4" />
                <span className="flex-1">Contactos</span>
                <KeyboardHint shortcut="G C" />
              </CommandItem>
              <CommandItem onSelect={() => handleSelect(() => navigate("/empresas"), "/empresas")}>
                <Building2 className="mr-2 h-4 w-4" />
                <span className="flex-1">Empresas</span>
                <KeyboardHint shortcut="G E" />
              </CommandItem>
              <CommandItem onSelect={() => handleSelect(() => navigate("/tareas"), "/tareas")}>
                <ListTodo className="mr-2 h-4 w-4" />
                <span className="flex-1">Tareas</span>
                <KeyboardHint shortcut="G T" />
              </CommandItem>
              <CommandItem onSelect={() => handleSelect(() => navigate("/documentos"), "/documentos")}>
                <FolderOpen className="mr-2 h-4 w-4" />
                <span>Documentos</span>
              </CommandItem>
              <CommandItem onSelect={() => handleSelect(() => navigate("/reportes"), "/reportes")}>
                <BarChart3 className="mr-2 h-4 w-4" />
                <span>Reportes</span>
              </CommandItem>
            </CommandGroup>

            <CommandSeparator />

            <CommandGroup heading="Acciones rápidas">
              <CommandItem onSelect={() => handleSelect(() => navigate("/mandatos?nuevo=true"), "/mandatos?nuevo=true")}>
                <Plus className="mr-2 h-4 w-4" />
                <span className="flex-1">Nuevo Mandato</span>
                <KeyboardHint shortcut="N" />
              </CommandItem>
              <CommandItem onSelect={() => handleSelect(() => navigate("/contactos?nuevo=true"), "/contactos?nuevo=true")}>
                <Plus className="mr-2 h-4 w-4" />
                <span>Nuevo Contacto</span>
              </CommandItem>
              <CommandItem onSelect={() => handleSelect(() => navigate("/empresas?nuevo=true"), "/empresas?nuevo=true")}>
                <Plus className="mr-2 h-4 w-4" />
                <span>Nueva Empresa</span>
              </CommandItem>
            </CommandGroup>

            <CommandSeparator />

            <CommandGroup heading="Preferencias">
              <CommandItem
                onSelect={() => handleSelect(() => setTheme(theme === "dark" ? "light" : "dark"))}
              >
                {theme === "dark" ? (
                  <Sun className="mr-2 h-4 w-4" />
                ) : (
                  <Moon className="mr-2 h-4 w-4" />
                )}
                <span>Cambiar a modo {theme === "dark" ? "claro" : "oscuro"}</span>
              </CommandItem>
              <CommandItem onSelect={() => handleSelect(() => navigate("/perfil"), "/perfil")}>
                <Settings className="mr-2 h-4 w-4" />
                <span>Configuración</span>
              </CommandItem>
            </CommandGroup>
          </>
        )}

        {mandatosResults.length > 0 && (
          <>
            <CommandGroup heading="Mandatos">
              {mandatosResults.map((resultado) => {
                const Icon = getIconForType(resultado.tipo);
                return (
                  <CommandItem
                    key={resultado.id}
                    onSelect={() => handleSelect(() => navigate(resultado.ruta))}
                  >
                    <Icon className="mr-2 h-4 w-4" />
                    <div className="flex flex-col">
                      <span>{resultado.titulo}</span>
                      {resultado.subtitulo && (
                        <span className="text-xs text-muted-foreground">
                          {resultado.subtitulo}
                        </span>
                      )}
                    </div>
                  </CommandItem>
                );
              })}
            </CommandGroup>
          </>
        )}

        {contactosResults.length > 0 && (
          <>
            <CommandGroup heading="Contactos">
              {contactosResults.map((resultado) => {
                const Icon = getIconForType(resultado.tipo);
                return (
                  <CommandItem
                    key={resultado.id}
                    onSelect={() => handleSelect(() => navigate(resultado.ruta))}
                  >
                    <Icon className="mr-2 h-4 w-4" />
                    <div className="flex flex-col">
                      <span>{resultado.titulo}</span>
                      {resultado.subtitulo && (
                        <span className="text-xs text-muted-foreground">
                          {resultado.subtitulo}
                        </span>
                      )}
                    </div>
                  </CommandItem>
                );
              })}
            </CommandGroup>
          </>
        )}

        {empresasResults.length > 0 && (
          <>
            <CommandGroup heading="Empresas">
              {empresasResults.map((resultado) => {
                const Icon = getIconForType(resultado.tipo);
                return (
                  <CommandItem
                    key={resultado.id}
                    onSelect={() => handleSelect(() => navigate(resultado.ruta))}
                  >
                    <Icon className="mr-2 h-4 w-4" />
                    <div className="flex flex-col">
                      <span>{resultado.titulo}</span>
                      {resultado.subtitulo && (
                        <span className="text-xs text-muted-foreground">
                          {resultado.subtitulo}
                        </span>
                      )}
                    </div>
                  </CommandItem>
                );
              })}
            </CommandGroup>
          </>
        )}
      </CommandList>
    </CommandDialog>
  );
}

// Helper para obtener configuración de acción reciente
function getActionConfig(path: string): { label: string; icon: any } | null {
  const configs: Record<string, { label: string; icon: any }> = {
    "/mandatos": { label: "Mandatos", icon: FileText },
    "/contactos": { label: "Contactos", icon: Users },
    "/empresas": { label: "Empresas", icon: Building2 },
    "/tareas": { label: "Tareas", icon: ListTodo },
    "/documentos": { label: "Documentos", icon: FolderOpen },
    "/reportes": { label: "Reportes", icon: BarChart3 },
    "/mandatos?nuevo=true": { label: "Nuevo Mandato", icon: Plus },
    "/contactos?nuevo=true": { label: "Nuevo Contacto", icon: Plus },
    "/empresas?nuevo=true": { label: "Nueva Empresa", icon: Plus },
    "/perfil": { label: "Configuración", icon: Settings },
  };
  return configs[path] || null;
}
