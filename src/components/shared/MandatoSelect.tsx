import { useState, useMemo } from "react";
import { Check, ChevronsUpDown, Building2, TrendingUp, TrendingDown, Search } from "lucide-react";
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
import { useMandatos } from "@/hooks/queries/useMandatos";

interface MandatoSelectProps {
  value: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  includeGeneralWork?: boolean;
}

const GENERAL_WORK_ID = "00000000-0000-0000-0000-000000000001";

export function MandatoSelect({
  value,
  onValueChange,
  placeholder = "Selecciona un mandato",
  disabled = false,
  includeGeneralWork = true,
}: MandatoSelectProps) {
  const [open, setOpen] = useState(false);
  const { data: mandatos = [], isLoading } = useMandatos();

  // Filter mandatos by status (exclude cerrado, cancelado)
  const activeMandatos = useMemo(() => {
    return mandatos.filter(m => 
      !['cerrado', 'cancelado'].includes(m.estado || '')
    );
  }, [mandatos]);

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
    if (value === GENERAL_WORK_ID) {
      return "🏢 Trabajo General M&A";
    }
    const mandato = mandatos.find(m => m.id === value);
    if (mandato) {
      const empresaNombre = mandato.empresa_principal?.nombre || 'Sin empresa';
      return `${empresaNombre} - ${mandato.descripcion || mandato.tipo}`;
    }
    return null;
  }, [value, mandatos]);

  const getMandatoDisplayName = (mandato: typeof mandatos[0]) => {
    const empresaNombre = mandato.empresa_principal?.nombre || 'Sin empresa';
    const desc = mandato.descripcion || `Mandato ${mandato.tipo}`;
    return { empresaNombre, desc };
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between font-normal"
          disabled={disabled || isLoading}
        >
          {isLoading ? (
            "Cargando mandatos..."
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
          <CommandInput placeholder="Buscar mandato..." />
          <CommandList>
            <CommandEmpty>No se encontraron mandatos.</CommandEmpty>
            
            {/* Trabajo General */}
            {includeGeneralWork && (
              <>
                <CommandGroup heading="Trabajo General">
                  <CommandItem
                    value="trabajo-general-ma"
                    onSelect={() => {
                      onValueChange(GENERAL_WORK_ID);
                      setOpen(false);
                    }}
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        value === GENERAL_WORK_ID ? "opacity-100" : "opacity-0"
                      )}
                    />
                    <Building2 className="mr-2 h-4 w-4 text-muted-foreground" />
                    <div className="flex flex-col">
                      <span className="font-medium">Trabajo General M&A</span>
                      <span className="text-xs text-muted-foreground">
                        Horas internas no asignadas
                      </span>
                    </div>
                  </CommandItem>
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
                        value={`venta-${empresaNombre}-${desc}`}
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
              <CommandGroup heading={`🟧 Mandatos de Compra (${mandatosCompra.length})`}>
                {mandatosCompra.map((mandato) => {
                  const { empresaNombre, desc } = getMandatoDisplayName(mandato);
                  return (
                    <CommandItem
                      key={mandato.id}
                      value={`compra-${empresaNombre}-${desc}`}
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
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
