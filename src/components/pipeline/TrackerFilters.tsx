import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { TrackerFilterState } from "@/types/pipeline-tracker";

interface TrackerFiltersProps {
  activeFilter: TrackerFilterState;
  onFilterChange: (filter: TrackerFilterState) => void;
  counts?: Record<TrackerFilterState, number>;
}

const FILTER_OPTIONS: { value: TrackerFilterState; label: string }[] = [
  { value: 'all', label: 'Todos' },
  { value: 'incoming', label: 'Incoming' },
  { value: 'go_to_market', label: 'Go to Market' },
  { value: 'dd_spa', label: 'DD / SPA' },
];

export function TrackerFilters({ activeFilter, onFilterChange, counts }: TrackerFiltersProps) {
  return (
    <div className="flex items-center gap-2 flex-wrap">
      {FILTER_OPTIONS.map((option) => (
        <Button
          key={option.value}
          variant={activeFilter === option.value ? "default" : "outline"}
          size="sm"
          onClick={() => onFilterChange(option.value)}
          className={cn(
            "text-sm",
            activeFilter === option.value && "shadow-sm"
          )}
        >
          {option.label}
          {counts && counts[option.value] !== undefined && (
            <span className="ml-1.5 px-1.5 py-0.5 text-xs rounded-full bg-background/20">
              {counts[option.value]}
            </span>
          )}
        </Button>
      ))}
    </div>
  );
}
