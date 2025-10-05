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
} from "lucide-react";

export function CommandPalette() {
  const navigate = useNavigate();
  const { isCommandPaletteOpen, closeCommandPalette } = useUIStore();
  const [query, setQuery] = useState("");
  const [resultados, setResultados] = useState<ResultadoBusqueda[]>([]);
  const [loading, setLoading] = useState(false);

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

  const handleSelect = (callback: () => void) => {
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
        placeholder="Buscar mandatos, clientes, empresas..."
        value={query}
        onValueChange={setQuery}
      />
      <CommandList>
        <CommandEmpty>
          {loading ? "Buscando..." : "No se encontraron resultados"}
        </CommandEmpty>

        {query.length < 2 && (
          <>
            <CommandGroup heading="Navegación">
              <CommandItem onSelect={() => handleSelect(() => navigate("/mandatos"))}>
                <FileText className="mr-2 h-4 w-4" />
                <span>Mandatos</span>
              </CommandItem>
              <CommandItem onSelect={() => handleSelect(() => navigate("/contactos"))}>
                <Users className="mr-2 h-4 w-4" />
                <span>Contactos</span>
              </CommandItem>
              <CommandItem onSelect={() => handleSelect(() => navigate("/empresas"))}>
                <Building2 className="mr-2 h-4 w-4" />
                <span>Empresas</span>
              </CommandItem>
              <CommandItem onSelect={() => handleSelect(() => navigate("/tareas"))}>
                <ListTodo className="mr-2 h-4 w-4" />
                <span>Tareas</span>
              </CommandItem>
              <CommandItem onSelect={() => handleSelect(() => navigate("/documentos"))}>
                <FolderOpen className="mr-2 h-4 w-4" />
                <span>Documentos</span>
              </CommandItem>
              <CommandItem onSelect={() => handleSelect(() => navigate("/reportes"))}>
                <BarChart3 className="mr-2 h-4 w-4" />
                <span>Reportes</span>
              </CommandItem>
            </CommandGroup>

            <CommandSeparator />

            <CommandGroup heading="Acciones">
              <CommandItem onSelect={() => handleSelect(() => console.log("Nuevo mandato"))}>
                <Plus className="mr-2 h-4 w-4" />
                <span>Nuevo Mandato</span>
              </CommandItem>
              <CommandItem onSelect={() => handleSelect(() => console.log("Nuevo contacto"))}>
                <Plus className="mr-2 h-4 w-4" />
                <span>Nuevo Contacto</span>
              </CommandItem>
              <CommandItem onSelect={() => handleSelect(() => console.log("Nueva empresa"))}>
                <Plus className="mr-2 h-4 w-4" />
                <span>Nueva Empresa</span>
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
