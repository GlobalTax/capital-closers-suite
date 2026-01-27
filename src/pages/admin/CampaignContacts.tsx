import { useState, useCallback } from "react";
import { useLocation } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Upload, Users, RefreshCw } from "lucide-react";
import { useDropzone } from "react-dropzone";
import { toast } from "sonner";
import { parseSpreadsheet, type ParsedSpreadsheet } from "@/services/importacion/spreadsheetParser";
import { normalizeCampaignContactRow } from "@/services/importacion/columnNormalizer";
import { validateCampaignContactRow } from "@/services/importacion/validator";
import { CampaignContactsTable } from "@/components/campaigns/contacts/CampaignContactsTable";
import { CampaignContactsImportPreview } from "@/components/campaigns/contacts/CampaignContactsImportPreview";
import { useCampaignContacts } from "@/hooks/useCampaignContacts";
import { importCampaignContacts } from "@/services/importacion/importCampaignContacts";
import { ImportProgress } from "@/components/importacion/ImportProgress";
import { useQueryClient } from "@tanstack/react-query";

type CampaignType = 'buy' | 'sell';

const campaignLabels: Record<CampaignType, { title: string; singular: string; description: string }> = {
  buy: { 
    title: 'Contactos de Compra', 
    singular: 'Buyer',
    description: 'Gestiona los contactos de campañas de compra (inversores, compradores potenciales)'
  },
  sell: { 
    title: 'Contactos de Venta', 
    singular: 'Seller',
    description: 'Gestiona los contactos de campañas de venta (vendedores, propietarios de empresas)'
  }
};

