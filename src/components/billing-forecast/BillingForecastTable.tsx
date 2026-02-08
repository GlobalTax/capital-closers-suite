import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BillingForecastRow } from "@/hooks/useBillingForecast";
import { format, parseISO, differenceInDays, isPast, isWithinInterval, addMonths } from "date-fns";
import { es } from "date-fns/locale";
import { ArrowUpDown, Search, AlertTriangle } from "lucide-react";

interface Props {
  mandatos: BillingForecastRow[];
}

function fmt(n: number | null | undefined): string {
  if (!n) return "—";
  return n.toLocaleString("es-ES", { maximumFractionDigits: 0 }) + " €";
}

function getClosingDate(m: BillingForecastRow): string | null {
  return m.fecha_cierre ?? m.expected_close_date ?? null;
}

function getEstadoBadge(estado: string) {
  const variants: Record<string, string> = {
    prospecto: "bg-muted text-muted-foreground",
    activo: "bg-primary/10 text-primary",
    cerrado_ganado: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
    pausado: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
  };
  return variants[estado] ?? "bg-muted text-muted-foreground";
}

function getTimelineColor(closingDate: string | null): string {
  if (!closingDate) return "";
  const d = parseISO(closingDate);
  if (isPast(d)) return "text-destructive font-medium";
  if (differenceInDays(d, new Date()) <= 30) return "text-orange-600 dark:text-orange-400 font-medium";
  return "";
}

type SortKey = "codigo" | "empresa" | "honorarios" | "probability" | "fecha_cierre" | "ponderado";
type TimeFilter = "all" | "overdue" | "30d" | "90d" | "no_date";

