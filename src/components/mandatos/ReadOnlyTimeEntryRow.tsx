import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import type { TimeEntry } from "@/types";

interface ReadOnlyTimeEntryRowProps {
  entry: TimeEntry;
  compact?: boolean;
}

export function ReadOnlyTimeEntryRow({ entry, compact = false }: ReadOnlyTimeEntryRowProps) {
  const formatDuration = (mins?: number) => {
    if (!mins) return '-';
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    if (h === 0) return `${m}m`;
    if (m === 0) return `${h}h`;
    return `${h}h ${m}m`;
  };

  if (compact) {
    return (
      <div className="flex items-center gap-2 text-sm py-1">
        <span className="font-mono text-xs text-muted-foreground w-10">
          {format(new Date(entry.start_time), 'HH:mm')}
        </span>
        <span className="font-mono text-xs text-primary font-medium">
          {entry.mandato?.codigo || '-'}
        </span>
        <span className="text-muted-foreground truncate flex-1">
          {entry.description || entry.mandato?.descripcion || '-'}
        </span>
        <span className="font-mono text-xs font-medium">
          {formatDuration(entry.duration_minutes)}
        </span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3 py-2 px-3 rounded-md bg-muted/30">
      {/* Time */}
      <span className="font-mono text-sm text-muted-foreground w-12 shrink-0">
        {format(new Date(entry.start_time), 'HH:mm')}
      </span>

      {/* Mandato */}
      <div className="flex-1 min-w-0">
        <span className="font-mono text-xs text-primary font-medium">
          {entry.mandato?.codigo || '-'}
        </span>
        <span className="text-sm text-muted-foreground ml-2 truncate">
          {entry.mandato?.descripcion || 'Sin mandato'}
        </span>
      </div>

      {/* Task Type */}
      <Badge variant="secondary" className="text-xs shrink-0">
        {entry.work_task_type?.name || '-'}
      </Badge>

      {/* Description */}
      <span className="text-sm text-muted-foreground truncate max-w-[200px]">
        {entry.description || '-'}
      </span>

      {/* Duration */}
      <span className="font-mono text-sm font-medium w-16 text-right shrink-0">
        {formatDuration(entry.duration_minutes)}
      </span>
    </div>
  );
}
