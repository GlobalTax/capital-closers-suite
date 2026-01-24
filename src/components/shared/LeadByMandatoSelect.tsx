import { useState, useMemo } from 'react';
import { Check, ChevronsUpDown, User, Users, Building2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';
import { useLeadsByMandato, type MandateLead } from '@/hooks/useLeadsByMandato';
import { useProspectsForTimeEntry, type ProspectForTimeEntry } from '@/hooks/useProspectsForTimeEntry';

// Export types for external use
export type { ProspectForTimeEntry, MandateLead };

// Combined type for selected lead data
export type SelectedLeadData = ProspectForTimeEntry | MandateLead | null;

interface LeadByMandatoSelectProps {
  mandatoId: string | null;
  value: string | null;
  /** Called when selection changes. leadData contains full lead info for Prospección prospects */
  onValueChange: (leadId: string | null, leadData?: SelectedLeadData) => void;
  placeholder?: string;
  disabled?: boolean;
}

const GENERAL_WORK_ID = '00000000-0000-0000-0000-000000000001';
const PROSPECCION_PROJECT_ID = '00000000-0000-0000-0000-000000000004';

// Internal projects that DON'T have leads (Prospección is an exception - it has leads from form tables)
const INTERNAL_PROJECT_IDS_NO_LEADS = [
  GENERAL_WORK_ID,
  '00000000-0000-0000-0000-000000000002', // Reuniones Internas
  '00000000-0000-0000-0000-000000000003', // Administrativo
];

export function LeadByMandatoSelect({
  mandatoId,
  value,
  onValueChange,
  placeholder = 'Sin lead (horas generales)',
  disabled = false,
}: LeadByMandatoSelectProps) {
  const [open, setOpen] = useState(false);
  
  // Check project type
  const isProspeccionProject = mandatoId === PROSPECCION_PROJECT_ID;
  const isInternalProjectWithoutLeads = !mandatoId || INTERNAL_PROJECT_IDS_NO_LEADS.includes(mandatoId);
  
  // Fetch prospects from admin_leads for Prospección project
  const { data: prospects = [], isLoading: loadingProspects } = useProspectsForTimeEntry(
    isProspeccionProject ? mandatoId : null
  );
  
  // Fetch leads for regular mandatos (not internal projects, not Prospección)
  const { data: mandateLeads = [], isLoading: loadingMandateLeads } = useLeadsByMandato(
    !isProspeccionProject && !isInternalProjectWithoutLeads ? mandatoId : null
  );
  
  // Combine based on project type
  const isLoading = isProspeccionProject ? loadingProspects : loadingMandateLeads;
  
  // Get selected item for display (works for both prospects and mandate leads)
  const selectedItem = useMemo(() => {
    if (!value) return null;
    
    if (isProspeccionProject) {
      return prospects.find(p => p.id === value) || null;
    }
    return mandateLeads.find(lead => lead.id === value) || null;
  }, [value, prospects, mandateLeads, isProspeccionProject]);
  
  // Get display label
  const displayLabel = useMemo(() => {
    if (!value) return placeholder;
    if (selectedItem) {
      return selectedItem.company_name || selectedItem.contact_name || 'Sin nombre';
    }
    return placeholder;
  }, [value, selectedItem, placeholder]);
  
  // Handle selection - pass full lead data for transformation
  const handleSelect = (leadId: string | null) => {
    if (leadId === null) {
      onValueChange(null, null);
    } else if (isProspeccionProject) {
      const prospect = prospects.find(p => p.id === leadId);
      onValueChange(leadId, prospect || null);
    } else {
      const lead = mandateLeads.find(l => l.id === leadId);
      onValueChange(leadId, lead || null);
    }
    setOpen(false);
  };
  
  // Get stage badge
  const getStageBadge = (stage: string | null) => {
    if (!stage) return null;
    
    const stageConfig: Record<string, { label: string; className: string }> = {
      'nuevo': { label: 'Nuevo', className: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' },
      'contactado': { label: 'Contactado', className: 'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400' },
      'en_analisis': { label: 'En análisis', className: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' },
      'negociacion': { label: 'Negociación', className: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' },
    };
    
    const config = stageConfig[stage] || { label: stage, className: 'bg-muted text-muted-foreground' };
    
    return (
      <Badge variant="secondary" className={cn('text-[9px] px-1 py-0 h-4', config.className)}>
        {config.label}
      </Badge>
    );
  };
  
  // If internal project without leads, show disabled state
  if (isInternalProjectWithoutLeads) {
    return (
      <Button
        variant="outline"
        disabled
        className="w-full justify-between h-9 font-normal text-muted-foreground"
      >
        <span className="flex items-center gap-2">
          <Users className="h-3.5 w-3.5 opacity-50" />
          N/A para proyectos internos
        </span>
        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
      </Button>
    );
  }
  
  // Get current items list based on project type
  const items = isProspeccionProject ? prospects : mandateLeads;
  
  // If no items available
  if (!isLoading && items.length === 0) {
    return (
      <Button
        variant="outline"
        disabled
        className="w-full justify-between h-9 font-normal text-muted-foreground"
      >
        <span className="flex items-center gap-2">
          <Users className="h-3.5 w-3.5 opacity-50" />
          {isProspeccionProject ? 'Sin prospectos disponibles' : 'Sin leads asignados'}
        </span>
        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
      </Button>
    );
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled || isLoading}
          className={cn(
            'w-full justify-between h-9 font-normal',
            !value && 'text-muted-foreground'
          )}
        >
          {isLoading ? (
            <span className="animate-pulse">Cargando leads...</span>
          ) : (
            <div className="flex items-center gap-2 min-w-0 flex-1">
              {isProspeccionProject ? (
                <Building2 className="h-3.5 w-3.5 shrink-0 text-blue-600" />
              ) : (
                <User className="h-3.5 w-3.5 shrink-0 text-amber-600" />
              )}
              <span className="truncate">{displayLabel}</span>
              {!isProspeccionProject && selectedItem && 'stage' in selectedItem && getStageBadge((selectedItem as MandateLead).stage)}
            </div>
          )}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[350px] p-0" align="start">
        <Command
          filter={(value, search) => {
            if (value.toLowerCase().includes(search.toLowerCase())) return 1;
            return 0;
          }}
        >
          <CommandInput placeholder={isProspeccionProject ? `Buscar entre ${prospects.length} prospectos...` : "Buscar lead..."} />
          <CommandList className="max-h-[400px]">
            <CommandEmpty>{isProspeccionProject ? 'No se encontraron prospectos' : 'No se encontraron leads'}</CommandEmpty>
            
            {/* Option for no lead/prospect (general hours) */}
            <CommandGroup heading="Opciones">
              <CommandItem
                value="__sin_lead__"
                onSelect={() => handleSelect(null)}
                className="flex items-center gap-2"
              >
                <Check
                  className={cn(
                    'h-4 w-4 shrink-0',
                    !value ? 'opacity-100' : 'opacity-0'
                  )}
                />
                <Users className="h-4 w-4 text-muted-foreground" />
                <div className="flex-1">
                  <span className="font-medium">{isProspeccionProject ? 'Sin prospecto (horas generales)' : 'Sin lead (horas generales)'}</span>
                  <p className="text-xs text-muted-foreground">
                    {isProspeccionProject ? 'Tiempo de prospección en general' : 'Tiempo dedicado al mandato en general'}
                  </p>
                </div>
              </CommandItem>
            </CommandGroup>
            
            {/* Prospects list (for Prospección project) */}
            {isProspeccionProject && prospects.length > 0 && (
              <CommandGroup heading={`🏢 Prospectos (${prospects.length} disponibles)`}>
                {prospects.map((prospect) => (
                  <CommandItem
                    key={prospect.id}
                    value={`${prospect.company_name || ''} ${prospect.contact_name || ''} ${prospect.id}`}
                    onSelect={() => handleSelect(prospect.id)}
                    className="flex items-center gap-2"
                  >
                    <Check
                      className={cn(
                        'h-4 w-4 shrink-0',
                        value === prospect.id ? 'opacity-100' : 'opacity-0'
                      )}
                    />
                    <Building2 className="h-4 w-4 shrink-0 text-blue-600" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium truncate">
                          {prospect.company_name || 'Sin empresa'}
                        </span>
                        {prospect.sector && (
                          <Badge variant="outline" className="text-[9px] px-1 py-0 h-4">
                            {prospect.sector}
                          </Badge>
                        )}
                      </div>
                      {prospect.contact_name && (
                        <p className="text-xs text-muted-foreground truncate">
                          {prospect.contact_name}
                          {prospect.contact_email && ` · ${prospect.contact_email}`}
                        </p>
                      )}
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
            
            {/* Leads list (for regular mandatos) */}
            {!isProspeccionProject && mandateLeads.length > 0 && (
              <CommandGroup heading={`👤 Leads del mandato (${mandateLeads.length})`}>
                {mandateLeads.map((lead) => (
                  <CommandItem
                    key={lead.id}
                    value={`${lead.company_name || ''} ${lead.contact_name || ''} ${lead.id}`}
                    onSelect={() => handleSelect(lead.id)}
                    className="flex items-center gap-2"
                  >
                    <Check
                      className={cn(
                        'h-4 w-4 shrink-0',
                        value === lead.id ? 'opacity-100' : 'opacity-0'
                      )}
                    />
                    <User className="h-4 w-4 shrink-0 text-amber-600" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium truncate">
                          {lead.company_name || 'Sin empresa'}
                        </span>
                        {getStageBadge(lead.stage)}
                      </div>
                      {lead.contact_name && (
                        <p className="text-xs text-muted-foreground truncate">
                          {lead.contact_name}
                          {lead.contact_email && ` · ${lead.contact_email}`}
                        </p>
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
