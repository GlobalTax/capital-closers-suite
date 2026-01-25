import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { RotateCcw, Trash2, Eye, AlertTriangle, Clock, XCircle, Loader2, RefreshCw } from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import { useEmailQueue, useRetryEmail, useCancelEmail, useClearOldEmails, type QueueFilters } from "@/hooks/useEmailQueue";
import { EmailDetailDrawer } from "./EmailDetailDrawer";
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";

const PAGE_SIZE = 20;

export function FailedEmailsTab() {
  const [page, setPage] = useState(0);
  const [selectedEmailId, setSelectedEmailId] = useState<string | null>(null);

  const filters: QueueFilters = { status: "failed" };
  const { data, isLoading, refetch } = useEmailQueue(filters, page, PAGE_SIZE);
  
  const retryEmail = useRetryEmail();
  const cancelEmail = useCancelEmail();
  const clearOld = useClearOldEmails();

  const handleRetry = (emailId: string) => {
    retryEmail.mutate(emailId);
  };

  const handleDiscard = (emailId: string) => {
    // Cancel marks it as cancelled so it won't be retried
    cancelEmail.mutate(emailId);
  };

  const handleClearOld = () => {
    clearOld.mutate(30);
  };

  const totalPages = Math.ceil((data?.count || 0) / PAGE_SIZE);

  const getErrorIcon = (attempts: number, maxAttempts: number) => {
    if (attempts >= maxAttempts) {
      return <XCircle className="h-5 w-5 text-destructive" />;
    }
    return <AlertTriangle className="h-5 w-5 text-amber-500" />;
  };

  return (
    <div className="space-y-4">
      {/* Header Actions */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">
            {data?.count || 0} emails fallidos
          </span>
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleClearOld}
            disabled={clearOld.isPending}
          >
            {clearOld.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <Trash2 className="h-4 w-4 mr-2" />
            )}
            Limpiar &gt;30 días
          </Button>
        </div>
      </div>

      {/* Failed Emails List */}
      {isLoading ? (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="py-4">
                <div className="h-20 bg-muted rounded" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : data?.data.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <div className="flex flex-col items-center gap-2">
              <div className="h-12 w-12 rounded-full bg-emerald-100 flex items-center justify-center">
                <XCircle className="h-6 w-6 text-emerald-600" />
              </div>
              <p className="text-muted-foreground">No hay emails fallidos</p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <ScrollArea className="h-[600px]">
          <div className="space-y-4 pr-4">
            {data?.data.map((email) => {
              const canRetry = email.attempts < email.max_attempts;
              const hasScheduledRetry = email.next_retry_at && new Date(email.next_retry_at) > new Date();

              return (
                <Card key={email.id} className="border-l-4 border-l-destructive">
                  <CardContent className="py-4">
                    <div className="flex items-start gap-4">
                      {/* Icon */}
                      <div className="mt-1">
                        {getErrorIcon(email.attempts, email.max_attempts)}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0 space-y-2">
                        {/* Header */}
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <p className="font-medium">{email.to_email}</p>
                            <p className="text-sm text-muted-foreground truncate max-w-md">
                              {email.subject}
                            </p>
                          </div>
                          <span className="text-xs text-muted-foreground whitespace-nowrap">
                            {formatDistanceToNow(new Date(email.last_attempt_at || email.created_at), {
                              addSuffix: true,
                              locale: es,
                            })}
                          </span>
                        </div>

                        {/* Error Message */}
                        <Alert variant="destructive" className="py-2">
                          <AlertDescription className="text-xs font-mono">
                            {email.last_error || "Error desconocido"}
                          </AlertDescription>
                        </Alert>

                        {/* Meta Info */}
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Badge variant={canRetry ? "outline" : "destructive"} className="text-xs">
                              Intentos: {email.attempts}/{email.max_attempts}
                            </Badge>
                          </span>
                          <span>Tipo: {email.queue_type}</span>
                          {hasScheduledRetry && (
                            <span className="flex items-center gap-1 text-amber-600">
                              <Clock className="h-3 w-3" />
                              Reintento en{" "}
                              {formatDistanceToNow(new Date(email.next_retry_at!), { locale: es })}
                            </span>
                          )}
                        </div>

                        <Separator className="my-2" />

                        {/* Actions */}
                        <div className="flex gap-2">
                          {canRetry && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleRetry(email.id)}
                              disabled={retryEmail.isPending}
                            >
                              {retryEmail.isPending ? (
                                <Loader2 className="h-3 w-3 animate-spin mr-1" />
                              ) : (
                                <RotateCcw className="h-3 w-3 mr-1" />
                              )}
                              {hasScheduledRetry ? "Reintentar ahora" : "Reintentar"}
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setSelectedEmailId(email.id)}
                          >
                            <Eye className="h-3 w-3 mr-1" />
                            Ver detalles
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-muted-foreground hover:text-destructive"
                            onClick={() => handleDiscard(email.id)}
                            disabled={cancelEmail.isPending}
                          >
                            <Trash2 className="h-3 w-3 mr-1" />
                            Descartar
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </ScrollArea>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <Pagination>
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                className={page === 0 ? "pointer-events-none opacity-50" : "cursor-pointer"}
              />
            </PaginationItem>
            {Array.from({ length: Math.min(5, totalPages) }).map((_, i) => {
              const pageNum = page < 3 ? i : page - 2 + i;
              if (pageNum >= totalPages) return null;
              return (
                <PaginationItem key={pageNum}>
                  <PaginationLink
                    onClick={() => setPage(pageNum)}
                    isActive={page === pageNum}
                    className="cursor-pointer"
                  >
                    {pageNum + 1}
                  </PaginationLink>
                </PaginationItem>
              );
            })}
            <PaginationItem>
              <PaginationNext
                onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                className={page === totalPages - 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      )}

      {/* Detail Drawer */}
      <EmailDetailDrawer
        emailId={selectedEmailId}
        open={!!selectedEmailId}
        onClose={() => setSelectedEmailId(null)}
      />
    </div>
  );
}
