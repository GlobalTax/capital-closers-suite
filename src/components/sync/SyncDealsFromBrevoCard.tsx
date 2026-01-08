import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { useSyncDealsFromBrevo } from '@/hooks/useSyncDealsFromBrevo';
import { RefreshCw, CheckCircle2, AlertCircle, Building2, FileText } from 'lucide-react';

export function SyncDealsFromBrevoCard() {
  const { loading, result, error, syncDealsFromBrevo } = useSyncDealsFromBrevo();

  const handleSync = async () => {
    await syncDealsFromBrevo();
  };

  const totalProcessed = result 
    ? result.mandatosCreated + result.mandatosUpdated 
    : 0;

  const successRate = result && result.totalDeals > 0 
    ? Math.round((totalProcessed / result.totalDeals) * 100) 
    : 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Sincronizar Deals desde Brevo
        </CardTitle>
        <CardDescription>
          Importa todas las oportunidades (deals) de Brevo como mandatos, creando empresas automáticamente
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button
          onClick={handleSync}
          disabled={loading}
          className="w-full"
        >
          {loading ? (
            <>
              <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
              Sincronizando...
            </>
          ) : (
            <>
              <RefreshCw className="mr-2 h-4 w-4" />
              Importar Deals
            </>
          )}
        </Button>

        {loading && (
          <div className="space-y-2">
            <Progress value={undefined} className="w-full" />
            <p className="text-sm text-muted-foreground text-center">
              Obteniendo deals desde Brevo...
            </p>
          </div>
        )}

        {result && (
          <div className="space-y-4 pt-4 border-t">
            <div className="flex items-center gap-2 text-green-600">
              <CheckCircle2 className="h-5 w-5" />
              <span className="font-medium">Sincronización completada</span>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-muted/50 rounded-lg p-3">
                <p className="text-2xl font-medium">{result.totalDeals}</p>
                <p className="text-sm text-muted-foreground">Deals en Brevo</p>
              </div>
              <div className="bg-muted/50 rounded-lg p-3">
                <p className="text-2xl font-medium">{successRate}%</p>
                <p className="text-sm text-muted-foreground">Tasa de éxito</p>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-green-600" />
                  Mandatos creados
                </span>
                <span className="font-medium">{result.mandatosCreated}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2">
                  <RefreshCw className="h-4 w-4 text-blue-600" />
                  Mandatos actualizados
                </span>
                <span className="font-medium">{result.mandatosUpdated}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-purple-600" />
                  Empresas creadas
                </span>
                <span className="font-medium">{result.empresasCreated}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-orange-600" />
                  Empresas vinculadas
                </span>
                <span className="font-medium">{result.empresasLinked}</span>
              </div>
            </div>

            {result.errors.length > 0 && (
              <div className="space-y-2 pt-2 border-t">
                <p className="text-sm font-medium text-destructive flex items-center gap-2">
                  <AlertCircle className="h-4 w-4" />
                  Errores ({result.errors.length})
                </p>
                <div className="max-h-32 overflow-y-auto space-y-1">
                  {result.errors.slice(0, 5).map((err, idx) => (
                    <p key={idx} className="text-xs text-muted-foreground bg-destructive/10 p-2 rounded">
                      {err}
                    </p>
                  ))}
                  {result.errors.length > 5 && (
                    <p className="text-xs text-muted-foreground">
                      ... y {result.errors.length - 5} errores más
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {error && !result && (
          <div className="flex items-center gap-2 text-destructive pt-4 border-t">
            <AlertCircle className="h-5 w-5" />
            <span className="text-sm">{error}</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
