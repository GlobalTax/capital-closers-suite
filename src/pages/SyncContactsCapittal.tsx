import { SyncCapittalContactsCard } from '@/components/sync/SyncCapittalContactsCard';
import { PageHeader } from '@/components/shared/PageHeader';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Info, 
  ArrowRight, 
  Database, 
  Clock, 
  Shield, 
  AlertTriangle,
  ExternalLink
} from 'lucide-react';
import { useSyncContactsFromCapittal } from '@/hooks/useSyncContactsFromCapittal';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';

export default function SyncContactsCapittal() {
  const { history } = useSyncContactsFromCapittal();

  // Encontrar errores recientes
  const recentErrors = history
    .filter(log => log.errors && log.errors.length > 0)
    .slice(0, 3);

  return (
    <div className="container mx-auto py-6 space-y-6">
      <PageHeader
        title="Sincronización Capittal"
        description="Gestiona la importación automática de contactos desde Capittal hacia GoDeal"
      />

      {/* Info Banner */}
      <Alert>
        <Info className="h-4 w-4" />
        <AlertTitle>Sincronización unidireccional</AlertTitle>
        <AlertDescription>
          Los contactos fluyen exclusivamente desde Capittal hacia GoDeal. Los cambios realizados
          en GoDeal no se reflejan en Capittal.
        </AlertDescription>
      </Alert>

      {/* Main Card */}
      <SyncCapittalContactsCard />

      {/* Architecture Diagram */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Arquitectura del sistema
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center gap-4 p-6 bg-muted/30 rounded-lg">
            <div className="flex flex-col items-center gap-2">
              <div className="w-24 h-16 bg-primary/10 border-2 border-primary rounded-lg flex items-center justify-center">
                <span className="font-medium text-primary">Capittal</span>
              </div>
              <span className="text-xs text-muted-foreground">Fuente</span>
            </div>
            
            <div className="flex flex-col items-center gap-1">
              <ArrowRight className="h-8 w-8 text-muted-foreground" />
              <Badge variant="outline" className="gap-1">
                <Clock className="h-3 w-3" />
                Polling / Webhook
              </Badge>
            </div>
            
            <div className="flex flex-col items-center gap-2">
              <div className="w-24 h-16 bg-green-500/10 border-2 border-green-500 rounded-lg flex items-center justify-center">
                <span className="font-medium text-green-600">GoDeal</span>
              </div>
              <span className="text-xs text-muted-foreground">Destino</span>
            </div>
          </div>

          <div className="mt-6 grid md:grid-cols-3 gap-4">
            <div className="p-4 border rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Shield className="h-4 w-4 text-blue-500" />
                <span className="font-medium">Deduplicación</span>
              </div>
              <p className="text-sm text-muted-foreground">
                Por ID externo, email normalizado, o combinación teléfono + nombre
              </p>
            </div>
            <div className="p-4 border rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Clock className="h-4 w-4 text-orange-500" />
                <span className="font-medium">Incremental</span>
              </div>
              <p className="text-sm text-muted-foreground">
                Solo procesa contactos modificados desde el último sync
              </p>
            </div>
            <div className="p-4 border rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Database className="h-4 w-4 text-green-500" />
                <span className="font-medium">Idempotente</span>
              </div>
              <p className="text-sm text-muted-foreground">
                Ejecutar múltiples veces no crea duplicados
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recent Errors */}
      {recentErrors.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              Errores recientes
            </CardTitle>
            <CardDescription>
              Contactos que no pudieron sincronizarse correctamente
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Accordion type="single" collapsible>
              {recentErrors.map((log, idx) => (
                <AccordionItem key={log.id} value={log.id}>
                  <AccordionTrigger>
                    <div className="flex items-center gap-3">
                      <Badge variant="destructive">{log.errors.length} errores</Badge>
                      <span className="text-sm text-muted-foreground">
                        {format(new Date(log.started_at), "dd MMM yyyy HH:mm", { locale: es })}
                      </span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-2">
                      {log.errors.map((error, i) => (
                        <div key={i} className="p-2 bg-destructive/5 rounded text-sm">
                          <span className="font-mono text-xs">{error.capittalId}</span>
                          <p className="text-muted-foreground">{error.error}</p>
                        </div>
                      ))}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </CardContent>
        </Card>
      )}

      {/* Field Mapping */}
      <Card>
        <CardHeader>
          <CardTitle>Mapeo de campos</CardTitle>
          <CardDescription>
            Correspondencia entre campos de Capittal y GoDeal
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 px-4 font-medium">Campo Capittal</th>
                  <th className="text-left py-2 px-4 font-medium">Campo GoDeal</th>
                  <th className="text-left py-2 px-4 font-medium">Notas</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                <tr>
                  <td className="py-2 px-4 font-mono text-xs">id</td>
                  <td className="py-2 px-4 font-mono text-xs">external_capittal_id</td>
                  <td className="py-2 px-4 text-muted-foreground">Clave de deduplicación primaria</td>
                </tr>
                <tr>
                  <td className="py-2 px-4 font-mono text-xs">nombre</td>
                  <td className="py-2 px-4 font-mono text-xs">nombre</td>
                  <td className="py-2 px-4 text-muted-foreground">Requerido</td>
                </tr>
                <tr>
                  <td className="py-2 px-4 font-mono text-xs">apellidos</td>
                  <td className="py-2 px-4 font-mono text-xs">apellidos</td>
                  <td className="py-2 px-4 text-muted-foreground">-</td>
                </tr>
                <tr>
                  <td className="py-2 px-4 font-mono text-xs">email</td>
                  <td className="py-2 px-4 font-mono text-xs">email</td>
                  <td className="py-2 px-4 text-muted-foreground">Normalizado (lowercase, trim)</td>
                </tr>
                <tr>
                  <td className="py-2 px-4 font-mono text-xs">telefono</td>
                  <td className="py-2 px-4 font-mono text-xs">telefono</td>
                  <td className="py-2 px-4 text-muted-foreground">Solo dígitos</td>
                </tr>
                <tr>
                  <td className="py-2 px-4 font-mono text-xs">cargo</td>
                  <td className="py-2 px-4 font-mono text-xs">cargo</td>
                  <td className="py-2 px-4 text-muted-foreground">-</td>
                </tr>
                <tr>
                  <td className="py-2 px-4 font-mono text-xs">linkedin</td>
                  <td className="py-2 px-4 font-mono text-xs">linkedin</td>
                  <td className="py-2 px-4 text-muted-foreground">-</td>
                </tr>
                <tr>
                  <td className="py-2 px-4 font-mono text-xs">notas</td>
                  <td className="py-2 px-4 font-mono text-xs">notas</td>
                  <td className="py-2 px-4 text-muted-foreground">-</td>
                </tr>
                <tr>
                  <td className="py-2 px-4 font-mono text-xs">-</td>
                  <td className="py-2 px-4 font-mono text-xs">source</td>
                  <td className="py-2 px-4 text-muted-foreground">Siempre "capittal"</td>
                </tr>
                <tr>
                  <td className="py-2 px-4 font-mono text-xs">updated_at</td>
                  <td className="py-2 px-4 font-mono text-xs">capittal_synced_at</td>
                  <td className="py-2 px-4 text-muted-foreground">Timestamp del sync</td>
                </tr>
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
