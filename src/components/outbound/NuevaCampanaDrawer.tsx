import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2, ChevronRight, ChevronLeft, Sparkles } from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useSectors } from '@/hooks/useSectors';
import { useSectorMappings, useCreateCampaign } from '@/hooks/useOutboundCampaigns';
import { 
  APOLLO_EMPLOYEE_RANGES, 
  APOLLO_SENIORITY_LEVELS, 
  APOLLO_COMMON_TITLES,
  APOLLO_LOCATIONS,
} from '@/lib/apollo-sector-mapping';
import type { OutboundFilters } from '@/types/outbound';

const schema = z.object({
  name: z.string().min(1, 'El nombre es requerido'),
  description: z.string().optional(),
  sector_id: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: (campaignId: string) => void;
}

export default function NuevaCampanaDrawer({ open, onOpenChange, onSuccess }: Props) {
  const [step, setStep] = useState(1);
  const [filters, setFilters] = useState<OutboundFilters>({
    employee_ranges: [],
    locations: ['Spain'],
    seniority: ['owner', 'founder', 'c_suite'],
    titles: [],
  });
  const [customKeywords, setCustomKeywords] = useState<string[]>([]);
  const [keywordInput, setKeywordInput] = useState('');

  const { data: sectors } = useSectors();
  const { data: sectorMappings } = useSectorMappings();
  const createCampaign = useCreateCampaign();

  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: '',
      description: '',
      sector_id: '',
    },
  });

  const selectedSectorId = form.watch('sector_id');
  const selectedSector = sectors?.find(s => s.id === selectedSectorId);
  const sectorMapping = sectorMappings?.find(m => m.sector_id === selectedSectorId);
  
  const apolloKeywords = [
    ...(sectorMapping?.apollo_keywords || []),
    ...customKeywords,
  ];

  const handleAddKeyword = () => {
    if (keywordInput.trim() && !customKeywords.includes(keywordInput.trim())) {
      setCustomKeywords([...customKeywords, keywordInput.trim()]);
      setKeywordInput('');
    }
  };

  const handleRemoveKeyword = (keyword: string) => {
    setCustomKeywords(customKeywords.filter(k => k !== keyword));
  };

  const toggleFilter = (key: keyof OutboundFilters, value: string) => {
    const current = (filters[key] as string[]) || [];
    const updated = current.includes(value)
      ? current.filter(v => v !== value)
      : [...current, value];
    setFilters({ ...filters, [key]: updated });
  };

  const handleSubmit = async () => {
    const data = form.getValues();
    
    if (!data.name) {
      form.setError('name', { message: 'El nombre es requerido' });
      return;
    }

    try {
      const campaign = await createCampaign.mutateAsync({
        name: data.name,
        description: data.description,
        sector_id: data.sector_id || undefined,
        sector_name: selectedSector?.name_es,
        filters,
        apollo_keywords: apolloKeywords,
      });

      onSuccess?.(campaign.id);
      resetForm();
    } catch (error) {
      console.error('Error creating campaign:', error);
    }
  };

  const resetForm = () => {
    form.reset();
    setStep(1);
    setFilters({
      employee_ranges: [],
      locations: ['Spain'],
      seniority: ['owner', 'founder', 'c_suite'],
      titles: [],
    });
    setCustomKeywords([]);
  };

  const handleOpenChange = (open: boolean) => {
    if (!open) resetForm();
    onOpenChange(open);
  };

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Nueva Campaña de Outbound</SheetTitle>
          <SheetDescription>
            {step === 1 ? 'Define el nombre y sector de la campaña' : 'Configura los filtros de búsqueda'}
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          {/* Step indicator */}
          <div className="flex items-center gap-2">
            <div className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium ${
              step >= 1 ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
            }`}>
              1
            </div>
            <div className={`flex-1 h-1 rounded ${step >= 2 ? 'bg-primary' : 'bg-muted'}`} />
            <div className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium ${
              step >= 2 ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
            }`}>
              2
            </div>
          </div>

          {step === 1 && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nombre de la campaña *</Label>
                <Input
                  id="name"
                  placeholder="Ej: CEOs Industriales España"
                  {...form.register('name')}
                />
                {form.formState.errors.name && (
                  <p className="text-sm text-destructive">{form.formState.errors.name.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Descripción (opcional)</Label>
                <Textarea
                  id="description"
                  placeholder="Objetivo de la campaña..."
                  rows={2}
                  {...form.register('description')}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="sector">Sector objetivo</Label>
                <Select
                  value={form.watch('sector_id') || ''}
                  onValueChange={(value) => form.setValue('sector_id', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona un sector" />
                  </SelectTrigger>
                  <SelectContent>
                    {sectors?.map((sector) => (
                      <SelectItem key={sector.id} value={sector.id}>
                        {sector.name_es}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Apollo Keywords Preview */}
              {sectorMapping && sectorMapping.apollo_keywords.length > 0 && (
                <div className="space-y-2 p-3 bg-muted/50 rounded-lg">
                  <Label className="text-xs text-muted-foreground flex items-center gap-1">
                    <Sparkles className="h-3 w-3" />
                    Keywords de Apollo para este sector
                  </Label>
                  <div className="flex flex-wrap gap-1.5">
                    {sectorMapping.apollo_keywords.map((kw) => (
                      <Badge key={kw} variant="secondary" className="text-xs">
                        {kw}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Custom Keywords */}
              <div className="space-y-2">
                <Label>Keywords personalizados</Label>
                <div className="flex gap-2">
                  <Input
                    placeholder="Añadir keyword..."
                    value={keywordInput}
                    onChange={(e) => setKeywordInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddKeyword())}
                  />
                  <Button type="button" variant="outline" onClick={handleAddKeyword}>
                    Añadir
                  </Button>
                </div>
                {customKeywords.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {customKeywords.map((kw) => (
                      <Badge 
                        key={kw} 
                        variant="outline" 
                        className="cursor-pointer hover:bg-destructive/10"
                        onClick={() => handleRemoveKeyword(kw)}
                      >
                        {kw} ×
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6">
              {/* Locations */}
              <div className="space-y-2">
                <Label>Ubicación</Label>
                <div className="grid grid-cols-2 gap-2">
                  {APOLLO_LOCATIONS.map((loc) => (
                    <div key={loc.value} className="flex items-center gap-2">
                      <Checkbox
                        id={`loc-${loc.value}`}
                        checked={filters.locations?.includes(loc.value)}
                        onCheckedChange={() => toggleFilter('locations', loc.value)}
                      />
                      <label htmlFor={`loc-${loc.value}`} className="text-sm cursor-pointer">
                        {loc.label}
                      </label>
                    </div>
                  ))}
                </div>
              </div>

              {/* Seniority */}
              <div className="space-y-2">
                <Label>Nivel de seniority</Label>
                <div className="grid grid-cols-2 gap-2">
                  {APOLLO_SENIORITY_LEVELS.slice(0, 8).map((level) => (
                    <div key={level.value} className="flex items-center gap-2">
                      <Checkbox
                        id={`sen-${level.value}`}
                        checked={filters.seniority?.includes(level.value)}
                        onCheckedChange={() => toggleFilter('seniority', level.value)}
                      />
                      <label htmlFor={`sen-${level.value}`} className="text-sm cursor-pointer">
                        {level.label}
                      </label>
                    </div>
                  ))}
                </div>
              </div>

              {/* Titles */}
              <div className="space-y-2">
                <Label>Cargos específicos (opcional)</Label>
                <div className="grid grid-cols-2 gap-2">
                  {APOLLO_COMMON_TITLES.map((title) => (
                    <div key={title.value} className="flex items-center gap-2">
                      <Checkbox
                        id={`title-${title.value}`}
                        checked={filters.titles?.includes(title.value)}
                        onCheckedChange={() => toggleFilter('titles', title.value)}
                      />
                      <label htmlFor={`title-${title.value}`} className="text-sm cursor-pointer">
                        {title.label}
                      </label>
                    </div>
                  ))}
                </div>
              </div>

              {/* Employee Ranges */}
              <div className="space-y-2">
                <Label>Tamaño de empresa (empleados)</Label>
                <div className="grid grid-cols-2 gap-2">
                  {APOLLO_EMPLOYEE_RANGES.map((range) => (
                    <div key={range.value} className="flex items-center gap-2">
                      <Checkbox
                        id={`emp-${range.value}`}
                        checked={filters.employee_ranges?.includes(range.value)}
                        onCheckedChange={() => toggleFilter('employee_ranges', range.value)}
                      />
                      <label htmlFor={`emp-${range.value}`} className="text-sm cursor-pointer">
                        {range.label}
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Navigation */}
          <div className="flex justify-between pt-4 border-t">
            {step === 1 ? (
              <>
                <Button variant="ghost" onClick={() => handleOpenChange(false)}>
                  Cancelar
                </Button>
                <Button onClick={() => setStep(2)}>
                  Siguiente
                  <ChevronRight className="ml-2 h-4 w-4" />
                </Button>
              </>
            ) : (
              <>
                <Button variant="ghost" onClick={() => setStep(1)}>
                  <ChevronLeft className="mr-2 h-4 w-4" />
                  Atrás
                </Button>
                <Button onClick={handleSubmit} disabled={createCampaign.isPending}>
                  {createCampaign.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Crear Campaña
                </Button>
              </>
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
