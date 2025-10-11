import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Upload, CheckCircle2, XCircle, AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ScrollArea } from "@/components/ui/scroll-area";

interface ImportResult {
  nombre: string;
  status: 'success' | 'error' | 'skipped';
  message: string;
  brevoId?: string;
}

const ImportarMandatos = () => {
  const [importing, setImporting] = useState(false);
  const [results, setResults] = useState<ImportResult[]>([]);
  const { toast } = useToast();

  const parseCSVLine = (line: string): string[] => {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        result.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    result.push(current.trim());
    return result;
  };

  const extractEmpresaFromNombre = (nombre: string): { idCorto?: string; empresa: string } => {
    // Formatos: "65 - Fryel - Proceso de Venta" o "DORGRAF"
    const match = nombre.match(/^(\d+)\s*-\s*(.+?)\s*-\s*Proceso de Venta$/);
    if (match) {
      return {
        idCorto: match[1],
        empresa: match[2].trim()
      };
    }
    return { empresa: nombre.trim() };
  };

  const importarMandatos = async () => {
    setImporting(true);
    setResults([]);
    const importResults: ImportResult[] = [];

    try {
      // Leer el CSV
      const response = await fetch('/imports/brevo_deals.csv');
      const csvText = await response.text();
      const lines = csvText.split('\n').filter(line => line.trim());
      
      // Saltar el header
      const dataLines = lines.slice(1);

      for (const line of dataLines) {
        const [brevoId, nombre, creadoEl, fase, , , , propietario] = parseCSVLine(line);
        
        if (!nombre || !brevoId) {
          importResults.push({
            nombre: nombre || 'Sin nombre',
            status: 'skipped',
            message: 'Datos incompletos'
          });
          continue;
        }

        const { idCorto, empresa } = extractEmpresaFromNombre(nombre);

        try {
          // 1. Buscar o crear la empresa
          let empresaId: string;
          
          const { data: existingEmpresa } = await supabase
            .from('empresas')
            .select('id')
            .ilike('nombre', empresa)
            .maybeSingle();

          if (existingEmpresa) {
            empresaId = existingEmpresa.id;
          } else {
            // Crear empresa nueva
            const { data: newEmpresa, error: empresaError } = await supabase
              .from('empresas')
              .insert({
                nombre: empresa,
                sector: 'Industria', // Valor por defecto
                notas: `Importado desde Brevo - Deal ID: ${brevoId}`
              })
              .select('id')
              .single();

            if (empresaError || !newEmpresa) {
              throw new Error(`Error creando empresa: ${empresaError?.message}`);
            }
            empresaId = newEmpresa.id;
          }

          // 2. Verificar si ya existe un mandato con este brevo_id
          const { data: existingMandato } = await supabase
            .from('brevo_sync_log')
            .select('entity_id')
            .eq('brevo_id', brevoId)
            .eq('entity_type', 'deal')
            .maybeSingle();

          if (existingMandato) {
            importResults.push({
              nombre,
              status: 'skipped',
              message: 'Ya existe en la base de datos',
              brevoId
            });
            continue;
          }

          // 3. Crear el mandato
          const { data: mandato, error: mandatoError } = await supabase
            .from('mandatos')
            .insert({
              tipo: 'venta',
              estado: 'prospecto', // Todos empiezan en prospecto
              empresa_id: empresaId,
              titulo: nombre,
              descripcion: `Importado desde Brevo\nDeal ID: ${brevoId}\nFase: ${fase}`,
              fecha_inicio: creadoEl ? new Date(creadoEl.split('-').reverse().join('-')).toISOString() : new Date().toISOString(),
              id_corto: idCorto ? parseInt(idCorto) : undefined
            })
            .select('id')
            .single();

          if (mandatoError || !mandato) {
            throw new Error(`Error creando mandato: ${mandatoError?.message}`);
          }

          // 4. Registrar en brevo_sync_log para evitar duplicados
          await supabase
            .from('brevo_sync_log')
            .insert({
              entity_id: mandato.id,
              entity_type: 'deal',
              brevo_id: brevoId,
              sync_status: 'synced',
              last_sync_at: new Date().toISOString()
            });

          importResults.push({
            nombre,
            status: 'success',
            message: `Mandato creado exitosamente${idCorto ? ` (ID: ${idCorto})` : ''}`,
            brevoId
          });

        } catch (error: any) {
          importResults.push({
            nombre,
            status: 'error',
            message: error.message || 'Error desconocido',
            brevoId
          });
        }

        // Actualizar resultados en tiempo real
        setResults([...importResults]);
      }

      const successCount = importResults.filter(r => r.status === 'success').length;
      const errorCount = importResults.filter(r => r.status === 'error').length;
      const skippedCount = importResults.filter(r => r.status === 'skipped').length;

      toast({
        title: "Importación completada",
        description: `✅ ${successCount} creados | ⚠️ ${skippedCount} omitidos | ❌ ${errorCount} errores`,
      });

    } catch (error: any) {
      toast({
        title: "Error en la importación",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="container mx-auto py-8">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-6 w-6" />
            Importar Mandatos desde Brevo
          </CardTitle>
          <CardDescription>
            Importar 36 mandatos de venta desde el archivo CSV de Brevo
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Este proceso creará los mandatos en tu base de datos y los vinculará con las empresas correspondientes.
              Las empresas que no existan serán creadas automáticamente.
            </AlertDescription>
          </Alert>

          <Button 
            onClick={importarMandatos} 
            disabled={importing}
            className="w-full"
          >
            {importing ? "Importando..." : "Iniciar Importación"}
          </Button>

          {results.length > 0 && (
            <div className="space-y-2">
              <h3 className="font-semibold text-sm">
                Resultados ({results.length} procesados)
              </h3>
              <ScrollArea className="h-[400px] rounded-md border p-4">
                <div className="space-y-2">
                  {results.map((result, idx) => (
                    <div 
                      key={idx}
                      className="flex items-start gap-2 text-sm p-2 rounded-md bg-muted/50"
                    >
                      {result.status === 'success' && (
                        <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                      )}
                      {result.status === 'error' && (
                        <XCircle className="h-4 w-4 text-destructive mt-0.5 flex-shrink-0" />
                      )}
                      {result.status === 'skipped' && (
                        <AlertCircle className="h-4 w-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                      )}
                      <div className="flex-1">
                        <div className="font-medium">{result.nombre}</div>
                        <div className="text-xs text-muted-foreground">{result.message}</div>
                        {result.brevoId && (
                          <div className="text-xs text-muted-foreground">Brevo ID: {result.brevoId}</div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ImportarMandatos;
