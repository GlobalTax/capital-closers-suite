import { RefreshCw, Users, Building2, CheckCircle, AlertCircle, ArrowDownToLine } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { useSyncFromBrevo } from '@/hooks/useSyncFromBrevo';

export function SyncFromBrevoCard() {
  const { loading, result, error, syncFromBrevo } = useSyncFromBrevo();

  const handleSync = async () => {
    try {
      await syncFromBrevo();
    } catch {
      // Error already handled in hook
    }
  };

  const totalProcessed = result 
    ? result.contactos_created + result.contactos_updated + result.contactos_skipped 
    : 0;
  
  const successRate = result && result.total_brevo_contacts > 0
    ? Math.round(((result.contactos_created + result.contactos_updated) / result.total_brevo_contacts) * 100)
    : 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ArrowDownToLine className="h-5 w-5 text-primary" />
          Sincronizar desde Brevo
        </CardTitle>
        <CardDescription>
          Importa contactos y empresas desde tu cuenta de Brevo al CRM
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
              Iniciar Sincronización
            </>
          )}
        </Button>

        {loading && (
          <div className="space-y-2">
            <Progress value={undefined} className="h-2" />
            <p className="text-sm text-muted-foreground text-center">
              Obteniendo contactos de Brevo...
            </p>
          </div>
        )}

        {result && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400">
              <CheckCircle className="h-4 w-4" />
              Sincronización completada
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-muted/50 rounded-lg p-3 text-center">
                <div className="flex items-center justify-center gap-1 text-muted-foreground mb-1">
                  <Users className="h-4 w-4" />
                  <span className="text-xs">Contactos</span>
                </div>
                <div className="text-2xl font-medium text-foreground">
                  {result.total_brevo_contacts}
                </div>
                <div className="text-xs text-muted-foreground">en Brevo</div>
              </div>

              <div className="bg-muted/50 rounded-lg p-3 text-center">
                <div className="flex items-center justify-center gap-1 text-muted-foreground mb-1">
                  <Building2 className="h-4 w-4" />
                  <span className="text-xs">Empresas</span>
                </div>
                <div className="text-2xl font-medium text-foreground">
                  {result.empresas_created}
                </div>
                <div className="text-xs text-muted-foreground">nuevas</div>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Tasa de éxito</span>
                <span className="font-medium">{successRate}%</span>
              </div>
              <Progress value={successRate} className="h-2" />
            </div>

            <div className="grid grid-cols-3 gap-2 text-center text-xs">
              <div className="bg-green-500/10 text-green-600 dark:text-green-400 rounded p-2">
                <div className="font-medium text-lg">{result.contactos_created}</div>
                <div>Creados</div>
              </div>
              <div className="bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded p-2">
                <div className="font-medium text-lg">{result.contactos_updated}</div>
                <div>Actualizados</div>
              </div>
              <div className="bg-muted rounded p-2">
                <div className="font-medium text-lg">{result.contactos_skipped}</div>
                <div>Omitidos</div>
              </div>
            </div>

            {result.errors.length > 0 && (
              <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-3">
                <div className="flex items-center gap-2 text-destructive text-sm font-medium mb-2">
                  <AlertCircle className="h-4 w-4" />
                  {result.errors.length} errores
                </div>
                <ul className="text-xs text-muted-foreground space-y-1 max-h-24 overflow-auto">
                  {result.errors.slice(0, 5).map((err, i) => (
                    <li key={i}>• {err}</li>
                  ))}
                  {result.errors.length > 5 && (
                    <li>... y {result.errors.length - 5} más</li>
                  )}
                </ul>
              </div>
            )}
          </div>
        )}

        {error && !result && (
          <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-3">
            <div className="flex items-center gap-2 text-destructive text-sm">
              <AlertCircle className="h-4 w-4" />
              {error}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