export function BillingForecastTable({ mandatos }: Props) {
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("fecha_cierre");
  const [sortAsc, setSortAsc] = useState(true);
  const [timeFilter, setTimeFilter] = useState<TimeFilter>("all");

  const filtered = useMemo(() => {
    let result = mandatos;
    
    // Search
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(
        (m) =>
          m.codigo?.toLowerCase().includes(q) ||
          m.nombre_proyecto?.toLowerCase().includes(q) ||
          m.empresa_nombre?.toLowerCase().includes(q)
      );
    }

    // Time filter
    const now = new Date();
    if (timeFilter === "overdue") {
      result = result.filter((m) => {
        const d = getClosingDate(m);
        return d && isPast(parseISO(d));
      });
    } else if (timeFilter === "30d") {
      result = result.filter((m) => {
        const d = getClosingDate(m);
        return d && isWithinInterval(parseISO(d), { start: now, end: addMonths(now, 1) });
      });
    } else if (timeFilter === "90d") {
      result = result.filter((m) => {
        const d = getClosingDate(m);
        return d && isWithinInterval(parseISO(d), { start: now, end: addMonths(now, 3) });
      });
    } else if (timeFilter === "no_date") {
      result = result.filter((m) => !getClosingDate(m));
    }

    // Sort
    result = [...result].sort((a, b) => {
      let cmp = 0;
      switch (sortKey) {
        case "codigo":
          cmp = (a.codigo ?? "").localeCompare(b.codigo ?? "");
          break;
        case "empresa":
          cmp = (a.empresa_nombre ?? "").localeCompare(b.empresa_nombre ?? "");
          break;
        case "honorarios":
          cmp = (a.honorarios_aceptados ?? a.honorarios_propuestos ?? 0) - (b.honorarios_aceptados ?? b.honorarios_propuestos ?? 0);
          break;
        case "probability":
          cmp = (a.probability ?? 0) - (b.probability ?? 0);
          break;
        case "fecha_cierre": {
          const da = getClosingDate(a);
          const db = getClosingDate(b);
          if (!da && !db) cmp = 0;
          else if (!da) cmp = 1;
          else if (!db) cmp = -1;
          else cmp = da.localeCompare(db);
          break;
        }
        case "ponderado": {
          const pa = (a.honorarios_aceptados ?? a.honorarios_propuestos ?? 0) * ((a.probability ?? 10) / 100);
          const pb = (b.honorarios_aceptados ?? b.honorarios_propuestos ?? 0) * ((b.probability ?? 10) / 100);
          cmp = pa - pb;
          break;
        }
      }
      return sortAsc ? cmp : -cmp;
    });

    return result;
  }, [mandatos, search, sortKey, sortAsc, timeFilter]);

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) setSortAsc(!sortAsc);
    else { setSortKey(key); setSortAsc(true); }
  };

  const SortHeader = ({ label, sortId }: { label: string; sortId: SortKey }) => (
    <button
      onClick={() => toggleSort(sortId)}
      className="flex items-center gap-1 hover:text-foreground transition-colors"
    >
      {label}
      <ArrowUpDown className="h-3 w-3" />
    </button>
  );

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <CardTitle className="text-lg">Detalle por Mandato</CardTitle>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-8 w-56"
              />
            </div>
            <Select value={timeFilter} onValueChange={(v) => setTimeFilter(v as TimeFilter)}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="overdue">Vencidos</SelectItem>
                <SelectItem value="30d">Próx. 30 días</SelectItem>
                <SelectItem value="90d">Próx. 90 días</SelectItem>
                <SelectItem value="no_date">Sin fecha</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead><SortHeader label="Código" sortId="codigo" /></TableHead>
                <TableHead><SortHeader label="Empresa" sortId="empresa" /></TableHead>
                <TableHead>Categoría</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="text-right"><SortHeader label="Honorarios" sortId="honorarios" /></TableHead>
                <TableHead className="text-right"><SortHeader label="Prob." sortId="probability" /></TableHead>
                <TableHead className="text-right"><SortHeader label="Ponderado" sortId="ponderado" /></TableHead>
                <TableHead className="text-right">Facturado</TableHead>
                <TableHead><SortHeader label="Fecha Cierre" sortId="fecha_cierre" /></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center text-muted-foreground py-8">
                    No hay mandatos que coincidan con los filtros
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((m) => {
                  const fee = m.honorarios_aceptados ?? m.honorarios_propuestos ?? 0;
                  const prob = m.probability ?? 10;
                  const ponderado = fee * (prob / 100);
                  const closingDate = getClosingDate(m);
                  const isOverdue = closingDate && isPast(parseISO(closingDate));
                  const catLabel: Record<string, string> = {
                    operacion_ma: "M&A",
                    valoracion: "Valoración",
                    due_diligence: "Due Diligence",
                    legal: "Legal",
                    asesoria: "Asesoría",
                  };

                  return (
                    <TableRow key={m.id} className="group">
                      <TableCell>
                        <Link
                          to={`/mandatos/${m.id}`}
                          className="font-mono text-sm text-primary hover:underline"
                        >
                          {m.codigo ?? "—"}
                        </Link>
                      </TableCell>
                      <TableCell>
                        <div>
                          <span className="font-medium text-sm">
                            {m.empresa_nombre ?? "Sin empresa"}
                          </span>
                          {m.nombre_proyecto && (
                            <p className="text-xs text-muted-foreground">{m.nombre_proyecto}</p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-xs">{catLabel[m.categoria ?? ""] ?? m.categoria ?? "—"}</span>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={getEstadoBadge(m.estado)}>
                          {m.estado}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right font-medium tabular-nums">
                        {fmt(fee || null)}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {prob}%
                      </TableCell>
                      <TableCell className="text-right font-medium tabular-nums">
                        {ponderado > 0 ? fmt(ponderado) : "—"}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {fmt(m.fee_facturado)}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1.5">
                          {isOverdue && <AlertTriangle className="h-3.5 w-3.5 text-destructive" />}
                          <span className={getTimelineColor(closingDate)}>
                            {closingDate
                              ? format(parseISO(closingDate), "dd MMM yyyy", { locale: es })
                              : "Sin fecha"}
                          </span>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
