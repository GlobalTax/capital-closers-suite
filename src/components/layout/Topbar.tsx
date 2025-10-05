import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Bell, Settings, Plus, LogOut, User, Moon, Sun } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { SidebarTrigger } from "@/components/ui/sidebar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useUIStore } from "@/stores/useUIStore";
import { searchGlobal } from "@/services/search";
import type { ResultadoBusqueda } from "@/types";
import { useTheme } from "next-themes";

export function Topbar() {
  const navigate = useNavigate();
  const { theme, setTheme } = useTheme();
  const { globalSearchQuery, setGlobalSearchQuery } = useUIStore();
  const [showResults, setShowResults] = useState(false);
  const [resultados, setResultados] = useState<ResultadoBusqueda[]>([]);

  useEffect(() => {
    const buscar = async () => {
      if (globalSearchQuery.length < 2) {
        setResultados([]);
        return;
      }

      try {
        const results = await searchGlobal(globalSearchQuery);
        setResultados(results.slice(0, 5));
      } catch (error) {
        console.error("Error en búsqueda:", error);
      }
    };

    const debounce = setTimeout(buscar, 300);
    return () => clearTimeout(debounce);
  }, [globalSearchQuery]);

  const handleResultClick = (ruta: string) => {
    navigate(ruta);
    setGlobalSearchQuery("");
    setShowResults(false);
  };

  return (
    <header className="h-16 border-b border-border bg-card flex items-center justify-between px-6 sticky top-0 z-10">
      <div className="flex items-center gap-4 flex-1">
        <SidebarTrigger />
        
        <div className="relative max-w-md w-full">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Buscar mandatos, contactos, empresas..."
            className="pl-10 bg-muted/50 border-0"
            value={globalSearchQuery}
            onChange={(e) => setGlobalSearchQuery(e.target.value)}
            onFocus={() => setShowResults(true)}
            onBlur={() => setTimeout(() => setShowResults(false), 200)}
          />
          
          {showResults && resultados.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-card border border-border rounded-lg shadow-lg max-h-80 overflow-y-auto z-50">
              {resultados.map((resultado) => (
                <button
                  key={resultado.id}
                  className="w-full px-4 py-3 text-left hover:bg-muted/50 border-b border-border last:border-0 transition-colors"
                  onClick={() => handleResultClick(resultado.ruta)}
                >
                  <div className="font-medium text-sm">{resultado.titulo}</div>
                  {resultado.subtitulo && (
                    <div className="text-xs text-muted-foreground mt-1">
                      {resultado.subtitulo}
                    </div>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center gap-3">
        {/* Botón + Nuevo */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button className="gap-2">
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">Nuevo</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => console.log("Nuevo mandato")}>
              Nuevo Mandato
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => console.log("Nuevo contacto")}>
              Nuevo Contacto
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => console.log("Nueva empresa")}>
              Nueva Empresa
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => console.log("Nueva tarea")}>
              Nueva Tarea
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <Button variant="ghost" size="icon" className="relative">
          <Bell className="w-5 h-5" />
          <span className="absolute top-1 right-1 w-2 h-2 bg-destructive rounded-full"></span>
        </Button>

        {/* Menú de Usuario */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="gap-2 h-auto p-1 pr-3">
              <Avatar className="w-8 h-8">
                <AvatarImage src="" />
                <AvatarFallback className="bg-primary text-primary-foreground text-sm">
                  JD
                </AvatarFallback>
              </Avatar>
              <div className="hidden md:block text-left">
                <p className="text-sm font-medium">Juan Díaz</p>
                <p className="text-xs text-muted-foreground">Admin</p>
              </div>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>Mi Cuenta</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => console.log("Perfil")}>
              <User className="mr-2 h-4 w-4" />
              <span>Perfil</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => console.log("Configuración")}>
              <Settings className="mr-2 h-4 w-4" />
              <span>Configuración</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => setTheme(theme === "dark" ? "light" : "dark")}>
              {theme === "dark" ? (
                <Sun className="mr-2 h-4 w-4" />
              ) : (
                <Moon className="mr-2 h-4 w-4" />
              )}
              <span>{theme === "dark" ? "Modo Claro" : "Modo Oscuro"}</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => console.log("Cerrar sesión")}>
              <LogOut className="mr-2 h-4 w-4" />
              <span>Cerrar Sesión</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
