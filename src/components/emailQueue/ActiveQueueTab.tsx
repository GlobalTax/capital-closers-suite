import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { X, Eye, Clock, AlertCircle, RefreshCw } from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import { useEmailQueue, useCancelEmail, type QueueFilters } from "@/hooks/useEmailQueue";
import { EmailDetailDrawer } from "./EmailDetailDrawer";
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";

interface ActiveQueueTabProps {
  initialStatusFilter?: string;
}

const PAGE_SIZE = 20;

export function ActiveQueueTab({ initialStatusFilter }: ActiveQueueTabProps) {
  const [filters, setFilters] = useState<QueueFilters>({
    status: initialStatusFilter,
  });
  const [page, setPage] = useState(0);
  const [selectedEmailId, setSelectedEmailId] = useState<string | null>(null);
  const [searchEmail, setSearchEmail] = useState("");

  useEffect(() => {
    if (initialStatusFilter) {
      setFilters((f) => ({ ...f, status: initialStatusFilter }));
    }
  }, [initialStatusFilter]);

  const { data, isLoading, refetch } = useEmailQueue(filters, page, PAGE_SIZE);
  const cancelEmail = useCancelEmail();

  const handleSearchChange = (value: string) => {
    setSearchEmail(value);
    setFilters((f) => ({ ...f, to_email: value || undefined }));
    setPage(0);
  };

  const handleStatusChange = (value: string) => {
    setFilters((f) => ({ ...f, status: value === "all" ? undefined : value }));
    setPage(0);
  };

  const handleTypeChange = (value: string) => {
    setFilters((f) => ({ ...f, queue_type: value === "all" ? undefined : value }));
    setPage(0);
  };

  const handleCancel = (emailId: string) => {
    cancelEmail.mutate(emailId);
  };

  const clearFilters = () => {
    setFilters({});
    setSearchEmail("");
    setPage(0);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge variant="outline" className="text-amber-600 border-amber-300 bg-amber-50"><Clock className="h-3 w-3 mr-1" />Pendiente</Badge>;
      case "queued":
        return <Badge variant="outline" className="text-indigo-600 border-indigo-300 bg-indigo-50">En cola</Badge>;
      case "sending":
        return <Badge variant="outline" className="text-blue-600 border-blue-300 bg-blue-50"><RefreshCw className="h-3 w-3 mr-1 animate-spin" />Enviando</Badge>;
      case "sent":
        return <Badge variant="outline" className="text-emerald-600 border-emerald-300 bg-emerald-50">Enviado</Badge>;
      case "failed":
        return <Badge variant="destructive"><AlertCircle className="h-3 w-3 mr-1" />Fallido</Badge>;
      case "cancelled":
        return <Badge variant="secondary">Cancelado</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  // Calculate ETA for pending emails
  const pendingCount = data?.data.filter((e) => ["pending", "queued"].includes(e.status)).length || 0;
  const etaMinutes = Math.ceil(pendingCount / 20); // ~20 emails/min

  const totalPages = Math.ceil((data?.count || 0) / PAGE_SIZE);

  return (
    <div className="space-y-4">
      {/* Filters */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Filtros</CardTitle>
            <Button variant="ghost" size="sm" onClick={clearFilters}>
              Limpiar
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            <Input
              placeholder="Buscar por email..."
              value={searchEmail}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="w-64"
            />
            <Select value={filters.status || "all"} onValueChange={handleStatusChange}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="pending">Pendiente</SelectItem>
                <SelectItem value="queued">En cola</SelectItem>
                <SelectItem value="sending">Enviando</SelectItem>
                <SelectItem value="sent">Enviado</SelectItem>
                <SelectItem value="failed">Fallido</SelectItem>
                <SelectItem value="cancelled">Cancelado</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filters.queue_type || "all"} onValueChange={handleTypeChange}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="teaser">Teaser</SelectItem>
                <SelectItem value="transactional">Transaccional</SelectItem>
                <SelectItem value="notification">Notificación</SelectItem>
                <SelectItem value="digest">Digest</SelectItem>
                <SelectItem value="test">Test</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" size="icon" onClick={() => refetch()}>
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* ETA Banner */}
      {pendingCount > 0 && (
        <Card className="bg-amber-50 border-amber-200">
          <CardContent className="py-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-amber-600" />
              <span className="text-sm text-amber-800">
                <strong>{pendingCount}</strong> emails pendientes • ETA: ~{etaMinutes} {etaMinutes === 1 ? "minuto" : "minutos"}
              </span>
            </div>
            <span className="text-xs text-amber-600">Rate limit: ~20 emails/min</span>
          </CardContent>
        </Card>
      )}

      {/* Table */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base">Cola de Emails</CardTitle>
              <CardDescription>{data?.count || 0} emails encontrados</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Destinatario</TableHead>
                <TableHead>Asunto</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Creado</TableHead>
                <TableHead className="w-[100px]">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell><Skeleton className="h-4 w-40" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-60" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                  </TableRow>
                ))
              ) : data?.data.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    No hay emails en la cola
                  </TableCell>
                </TableRow>
              ) : (
                data?.data.map((email) => (
                  <TableRow key={email.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium text-sm">{email.to_email}</p>
                        {email.to_name && (
                          <p className="text-xs text-muted-foreground">{email.to_name}</p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <p className="text-sm truncate max-w-[300px]" title={email.subject}>
                        {email.subject}
                      </p>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-xs">
                        {email.queue_type}
                      </Badge>
                    </TableCell>
                    <TableCell>{getStatusBadge(email.status)}</TableCell>
                    <TableCell>
                      <span className="text-xs text-muted-foreground" title={format(new Date(email.created_at), "PPpp", { locale: es })}>
                        {formatDistanceToNow(new Date(email.created_at), { addSuffix: true, locale: es })}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => setSelectedEmailId(email.id)}
                        >
                          <Eye className="h-3.5 w-3.5" />
                        </Button>
                        {["pending", "queued"].includes(email.status) && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-destructive hover:text-destructive"
                            onClick={() => handleCancel(email.id)}
                            disabled={cancelEmail.isPending}
                          >
                            <X className="h-3.5 w-3.5" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

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
