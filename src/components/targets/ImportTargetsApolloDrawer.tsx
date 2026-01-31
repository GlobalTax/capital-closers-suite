/**
 * Drawer para importar targets desde búsqueda en Apollo
 */

import { useState } from "react";
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
  MapPin
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { importTargetsFromApollo, type ApolloProspect, type TargetImportConfig } from "@/services/importacion/importTargets";
import type { ImportResult } from "@/hooks/useImportacion";
import { toast } from "sonner";

interface ImportTargetsApolloDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mandatoId: string;
  onSuccess: () => void;
}

type ImportStep = 'search' | 'results' | 'importing' | 'summary';

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

export function ImportTargetsApolloDrawer({ 
  open, 
  onOpenChange, 
  mandatoId, 
  onSuccess 
}: ImportTargetsApolloDrawerProps) {
  const [step, setStep] = useState<ImportStep>('search');
  const [keywords, setKeywords] = useState('');
  const [country, setCountry] = useState('');
  const [employeeRange, setEmployeeRange] = useState('');
  const [searching, setSearching] = useState(false);
  const [prospects, setProspects] = useState<ApolloProspect[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [importing, setImporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [results, setResults] = useState<ImportResult[]>([]);
  const [searchError, setSearchError] = useState<string | null>(null);

  const resetState = () => {
    setStep('search');
    setKeywords('');
    setCountry('');
    setEmployeeRange('');
    setSearching(false);
    setProspects([]);
    setSelectedIds(new Set());
    setImporting(false);
    setProgress(0);
    setResults([]);
    setSearchError(null);
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
      // Preparar filtros
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
      
      // Agrupar por organización para evitar duplicados
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
      console.error('[ImportApollo] Search error:', error);
      setSearchError(error.message || 'Error al buscar en Apollo');
      toast.error('Error en la búsqueda', {
        description: error.message,
      });
    } finally {
      setSearching(false);
    }
  };

  const toggleSelection = (id: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === prospects.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(prospects.map(p => p.organization?.name || '')));
    }
  };

  const handleImport = async () => {
    const selectedProspects = prospects.filter(p => 
      selectedIds.has(p.organization?.name || '')
    );

    if (selectedProspects.length === 0) {
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
        selectedProspects,
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
      console.error('[ImportApollo] Import error:', error);
      toast.error('Error durante la importación', {
        description: error.message,
      });
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

  return (
    <Drawer open={open} onOpenChange={handleClose}>
      <DrawerContent className="max-h-[90vh]">
        <DrawerHeader>
          <DrawerTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Importar Targets desde Apollo
          </DrawerTitle>
          <DrawerDescription>
            {step === 'search' && 'Busca empresas en la base de datos de Apollo (275M+ contactos)'}
            {step === 'results' && `${prospects.length} empresas encontradas`}
            {step === 'importing' && 'Importando targets seleccionados...'}
            {step === 'summary' && 'Resumen de la importación'}
          </DrawerDescription>
        </DrawerHeader>

        <div className="px-4 overflow-y-auto max-h-[calc(90vh-200px)]">
          {/* Step: Search */}
          {step === 'search' && (
            <div className="space-y-4">
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

              <Card>
                <CardContent className="pt-4">
                  <p className="text-sm text-muted-foreground">
                    Apollo es una base de datos B2B con información de más de 275 millones de contactos 
                    y 73 millones de empresas a nivel mundial.
                  </p>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Step: Results */}
          {step === 'results' && (
            <div className="space-y-4">
              {/* Header con selección */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Checkbox
                    checked={selectedIds.size === prospects.length && prospects.length > 0}
                    onCheckedChange={toggleSelectAll}
                  />
                  <span className="text-sm">
                    {selectedIds.size} de {prospects.length} seleccionados
                  </span>
                </div>
                <Button variant="outline" size="sm" onClick={() => setStep('search')}>
                  Nueva búsqueda
                </Button>
              </div>

              {/* Lista de resultados en tabla */}
              <ScrollArea className="h-[400px]">
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-transparent">
                      <TableHead className="w-10">
                        <Checkbox
                          checked={selectedIds.size === prospects.length && prospects.length > 0}
                          onCheckedChange={toggleSelectAll}
                        />
                      </TableHead>
                      <TableHead>Empresa</TableHead>
                      <TableHead>Sector</TableHead>
                      <TableHead>País</TableHead>
                      <TableHead>Empleados</TableHead>
                      <TableHead className="w-10">Web</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {prospects.map((prospect, i) => {
                      const orgName = prospect.organization?.name || `Empresa ${i + 1}`;
                      const isSelected = selectedIds.has(orgName);

                      return (
                        <TableRow
                          key={orgName}
                          className={`cursor-pointer ${isSelected ? 'bg-primary/5' : ''}`}
                          onClick={() => toggleSelection(orgName)}
                        >
                          <TableCell onClick={(e) => e.stopPropagation()}>
                            <Checkbox
                              checked={isSelected}
                              onCheckedChange={() => toggleSelection(orgName)}
                            />
                          </TableCell>
                          <TableCell className="font-medium">
                            <div className="flex items-center gap-2">
                              <Building2 className="h-4 w-4 text-muted-foreground shrink-0" />
                              <span className="truncate max-w-[200px]">{orgName}</span>
                            </div>
                          </TableCell>
                          <TableCell className="text-muted-foreground text-sm">
                            {prospect.organization?.industry || '-'}
                          </TableCell>
                          <TableCell className="text-muted-foreground text-sm">
                            {prospect.organization?.country || '-'}
                          </TableCell>
                          <TableCell className="text-muted-foreground text-sm">
                            {prospect.organization?.estimated_num_employees || '-'}
                          </TableCell>
                          <TableCell>
                            {prospect.organization?.primary_domain && (
                              <a
                                href={`https://${prospect.organization.primary_domain}`}
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

              {prospects.length === 0 && (
                <Card>
                  <CardContent className="py-8 text-center">
                    <Search className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-sm text-muted-foreground">
                      No se encontraron empresas con esos criterios
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>
          )}

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

              {(errorCount > 0 || skippedCount > 0) && (
                <Card>
                  <CardContent className="pt-4">
                    <p className="text-sm font-medium mb-2">Detalles:</p>
                    <ScrollArea className="h-32">
                      <div className="space-y-1">
                        {results
                          .filter(r => r.status !== 'success')
                          .map((result, i) => (
                            <div key={i} className="flex items-center gap-2 text-xs">
                              {result.status === 'error' ? (
                                <XCircle className="h-3 w-3 text-destructive shrink-0" />
                              ) : (
                                <AlertTriangle className="h-3 w-3 text-amber-500 shrink-0" />
                              )}
                              <span className="font-medium">{result.name}:</span>
                              <span className="text-muted-foreground">{result.message}</span>
                            </div>
                          ))}
                      </div>
                    </ScrollArea>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </div>

        <DrawerFooter>
          <div className="flex justify-end gap-2">
            {step === 'search' && (
              <>
                <DrawerClose asChild>
                  <Button variant="outline">Cancelar</Button>
                </DrawerClose>
                <Button onClick={handleSearch} disabled={searching || !keywords.trim()}>
                  {searching ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Buscando...
                    </>
                  ) : (
                    <>
                      <Search className="h-4 w-4 mr-2" />
                      Buscar
                    </>
                  )}
                </Button>
              </>
            )}

            {step === 'results' && (
              <>
                <Button variant="outline" onClick={() => setStep('search')}>
                  Volver
                </Button>
                <Button 
                  onClick={handleImport}
                  disabled={selectedIds.size === 0}
                >
                  Importar {selectedIds.size} targets
                </Button>
              </>
            )}

            {step === 'summary' && (
              <Button onClick={handleClose}>
                Cerrar
              </Button>
            )}
          </div>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}
