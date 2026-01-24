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
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  Users,
  Building2,
  FileText,
  RotateCcw,
  Ban,
  ExternalLink,
  Lightbulb,
  AlertTriangle,
  Clock,
  CheckCircle,
  XCircle,
  Loader2,
} from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { parseBrevoError, getSeverityColor, getSeverityBgColor } from "@/lib/brevo-error-suggestions";
import type { QueueItemWithEntity } from "@/hooks/useBrevoQueue";
import { Link } from "react-router-dom";

interface QueueItemDetailDrawerProps {
  item: QueueItemWithEntity | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onRetry: (itemId: string) => void;
  onIgnore: (itemId: string) => void;
  isRetrying: boolean;
  isIgnoring: boolean;
}

export function QueueItemDetailDrawer({
  item,
  open,
  onOpenChange,
  onRetry,
  onIgnore,
  isRetrying,
  isIgnoring,
}: QueueItemDetailDrawerProps) {
  if (!item) return null;

  const parsedError = parseBrevoError(item.error_message);

  const getEntityIcon = () => {
    switch (item.entity_type) {
      case 'contact':
        return <Users className="h-5 w-5 text-blue-500" />;
      case 'company':
        return <Building2 className="h-5 w-5 text-green-500" />;
      case 'deal':
        return <FileText className="h-5 w-5 text-purple-500" />;
      default:
        return null;
    }
  };

  const getEntityLabel = () => {
    switch (item.entity_type) {
      case 'contact':
        return 'Contacto';
      case 'company':
        return 'Empresa';
      case 'deal':
        return 'Deal/Mandato';
      default:
        return item.entity_type;
    }
  };

  const getEntityLink = () => {
    switch (item.entity_type) {
      case 'contact':
        return `/contactos/${item.entity_id}`;
      case 'company':
        return `/empresas/${item.entity_id}`;
      case 'deal':
        return `/mandatos/${item.entity_id}`;
      default:
        return null;
    }
  };

  const getStatusIcon = () => {
    switch (item.status) {
      case 'pending':
        return <Clock className="h-4 w-4 text-amber-500" />;
      case 'processing':
        return <Loader2 className="h-4 w-4 text-blue-500 animate-spin" />;
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return null;
    }
  };

  const entityLink = getEntityLink();

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="max-h-[90vh]">
        <DrawerHeader className="border-b">
          <div className="flex items-center gap-3">
            {getEntityIcon()}
            <div>
              <DrawerTitle className="flex items-center gap-2">
                Detalle del Item de Cola
              </DrawerTitle>
              <DrawerDescription>
                {getEntityLabel()} - {item.entityName || item.entity_id.slice(0, 8)}
              </DrawerDescription>
            </div>
          </div>
        </DrawerHeader>

        <ScrollArea className="flex-1 p-6">
          <div className="space-y-6">
            {/* Status Overview */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-3 rounded-lg bg-muted/50">
                <div className="text-sm text-muted-foreground">Estado</div>
                <div className="flex items-center justify-center gap-2 mt-1 font-medium">
                  {getStatusIcon()}
                  <span className="capitalize">{item.status}</span>
                </div>
              </div>
              <div className="text-center p-3 rounded-lg bg-muted/50">
                <div className="text-sm text-muted-foreground">Intentos</div>
                <div className={`font-medium mt-1 ${item.attempts >= item.max_attempts ? 'text-red-500' : ''}`}>
                  {item.attempts} / {item.max_attempts}
                </div>
              </div>
              <div className="text-center p-3 rounded-lg bg-muted/50">
                <div className="text-sm text-muted-foreground">Acción</div>
                <div className="font-medium mt-1">
                  <Badge variant="secondary">{item.action}</Badge>
                </div>
              </div>
              <div className="text-center p-3 rounded-lg bg-muted/50">
                <div className="text-sm text-muted-foreground">Tipo</div>
                <div className="font-medium mt-1 capitalize">{getEntityLabel()}</div>
              </div>
            </div>

            {/* Entity Link */}
            {entityLink && (
              <Card>
                <CardContent className="py-3">
                  <Link
                    to={entityLink}
                    className="flex items-center gap-2 text-primary hover:underline"
                  >
                    <ExternalLink className="h-4 w-4" />
                    Ver {getEntityLabel().toLowerCase()} en el CRM
                  </Link>
                </CardContent>
              </Card>
            )}

            {/* Error Section */}
            {item.error_message && (
              <Card className="border-red-200 dark:border-red-900">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2 text-red-600">
                    <AlertTriangle className="h-4 w-4" />
                    Error: {parsedError.title}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
                    <code className="text-sm text-red-700 dark:text-red-400 break-all">
                      {item.error_message}
                    </code>
                  </div>

                  <div className={`p-3 rounded-lg flex items-start gap-3 ${getSeverityBgColor(parsedError.severity)}`}>
                    <Lightbulb className={`h-5 w-5 mt-0.5 ${getSeverityColor(parsedError.severity)}`} />
                    <div>
                      <div className="font-medium text-sm">Sugerencia</div>
                      <p className="text-sm text-muted-foreground mt-1">
                        {parsedError.suggestion}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Payload Section */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Payload enviado a Brevo</CardTitle>
              </CardHeader>
              <CardContent>
                <pre className="p-3 bg-muted rounded-lg overflow-x-auto text-xs">
                  {JSON.stringify(item.payload, null, 2)}
                </pre>
              </CardContent>
            </Card>

            {/* Timeline */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Timeline</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center gap-3 text-sm">
                    <div className="w-2 h-2 rounded-full bg-blue-500" />
                    <span className="text-muted-foreground">Creado:</span>
                    <span>
                      {format(new Date(item.created_at), "dd MMM yyyy HH:mm", { locale: es })}
                    </span>
                  </div>

                  {item.processed_at && (
                    <div className={`flex items-center gap-3 text-sm`}>
                      <div className={`w-2 h-2 rounded-full ${item.status === 'completed' ? 'bg-green-500' : 'bg-red-500'}`} />
                      <span className="text-muted-foreground">Procesado:</span>
                      <span>
                        {format(new Date(item.processed_at), "dd MMM yyyy HH:mm", { locale: es })}
                      </span>
                    </div>
                  )}

                  {item.attempts > 0 && item.status === 'failed' && (
                    <div className="flex items-center gap-3 text-sm text-red-500">
                      <div className="w-2 h-2 rounded-full bg-red-500" />
                      <span>Fallido después de {item.attempts} intento{item.attempts > 1 ? 's' : ''}</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* IDs */}
            <div className="text-xs text-muted-foreground space-y-1">
              <div><strong>Queue ID:</strong> {item.id}</div>
              <div><strong>Entity ID:</strong> {item.entity_id}</div>
            </div>
          </div>
        </ScrollArea>

        <Separator />

        <DrawerFooter className="flex-row gap-2">
          <DrawerClose asChild>
            <Button variant="outline" className="flex-1">
              Cerrar
            </Button>
          </DrawerClose>

          {item.status === 'failed' && (
            <>
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => onIgnore(item.id)}
                disabled={isIgnoring}
              >
                {isIgnoring ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Ban className="h-4 w-4 mr-2" />
                )}
                Ignorar
              </Button>
              <Button
                className="flex-1"
                onClick={() => onRetry(item.id)}
                disabled={isRetrying}
              >
                {isRetrying ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <RotateCcw className="h-4 w-4 mr-2" />
                )}
                Reintentar
              </Button>
            </>
          )}
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}
