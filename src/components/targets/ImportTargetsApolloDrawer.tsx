/**
 * Drawer para importar targets desde Apollo
 * Soporta 3 métodos:
 * 1. Buscar por keywords (actual)
 * 2. Importar desde Lista guardada de Apollo
 * 3. Pegar URLs/IDs de contactos
 */

import { useState, useEffect } from "react";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Search, 
  Building2, 
  Users, 
  Globe, 
  Loader2,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  ExternalLink,
  MapPin,
  List,
  Link2,
  RefreshCw,
  Mail,
  Phone,
  User,
  Calendar,
  Clock,
  Info
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { importTargetsFromApollo, type ApolloProspect, type TargetImportConfig } from "@/services/importacion/importTargets";
import type { ImportResult } from "@/hooks/useImportacion";
import { toast } from "sonner";
import { format, formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";

interface ImportTargetsApolloDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mandatoId: string;
  onSuccess: () => void;
}

type ImportMethod = 'search' | 'list' | 'urls';
type ImportStep = 'select' | 'results' | 'importing' | 'summary';

interface ApolloLabel {
  id: string;
  name: string;
  cached_count: number;
  created_at?: string;
  updated_at?: string;
}

interface ApolloListPreview {
  labelId: string;
  contacts: ApolloContact[];
  loading: boolean;
}

interface ApolloContact {
  id: string;
  first_name: string;
  last_name: string;
  name: string;
  email: string;
  phone_numbers?: { raw_number: string; type: string }[];
  organization_name?: string;
  organization?: {
    id: string;
    name: string;
    industry?: string;
    country?: string;
    estimated_num_employees?: number;
    primary_domain?: string;
  };
  title?: string;
  linkedin_url?: string;
  country?: string;
}

const EMPLOYEE_RANGES = [
  { value: '', label: 'Todos los tamaños' },
  { value: '1,10', label: '1-10 empleados' },
  { value: '11,50', label: '11-50 empleados' },
  { value: '51,200', label: '51-200 empleados' },
  { value: '201,500', label: '201-500 empleados' },
  { value: '501,1000', label: '501-1000 empleados' },
  { value: '1001,5000', label: '1001-5000 empleados' },
  { value: '5001,10000', label: '5001-10000 empleados' },
];

const COUNTRIES = [
  { value: '', label: 'Todos los países' },
  { value: 'Spain', label: 'España' },
  { value: 'United Kingdom', label: 'Reino Unido' },
  { value: 'France', label: 'Francia' },
  { value: 'Germany', label: 'Alemania' },
  { value: 'Italy', label: 'Italia' },
  { value: 'Portugal', label: 'Portugal' },
  { value: 'United States', label: 'Estados Unidos' },
  { value: 'Mexico', label: 'México' },
];

// Helper to convert ApolloContact to ApolloProspect format
function contactToProspect(contact: ApolloContact): ApolloProspect {
  return {
    id: contact.id,
    first_name: contact.first_name,
    last_name: contact.last_name,
    email: contact.email,
    title: contact.title,
    linkedin_url: contact.linkedin_url,
    organization: contact.organization ? {
      name: contact.organization.name,
      industry: contact.organization.industry,
      country: contact.organization.country,
      estimated_num_employees: contact.organization.estimated_num_employees,
      primary_domain: contact.organization.primary_domain,
    } : undefined,
  };
}

