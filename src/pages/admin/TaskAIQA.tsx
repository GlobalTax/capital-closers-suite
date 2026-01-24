import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Skeleton } from "@/components/ui/skeleton";
import { TaskAIQAStats } from "@/components/tasks/TaskAIQAStats";
import { TaskAIEventRow } from "@/components/tasks/TaskAIEventRow";
import { TaskAIEventDrawer } from "@/components/tasks/TaskAIEventDrawer";
import { useTaskAIEvents, useTaskAIStats } from "@/hooks/useTaskAIEvents";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { 
  Sparkles, 
  Search, 
  CalendarIcon, 
  RefreshCw, 
  AlertCircle,
  Inbox,
} from "lucide-react";
import type { TaskAIEventFilters, TaskAIEventWithTasks } from "@/services/taskAIFeedback.service";

export default function TaskAIQA() {
  const [filters, setFilters] = useState<TaskAIEventFilters>({});
  const [searchText, setSearchText] = useState('');
  const [dateFrom, setDateFrom] = useState<Date | undefined>();
  const [dateTo, setDateTo] = useState<Date | undefined>();
  const [confidenceFilter, setConfidenceFilter] = useState<string>('all');
  const [feedbackFilter, setFeedbackFilter] = useState<string>('all');
  const [selectedEvent, setSelectedEvent] = useState<TaskAIEventWithTasks | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const buildFilters = (): TaskAIEventFilters => {
    const f: TaskAIEventFilters = {};
    
    if (searchText.trim()) f.searchText = searchText.trim();
    if (dateFrom) f.dateFrom = dateFrom.toISOString();
    if (dateTo) f.dateTo = dateTo.toISOString();
    
    if (confidenceFilter === 'high') {
      f.confidenceMin = 0.8;
    } else if (confidenceFilter === 'medium') {
      f.confidenceMin = 0.6;
      f.confidenceMax = 0.79;
    } else if (confidenceFilter === 'low') {
      f.confidenceMax = 0.59;
    }

    if (feedbackFilter === 'pending') {
      f.hasFeedback = false;
    } else if (feedbackFilter === 'reviewed') {
      f.hasFeedback = true;
    }
    
    return f;
  };

  const handleSearch = () => {
    setFilters(buildFilters());
  };

  const handleClearFilters = () => {
    setSearchText('');
    setDateFrom(undefined);
    setDateTo(undefined);
    setConfidenceFilter('all');
    setFeedbackFilter('all');
    setFilters({});
  };

  const { data: events, isLoading, error, refetch } = useTaskAIEvents(filters);
  const { data: stats, isLoading: statsLoading } = useTaskAIStats();

  const handleViewDetails = (event: TaskAIEventWithTasks) => {
    setSelectedEvent(event);
    setDrawerOpen(true);
  };

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Sparkles className="h-6 w-6 text-primary" />
          Auditoría de Tareas IA
        </h1>
        <p className="text-muted-foreground">
          Revisa y evalúa las tareas generadas por inteligencia artificial para mejorar la precisión del sistema.
        </p>
      </div>

      {/* Stats */}
      <TaskAIQAStats stats={stats} isLoading={statsLoading} />

      {/* Filters */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Filtros</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            {/* Search */}
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por texto original..."
                  value={searchText}
                  onChange={(e) => setSearchText(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  className="pl-9"
                />
              </div>
            </div>

            {/* Date From */}
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="min-w-[140px] justify-start">
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {dateFrom ? format(dateFrom, "d MMM", { locale: es }) : "Desde"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={dateFrom}
                  onSelect={setDateFrom}
                  locale={es}
                />
              </PopoverContent>
            </Popover>

            {/* Date To */}
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="min-w-[140px] justify-start">
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {dateTo ? format(dateTo, "d MMM", { locale: es }) : "Hasta"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={dateTo}
                  onSelect={setDateTo}
                  locale={es}
                />
              </PopoverContent>
            </Popover>

            {/* Confidence Filter */}
            <Select value={confidenceFilter} onValueChange={setConfidenceFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Confianza" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas</SelectItem>
                <SelectItem value="high">Alta (≥80%)</SelectItem>
                <SelectItem value="medium">Media (60-79%)</SelectItem>
                <SelectItem value="low">Baja (&lt;60%)</SelectItem>
              </SelectContent>
            </Select>

            {/* Feedback Filter */}
            <Select value={feedbackFilter} onValueChange={setFeedbackFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Feedback" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="pending">Sin evaluar</SelectItem>
                <SelectItem value="reviewed">Evaluados</SelectItem>
              </SelectContent>
            </Select>

            {/* Actions */}
            <Button onClick={handleSearch}>Filtrar</Button>
            <Button variant="outline" onClick={handleClearFilters}>Limpiar</Button>
          </div>
        </CardContent>
      </Card>

      {/* Events Table */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <div>
            <CardTitle className="text-base">Eventos de IA</CardTitle>
            <CardDescription>
              {events?.length || 0} eventos encontrados
            </CardDescription>
          </div>
          <Button variant="ghost" size="icon" onClick={() => refetch()}>
            <RefreshCw className="h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-4 space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center gap-4">
                  <Skeleton className="h-12 w-full" />
                </div>
              ))}
            </div>
          ) : error ? (
            <div className="p-8 text-center">
              <AlertCircle className="h-8 w-8 text-destructive mx-auto mb-2" />
              <p className="text-destructive font-medium">Error al cargar eventos</p>
              <p className="text-sm text-muted-foreground mb-4">
                {(error as Error).message}
              </p>
              <Button variant="outline" onClick={() => refetch()}>
                Reintentar
              </Button>
            </div>
          ) : events?.length === 0 ? (
            <div className="p-8 text-center">
              <Inbox className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
              <p className="font-medium">Aún no hay eventos AI</p>
              <p className="text-sm text-muted-foreground">
                Los eventos aparecerán aquí cuando crees tareas usando la IA.
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[300px]">Texto Original</TableHead>
                  <TableHead className="w-[120px]">Confianza</TableHead>
                  <TableHead className="w-[200px]">Tarea Generada</TableHead>
                  <TableHead className="w-[120px]">Feedback</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {events?.map((event) => (
                  <TaskAIEventRow 
                    key={event.id} 
                    event={event} 
                    onViewDetails={handleViewDetails}
                  />
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Detail Drawer */}
      <TaskAIEventDrawer 
        event={selectedEvent}
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
      />
    </div>
  );
}
