import { useState, useMemo } from "react";
import { Check, ChevronsUpDown, Building2, Search, Factory, Briefcase } from "lucide-react";
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
import { Badge } from "@/components/ui/badge";
import { useEmpresas } from "@/hooks/queries/useEmpresas";
import type { Empresa } from "@/types";

interface EmpresaSelectProps {
  value: string | undefined;
  onValueChange: (empresaId: string | undefined, empresa: Empresa | undefined) => void;
  placeholder?: string;
  disabled?: boolean;
  allowClear?: boolean;
  filterTarget?: boolean; // true = solo targets, false = solo no-targets, undefined = todas
}

export function EmpresaSelect({
  value,
  onValueChange,
  placeholder = "Selecciona una empresa",
  disabled = false,
  allowClear = true,
  filterTarget,
}: EmpresaSelectProps) {
  const [open, setOpen] = useState(false);
  const { data: empresas = [], isLoading } = useEmpresas(filterTarget);

  // Group empresas by type
  const { targets, clientes } = useMemo(() => {
    const targets: Empresa[] = [];
    const clientes: Empresa[] = [];

    empresas.forEach((empresa) => {
      if (empresa.es_target) {
        targets.push(empresa);
      } else {
        clientes.push(empresa);
      }
    });

    return { targets, clientes };
  }, [empresas]);

  // Get selected empresa
  const selectedEmpresa = useMemo(() => {
    if (!value) return null;
    return empresas.find((e) => e.id === value) || null;
  }, [value, empresas]);

  const handleSelect = (empresaId: string | undefined) => {
    if (!empresaId) {
      onValueChange(undefined, undefined);
    } else {
      const empresa = empresas.find((e) => e.id === empresaId);
      onValueChange(empresaId, empresa);
    }
    setOpen(false);
  };

  const getEmpresaIcon = (empresa: Empresa) => {
    if (empresa.es_target) {
      return <Factory className="mr-2 h-4 w-4 text-amber-500" />;
    }
    return <Briefcase className="mr-2 h-4 w-4 text-blue-500" />;
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
            "Cargando empresas..."
          ) : selectedEmpresa ? (
            <div className="flex items-center gap-2 truncate">
              {selectedEmpresa.es_target ? (
                <Factory className="h-4 w-4 text-amber-500 shrink-0" />
              ) : (
                <Briefcase className="h-4 w-4 text-blue-500 shrink-0" />
              )}
              <span className="truncate">{selectedEmpresa.nombre}</span>
              {selectedEmpresa.cif && (
                <Badge variant="outline" className="ml-auto text-xs font-normal shrink-0">
                  {selectedEmpresa.cif}
                </Badge>
              )}
            </div>
          ) : (
            <span className="text-muted-foreground">{placeholder}</span>
          )}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[400px] p-0" align="start">
        <Command>
          <CommandInput placeholder="Buscar empresa por nombre o CIF..." />
          <CommandList>
            <CommandEmpty>No se encontraron empresas.</CommandEmpty>

            {/* Option to clear selection */}
            {allowClear && value && (
              <>
                <CommandGroup>
                  <CommandItem
                    value="__clear__"
                    onSelect={() => handleSelect(undefined)}
                    className="text-muted-foreground"
                  >
                    <span className="mr-2">✕</span>
                    Limpiar selección
                  </CommandItem>
                </CommandGroup>
                <CommandSeparator />
              </>
            )}

            {/* Targets */}
            {targets.length > 0 && filterTarget !== false && (
              <>
                <CommandGroup heading={`🎯 Targets (${targets.length})`}>
                  {targets.map((empresa) => (
                    <CommandItem
                      key={empresa.id}
                      value={`target-${empresa.nombre}-${empresa.cif || ''}`}
                      onSelect={() => handleSelect(empresa.id)}
                    >
                      <Check
                        className={cn(
                          "mr-2 h-4 w-4",
                          value === empresa.id ? "opacity-100" : "opacity-0"
                        )}
                      />
                      {getEmpresaIcon(empresa)}
                      <div className="flex flex-col min-w-0 flex-1">
                        <span className="font-medium truncate">{empresa.nombre}</span>
                        <span className="text-xs text-muted-foreground truncate">
                          {empresa.cif || 'Sin CIF'} 
                          {empresa.sector && ` • ${empresa.sector}`}
                        </span>
                      </div>
                    </CommandItem>
                  ))}
                </CommandGroup>
                <CommandSeparator />
              </>
            )}

            {/* Clientes / Otras empresas */}
            {clientes.length > 0 && filterTarget !== true && (
              <CommandGroup heading={`🏢 Clientes y Otras (${clientes.length})`}>
                {clientes.map((empresa) => (
                  <CommandItem
                    key={empresa.id}
                    value={`cliente-${empresa.nombre}-${empresa.cif || ''}`}
                    onSelect={() => handleSelect(empresa.id)}
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        value === empresa.id ? "opacity-100" : "opacity-0"
                      )}
                    />
                    {getEmpresaIcon(empresa)}
                    <div className="flex flex-col min-w-0 flex-1">
                      <span className="font-medium truncate">{empresa.nombre}</span>
                      <span className="text-xs text-muted-foreground truncate">
                        {empresa.cif || 'Sin CIF'}
                        {empresa.sector && ` • ${empresa.sector}`}
                      </span>
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