export function ImportTargetsApolloDrawer({ 
  open, 
  onOpenChange, 
  mandatoId, 
  onSuccess 
}: ImportTargetsApolloDrawerProps) {
  // Method selection
  const [method, setMethod] = useState<ImportMethod>('search');
  const [step, setStep] = useState<ImportStep>('select');
  
  // Search method state
  const [keywords, setKeywords] = useState('');
  const [country, setCountry] = useState('');
  const [employeeRange, setEmployeeRange] = useState('');
  const [searching, setSearching] = useState(false);
  const [prospects, setProspects] = useState<ApolloProspect[]>([]);
  const [searchError, setSearchError] = useState<string | null>(null);
  
  // List method state
  const [labels, setLabels] = useState<ApolloLabel[]>([]);
  const [loadingLabels, setLoadingLabels] = useState(false);
  const [selectedLabelId, setSelectedLabelId] = useState<string>('');
  const [contacts, setContacts] = useState<ApolloContact[]>([]);
  const [loadingContacts, setLoadingContacts] = useState(false);
  const [listPreviews, setListPreviews] = useState<Map<string, ApolloListPreview>>(new Map());
  
  // URLs method state
  const [urlsInput, setUrlsInput] = useState('');
  const [extractingUrls, setExtractingUrls] = useState(false);
  const [extractedContacts, setExtractedContacts] = useState<ApolloContact[]>([]);
  
  // Shared state
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [importing, setImporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [results, setResults] = useState<ImportResult[]>([]);

  // Load labels when opening with list method
  useEffect(() => {
    if (open && method === 'list' && labels.length === 0) {
      loadLabels();
    }
  }, [open, method]);

  const resetState = () => {
    setMethod('search');
    setStep('select');
    setKeywords('');
    setCountry('');
    setEmployeeRange('');
    setSearching(false);
    setProspects([]);
    setSearchError(null);
    setLabels([]);
    setSelectedLabelId('');
    setContacts([]);
    setListPreviews(new Map());
    setUrlsInput('');
    setExtractedContacts([]);
    setSelectedIds(new Set());
    setImporting(false);
    setProgress(0);
    setResults([]);
  };

  const loadLabels = async () => {
    setLoadingLabels(true);
    try {
      const { data, error } = await supabase.functions.invoke('get-apollo-lists');
      if (error) throw error;
      
      setLabels(data?.labels || []);
      console.log('[Apollo] Loaded labels:', data?.labels?.length);
    } catch (error: any) {
      console.error('[Apollo] Error loading labels:', error);
      toast.error('Error al cargar listas de Apollo', { description: error.message });
    } finally {
      setLoadingLabels(false);
    }
  };

  // Load preview contacts for a specific list (lazy loading)
  const loadListPreview = async (labelId: string) => {
    // Skip if already loaded or loading
    const existing = listPreviews.get(labelId);
    if (existing && (existing.contacts.length > 0 || existing.loading)) {
      return;
    }

    // Set loading state
    setListPreviews(prev => {
      const next = new Map(prev);
      next.set(labelId, { labelId, contacts: [], loading: true });
      return next;
    });

    try {
      const { data, error } = await supabase.functions.invoke('get-apollo-list-contacts', {
        body: { label_id: labelId, page: 1, per_page: 5 },
      });
      
      if (error) throw error;
      
      setListPreviews(prev => {
        const next = new Map(prev);
        next.set(labelId, { 
          labelId, 
          contacts: data?.contacts || [], 
          loading: false 
        });
        return next;
      });
    } catch (error: any) {
      console.error('[Apollo] Error loading preview:', error);
      setListPreviews(prev => {
        const next = new Map(prev);
        next.set(labelId, { labelId, contacts: [], loading: false });
        return next;
      });
    }
  };

  // Handle list selection and load preview
  const handleSelectList = (labelId: string) => {
    setSelectedLabelId(labelId);
    loadListPreview(labelId);
  };

  const loadListContacts = async () => {
    if (!selectedLabelId) {
      toast.error('Selecciona una lista');
      return;
    }

    setLoadingContacts(true);
    setContacts([]);

    try {
      const { data, error } = await supabase.functions.invoke('get-apollo-list-contacts', {
        body: { label_id: selectedLabelId, page: 1, per_page: 100 },
      });
      
      if (error) throw error;
      
      setContacts(data?.contacts || []);
      setStep('results');
      
      if ((data?.contacts || []).length === 0) {
        toast.info('La lista no tiene contactos');
      }
    } catch (error: any) {
      console.error('[Apollo] Error loading contacts:', error);
      toast.error('Error al cargar contactos', { description: error.message });
    } finally {
      setLoadingContacts(false);
    }
  };

  const handleSearch = async () => {
    if (!keywords.trim()) {
      toast.error('Introduce palabras clave para buscar');
      return;
    }

    setSearching(true);
    setSearchError(null);
    setProspects([]);

    try {
      const filters: Record<string, any> = {};
      
      if (country) {
        filters.person_locations = [country];
      }
      
      if (employeeRange) {
        const [min, max] = employeeRange.split(',');
        filters.organization_num_employees_ranges = [`${min},${max}`];
      }

      const { data, error } = await supabase.functions.invoke('search-apollo-prospects', {
        body: {
          keywords: keywords.trim(),
          filters,
          page: 1,
          per_page: 50,
        },
      });

      if (error) throw error;

      const results = data?.people || [];
      
      // Group by organization to avoid duplicates
      const orgMap = new Map<string, ApolloProspect>();
      for (const person of results) {
        const orgName = person.organization?.name;
        if (orgName && !orgMap.has(orgName)) {
          orgMap.set(orgName, person);
        }
      }

      const uniqueProspects = Array.from(orgMap.values());
      setProspects(uniqueProspects);
      setStep('results');

      if (uniqueProspects.length === 0) {
        toast.info('No se encontraron resultados');
      }

    } catch (error: any) {
      console.error('[Apollo] Search error:', error);
      setSearchError(error.message || 'Error al buscar en Apollo');
      toast.error('Error en la búsqueda', { description: error.message });
    } finally {
      setSearching(false);
    }
  };

  const handleExtractUrls = async () => {
    const lines = urlsInput.split('\n').filter(line => line.trim());
    
    if (lines.length === 0) {
      toast.error('Pega URLs o IDs de Apollo');
      return;
    }

    setExtractingUrls(true);
    setExtractedContacts([]);

    try {
      const { data, error } = await supabase.functions.invoke('get-apollo-people-by-ids', {
        body: { urls_or_ids: lines },
      });

      if (error) throw error;

      const people = data?.people || [];
      setExtractedContacts(people);
      setStep('results');

      if (people.length === 0) {
        toast.warning('No se encontraron contactos válidos');
      } else if (data?.errors?.length > 0) {
        toast.warning(`${people.length} contactos encontrados, ${data.errors.length} errores`);
      } else {
        toast.success(`${people.length} contactos extraídos`);
      }

    } catch (error: any) {
      console.error('[Apollo] Extract error:', error);
      toast.error('Error al extraer contactos', { description: error.message });
    } finally {
      setExtractingUrls(false);
    }
  };

  const getCurrentData = (): ApolloProspect[] => {
    if (method === 'search') return prospects;
    if (method === 'list') return contacts.map(contactToProspect);
    if (method === 'urls') return extractedContacts.map(contactToProspect);
    return [];
  };

  const getSelectionKey = (item: ApolloProspect | ApolloContact): string => {
    if ('organization' in item && item.organization?.name) {
      return item.organization.name;
    }
    return item.id;
  };

  const toggleSelection = (key: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(key)) {
      newSelected.delete(key);
    } else {
      newSelected.add(key);
    }
    setSelectedIds(newSelected);
  };

  const toggleSelectAll = () => {
    const data = getCurrentData();
    if (selectedIds.size === data.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(data.map(d => getSelectionKey(d))));
    }
  };

  const handleImport = async () => {
    const data = getCurrentData();
    const selectedData = data.filter(d => selectedIds.has(getSelectionKey(d)));

    if (selectedData.length === 0) {
      toast.error('Selecciona al menos un target');
      return;
    }

    setStep('importing');
    setImporting(true);
    setProgress(0);

    const config: TargetImportConfig = {
      autoCrearEmpresas: true,
      estrategiaDuplicados: 'skip',
      sincronizarBrevo: false,
      validarCIF: false,
      defaultTags: ['apollo_import'],
    };

    try {
      const importResults = await importTargetsFromApollo(
        mandatoId,
        selectedData,
        config,
        (current, total) => {
          setProgress(Math.round((current / total) * 100));
        }
      );

      setResults(importResults);
      setStep('summary');

      const successful = importResults.filter(r => r.status === 'success').length;
      if (successful > 0) {
        toast.success(`${successful} targets importados desde Apollo`);
        onSuccess();
      }

    } catch (error: any) {
      console.error('[Apollo] Import error:', error);
      toast.error('Error durante la importación', { description: error.message });
      setStep('results');
    } finally {
      setImporting(false);
    }
  };

  const handleClose = () => {
    resetState();
    onOpenChange(false);
  };

  const successCount = results.filter(r => r.status === 'success').length;
  const errorCount = results.filter(r => r.status === 'error').length;
  const skippedCount = results.filter(r => r.status === 'skipped').length;

  const renderMethodSelector = () => (
    <Tabs value={method} onValueChange={(v) => setMethod(v as ImportMethod)} className="w-full">
      <TabsList className="grid w-full grid-cols-3">
        <TabsTrigger value="search" className="flex items-center gap-2">
          <Search className="h-4 w-4" />
          <span className="hidden sm:inline">Buscar</span>
        </TabsTrigger>
        <TabsTrigger value="list" className="flex items-center gap-2">
          <List className="h-4 w-4" />
          <span className="hidden sm:inline">Lista</span>
        </TabsTrigger>
        <TabsTrigger value="urls" className="flex items-center gap-2">
          <Link2 className="h-4 w-4" />
          <span className="hidden sm:inline">URLs/IDs</span>
        </TabsTrigger>
      </TabsList>

      {/* Search method */}
      <TabsContent value="search" className="space-y-4 mt-4">
        <div className="space-y-2">
          <Label>Palabras clave *</Label>
          <Input
            placeholder="Ej: software industrial, logística, alimentación..."
            value={keywords}
            onChange={(e) => setKeywords(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          />
          <p className="text-xs text-muted-foreground">
            Industria, sector o palabras clave para buscar empresas
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>País</Label>
            <Select value={country} onValueChange={setCountry}>
              <SelectTrigger>
                <SelectValue placeholder="Todos los países" />
              </SelectTrigger>
              <SelectContent>
                {COUNTRIES.map(c => (
                  <SelectItem key={c.value} value={c.value || "all"}>
                    {c.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Tamaño de empresa</Label>
            <Select value={employeeRange} onValueChange={setEmployeeRange}>
              <SelectTrigger>
                <SelectValue placeholder="Todos los tamaños" />
              </SelectTrigger>
              <SelectContent>
                {EMPLOYEE_RANGES.map(e => (
                  <SelectItem key={e.value} value={e.value || "all"}>
                    {e.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {searchError && (
          <Card className="border-destructive">
            <CardContent className="pt-4">
              <div className="flex items-center gap-2 text-destructive">
                <XCircle className="h-4 w-4" />
                <span className="text-sm">{searchError}</span>
              </div>
            </CardContent>
          </Card>
        )}
      </TabsContent>

      {/* List method */}
      <TabsContent value="list" className="space-y-4 mt-4">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label className="text-base font-medium">Selecciona una lista de Apollo</Label>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={loadLabels}
              disabled={loadingLabels}
              className="h-8 px-2"
            >
              <RefreshCw className={`h-4 w-4 ${loadingLabels ? 'animate-spin' : ''}`} />
              <span className="ml-1 text-xs">Actualizar</span>
            </Button>
          </div>
          
          {loadingLabels ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : labels.length === 0 ? (
            <Card>
              <CardContent className="py-6 text-center">
                <List className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground">
                  No se encontraron listas en Apollo
                </p>
                <Button variant="link" size="sm" onClick={loadLabels} className="mt-2">
                  Reintentar
                </Button>
              </CardContent>
            </Card>
          ) : (
            <ScrollArea className="h-[280px] pr-4">
              <RadioGroup value={selectedLabelId} onValueChange={handleSelectList} className="space-y-2">
                {labels.map(label => {
                  const isSelected = selectedLabelId === label.id;
                  const preview = listPreviews.get(label.id);
                  
                  return (
                    <div key={label.id}>
                      <label
                        htmlFor={`list-${label.id}`}
                        className={`
                          flex flex-col cursor-pointer rounded-lg border p-3 transition-all
                          ${isSelected 
                            ? 'border-primary bg-primary/5 ring-1 ring-primary/20' 
                            : 'border-border hover:border-primary/50 hover:bg-muted/30'
                          }
                        `}
                      >
                        {/* Header row */}
                        <div className="flex items-start gap-3">
                          <RadioGroupItem 
                            value={label.id} 
                            id={`list-${label.id}`}
                            className="mt-0.5 shrink-0"
                          />
                          <div className="flex-1 min-w-0">
                            {/* Name and count */}
                            <div className="flex items-center justify-between gap-2">
                              <span className="font-medium text-sm truncate">{label.name}</span>
                              <span className="text-xs font-medium text-muted-foreground whitespace-nowrap">
                                {label.cached_count} contactos
                              </span>
                            </div>
                            
                            {/* Dates */}
                            <div className="flex items-center gap-3 mt-1.5 text-xs text-muted-foreground">
                              {label.created_at && (
                                <div className="flex items-center gap-1">
                                  <Calendar className="h-3 w-3" />
                                  <span>
                                    {format(new Date(label.created_at), 'd MMM yyyy', { locale: es })}
                                  </span>
                                </div>
                              )}
                              {label.updated_at && (
                                <div className="flex items-center gap-1">
                                  <Clock className="h-3 w-3" />
                                  <span>
                                    {formatDistanceToNow(new Date(label.updated_at), { addSuffix: true, locale: es })}
                                  </span>
                                </div>
                              )}
                            </div>

                            {/* Preview section - only shown when selected */}
                            {isSelected && (
                              <div className="mt-3 pt-3 border-t border-border/50">
                                {preview?.loading ? (
                                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                    <Loader2 className="h-3 w-3 animate-spin" />
                                    <span>Cargando preview...</span>
                                  </div>
                                ) : preview?.contacts && preview.contacts.length > 0 ? (
                                  <div className="space-y-1.5">
                                    {preview.contacts.slice(0, 3).map((contact, idx) => (
                                      <div 
                                        key={contact.id || idx} 
                                        className="flex items-center gap-2 text-xs"
                                      >
                                        <User className="h-3 w-3 text-muted-foreground shrink-0" />
                                        <span className="font-medium truncate">
                                          {contact.first_name} {contact.last_name}
                                        </span>
                                        {contact.title && (
                                          <span className="text-muted-foreground truncate hidden sm:inline">
                                            ({contact.title})
                                          </span>
                                        )}
                                        {contact.organization_name && (
                                          <span className="text-muted-foreground truncate">
                                            @ {contact.organization_name}
                                          </span>
                                        )}
                                      </div>
                                    ))}
                                    {label.cached_count > 3 && (
                                      <p className="text-xs text-muted-foreground pl-5">
                                        +{label.cached_count - 3} más...
                                      </p>
                                    )}
                                  </div>
                                ) : (
                                  <p className="text-xs text-muted-foreground">
                                    Sin preview disponible
                                  </p>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      </label>
                    </div>
                  );
                })}
              </RadioGroup>
            </ScrollArea>
          )}
        </div>

        {/* Info card */}
        <Card className="bg-primary/5 border-primary/20">
          <CardContent className="py-3 px-4">
            <div className="flex items-start gap-2">
              <Info className="h-4 w-4 text-primary shrink-0 mt-0.5" />
              <p className="text-sm text-muted-foreground">
                Los contactos de listas de Apollo ya están enriquecidos con email y teléfono.
                <span className="font-medium text-foreground"> No consume créditos adicionales.</span>
              </p>
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      {/* URLs method */}
      <TabsContent value="urls" className="space-y-4 mt-4">
        <div className="space-y-2">
          <Label>Pega URLs o IDs de Apollo (uno por línea)</Label>
          <Textarea
            placeholder={`https://app.apollo.io/#/contacts/abc123
https://app.apollo.io/#/people/xyz789
5f8a9b2c1d3e4f5a6b7c8d9e`}
            value={urlsInput}
            onChange={(e) => setUrlsInput(e.target.value)}
            rows={6}
            className="font-mono text-sm"
          />
          <p className="text-xs text-muted-foreground">
            Formatos soportados: URLs de contactos, URLs de personas, o IDs directos (24 caracteres)
          </p>
        </div>

        <Card>
          <CardContent className="pt-4">
            <p className="text-sm text-muted-foreground">
              Copia las URLs directamente desde Apollo. Cada contacto será extraído
              con toda su información disponible.
            </p>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );

  const renderResults = () => {
    const data = getCurrentData();
    const isContactMode = method === 'list' || method === 'urls';

    return (
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Checkbox
              checked={selectedIds.size === data.length && data.length > 0}
              onCheckedChange={toggleSelectAll}
            />
            <span className="text-sm">
              {selectedIds.size} de {data.length} seleccionados
            </span>
          </div>
          <Button variant="outline" size="sm" onClick={() => setStep('select')}>
            Cambiar búsqueda
          </Button>
        </div>

        {/* Results table */}
        <ScrollArea className="h-[400px]">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="w-10">
                  <Checkbox
                    checked={selectedIds.size === data.length && data.length > 0}
                    onCheckedChange={toggleSelectAll}
                  />
                </TableHead>
                {isContactMode && <TableHead>Contacto</TableHead>}
                <TableHead>Empresa</TableHead>
                <TableHead>Sector</TableHead>
                <TableHead>País</TableHead>
                <TableHead>Empleados</TableHead>
                {isContactMode && <TableHead>Email</TableHead>}
                <TableHead className="w-10">Web</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((item, i) => {
                const key = getSelectionKey(item);
                const isSelected = selectedIds.has(key);
                const orgName = item.organization?.name || 'Sin empresa';

                return (
                  <TableRow
                    key={key + i}
                    className={`cursor-pointer ${isSelected ? 'bg-primary/5' : ''}`}
                    onClick={() => toggleSelection(key)}
                  >
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <Checkbox
                        checked={isSelected}
                        onCheckedChange={() => toggleSelection(key)}
                      />
                    </TableCell>
                    {isContactMode && (
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-muted-foreground shrink-0" />
                          <div className="min-w-0">
                            <p className="font-medium truncate max-w-[150px]">
                              {`${item.first_name || ''} ${item.last_name || ''}`.trim() || 'Sin nombre'}
                            </p>
                            {item.title && (
                              <p className="text-xs text-muted-foreground truncate max-w-[150px]">
                                {item.title}
                              </p>
                            )}
                          </div>
                        </div>
                      </TableCell>
                    )}
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <Building2 className="h-4 w-4 text-muted-foreground shrink-0" />
                        <span className="truncate max-w-[150px]">{orgName}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {item.organization?.industry || '-'}
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {item.organization?.country || '-'}
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {item.organization?.estimated_num_employees || '-'}
                    </TableCell>
                    {isContactMode && (
                      <TableCell className="text-muted-foreground text-sm">
                        {item.email ? (
                          <div className="flex items-center gap-1">
                            <Mail className="h-3 w-3" />
                            <span className="truncate max-w-[120px]">{item.email}</span>
                          </div>
                        ) : '-'}
                      </TableCell>
                    )}
                    <TableCell>
                      {item.organization?.primary_domain && (
                        <a
                          href={`https://${item.organization.primary_domain}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="text-muted-foreground hover:text-foreground"
                        >
                          <ExternalLink className="h-4 w-4" />
                        </a>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </ScrollArea>

        {data.length === 0 && (
          <Card>
            <CardContent className="py-8 text-center">
              <Search className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-sm text-muted-foreground">
                No se encontraron resultados
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    );
  };

  return (
    <Drawer open={open} onOpenChange={handleClose}>
      <DrawerContent className="max-h-[90vh]">
        <DrawerHeader>
          <DrawerTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Importar Targets desde Apollo
          </DrawerTitle>
          <DrawerDescription>
            {step === 'select' && 'Selecciona un método de importación'}
            {step === 'results' && `${getCurrentData().length} resultados encontrados`}
            {step === 'importing' && 'Importando targets seleccionados...'}
            {step === 'summary' && 'Resumen de la importación'}
          </DrawerDescription>
        </DrawerHeader>

        <div className="px-4 overflow-y-auto max-h-[calc(90vh-200px)]">
          {/* Step: Select method and configure */}
          {step === 'select' && renderMethodSelector()}

          {/* Step: Results */}
          {step === 'results' && renderResults()}

          {/* Step: Importing */}
          {step === 'importing' && (
            <div className="space-y-4 py-8">
              <div className="text-center">
                <Loader2 className="h-12 w-12 mx-auto animate-spin text-primary mb-4" />
                <p className="font-medium">Importando targets desde Apollo...</p>
                <p className="text-sm text-muted-foreground">
                  {Math.round(progress)}% completado
                </p>
              </div>
              <Progress value={progress} />
            </div>
          )}

          {/* Step: Summary */}
          {step === 'summary' && (
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-4 text-center">
                <Card>
                  <CardContent className="pt-4">
                    <CheckCircle2 className="h-8 w-8 mx-auto mb-2 text-green-500" />
                    <p className="text-2xl font-bold text-green-500">{successCount}</p>
                    <p className="text-xs text-muted-foreground">Importados</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-4">
                    <AlertTriangle className="h-8 w-8 mx-auto mb-2 text-amber-500" />
                    <p className="text-2xl font-bold text-amber-500">{skippedCount}</p>
                    <p className="text-xs text-muted-foreground">Omitidos</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-4">
                    <XCircle className="h-8 w-8 mx-auto mb-2 text-destructive" />
                    <p className="text-2xl font-bold text-destructive">{errorCount}</p>
                    <p className="text-xs text-muted-foreground">Errores</p>
                  </CardContent>
                </Card>
              </div>

              {results.length > 0 && (
                <ScrollArea className="h-[200px]">
                  <div className="space-y-1">
                    {results.map((r, i) => (
                      <div
                        key={i}
                        className={`flex items-center gap-2 p-2 rounded text-sm ${
                          r.status === 'success' ? 'bg-green-50 dark:bg-green-950/20' :
                          r.status === 'skipped' ? 'bg-amber-50 dark:bg-amber-950/20' :
                          'bg-red-50 dark:bg-red-950/20'
                        }`}
                      >
                        {r.status === 'success' && <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />}
                        {r.status === 'skipped' && <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0" />}
                        {r.status === 'error' && <XCircle className="h-4 w-4 text-destructive shrink-0" />}
                        <span className="truncate">{r.name}</span>
                        {r.message && (
                          <span className="text-xs text-muted-foreground ml-auto">
                            {r.message}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              )}
            </div>
          )}
        </div>

        <DrawerFooter>
          <div className="flex gap-2 w-full">
            <DrawerClose asChild>
              <Button variant="outline" className="flex-1">
                {step === 'summary' ? 'Cerrar' : 'Cancelar'}
              </Button>
            </DrawerClose>
            
            {step === 'select' && method === 'search' && (
              <Button 
                className="flex-1" 
                onClick={handleSearch}
                disabled={searching || !keywords.trim()}
              >
                {searching ? (
                  <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Buscando...</>
                ) : (
                  <><Search className="h-4 w-4 mr-2" />Buscar</>
                )}
              </Button>
            )}

            {step === 'select' && method === 'list' && (
              <Button 
                className="flex-1" 
                onClick={loadListContacts}
                disabled={loadingContacts || !selectedLabelId}
              >
                {loadingContacts ? (
                  <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Cargando...</>
                ) : (
                  <><List className="h-4 w-4 mr-2" />Cargar contactos</>
                )}
              </Button>
            )}

            {step === 'select' && method === 'urls' && (
              <Button 
                className="flex-1" 
                onClick={handleExtractUrls}
                disabled={extractingUrls || !urlsInput.trim()}
              >
                {extractingUrls ? (
                  <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Extrayendo...</>
                ) : (
                  <><Link2 className="h-4 w-4 mr-2" />Extraer contactos</>
                )}
              </Button>
            )}

            {step === 'results' && (
              <Button 
                className="flex-1" 
                onClick={handleImport}
                disabled={importing || selectedIds.size === 0}
              >
                <CheckCircle2 className="h-4 w-4 mr-2" />
                Importar {selectedIds.size} seleccionados
              </Button>
            )}
          </div>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}
