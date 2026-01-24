import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Trash2,
  Ban,
  RotateCcw,
  AlertTriangle,
  Loader2,
  Users,
  Building2,
  FileText,
} from "lucide-react";
import {
  useErrorStats,
  useBulkIgnoreByError,
  useBulkRetryByType,
  useCleanOldCompleted,
} from "@/hooks/useBrevoQueue";
import { parseBrevoError } from "@/lib/brevo-error-suggestions";

export function BrevoSettingsTab() {
  const { data: errorStats, isLoading: loadingErrors } = useErrorStats();
  const bulkIgnore = useBulkIgnoreByError();
  const bulkRetry = useBulkRetryByType();
  const cleanOld = useCleanOldCompleted();

  const [selectedRetryType, setSelectedRetryType] = useState<'contact' | 'company' | 'deal'>('contact');

  const getEntityIcon = (entityType: string) => {
    switch (entityType) {
      case 'contact':
        return <Users className="h-3 w-3" />;
      case 'company':
        return <Building2 className="h-3 w-3" />;
      case 'deal':
        return <FileText className="h-3 w-3" />;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Bulk Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">Acciones en Lote</CardTitle>
          <CardDescription>
            Gestiona múltiples items de la cola a la vez
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Clean old completed */}
          <div className="flex items-center justify-between p-3 rounded-lg border">
            <div>
              <div className="font-medium text-sm">Limpiar completados antiguos</div>
              <div className="text-xs text-muted-foreground">
                Elimina items completados hace más de 7 días
              </div>
            </div>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2">
                  <Trash2 className="h-4 w-4" />
                  Limpiar
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>¿Limpiar items completados?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Se eliminarán todos los items completados hace más de 7 días.
                    Esta acción no se puede deshacer.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => cleanOld.mutate(7)}
                              disabled={cleanOld.isPending}
                            >
                    {cleanOld.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                    Confirmar
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>

          {/* Retry by type */}
          <div className="flex items-center justify-between p-3 rounded-lg border">
            <div>
              <div className="font-medium text-sm">Reintentar fallidos por tipo</div>
              <div className="text-xs text-muted-foreground">
                Marca todos los items fallidos de un tipo para reintento
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Select
                value={selectedRetryType}
                onValueChange={(v) => setSelectedRetryType(v as typeof selectedRetryType)}
              >
                <SelectTrigger className="w-[130px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="contact">Contactos</SelectItem>
                  <SelectItem value="company">Empresas</SelectItem>
                  <SelectItem value="deal">Deals</SelectItem>
                </SelectContent>
              </Select>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="outline" size="sm" className="gap-2">
                    <RotateCcw className="h-4 w-4" />
                    Reintentar
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>¿Reintentar todos los fallidos?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Se marcarán para reintento todos los items fallidos de tipo{' '}
                      <strong>
                        {selectedRetryType === 'contact' ? 'Contactos' :
                         selectedRetryType === 'company' ? 'Empresas' : 'Deals'}
                      </strong>.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={() => bulkRetry.mutate(selectedRetryType)}
                      disabled={bulkRetry.isPending}
                    >
                      {bulkRetry.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                      Confirmar
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Error Analysis */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-amber-500" />
            Análisis de Errores
          </CardTitle>
          <CardDescription>
            Errores más frecuentes en la cola de sincronización
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loadingErrors ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : errorStats && errorStats.length > 0 ? (
            <div className="space-y-3">
              {errorStats.slice(0, 5).map((error, index) => {
                const parsed = parseBrevoError(error.message);
                return (
                  <div key={index} className="p-3 rounded-lg border space-y-2">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-sm">{parsed.title}</div>
                        <div className="text-xs text-muted-foreground truncate mt-1">
                          {error.message.slice(0, 80)}...
                        </div>
                      </div>
                      <Badge variant="destructive" className="shrink-0">
                        {error.count.toLocaleString()} items
                      </Badge>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1">
                        {error.entityTypes.map((type) => (
                          <Badge key={type} variant="secondary" className="text-xs gap-1">
                            {getEntityIcon(type)}
                            {type === 'contact' ? 'Contacto' :
                             type === 'company' ? 'Empresa' : 'Deal'}
                          </Badge>
                        ))}
                      </div>
                      
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="sm" className="text-muted-foreground gap-1">
                            <Ban className="h-3 w-3" />
                            Ignorar todos
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>¿Ignorar {error.count} items?</AlertDialogTitle>
                            <AlertDialogDescription>
                              Se marcarán como ignorados todos los items con este error.
                              No se intentarán sincronizar de nuevo.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => bulkIgnore.mutate(error.message)}
                              disabled={bulkIgnore.isPending}
                            >
                              {bulkIgnore.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                              Ignorar todos
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>

                    {parsed.isKnown && (
                      <div className="text-xs text-muted-foreground bg-muted/50 p-2 rounded">
                        💡 {parsed.suggestion}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              No hay errores en la cola
            </div>
          )}
        </CardContent>
      </Card>

      {/* Sync Info */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">Información de Sincronización</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground space-y-2">
          <p>• La cola se procesa automáticamente cada 5 minutos</p>
          <p>• Cada ejecución procesa hasta 50 items</p>
          <p>• Los items fallidos se reintentan hasta 3 veces</p>
          <p>• Los items ignorados no se procesan nunca más</p>
        </CardContent>
      </Card>
    </div>
  );
}
