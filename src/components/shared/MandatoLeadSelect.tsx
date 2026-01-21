import { useState, useEffect, useMemo } from 'react';
import { Check, ChevronsUpDown, Briefcase, User, Folder, Search } from 'lucide-react';
import { cn } from '@/lib/utils';
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
import { Badge } from '@/components/ui/badge';
import {
  useMandatoLeadSearch,
  useMandatoLeadItem,
  type SearchItemType,
  type MandatoLeadSearchItem,
} from '@/hooks/useMandatoLeadSearch';

export interface MandatoLeadSelectProps {
  value: string;
  valueType: SearchItemType | null;
  onValueChange: (value: string, type: SearchItemType) => void;
  placeholder?: string;
  disabled?: boolean;
  includeGeneralWork?: boolean;
  includeLeads?: boolean;
}

const GENERAL_WORK_ID = '00000000-0000-0000-0000-000000000001';

export function MandatoLeadSelect({
  value,
  valueType,
  onValueChange,
  placeholder = 'Seleccionar mandato o lead...',
  disabled = false,
  includeGeneralWork = true,
  includeLeads = true,
}: MandatoLeadSelectProps) {
  const [open, setOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Fetch search results
  const { data: searchResults, isLoading } = useMandatoLeadSearch(searchTerm, {
    includeGeneralWork,
    includeLeads,
  });

  // Fetch current selected item for display
  const { data: selectedItem } = useMandatoLeadItem(value, valueType);

  // Get display label for selected item
  const displayLabel = useMemo(() => {
    if (!value) return null;

    if (selectedItem) {
      return selectedItem;
    }

    // Fallback for General Work
    if (value === GENERAL_WORK_ID) {
      return {
        id: GENERAL_WORK_ID,
        type: 'internal' as const,
        label: 'Trabajo General M&A',
        icon: 'folder' as const,
      };
    }

    return null;
  }, [value, selectedItem]);

  // Handle selection
  const handleSelect = (item: MandatoLeadSearchItem) => {
    onValueChange(item.id, item.type);
    setOpen(false);
    setSearchTerm('');
  };

  // Get icon for item type
  const getIcon = (type: SearchItemType | 'briefcase' | 'user' | 'folder', size = 'h-4 w-4') => {
    switch (type) {
      case 'mandato':
      case 'briefcase':
        return <Briefcase className={cn(size, 'text-primary')} />;
      case 'contacto':
      case 'user':
        return <User className={cn(size, 'text-amber-600')} />;
      case 'internal':
      case 'folder':
        return <Folder className={cn(size, 'text-muted-foreground')} />;
      default:
        return null;
    }
  };

  // Get badge for item type
  const getTypeBadge = (type: SearchItemType) => {
    switch (type) {
      case 'mandato':
        return (
          <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4 bg-primary/5 text-primary border-primary/20">
            Mandato
          </Badge>
        );
      case 'contacto':
        return (
          <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4 bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-800">
            Lead
          </Badge>
        );
      case 'internal':
        return (
          <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4">
            Interno
          </Badge>
        );
      default:
        return null;
    }
  };

  const internalProjects = searchResults?.internalProjects || [];
  const mandatos = searchResults?.mandatos || [];
  const contactos = searchResults?.contactos || [];

  const hasResults = internalProjects.length > 0 || mandatos.length > 0 || contactos.length > 0;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled}
          className={cn(
            'w-full justify-between h-9 font-normal',
            !value && 'text-muted-foreground'
          )}
        >
          {displayLabel ? (
            <div className="flex items-center gap-2 min-w-0 flex-1">
              {getIcon(displayLabel.icon || displayLabel.type, 'h-3.5 w-3.5 shrink-0')}
              <span className="truncate">{displayLabel.label}</span>
              {displayLabel.type !== 'internal' && getTypeBadge(displayLabel.type)}
            </div>
          ) : (
            <span>{placeholder}</span>
          )}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[400px] p-0" align="start">
        <Command shouldFilter={false}>
          <CommandInput
            placeholder="Buscar mandato o lead..."
            value={searchTerm}
            onValueChange={setSearchTerm}
          />
          <CommandList className="max-h-[300px]">
            {isLoading && (
              <div className="py-6 text-center text-sm text-muted-foreground">
                <div className="animate-pulse">Buscando...</div>
              </div>
            )}

            {/* Error state */}
            {!isLoading && searchResults?.error && (
              <div className="py-6 text-center text-sm text-destructive">
                <p>Error al buscar</p>
                <p className="text-xs text-muted-foreground mt-1">{searchResults.error}</p>
              </div>
            )}

            {!isLoading && !searchResults?.error && !hasResults && searchTerm && (
              <CommandEmpty>No se encontraron resultados</CommandEmpty>
            )}

            {!isLoading && !searchResults?.error && !hasResults && !searchTerm && (
              <div className="py-6 text-center text-sm text-muted-foreground">
                <Search className="h-8 w-8 mx-auto mb-2 opacity-40" />
                Escribe para buscar mandatos o leads
              </div>
            )}

            {/* Internal Projects */}
            {internalProjects.length > 0 && (
              <CommandGroup heading="📁 Proyectos Internos">
                {internalProjects.map((item) => (
                  <CommandItem
                    key={item.id}
                    value={item.id}
                    onSelect={() => handleSelect(item)}
                    className="flex items-center gap-2"
                  >
                    <Check
                      className={cn(
                        'h-4 w-4 shrink-0',
                        value === item.id ? 'opacity-100' : 'opacity-0'
                      )}
                    />
                    {getIcon('folder', 'h-4 w-4 shrink-0')}
                    <div className="flex-1 min-w-0">
                      <div className="font-medium truncate">{item.label}</div>
                      {item.sublabel && (
                        <div className="text-xs text-muted-foreground truncate">
                          {item.sublabel}
                        </div>
                      )}
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            )}

            {internalProjects.length > 0 && (mandatos.length > 0 || contactos.length > 0) && (
              <CommandSeparator />
            )}

            {/* Mandatos */}
            {mandatos.length > 0 && (
              <CommandGroup heading="📊 Mandatos">
                {mandatos.map((item) => (
                  <CommandItem
                    key={item.id}
                    value={item.id}
                    onSelect={() => handleSelect(item)}
                    className="flex items-center gap-2"
                  >
                    <Check
                      className={cn(
                        'h-4 w-4 shrink-0',
                        value === item.id ? 'opacity-100' : 'opacity-0'
                      )}
                    />
                    {getIcon('briefcase', 'h-4 w-4 shrink-0')}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium truncate">{item.label}</span>
                        {item.metadata?.tipo && (
                          <Badge variant="outline" className="text-[9px] px-1 py-0 h-3.5 shrink-0">
                            {item.metadata.tipo}
                          </Badge>
                        )}
                      </div>
                      {item.sublabel && (
                        <div className="text-xs text-muted-foreground truncate">
                          {item.sublabel}
                        </div>
                      )}
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            )}

            {mandatos.length > 0 && contactos.length > 0 && <CommandSeparator />}

            {/* Contactos/Leads */}
            {contactos.length > 0 && (
              <CommandGroup heading="👤 Leads / Contactos">
                {contactos.map((item) => (
                  <CommandItem
                    key={item.id}
                    value={item.id}
                    onSelect={() => handleSelect(item)}
                    className="flex items-center gap-2"
                  >
                    <Check
                      className={cn(
                        'h-4 w-4 shrink-0',
                        value === item.id ? 'opacity-100' : 'opacity-0'
                      )}
                    />
                    {getIcon('user', 'h-4 w-4 shrink-0')}
                    <div className="flex-1 min-w-0">
                      <div className="font-medium truncate">{item.label}</div>
                      {item.sublabel && (
                        <div className="text-xs text-muted-foreground truncate">
                          {item.sublabel}
                        </div>
                      )}
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
