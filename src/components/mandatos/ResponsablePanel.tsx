import { useState, useMemo } from "react";
import { format, startOfDay, isSameDay, addDays, subDays, isToday } from "date-fns";
import { es } from "date-fns/locale";
import { CalendarIcon, ChevronLeft, ChevronRight, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DaySummaryKPIs } from "./DaySummaryKPIs";
import { DailyTimeEntriesDetail } from "./DailyTimeEntriesDetail";
import type { TimeEntry } from "@/types";
import { cn } from "@/lib/utils";

interface ResponsablePanelProps {
  entries: TimeEntry[];
  users: { id: string; name: string }[];
  mandatos: { id: string; name: string }[];
  loading?: boolean;
}

export function ResponsablePanel({ entries, users, mandatos, loading }: ResponsablePanelProps) {
  const [selectedUserId, setSelectedUserId] = useState<string>("");
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedMandatoId, setSelectedMandatoId] = useState<string>("all");

  // Filter entries for selected user and date
  const filteredEntries = useMemo(() => {
    if (!selectedUserId) return [];

    return entries.filter(entry => {
      // Match user
      if (entry.user_id !== selectedUserId) return false;

      // Match date (using start_time)
      if (entry.start_time) {
        const entryDate = startOfDay(new Date(entry.start_time));
        if (!isSameDay(entryDate, selectedDate)) return false;
      } else if (entry.created_at) {
        const entryDate = startOfDay(new Date(entry.created_at));
        if (!isSameDay(entryDate, selectedDate)) return false;
      }

      // Match mandato (optional)
      if (selectedMandatoId !== "all" && entry.mandato_id !== selectedMandatoId) {
        return false;
      }

      return true;
    });
  }, [entries, selectedUserId, selectedDate, selectedMandatoId]);

  // Get user name
  const selectedUserName = useMemo(() => {
    const user = users.find(u => u.id === selectedUserId);
    return user?.name || "Usuario";
  }, [users, selectedUserId]);

  // Navigate days
  const goToPreviousDay = () => setSelectedDate(subDays(selectedDate, 1));
  const goToNextDay = () => setSelectedDate(addDays(selectedDate, 1));

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="flex flex-wrap items-center gap-4 p-4 bg-muted/30 rounded-lg">
        {/* User selector (prominent) */}
        <div className="flex items-center gap-2">
          <User className="h-4 w-4 text-muted-foreground" />
          <Select value={selectedUserId} onValueChange={setSelectedUserId}>
            <SelectTrigger className="w-[200px] bg-background">
              <SelectValue placeholder="Seleccionar operativo" />
            </SelectTrigger>
            <SelectContent className="bg-popover">
              {users.map(user => (
                <SelectItem key={user.id} value={user.id}>
                  {user.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Date picker */}
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" className="min-w-[220px] justify-start">
              <CalendarIcon className="mr-2 h-4 w-4" />
              {format(selectedDate, "EEEE d MMM yyyy", { locale: es })}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0 bg-popover" align="start">
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={(date) => date && setSelectedDate(date)}
              initialFocus
              className={cn("p-3 pointer-events-auto")}
            />
          </PopoverContent>
        </Popover>

        {/* Mandato filter (optional) */}
        <Select value={selectedMandatoId} onValueChange={setSelectedMandatoId}>
          <SelectTrigger className="w-[200px] bg-background">
            <SelectValue placeholder="Todos los mandatos" />
          </SelectTrigger>
          <SelectContent className="bg-popover max-h-[300px]">
            <SelectItem value="all">Todos los mandatos</SelectItem>
            {mandatos.map(m => (
              <SelectItem key={m.id} value={m.id}>
                {m.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Content area */}
      {!selectedUserId ? (
        <div className="text-center py-12 text-muted-foreground">
          <User className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>Selecciona un operativo para ver su detalle diario</p>
        </div>
      ) : (
        <>
          {/* Day navigation */}
          <div className="flex items-center justify-between">
            <Button
              variant="outline"
              size="sm"
              onClick={goToPreviousDay}
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              {format(subDays(selectedDate, 1), "EEE d", { locale: es })}
            </Button>

            <div className="text-center">
              <h2 className="text-lg font-semibold capitalize">
                {format(selectedDate, "EEEE d MMMM yyyy", { locale: es })}
              </h2>
              <p className="text-sm text-muted-foreground">{selectedUserName}</p>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={goToNextDay}
              disabled={isToday(selectedDate)}
            >
              {format(addDays(selectedDate, 1), "EEE d", { locale: es })}
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>

          {/* Day summary KPIs */}
          <DaySummaryKPIs
            entries={filteredEntries}
            date={selectedDate}
            userName={selectedUserName}
          />

          {/* Detailed entries table */}
          <DailyTimeEntriesDetail
            entries={filteredEntries}
            date={selectedDate}
            userName={selectedUserName}
            loading={loading}
          />
        </>
      )}
    </div>
  );
}
