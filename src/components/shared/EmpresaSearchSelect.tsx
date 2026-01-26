import { useState, useMemo, useEffect } from 'react';
import { Check, ChevronsUpDown, Building2, Loader2, Plus, Target, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { useEmpresasSearch } from '@/hooks/useEmpresasSearch';
import type { Empresa } from '@/types';

interface EmpresaSearchSelectProps {
  value: string | undefined;
  onValueChange: (empresaId: string | undefined, empresa: Empresa | undefined) => void;
  placeholder?: string;
  disabled?: boolean;
  onCreateNew?: () => void;
  filterTarget?: boolean;
  className?: string;
}

export function EmpresaSearchSelect({
  value,
  onValueChange,
  placeholder = 'Buscar empresa...',
  disabled = false,
  onCreateNew,
  filterTarget,
  className,
}: EmpresaSearchSelectProps) {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedEmpresa, setSelectedEmpresa] = useState<Empresa | undefined>();
  
  const { empresas, loading } = useEmpresasSearch(searchQuery, 250, filterTarget);

  // Agrupar empresas por tipo
  const { targets, clientes } = useMemo(() => {
    const targets = empresas.filter(e => e.es_target);
    const clientes = empresas.filter(e => !e.es_target);
    return { targets, clientes };
  }, [empresas]);

  // Actualizar empresa seleccionada cuando cambia el value externamente
  useEffect(() => {
    if (!value) {
      setSelectedEmpresa(undefined);
    }
  }, [value]);

  const handleSelect = (empresa: Empresa) => {
    setSelectedEmpresa(empresa);
    onValueChange(empresa.id, empresa);
    setSearchQuery('');
    setOpen(false);
  };

  const handleClear = () => {
    setSelectedEmpresa(undefined);
    onValueChange(undefined, undefined);
    setSearchQuery('');
  };

  const handleCreateNew = () => {
    setOpen(false);
    onCreateNew?.();
  };

  const displayValue = selectedEmpresa
    ? selectedEmpresa.nombre
    : value
      ? 'Cargando...'
      : placeholder;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled}
          className={cn(
            'w-full justify-between font-normal',
            !selectedEmpresa && !value && 'text-muted-foreground',
            className
          )}
        >
          <span className="flex items-center gap-2 truncate">
            <Building2 className="h-4 w-4 shrink-0 text-muted-foreground" />
            <span className="truncate">{displayValue}</span>
            {selectedEmpresa?.cif && (
              <span className="text-xs text-muted-foreground">
                ({selectedEmpresa.cif})
              </span>
            )}
          </span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      
      <PopoverContent 
        className="w-[400px] p-0 bg-background z-50" 
        align="start"
        sideOffset={4}
      >
        <Command shouldFilter={false}>
          <CommandInput
            value={searchQuery}
            onValueChange={setSearchQuery}
            placeholder="Buscar por nombre o CIF..."
            className="h-10"
          />
          
          <CommandList className="max-h-[300px]">
            {/* Estado de carga */}
            {loading && (
              <div className="flex items-center justify-center py-6 gap-2">
                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Buscando...</span>
              </div>
            )}
            
            {/* Sin resultados */}
            {!loading && searchQuery.length >= 2 && empresas.length === 0 && (
              <CommandEmpty>
                <div className="text-center py-6">
                  <Building2 className="h-8 w-8 mx-auto mb-2 text-muted-foreground/50" />
                  <p className="text-sm text-muted-foreground mb-3">
                    No se encontró "{searchQuery}"
                  </p>
                  {onCreateNew && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleCreateNew}
                      className="gap-1"
                    >
                      <Plus className="h-3 w-3" />
                      Crear empresa
                    </Button>
                  )}
                </div>
              </CommandEmpty>
            )}

            {/* Mensaje inicial */}
            {!loading && searchQuery.length < 2 && empresas.length === 0 && (
              <div className="py-6 text-center">
                <p className="text-sm text-muted-foreground">
                  Escribe al menos 2 caracteres para buscar
                </p>
              </div>
            )}
            
            {/* Resultados: Clientes */}
            {clientes.length > 0 && (
              <CommandGroup heading={
                <span className="flex items-center gap-1.5">
                  <Users className="h-3 w-3" />
                  Clientes ({clientes.length})
                </span>
              }>
                {clientes.map((empresa) => (
                  <CommandItem
                    key={empresa.id}
                    value={empresa.id}
                    onSelect={() => handleSelect(empresa)}
                    className="flex items-center gap-2 py-2"
                  >
                    <Check
                      className={cn(
                        'h-4 w-4 shrink-0',
                        value === empresa.id ? 'opacity-100' : 'opacity-0'
                      )}
                    />
                    <div className="flex flex-col flex-1 min-w-0">
                      <span className="font-medium truncate">{empresa.nombre}</span>
                      <span className="text-xs text-muted-foreground flex items-center gap-2">
                        {empresa.cif && <span>{empresa.cif}</span>}
                        {empresa.sector && <span>• {empresa.sector}</span>}
                        {empresa.ubicacion && <span>• {empresa.ubicacion}</span>}
                      </span>
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
            
            {/* Resultados: Targets */}
            {targets.length > 0 && (
              <CommandGroup heading={
                <span className="flex items-center gap-1.5">
                  <Target className="h-3 w-3" />
                  Targets ({targets.length})
                </span>
              }>
                {targets.map((empresa) => (
                  <CommandItem
                    key={empresa.id}
                    value={empresa.id}
                    onSelect={() => handleSelect(empresa)}
                    className="flex items-center gap-2 py-2"
                  >
                    <Check
                      className={cn(
                        'h-4 w-4 shrink-0',
                        value === empresa.id ? 'opacity-100' : 'opacity-0'
                      )}
                    />
                    <div className="flex flex-col flex-1 min-w-0">
                      <span className="font-medium truncate">{empresa.nombre}</span>
                      <span className="text-xs text-muted-foreground flex items-center gap-2">
                        {empresa.cif && <span>{empresa.cif}</span>}
                        {empresa.sector && <span>• {empresa.sector}</span>}
                        {empresa.ubicacion && <span>• {empresa.ubicacion}</span>}
                      </span>
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            )}

            {/* Separador y acción crear nueva */}
            {onCreateNew && (
              <>
                <CommandSeparator />
                <CommandGroup>
                  <CommandItem
                    onSelect={handleCreateNew}
                    className="flex items-center gap-2 py-2 cursor-pointer"
                  >
                    <Plus className="h-4 w-4 text-primary" />
                    <span className="text-primary font-medium">Nueva empresa</span>
                  </CommandItem>
                </CommandGroup>
              </>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
