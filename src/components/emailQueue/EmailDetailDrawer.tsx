import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { RotateCcw, X, Clock, Send, AlertCircle, CheckCircle, Loader2, Code, FileText } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { useEmailById, useRetryEmail, useCancelEmail } from "@/hooks/useEmailQueue";

interface EmailDetailDrawerProps {
  emailId: string | null;
  open: boolean;
  onClose: () => void;
}

export function EmailDetailDrawer({ emailId, open, onClose }: EmailDetailDrawerProps) {
  const { data: email, isLoading } = useEmailById(emailId);
  const retryEmail = useRetryEmail();
  const cancelEmail = useCancelEmail();

  const handleRetry = () => {
    if (emailId) {
      retryEmail.mutate(emailId, {
        onSuccess: () => onClose(),
      });
    }
  };

  const handleCancel = () => {
    if (emailId) {
      cancelEmail.mutate(emailId, {
        onSuccess: () => onClose(),
      });
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "pending":
      case "queued":
        return <Clock className="h-4 w-4 text-amber-500" />;
      case "sending":
        return <Loader2 className="h-4 w-4 text-blue-500 animate-spin" />;
      case "sent":
        return <CheckCircle className="h-4 w-4 text-emerald-500" />;
      case "failed":
        return <AlertCircle className="h-4 w-4 text-destructive" />;
      default:
        return <Send className="h-4 w-4" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge className="bg-amber-500">Pendiente</Badge>;
      case "queued":
        return <Badge className="bg-indigo-500">En cola</Badge>;
      case "sending":
        return <Badge className="bg-blue-500">Enviando</Badge>;
      case "sent":
        return <Badge className="bg-emerald-500">Enviado</Badge>;
      case "failed":
        return <Badge variant="destructive">Fallido</Badge>;
      case "cancelled":
        return <Badge variant="secondary">Cancelado</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  return (
    <Sheet open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <SheetContent className="w-full sm:max-w-xl">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            {email && getStatusIcon(email.status)}
            Detalle del Email
          </SheetTitle>
          <SheetDescription>
            Información completa del envío
          </SheetDescription>
        </SheetHeader>

        {isLoading ? (
          <div className="space-y-4 mt-6">
            <Skeleton className="h-8 w-32" />
            <Skeleton className="h-20" />
            <Skeleton className="h-40" />
          </div>
        ) : !email ? (
          <div className="mt-6 text-center text-muted-foreground">
            Email no encontrado
          </div>
        ) : (
          <ScrollArea className="h-[calc(100vh-12rem)] mt-6">
            <div className="space-y-6 pr-4">
              {/* Status & Type */}
              <div className="flex items-center gap-2 flex-wrap">
                {getStatusBadge(email.status)}
                <Badge variant="outline">{email.queue_type}</Badge>
                <Badge variant="outline">Prioridad: {email.priority}</Badge>
              </div>

              <Separator />

              {/* Recipient Info */}
              <div className="space-y-2">
                <h4 className="text-sm font-medium text-muted-foreground">Destinatario</h4>
                <div className="p-3 rounded-lg bg-muted/50">
                  <p className="font-medium">{email.to_email}</p>
                  {email.to_name && (
                    <p className="text-sm text-muted-foreground">{email.to_name}</p>
                  )}
                </div>
              </div>

              {/* Subject */}
              <div className="space-y-2">
                <h4 className="text-sm font-medium text-muted-foreground">Asunto</h4>
                <p className="text-sm">{email.subject}</p>
              </div>

              {/* Timestamps */}
              <div className="space-y-2">
                <h4 className="text-sm font-medium text-muted-foreground">Tiempos</h4>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="p-2 rounded bg-muted/50">
                    <p className="text-xs text-muted-foreground">Creado</p>
                    <p>{format(new Date(email.created_at), "PPpp", { locale: es })}</p>
                  </div>
                  {email.first_attempt_at && (
                    <div className="p-2 rounded bg-muted/50">
                      <p className="text-xs text-muted-foreground">Primer intento</p>
                      <p>{format(new Date(email.first_attempt_at), "PPpp", { locale: es })}</p>
                    </div>
                  )}
                  {email.last_attempt_at && (
                    <div className="p-2 rounded bg-muted/50">
                      <p className="text-xs text-muted-foreground">Último intento</p>
                      <p>{format(new Date(email.last_attempt_at), "PPpp", { locale: es })}</p>
                    </div>
                  )}
                  {email.sent_at && (
                    <div className="p-2 rounded bg-emerald-50">
                      <p className="text-xs text-emerald-600">Enviado</p>
                      <p className="text-emerald-700">{format(new Date(email.sent_at), "PPpp", { locale: es })}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Attempts */}
              <div className="space-y-2">
                <h4 className="text-sm font-medium text-muted-foreground">Intentos</h4>
                <div className="flex items-center gap-4">
                  <Badge variant={email.attempts >= email.max_attempts ? "destructive" : "outline"}>
                    {email.attempts} / {email.max_attempts}
                  </Badge>
                  {email.next_retry_at && new Date(email.next_retry_at) > new Date() && (
                    <span className="text-xs text-amber-600">
                      Próximo reintento: {format(new Date(email.next_retry_at), "PPpp", { locale: es })}
                    </span>
                  )}
                </div>
              </div>

              {/* Error Info */}
              {email.last_error && (
                <div className="space-y-2">
                  <h4 className="text-sm font-medium text-destructive">Error</h4>
                  <Alert variant="destructive">
                    <AlertDescription className="font-mono text-xs">
                      {email.last_error}
                    </AlertDescription>
                  </Alert>
                </div>
              )}

              {/* Content Tabs */}
              <div className="space-y-2">
                <h4 className="text-sm font-medium text-muted-foreground">Contenido</h4>
                <Tabs defaultValue="html">
                  <TabsList className="w-full">
                    <TabsTrigger value="html" className="flex-1 gap-1">
                      <Code className="h-3 w-3" />
                      HTML
                    </TabsTrigger>
                    <TabsTrigger value="text" className="flex-1 gap-1">
                      <FileText className="h-3 w-3" />
                      Texto
                    </TabsTrigger>
                    <TabsTrigger value="response" className="flex-1 gap-1">
                      <Send className="h-3 w-3" />
                      Respuesta
                    </TabsTrigger>
                  </TabsList>
                  <TabsContent value="html">
                    <div className="mt-2 p-3 rounded-lg bg-muted/50 overflow-auto max-h-60">
                      <pre className="text-xs whitespace-pre-wrap break-all">
                        {email.html_content?.slice(0, 2000)}
                        {(email.html_content?.length || 0) > 2000 && "..."}
                      </pre>
                    </div>
                  </TabsContent>
                  <TabsContent value="text">
                    <div className="mt-2 p-3 rounded-lg bg-muted/50 overflow-auto max-h-60">
                      <pre className="text-xs whitespace-pre-wrap">
                        {email.text_content || "(Sin contenido de texto)"}
                      </pre>
                    </div>
                  </TabsContent>
                  <TabsContent value="response">
                    <div className="mt-2 p-3 rounded-lg bg-muted/50 overflow-auto max-h-60">
                      <pre className="text-xs whitespace-pre-wrap">
                        {email.provider_response 
                          ? JSON.stringify(email.provider_response, null, 2)
                          : "(Sin respuesta del proveedor)"}
                      </pre>
                    </div>
                  </TabsContent>
                </Tabs>
              </div>

              {/* Provider Info */}
              {email.provider_message_id && (
                <div className="space-y-2">
                  <h4 className="text-sm font-medium text-muted-foreground">Proveedor</h4>
                  <div className="p-3 rounded-lg bg-muted/50 text-xs">
                    <p><strong>Provider:</strong> {email.provider}</p>
                    <p><strong>Message ID:</strong> {email.provider_message_id}</p>
                    {email.provider_status && (
                      <p><strong>Status:</strong> {email.provider_status}</p>
                    )}
                  </div>
                </div>
              )}

              <Separator />

              {/* Actions */}
              <div className="flex gap-2 pb-4">
                {email.status === "failed" && email.attempts < email.max_attempts && (
                  <Button onClick={handleRetry} disabled={retryEmail.isPending}>
                    {retryEmail.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : (
                      <RotateCcw className="h-4 w-4 mr-2" />
                    )}
                    Reintentar
                  </Button>
                )}
                {["pending", "queued"].includes(email.status) && (
                  <Button variant="destructive" onClick={handleCancel} disabled={cancelEmail.isPending}>
                    {cancelEmail.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : (
                      <X className="h-4 w-4 mr-2" />
                    )}
                    Cancelar
                  </Button>
                )}
                <Button variant="outline" onClick={onClose}>
                  Cerrar
                </Button>
              </div>
            </div>
          </ScrollArea>
        )}
      </SheetContent>
    </Sheet>
  );
}