export default function CampaignContacts() {
  const location = useLocation();
  const campaignType: CampaignType = location.pathname.includes('seller') ? 'sell' : 'buy';
  const labels = campaignLabels[campaignType];
  
  const [activeTab, setActiveTab] = useState<'list' | 'import'>('list');
  const [parsedData, setParsedData] = useState<ParsedSpreadsheet | null>(null);
  const [validationResults, setValidationResults] = useState<Array<{ isValid: boolean; errors: any[] }>>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [importProgress, setImportProgress] = useState({ current: 0, total: 0 });
  
  const { data: contacts, isLoading, refetch } = useCampaignContacts(campaignType);
  const queryClient = useQueryClient();

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return;

    const file = acceptedFiles[0];
    const extension = file.name.split('.').pop()?.toLowerCase();
    
    if (!['csv', 'xlsx', 'xls'].includes(extension || '')) {
      toast.error("Formato no soportado", {
        description: "Use archivos CSV, XLSX o XLS"
      });
      return;
    }

    setIsProcessing(true);
    try {
      const parsed = await parseSpreadsheet(file);
      
      // Normalizar filas
      const normalizedRows = parsed.rows.map(row => normalizeCampaignContactRow(row));
      
      // Validar filas
      const validations = normalizedRows.map(row => validateCampaignContactRow(row));
      
      setParsedData({
        ...parsed,
        rows: normalizedRows
      });
      setValidationResults(validations);

      const valid = validations.filter(v => v.isValid).length;
      const invalid = validations.filter(v => !v.isValid).length;
      
      toast.success(`Archivo cargado (${parsed.format.toUpperCase()})`, {
        description: `${valid} válidos, ${invalid} requieren revisión`
      });

    } catch (error: any) {
      toast.error("Error al leer archivo", {
        description: error.message
      });
    } finally {
      setIsProcessing(false);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 
      'text/csv': ['.csv'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'application/vnd.ms-excel': ['.xls']
    },
    maxFiles: 1,
    maxSize: 10 * 1024 * 1024
  });

  const handleImport = async () => {
    if (!parsedData) return;
    
    const validRows = parsedData.rows.filter((_, i) => validationResults[i]?.isValid);
    if (validRows.length === 0) {
      toast.error("No hay contactos válidos para importar");
      return;
    }

    setIsImporting(true);
    setImportProgress({ current: 0, total: validRows.length });

    try {
      const results = await importCampaignContacts(
        validRows, 
        campaignType,
        (current) => setImportProgress(prev => ({ ...prev, current }))
      );
      
      const successCount = results.filter(r => r.status === 'success').length;
      const skippedCount = results.filter(r => r.status === 'skipped').length;
      const errorCount = results.filter(r => r.status === 'error').length;

      toast.success("Importación completada", {
        description: `✅ ${successCount} creados, ⏭️ ${skippedCount} omitidos, ❌ ${errorCount} errores`
      });

      // Limpiar y refrescar
      setParsedData(null);
      setValidationResults([]);
      queryClient.invalidateQueries({ queryKey: ['campaign-contacts', campaignType] });
      setActiveTab('list');

    } catch (error: any) {
      toast.error("Error en importación", {
        description: error.message
      });
    } finally {
      setIsImporting(false);
      setImportProgress({ current: 0, total: 0 });
    }
  };

  const handleCancelImport = () => {
    setParsedData(null);
    setValidationResults([]);
  };

  const validCount = validationResults.filter(v => v.isValid).length;
  const invalidCount = validationResults.filter(v => !v.isValid).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">{labels.title}</h1>
          <p className="text-muted-foreground">{labels.description}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => refetch()} disabled={isLoading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Actualizar
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'list' | 'import')}>
        <TabsList>
          <TabsTrigger value="list" className="gap-2">
            <Users className="h-4 w-4" />
            Listado ({contacts?.length || 0})
          </TabsTrigger>
          <TabsTrigger value="import" className="gap-2">
            <Upload className="h-4 w-4" />
            Importar Excel
          </TabsTrigger>
        </TabsList>

        <TabsContent value="list" className="mt-6">
          <CampaignContactsTable 
            contacts={contacts || []} 
            isLoading={isLoading}
            campaignType={campaignType}
            onRefresh={refetch}
          />
        </TabsContent>

        <TabsContent value="import" className="mt-6 space-y-4">
          {!parsedData ? (
            <Card>
              <CardHeader>
                <CardTitle>Subir archivo Excel</CardTitle>
                <CardDescription>
                  Sube un archivo CSV, XLSX o XLS con los contactos de {campaignType === 'buy' ? 'compra' : 'venta'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div
                  {...getRootProps()}
                  className={`
                    border-2 border-dashed rounded-lg p-12 text-center cursor-pointer
                    transition-colors duration-200
                    ${isDragActive 
                      ? 'border-primary bg-primary/5' 
                      : 'border-muted-foreground/25 hover:border-primary/50'
                    }
                    ${isProcessing ? 'opacity-50 pointer-events-none' : ''}
                  `}
                >
                  <input {...getInputProps()} />
                  <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  {isProcessing ? (
                    <p className="text-muted-foreground">Procesando archivo...</p>
                  ) : isDragActive ? (
                    <p className="text-primary font-medium">Suelta el archivo aquí...</p>
                  ) : (
                    <>
                      <p className="text-muted-foreground mb-2">
                        Arrastra un archivo aquí o haz clic para seleccionar
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Formatos soportados: CSV, XLSX, XLS (máx. 10MB)
                      </p>
                    </>
                  )}
                </div>

                <div className="mt-6 p-4 bg-muted/50 rounded-lg">
                  <h4 className="font-medium mb-2">Columnas esperadas:</h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm text-muted-foreground">
                    <span>• Nombre / first_name</span>
                    <span>• Apellidos / last_name</span>
                    <span>• Email / correo</span>
                    <span>• Teléfono / phone</span>
                    <span>• Empresa / company</span>
                    <span>• Cargo / position</span>
                    <span>• Tipo inversor</span>
                    <span>• Rango inversión</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : (
            <>
              <ImportProgress 
                progress={(importProgress.current / importProgress.total) * 100 || 0}
                total={importProgress.total}
                current={importProgress.current}
                importing={isImporting}
              />
              
              <CampaignContactsImportPreview
                rows={parsedData.rows}
                headers={parsedData.headers}
                validationResults={validationResults}
                validCount={validCount}
                invalidCount={invalidCount}
                onImport={handleImport}
                onCancel={handleCancelImport}
                isImporting={isImporting}
                campaignType={campaignType}
              />
            </>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
