import { useState, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Download, Upload, AlertCircle, History, Undo2 } from "lucide-react";
import { useDropzone } from "react-dropzone";
import { parseCSV } from "@/services/importacion/csvParser";
import { validateMandatoRow, validateContactoRow } from "@/services/importacion/validator";
import { importMandatos } from "@/services/importacion/importMandatos";
import { importContactos } from "@/services/importacion/importContactos";
import { ImportConfigComponent } from "@/components/importacion/ImportConfig";
import { ImportProgress } from "@/components/importacion/ImportProgress";
import { ImportPreview } from "@/components/importacion/ImportPreview";
import { useImportacion, type ImportType, type ImportConfig } from "@/hooks/useImportacion";
import { useToast } from "@/hooks/use-toast";
import type { ParsedCSV } from "@/services/importacion/csvParser";
import type { ValidationResult } from "@/services/importacion/validator";

export default function ImportarDatos() {
  const [activeTab, setActiveTab] = useState<ImportType>('mandatos');
  const [parsedData, setParsedData] = useState<ParsedCSV | null>(null);
  const [validationResults, setValidationResults] = useState<ValidationResult[]>([]);
  const [config, setConfig] = useState<ImportConfig>({
    autoCrearEmpresas: true,
    estrategiaDuplicados: 'skip',
    sincronizarBrevo: false,
    validarCIF: true
  });

  const {
    importing,
    setImporting,
    progress,
    setProgress,
    results,
    setResults,
    importLogId,
    setImportLogId,
    createImportLog,
    updateImportLog,
    rollbackImport,
    calculateStats,
    resetImport
  } = useImportacion();

  const { toast } = useToast();

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return;

    const file = acceptedFiles[0];
    
    if (!file.name.endsWith('.csv')) {
      toast({
        title: "❌ Formato inválido",
        description: "Solo se permiten archivos CSV",
        variant: "destructive"
      });
      return;
    }

    try {
      const parsed = await parseCSV(file);
      setParsedData(parsed);
      
      // Validar filas según el tipo
      const validator = activeTab === 'mandatos' ? validateMandatoRow : validateContactoRow;
      const validations = parsed.rows.map(row => validator(row));
      setValidationResults(validations);

      const errors = validations.filter(v => !v.isValid).length;
      toast({
        title: "✅ Archivo cargado",
        description: `${parsed.rows.length} filas detectadas${errors > 0 ? `, ${errors} con errores` : ''}`,
      });

    } catch (error: any) {
      toast({
        title: "❌ Error al leer archivo",
        description: error.message,
        variant: "destructive"
      });
    }
  }, [activeTab, toast]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'text/csv': ['.csv'] },
    maxFiles: 1,
    maxSize: 5 * 1024 * 1024 // 5MB
  });

  const handleImport = async () => {
    if (!parsedData) return;

    setImporting(true);
    setProgress(0);
    setResults([]);

    try {
      // Crear log de importación
      const logId = await createImportLog(
        activeTab,
        parsedData.rows.length,
        'manual-upload.csv',
        config
      );
      setImportLogId(logId);

      // Ejecutar importación según el tipo
      const importResults = activeTab === 'mandatos'
        ? await importMandatos(parsedData.rows, config, logId, (current, total) => {
            setProgress((current / total) * 100);
          })
        : await importContactos(parsedData.rows, config, logId, (current, total) => {
            setProgress((current / total) * 100);
          });

      setResults(importResults);

      // Actualizar log con resultados
      const stats = calculateStats(importResults);
      await updateImportLog(logId, stats, 'completed');

      toast({
        title: "✅ Importación completada",
        description: `${stats.successful} exitosos, ${stats.failed} errores, ${stats.skipped} omitidos`,
      });

    } catch (error: any) {
      toast({
        title: "❌ Error en importación",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setImporting(false);
      setProgress(100);
    }
  };

  const handleRollback = async () => {
    if (!importLogId) return;
    
    try {
      await rollbackImport(importLogId);
      resetImport();
      setParsedData(null);
      setValidationResults([]);
    } catch (error) {
      // Error handled in hook
    }
  };

  const downloadTemplate = (type: ImportType) => {
    const templates = {
      mandatos: `titulo,tipo,empresa_nombre,empresa_cif,sector,valor,estado,descripcion,fecha_inicio
"Venta ACME SL",venta,"ACME SL",B12345678,Tecnología,500000,prospecto,"Venta de empresa tecnológica",2024-01-01
"Compra Servicios XYZ",compra,"XYZ Corp",B87654321,Servicios,300000,activo,"Adquisición de empresa de servicios",2024-02-01`,
      
      contactos: `nombre,apellidos,email,telefono,cargo,empresa_nombre,empresa_cif,linkedin,notas
Juan,García,juan@empresa.com,+34600000000,Director,"ACME SL",B12345678,https://linkedin.com/in/juan,Cliente prioritario
María,López,maria@xyz.com,+34600000001,CEO,"XYZ Corp",B87654321,https://linkedin.com/in/maria,Contacto caliente`,
      
      empresas: `nombre,cif,sector,subsector,ubicacion,facturacion,empleados,sitio_web
"ACME SL",B12345678,Tecnología,"Software",Madrid,1000000,50,https://acme.com
"XYZ Corp",B87654321,Servicios,Consultoría,Barcelona,500000,25,https://xyz.com`
    };

    const content = templates[type];
    const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', `plantilla_${type}.csv`);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast({
      title: "📥 Plantilla descargada",
      description: `plantilla_${type}.csv`,
    });
  };

  const hasValidData = parsedData && validationResults.filter(v => v.isValid).length > 0;
  const totalErrors = validationResults.filter(v => !v.isValid).length;

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">📤 Importación Masiva de Datos</h1>
          <p className="text-muted-foreground mt-2">
            Importa mandatos, contactos y empresas desde archivos CSV
          </p>
        </div>
        
        {importLogId && results.length > 0 && (
          <Button
            variant="outline"
            onClick={handleRollback}
            className="gap-2"
          >
            <Undo2 className="h-4 w-4" />
            Revertir Importación
          </Button>
        )}
      </div>

      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as ImportType)}>
        <TabsList className="grid w-full max-w-md grid-cols-3">
          <TabsTrigger value="mandatos">Mandatos</TabsTrigger>
          <TabsTrigger value="contactos">Contactos</TabsTrigger>
          <TabsTrigger value="empresas">Empresas</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="space-y-6">
          {/* Upload Zone */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>1️⃣ Seleccionar Archivo CSV</span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => downloadTemplate(activeTab)}
                  className="gap-2"
                >
                  <Download className="h-4 w-4" />
                  Descargar Plantilla
                </Button>
              </CardTitle>
              <CardDescription>
                Arrastra un archivo CSV o haz clic para seleccionar (máximo 5MB)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div
                {...getRootProps()}
                className={`border-2 border-dashed rounded-lg p-12 text-center cursor-pointer transition-colors ${
                  isDragActive ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'
                }`}
              >
                <input {...getInputProps()} />
                <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                {isDragActive ? (
                  <p className="text-lg font-medium">Suelta el archivo aquí...</p>
                ) : (
                  <div>
                    <p className="text-lg font-medium mb-2">
                      Arrastra un archivo CSV aquí
                    </p>
                    <p className="text-sm text-muted-foreground">
                      o haz clic para seleccionar desde tu ordenador
                    </p>
                  </div>
                )}
              </div>

              {parsedData && (
                <Alert className="mt-4">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    ✅ Archivo cargado: {parsedData.rows.length} filas detectadas
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>

          {/* Configuración */}
          {parsedData && (
            <>
              <ImportConfigComponent config={config} onChange={setConfig} />

              {/* Preview */}
              <ImportPreview
                headers={parsedData.headers}
                rows={parsedData.rows}
                validationResults={validationResults}
              />

              {/* Progress */}
              <ImportProgress
                progress={progress}
                total={parsedData.rows.length}
                current={Math.floor((progress / 100) * parsedData.rows.length)}
                importing={importing}
              />

              {/* Botones de acción */}
              <div className="flex gap-4">
                <Button
                  onClick={handleImport}
                  disabled={!hasValidData || importing}
                  size="lg"
                  className="flex-1"
                >
                  {importing ? 'Importando...' : `✅ Importar ${parsedData.rows.length - totalErrors} registros válidos`}
                </Button>
                
                <Button
                  variant="outline"
                  onClick={() => {
                    setParsedData(null);
                    setValidationResults([]);
                    resetImport();
                  }}
                  disabled={importing}
                >
                  Cancelar
                </Button>
              </div>

              {/* Resultados */}
              {results.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>📋 Resultados de Importación</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 max-h-96 overflow-y-auto">
                      {results.map((result, index) => (
                        <Alert
                          key={index}
                          variant={result.status === 'error' ? 'destructive' : 'default'}
                        >
                          <AlertDescription>
                            <span className="font-medium">{result.name}</span>: {result.message}
                          </AlertDescription>
                        </Alert>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
