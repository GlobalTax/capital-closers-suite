/**
 * Drawer para importar targets desde archivos Excel/CSV
 */

import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
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
import { Progress } from "@/components/ui/progress";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Upload, 
  FileSpreadsheet, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle,
  Loader2,
  Trash2,
  FileCheck
} from "lucide-react";
import { parseSpreadsheet } from "@/services/importacion/spreadsheetParser";
import { normalizeTargetRow, hasMinimumTargetData, detectMappedColumns } from "@/services/importacion/targetColumnNormalizer";
import { importTargetsFromSpreadsheet, type TargetImportRow, type TargetImportConfig } from "@/services/importacion/importTargets";
import type { ImportResult } from "@/hooks/useImportacion";
import { toast } from "sonner";

interface ImportTargetsExcelDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mandatoId: string;
  onSuccess: () => void;
}

type ImportStep = 'upload' | 'preview' | 'config' | 'importing' | 'results';
type DuplicateStrategy = 'skip' | 'create_new';

export function ImportTargetsExcelDrawer({ 
  open, 
  onOpenChange, 
  mandatoId, 
  onSuccess 
}: ImportTargetsExcelDrawerProps) {
  const [step, setStep] = useState<ImportStep>('upload');
  const [file, setFile] = useState<File | null>(null);
  const [parsedRows, setParsedRows] = useState<TargetImportRow[]>([]);
  const [validRows, setValidRows] = useState<TargetImportRow[]>([]);
  const [invalidRows, setInvalidRows] = useState<{ row: Record<string, any>; reason: string }[]>([]);
  const [mappedColumns, setMappedColumns] = useState<Array<{ header: string; field: string }>>([]);
  const [unmappedColumns, setUnmappedColumns] = useState<string[]>([]);
  const [duplicateStrategy, setDuplicateStrategy] = useState<DuplicateStrategy>('skip');
  const [importing, setImporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [results, setResults] = useState<ImportResult[]>([]);
  const [parseError, setParseError] = useState<string | null>(null);

  const resetState = () => {
    setStep('upload');
    setFile(null);
    setParsedRows([]);
    setValidRows([]);
    setInvalidRows([]);
    setMappedColumns([]);
    setUnmappedColumns([]);
    setDuplicateStrategy('skip');
    setImporting(false);
    setProgress(0);
    setResults([]);
    setParseError(null);
  };

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return;
    
    const selectedFile = acceptedFiles[0];
    setFile(selectedFile);
    setParseError(null);
    
    try {
      const parsed = await parseSpreadsheet(selectedFile);
      
      // Detectar columnas mapeadas
      const { mapped, unmapped } = detectMappedColumns(parsed.headers);
      setMappedColumns(mapped);
      setUnmappedColumns(unmapped);
      
      // Normalizar y validar filas
      const normalized: TargetImportRow[] = [];
      const invalid: { row: Record<string, any>; reason: string }[] = [];
      
      for (const row of parsed.rows) {
        const normalizedRow = normalizeTargetRow(row);
        
        if (hasMinimumTargetData(normalizedRow)) {
          normalized.push(normalizedRow as TargetImportRow);
        } else {
          invalid.push({ 
            row: normalizedRow, 
            reason: 'Falta nombre de empresa (mínimo 2 caracteres)' 
          });
        }
      }
      
      setParsedRows(normalized);
      setValidRows(normalized);
      setInvalidRows(invalid);
      setStep('preview');
      
    } catch (error: any) {
      console.error('[ImportTargetsExcel] Parse error:', error);
      setParseError(error.message || 'Error al leer el archivo');
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'application/vnd.ms-excel': ['.xls'],
      'text/csv': ['.csv'],
    },
    maxFiles: 1,
    maxSize: 10 * 1024 * 1024, // 10MB
  });

  const handleImport = async () => {
    if (validRows.length === 0) return;
    
    setStep('importing');
    setImporting(true);
    setProgress(0);
    
    const config: TargetImportConfig = {
      autoCrearEmpresas: true,
      estrategiaDuplicados: duplicateStrategy,
      sincronizarBrevo: false,
      validarCIF: false,
      defaultTags: ['excel_import'],
    };
    
    try {
      const importResults = await importTargetsFromSpreadsheet(
        mandatoId,
        validRows,
        config,
        (current, total) => {
          setProgress(Math.round((current / total) * 100));
        }
      );
      
      setResults(importResults);
      setStep('results');
      
      const successful = importResults.filter(r => r.status === 'success').length;
      const failed = importResults.filter(r => r.status === 'error').length;
      const skipped = importResults.filter(r => r.status === 'skipped').length;
      
      if (successful > 0) {
        toast.success(`${successful} targets importados correctamente`);
        onSuccess();
      }
      
      if (failed > 0 || skipped > 0) {
        toast.warning(`${failed} errores, ${skipped} omitidos`);
      }
      
    } catch (error: any) {
      console.error('[ImportTargetsExcel] Import error:', error);
      toast.error('Error durante la importación', {
        description: error.message,
      });
      setStep('config');
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
            <FileSpreadsheet className="h-5 w-5" />
            Importar Targets desde Excel/CSV
          </DrawerTitle>
          <DrawerDescription>
            {step === 'upload' && 'Sube un archivo con la lista de empresas target'}
            {step === 'preview' && 'Revisa los datos detectados antes de importar'}
            {step === 'config' && 'Configura las opciones de importación'}
            {step === 'importing' && 'Importando targets...'}
            {step === 'results' && 'Resumen de la importación'}
          </DrawerDescription>
        </DrawerHeader>

        <div className="px-4 overflow-y-auto max-h-[calc(90vh-200px)]">
          {/* Step: Upload */}
          {step === 'upload' && (
            <div className="space-y-4">
              <div
                {...getRootProps()}
                className={`
                  border-2 border-dashed rounded-lg p-8 text-center cursor-pointer
                  transition-colors
                  ${isDragActive 
                    ? 'border-primary bg-primary/5' 
                    : 'border-muted-foreground/25 hover:border-primary/50'}
                `}
              >
                <input {...getInputProps()} />
                <Upload className="h-10 w-10 mx-auto mb-4 text-muted-foreground" />
                {isDragActive ? (
                  <p className="text-sm">Suelta el archivo aquí...</p>
                ) : (
                  <>
                    <p className="text-sm font-medium">
                      Arrastra un archivo o haz clic para seleccionar
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Formatos soportados: CSV, XLS, XLSX (máx. 10MB)
                    </p>
                  </>
                )}
              </div>

              {parseError && (
                <Card className="border-destructive">
                  <CardContent className="pt-4">
                    <div className="flex items-center gap-2 text-destructive">
                      <XCircle className="h-4 w-4" />
                      <span className="text-sm font-medium">{parseError}</span>
                    </div>
                  </CardContent>
                </Card>
              )}

              <Card>
                <CardContent className="pt-4">
                  <p className="text-sm font-medium mb-2">Columnas reconocidas:</p>
                  <div className="flex flex-wrap gap-1">
                    {['Nombre/Empresa', 'Sector', 'Ubicación', 'Facturación', 'Empleados', 
                      'Sitio Web', 'Contacto', 'Email', 'Teléfono'].map(col => (
                      <Badge key={col} variant="outline" className="text-xs">
                        {col}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Step: Preview */}
          {step === 'preview' && (
            <div className="space-y-4">
              {/* Resumen del archivo */}
              <Card>
                <CardContent className="pt-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <FileCheck className="h-4 w-4 text-primary" />
                      <span className="font-medium">{file?.name}</span>
                    </div>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={resetState}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div>
                      <p className="text-2xl font-bold text-primary">{validRows.length}</p>
                      <p className="text-xs text-muted-foreground">Válidos</p>
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-amber-500">{invalidRows.length}</p>
                      <p className="text-xs text-muted-foreground">Inválidos</p>
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{mappedColumns.length}</p>
                      <p className="text-xs text-muted-foreground">Columnas</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Columnas mapeadas */}
              <Card>
                <CardContent className="pt-4">
                  <p className="text-sm font-medium mb-2">Columnas detectadas:</p>
                  <div className="flex flex-wrap gap-1">
                    {mappedColumns.map(({ header, field }) => (
                      <Badge key={header} variant="secondary" className="text-xs">
                        {header} → {field}
                      </Badge>
                    ))}
                  </div>
                  {unmappedColumns.length > 0 && (
                    <>
                      <p className="text-sm font-medium mt-3 mb-2 text-muted-foreground">
                        No reconocidas:
                      </p>
                      <div className="flex flex-wrap gap-1">
                        {unmappedColumns.map(header => (
                          <Badge key={header} variant="outline" className="text-xs text-muted-foreground">
                            {header}
                          </Badge>
                        ))}
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>

              {/* Preview de datos */}
              <Card>
                <CardContent className="pt-4">
                  <p className="text-sm font-medium mb-2">
                    Vista previa (primeros 5 registros):
                  </p>
                  <ScrollArea className="h-48">
                    <div className="space-y-2">
                      {validRows.slice(0, 5).map((row, i) => (
                        <div key={i} className="p-2 bg-muted/50 rounded text-sm">
                          <p className="font-medium">{row.nombre}</p>
                          <p className="text-xs text-muted-foreground">
                            {[row.sector, row.ubicacion, row.contacto_email]
                              .filter(Boolean)
                              .join(' • ')}
                          </p>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>

              {/* Filas inválidas */}
              {invalidRows.length > 0 && (
                <Card className="border-amber-500/50">
                  <CardContent className="pt-4">
                    <div className="flex items-center gap-2 mb-2">
                      <AlertTriangle className="h-4 w-4 text-amber-500" />
                      <p className="text-sm font-medium">
                        {invalidRows.length} filas serán omitidas
                      </p>
                    </div>
                    <ScrollArea className="h-24">
                      <div className="space-y-1">
                        {invalidRows.slice(0, 5).map((item, i) => (
                          <p key={i} className="text-xs text-muted-foreground">
                            {item.reason}
                          </p>
                        ))}
                      </div>
                    </ScrollArea>
                  </CardContent>
                </Card>
              )}
            </div>
          )}

          {/* Step: Config */}
          {step === 'config' && (
            <div className="space-y-4">
              <Card>
                <CardContent className="pt-4">
                  <Label className="text-sm font-medium">
                    Estrategia para duplicados
                  </Label>
                  <p className="text-xs text-muted-foreground mb-3">
                    Qué hacer si la empresa ya existe en el CRM
                  </p>
                  <RadioGroup 
                    value={duplicateStrategy}
                    onValueChange={(v) => setDuplicateStrategy(v as DuplicateStrategy)}
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="skip" id="skip" />
                      <Label htmlFor="skip" className="font-normal cursor-pointer">
                        <span className="font-medium">Omitir</span> - No importar si ya existe
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="create_new" id="create_new" />
                      <Label htmlFor="create_new" className="font-normal cursor-pointer">
                        <span className="font-medium">Vincular existente</span> - Usar empresa del CRM
                      </Label>
                    </div>
                  </RadioGroup>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-4">
                  <p className="text-sm text-muted-foreground">
                    Se importarán <span className="font-bold text-foreground">{validRows.length}</span> targets 
                    al mandato actual. Se añadirá automáticamente el tag <Badge variant="outline">excel_import</Badge>
                  </p>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Step: Importing */}
          {step === 'importing' && (
            <div className="space-y-4 py-8">
              <div className="text-center">
                <Loader2 className="h-12 w-12 mx-auto animate-spin text-primary mb-4" />
                <p className="font-medium">Importando targets...</p>
                <p className="text-sm text-muted-foreground">
                  {Math.round(progress)}% completado
                </p>
              </div>
              <Progress value={progress} />
            </div>
          )}

          {/* Step: Results */}
          {step === 'results' && (
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
            {step === 'upload' && (
              <DrawerClose asChild>
                <Button variant="outline">Cancelar</Button>
              </DrawerClose>
            )}
            
            {step === 'preview' && (
              <>
                <Button variant="outline" onClick={resetState}>
                  Cambiar archivo
                </Button>
                <Button 
                  onClick={() => setStep('config')}
                  disabled={validRows.length === 0}
                >
                  Continuar ({validRows.length} targets)
                </Button>
              </>
            )}
            
            {step === 'config' && (
              <>
                <Button variant="outline" onClick={() => setStep('preview')}>
                  Atrás
                </Button>
                <Button onClick={handleImport}>
                  Importar {validRows.length} targets
                </Button>
              </>
            )}
            
            {step === 'results' && (
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
