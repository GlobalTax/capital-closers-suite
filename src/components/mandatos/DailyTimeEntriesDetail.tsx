import { useMemo } from "react";
import { format } from "date-fns";
import { Link } from "react-router-dom";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Clock, FileText } from "lucide-react";
import type { TimeEntry } from "@/types";

interface DailyTimeEntriesDetailProps {
  entries: TimeEntry[];
  date: Date;
  userName: string;
  loading?: boolean;
}

function formatDuration(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hours === 0) return `${mins}m`;
  if (mins === 0) return `${hours}h`;
  return `${hours}h ${mins}m`;
}

function getValueTypeBadge(valueType: string | null | undefined) {
  switch (valueType) {
    case 'core_ma':
      return <Badge className="bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20">Core M&A</Badge>;
    case 'soporte':
      return <Badge className="bg-amber-500/10 text-amber-600 hover:bg-amber-500/20">Soporte</Badge>;
    case 'bajo_valor':
      return <Badge className="bg-red-500/10 text-red-600 hover:bg-red-500/20">Bajo Valor</Badge>;
    default:
      return <Badge variant="secondary">Sin clasificar</Badge>;
  }
}

function getStatusBadge(status: string | null | undefined) {
  switch (status) {
    case 'approved':
      return <Badge variant="outline" className="border-emerald-500 text-emerald-600">Aprobado</Badge>;
    case 'pending':
      return <Badge variant="outline" className="border-amber-500 text-amber-600">Pendiente</Badge>;
    case 'rejected':
      return <Badge variant="outline" className="border-red-500 text-red-600">Rechazado</Badge>;
    default:
      return <Badge variant="outline">—</Badge>;
  }
}

export function DailyTimeEntriesDetail({ entries, date, userName, loading }: DailyTimeEntriesDetailProps) {
  // Sort entries by start_time
  const sortedEntries = useMemo(() => {
    return [...entries].sort((a, b) => {
      const timeA = a.start_time ? new Date(a.start_time).getTime() : 0;
      const timeB = b.start_time ? new Date(b.start_time).getTime() : 0;
      return timeA - timeB;
    });
  }, [entries]);

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          Cargando registros...
        </CardContent>
      </Card>
    );
  }

  if (entries.length === 0) {
    return null; // KPIs already show "no entries" message
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <FileText className="h-4 w-4" />
          Detalle de Entradas ({entries.length})
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[80px]">Hora</TableHead>
                <TableHead className="w-[180px]">Mandato</TableHead>
                <TableHead className="w-[120px]">Tipo Tarea</TableHead>
                <TableHead className="w-[100px]">Valor</TableHead>
                <TableHead className="min-w-[300px]">Descripción</TableHead>
                <TableHead className="w-[90px] text-right">Duración</TableHead>
                <TableHead className="w-[90px]">Estado</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedEntries.map((entry) => (
                <TableRow key={entry.id}>
                  {/* Time */}
                  <TableCell className="font-mono text-sm text-muted-foreground">
                    {entry.start_time
                      ? format(new Date(entry.start_time), "HH:mm")
                      : "—"}
                  </TableCell>

                  {/* Mandato */}
                  <TableCell>
                    {entry.mandato ? (
                      <Link
                        to={`/mandatos/${entry.mandato.id}`}
                        className="hover:underline"
                      >
                        <span className="font-mono text-primary text-sm">
                          {entry.mandato.codigo || "—"}
                        </span>
                        <br />
                        <span className="text-xs text-muted-foreground line-clamp-1">
                          {entry.mandato.empresa_principal?.nombre || entry.mandato.descripcion}
                        </span>
                      </Link>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </TableCell>

                  {/* Task Type */}
                  <TableCell>
                    {entry.work_task_type ? (
                      <Badge variant="secondary" className="text-xs">
                        {entry.work_task_type.name}
                      </Badge>
                    ) : (
                      <span className="text-muted-foreground text-xs">—</span>
                    )}
                  </TableCell>

                  {/* Value Type */}
                  <TableCell>
                    {getValueTypeBadge(entry.value_type)}
                  </TableCell>

                  {/* Description - ALWAYS VISIBLE, NOT TRUNCATED */}
                  <TableCell>
                    <div className="text-sm whitespace-pre-wrap">
                      {entry.description || <span className="text-muted-foreground italic">Sin descripción</span>}
                    </div>
                    {entry.notes && (
                      <div className="text-xs text-muted-foreground mt-1 italic border-l-2 border-muted pl-2">
                        Notas: {entry.notes}
                      </div>
                    )}
                  </TableCell>

                  {/* Duration */}
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Clock className="h-3 w-3 text-muted-foreground" />
                      <span className="font-mono font-medium">
                        {formatDuration(entry.duration_minutes || 0)}
                      </span>
                    </div>
                  </TableCell>

                  {/* Status */}
                  <TableCell>
                    {getStatusBadge(entry.status)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
