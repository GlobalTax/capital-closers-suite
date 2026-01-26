import { useState, useMemo } from "react";
import { Check, ChevronsUpDown, TrendingUp, TrendingDown, Target, Users, FileText, Wrench } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useMandatos, useServicios } from "@/hooks/queries/useMandatos";
import { INTERNAL_PROJECTS, INTERNAL_PROJECT_LABELS, MANDATO_CATEGORIA_LABELS } from "@/lib/constants";

interface MandatoSelectProps {
  value: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  includeGeneralWork?: boolean;
}

const INTERNAL_PROJECT_IDS = Object.values(INTERNAL_PROJECTS);

// Icon component mapping
const IconMap = {
  Target,
  Users,
  FileText,
};

export function MandatoSelect({
  value,
  onValueChange,
  placeholder = "Selecciona un mandato",
  disabled = false,
  includeGeneralWork = true,
}: MandatoSelectProps) {
  const [open, setOpen] = useState(false);
  const { data: mandatos = [], isLoading } = useMandatos();
  const { data: servicios = [], isLoading: loadingServicios } = useServicios();

  // Filter mandatos by status (exclude cerrado, cancelado) and exclude internal projects
  const activeMandatos = useMemo(() => {
    return mandatos.filter(m => 
      !['cerrado', 'cancelado'].includes(m.estado || '') &&
      !INTERNAL_PROJECT_IDS.includes(m.id as typeof INTERNAL_PROJECT_IDS[number])
    );
  }, [mandatos]);

  // Get internal projects from mandatos (always visible, no status filter)
  const internalProjects = useMemo(() => {
    return mandatos.filter(m => 
      INTERNAL_PROJECT_IDS.includes(m.id as typeof INTERNAL_PROJECT_IDS[number])
    );
  }, [mandatos]);

  // Filter servicios by status (exclude cerrado, cancelado)
  const activeServicios = useMemo(() => {
    return servicios.filter(s => 
      !['cerrado', 'cancelado'].includes(s.estado || '')
    );
  }, [servicios]);

  // Group mandatos by tipo
  const mandatosVenta = useMemo(() => 
    activeMandatos.filter(m => m.tipo === 'venta'), 
    [activeMandatos]
  );
  
  const mandatosCompra = useMemo(() => 
    activeMandatos.filter(m => m.tipo === 'compra'), 
    [activeMandatos]
  );

  // Get selected mandato label
  const selectedLabel = useMemo(() => {
    // Check if it's an internal project
    const internalInfo = INTERNAL_PROJECT_LABELS[value];
    if (internalInfo) {
      return `📁 ${internalInfo.label}`;
    }
    
    // Check mandatos M&A
    const mandato = mandatos.find(m => m.id === value);
    if (mandato) {
      const empresaNombre = mandato.empresa_principal?.nombre || 'Sin empresa';
      return `${empresaNombre} - ${mandato.descripcion || mandato.tipo}`;
    }

    // Check servicios
    const servicio = servicios.find(s => s.id === value);
    if (servicio) {
      const empresaNombre = servicio.empresa_principal?.nombre || 'Sin empresa';
      const categoriaInfo = MANDATO_CATEGORIA_LABELS[servicio.categoria || ''];
      return `🔧 ${empresaNombre} - ${categoriaInfo?.label || 'Servicio'}`;
    }
    
    return null;
  }, [value, mandatos, servicios]);

  const getMandatoDisplayName = (mandato: typeof mandatos[0]) => {
    const empresaNombre = mandato.empresa_principal?.nombre || 'Sin empresa';
    const desc = mandato.descripcion || `Mandato ${mandato.tipo}`;
    return { empresaNombre, desc };
  };

  const getInternalProjectIcon = (projectId: string) => {
    const info = INTERNAL_PROJECT_LABELS[projectId];
    if (!info) return Target;
    return IconMap[info.icon as keyof typeof IconMap] || Target;
  };

  const isLoadingAny = isLoading || loadingServicios;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between font-normal"
          disabled={disabled || isLoadingAny}
        >
          {isLoadingAny ? (
            "Cargando..."
          ) : selectedLabel ? (
            <span className="truncate">{selectedLabel}</span>
          ) : (
            <span className="text-muted-foreground">{placeholder}</span>
          )}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[400px] p-0" align="start">
        <Command>
          <CommandInput placeholder="Buscar mandato o servicio..." />
          <CommandList>
            <CommandEmpty>No se encontraron resultados.</CommandEmpty>
            
            {/* Proyectos Internos */}
            {includeGeneralWork && internalProjects.length > 0 && (
              <>
                <CommandGroup heading="📁 Proyectos Internos">
                  {internalProjects.map((project) => {
                    const info = INTERNAL_PROJECT_LABELS[project.id];
                    const IconComponent = getInternalProjectIcon(project.id);
                    return (
                      <CommandItem
                        key={project.id}
                        value={`interno-${info?.label || 'Proyecto'}-${project.id}`}
                        onSelect={() => {
                          onValueChange(project.id);
                          setOpen(false);
                        }}
                      >
                        <Check
                          className={cn(
                            "mr-2 h-4 w-4",
                            value === project.id ? "opacity-100" : "opacity-0"
                          )}
                        />
                        <IconComponent className="mr-2 h-4 w-4 text-violet-500" />
                        <div className="flex flex-col">
                          <span className="font-medium">{info?.label || 'Proyecto Interno'}</span>
                          <span className="text-xs text-muted-foreground">
                            {info?.description || project.descripcion}
                          </span>
                        </div>
                      </CommandItem>
                    );
                  })}
                </CommandGroup>
                <CommandSeparator />
              </>
            )}

            {/* Mandatos de Venta */}
            {mandatosVenta.length > 0 && (
              <>
                <CommandGroup heading={`🟦 Mandatos de Venta (${mandatosVenta.length})`}>
                  {mandatosVenta.map((mandato) => {
                    const { empresaNombre, desc } = getMandatoDisplayName(mandato);
                    return (
                      <CommandItem
                        key={mandato.id}
                        value={`venta-${empresaNombre}-${desc}-${mandato.id}`}
                        onSelect={() => {
                          onValueChange(mandato.id);
                          setOpen(false);
                        }}
                      >
                        <Check
                          className={cn(
                            "mr-2 h-4 w-4",
                            value === mandato.id ? "opacity-100" : "opacity-0"
                          )}
                        />
                        <TrendingUp className="mr-2 h-4 w-4 text-blue-500" />
                        <div className="flex flex-col min-w-0">
                          <span className="font-medium truncate">{empresaNombre}</span>
                          <span className="text-xs text-muted-foreground truncate">
                            {desc}
                          </span>
                        </div>
                      </CommandItem>
                    );
                  })}
                </CommandGroup>
                <CommandSeparator />
              </>
            )}

            {/* Mandatos de Compra */}
            {mandatosCompra.length > 0 && (
              <>
                <CommandGroup heading={`🟧 Mandatos de Compra (${mandatosCompra.length})`}>
                  {mandatosCompra.map((mandato) => {
                    const { empresaNombre, desc } = getMandatoDisplayName(mandato);
                    return (
                      <CommandItem
                        key={mandato.id}
                        value={`compra-${empresaNombre}-${desc}-${mandato.id}`}
                        onSelect={() => {
                          onValueChange(mandato.id);
                          setOpen(false);
                        }}
                      >
                        <Check
                          className={cn(
                            "mr-2 h-4 w-4",
                            value === mandato.id ? "opacity-100" : "opacity-0"
                          )}
                        />
                        <TrendingDown className="mr-2 h-4 w-4 text-orange-500" />
                        <div className="flex flex-col min-w-0">
                          <span className="font-medium truncate">{empresaNombre}</span>
                          <span className="text-xs text-muted-foreground truncate">
                            {desc}
                          </span>
                        </div>
                      </CommandItem>
                    );
                  })}
                </CommandGroup>
                <CommandSeparator />
              </>
            )}

            {/* Servicios */}
            {activeServicios.length > 0 && (
              <CommandGroup heading={`🔧 Servicios (${activeServicios.length})`}>
                {activeServicios.map((servicio) => {
                  const empresaNombre = servicio.empresa_principal?.nombre || 'Sin empresa';
                  const categoriaInfo = MANDATO_CATEGORIA_LABELS[servicio.categoria || ''];
                  return (
                    <CommandItem
                      key={servicio.id}
                      value={`servicio-${empresaNombre}-${categoriaInfo?.label || ''}-${servicio.descripcion || ''}-${servicio.id}`}
                      onSelect={() => {
                        onValueChange(servicio.id);
                        setOpen(false);
                      }}
                    >
                      <Check
                        className={cn(
                          "mr-2 h-4 w-4",
                          value === servicio.id ? "opacity-100" : "opacity-0"
                        )}
                      />
                      <Wrench className="mr-2 h-4 w-4 text-purple-500" />
                      <div className="flex flex-col min-w-0">
                        <span className="font-medium truncate">{empresaNombre}</span>
                        <span className="text-xs text-muted-foreground truncate">
                          {categoriaInfo?.label || servicio.categoria} {servicio.descripcion ? `- ${servicio.descripcion}` : ''}
                        </span>
                      </div>
                    </CommandItem>
                  );
                })}
              </CommandGroup>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
