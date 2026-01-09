import { useState } from "react";
import { LayoutGrid } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { TrackerTable } from "@/components/pipeline/TrackerTable";
import { TrackerFilters } from "@/components/pipeline/TrackerFilters";
import { usePipelineTracker } from "@/hooks/usePipelineTracker";
import type { TrackerFilterState } from "@/types/pipeline-tracker";

export default function PipelineTracker() {
  const [filter, setFilter] = useState<TrackerFilterState>('all');
  const { data, isLoading, error } = usePipelineTracker(filter);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Pipeline Tracker"
        subtitle="Estado de documentación y plataformas de sindicación"
        icon={LayoutGrid}
      />

      <div className="flex items-center justify-between flex-wrap gap-4">
        <TrackerFilters
          activeFilter={filter}
          onFilterChange={setFilter}
        />
        
        <div className="text-sm text-muted-foreground">
          {data?.length || 0} mandatos
        </div>
      </div>

      {error ? (
        <div className="border rounded-lg p-8 text-center text-destructive">
          Error al cargar datos: {error.message}
        </div>
      ) : (
        <TrackerTable data={data || []} isLoading={isLoading} />
      )}
    </div>
  );
}
