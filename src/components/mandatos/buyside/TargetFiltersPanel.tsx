import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Separator } from "@/components/ui/separator";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ChevronDown,
  ChevronRight,
  X,
  Filter,
  AlertTriangle,
  Ban,
  Clock,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  BUYER_TYPE_CONFIG,
  TARGET_FUNNEL_CONFIG,
  TARGET_PIPELINE_CONFIG,
  type BuyerType,
  type TargetFunnelStage,
  type TargetPipelineStage,
} from "@/types";

export type ActivityFilter = "all" | "7d" | "30d" | "60d" | "inactive_30d" | "inactive_60d";

export interface TargetFilters {
  buyerTypes: BuyerType[];
  funnelStages: TargetFunnelStage[];
  pipelineStages: TargetPipelineStage[];
  tags: string[];
  scoreRange: [number, number];
  matchScoreRange: [number, number];
  hideNoContactar: boolean;
  hideConflictos: boolean;
  onlyConflictos: boolean;
  activityFilter: ActivityFilter;
}

export const defaultFilters: TargetFilters = {
  buyerTypes: [],
  funnelStages: [],
  pipelineStages: [],
  tags: [],
  scoreRange: [0, 100],
  matchScoreRange: [0, 100],
  hideNoContactar: false,
  hideConflictos: false,
  onlyConflictos: false,
  activityFilter: "all",
};

const ACTIVITY_OPTIONS: { value: ActivityFilter; label: string }[] = [
  { value: "all", label: "Todos" },
  { value: "7d", label: "Últimos 7 días" },
  { value: "30d", label: "Últimos 30 días" },
  { value: "60d", label: "Últimos 60 días" },
  { value: "inactive_30d", label: "Inactivos +30 días" },
  { value: "inactive_60d", label: "Inactivos +60 días" },
];

interface TargetFiltersPanelProps {
  filters: TargetFilters;
  onChange: (filters: TargetFilters) => void;
  distinctTags: string[];
  isOpen: boolean;
  onToggle: () => void;
}

export function TargetFiltersPanel({
  filters,
  onChange,
  distinctTags,
  isOpen,
  onToggle,
}: TargetFiltersPanelProps) {
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    buyerType: true,
    funnel: false,
    pipeline: false,
    tags: false,
    scores: false,
    activity: false,
    alerts: true,
  });

  const toggleSection = (section: string) => {
    setOpenSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const activeFiltersCount = [
    filters.buyerTypes.length > 0,
    filters.funnelStages.length > 0,
    filters.pipelineStages.length > 0,
    filters.tags.length > 0,
    filters.scoreRange[0] > 0 || filters.scoreRange[1] < 100,
    filters.matchScoreRange[0] > 0 || filters.matchScoreRange[1] < 100,
    filters.hideNoContactar,
    filters.hideConflictos,
    filters.onlyConflictos,
    filters.activityFilter !== "all",
  ].filter(Boolean).length;

  const clearFilters = () => onChange(defaultFilters);

  const toggleBuyerType = (type: BuyerType) => {
    const current = filters.buyerTypes;
    const updated = current.includes(type)
      ? current.filter(t => t !== type)
      : [...current, type];
    onChange({ ...filters, buyerTypes: updated });
  };

  const toggleFunnelStage = (stage: TargetFunnelStage) => {
    const current = filters.funnelStages;
    const updated = current.includes(stage)
      ? current.filter(s => s !== stage)
      : [...current, stage];
    onChange({ ...filters, funnelStages: updated });
  };

  const togglePipelineStage = (stage: TargetPipelineStage) => {
    const current = filters.pipelineStages;
    const updated = current.includes(stage)
      ? current.filter(s => s !== stage)
      : [...current, stage];
    onChange({ ...filters, pipelineStages: updated });
  };

  const toggleTag = (tag: string) => {
    const current = filters.tags;
    const updated = current.includes(tag)
      ? current.filter(t => t !== tag)
      : [...current, tag];
    onChange({ ...filters, tags: updated });
  };

  if (!isOpen) {
    return (
      <Button
        variant="outline"
        size="sm"
        onClick={onToggle}
        className="relative"
      >
        <Filter className="h-4 w-4 mr-1" />
        Filtros
        {activeFiltersCount > 0 && (
          <Badge
            variant="destructive"
            className="absolute -top-2 -right-2 h-5 w-5 p-0 flex items-center justify-center text-xs"
          >
            {activeFiltersCount}
          </Badge>
        )}
      </Button>
    );
  }

  return (
    <div className="w-64 border rounded-lg bg-card p-3 space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium">Filtros</span>
          {activeFiltersCount > 0 && (
            <Badge variant="secondary" className="text-xs">
              {activeFiltersCount}
            </Badge>
          )}
        </div>
        <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={onToggle}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      <Separator />

      {/* Buyer Type Section */}
      <Collapsible open={openSections.buyerType} onOpenChange={() => toggleSection("buyerType")}>
        <CollapsibleTrigger className="flex items-center gap-1 w-full text-sm font-medium hover:text-foreground text-muted-foreground">
          {openSections.buyerType ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
          Tipo de Comprador
        </CollapsibleTrigger>
        <CollapsibleContent className="pt-2 space-y-2">
          {(Object.entries(BUYER_TYPE_CONFIG) as [BuyerType, typeof BUYER_TYPE_CONFIG[BuyerType]][]).map(
            ([type, config]) => (
              <div key={type} className="flex items-center gap-2">
                <Checkbox
                  id={`buyer-${type}`}
                  checked={filters.buyerTypes.includes(type)}
                  onCheckedChange={() => toggleBuyerType(type)}
                />
                <Label
                  htmlFor={`buyer-${type}`}
                  className="text-xs flex items-center gap-1.5 cursor-pointer"
                >
                  <div
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: config.color }}
                  />
                  {config.label}
                </Label>
              </div>
            )
          )}
        </CollapsibleContent>
      </Collapsible>

      {/* Funnel Stage Section */}
      <Collapsible open={openSections.funnel} onOpenChange={() => toggleSection("funnel")}>
        <CollapsibleTrigger className="flex items-center gap-1 w-full text-sm font-medium hover:text-foreground text-muted-foreground">
          {openSections.funnel ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
          Etapa Funnel
        </CollapsibleTrigger>
        <CollapsibleContent className="pt-2 space-y-2">
          {(Object.entries(TARGET_FUNNEL_CONFIG) as [TargetFunnelStage, typeof TARGET_FUNNEL_CONFIG[TargetFunnelStage]][]).map(
            ([stage, config]) => (
              <div key={stage} className="flex items-center gap-2">
                <Checkbox
                  id={`funnel-${stage}`}
                  checked={filters.funnelStages.includes(stage)}
                  onCheckedChange={() => toggleFunnelStage(stage)}
                />
                <Label
                  htmlFor={`funnel-${stage}`}
                  className="text-xs flex items-center gap-1.5 cursor-pointer"
                >
                  <div
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: config.color }}
                  />
                  {config.label}
                </Label>
              </div>
            )
          )}
        </CollapsibleContent>
      </Collapsible>

      {/* Pipeline Stage Section */}
      <Collapsible open={openSections.pipeline} onOpenChange={() => toggleSection("pipeline")}>
        <CollapsibleTrigger className="flex items-center gap-1 w-full text-sm font-medium hover:text-foreground text-muted-foreground">
          {openSections.pipeline ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
          Etapa Pipeline
        </CollapsibleTrigger>
        <CollapsibleContent className="pt-2 space-y-2">
          {(Object.entries(TARGET_PIPELINE_CONFIG) as [TargetPipelineStage, typeof TARGET_PIPELINE_CONFIG[TargetPipelineStage]][])
            .sort(([, a], [, b]) => a.order - b.order)
            .map(([stage, config]) => (
              <div key={stage} className="flex items-center gap-2">
                <Checkbox
                  id={`pipeline-${stage}`}
                  checked={filters.pipelineStages.includes(stage)}
                  onCheckedChange={() => togglePipelineStage(stage)}
                />
                <Label
                  htmlFor={`pipeline-${stage}`}
                  className="text-xs flex items-center gap-1.5 cursor-pointer"
                >
                  <div
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: config.color }}
                  />
                  {config.label}
                </Label>
              </div>
            ))}
        </CollapsibleContent>
      </Collapsible>

      {/* Tags Section */}
      {distinctTags.length > 0 && (
        <Collapsible open={openSections.tags} onOpenChange={() => toggleSection("tags")}>
          <CollapsibleTrigger className="flex items-center gap-1 w-full text-sm font-medium hover:text-foreground text-muted-foreground">
            {openSections.tags ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
            Tags
          </CollapsibleTrigger>
          <CollapsibleContent className="pt-2 flex flex-wrap gap-1">
            {distinctTags.map(tag => (
              <Badge
                key={tag}
                variant={filters.tags.includes(tag) ? "default" : "outline"}
                className="text-xs cursor-pointer"
                onClick={() => toggleTag(tag)}
              >
                {tag}
              </Badge>
            ))}
          </CollapsibleContent>
        </Collapsible>
      )}

      {/* Scores Section */}
      <Collapsible open={openSections.scores} onOpenChange={() => toggleSection("scores")}>
        <CollapsibleTrigger className="flex items-center gap-1 w-full text-sm font-medium hover:text-foreground text-muted-foreground">
          {openSections.scores ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
          Puntuaciones
        </CollapsibleTrigger>
        <CollapsibleContent className="pt-3 space-y-4">
          <div>
            <Label className="text-xs text-muted-foreground">
              Fit Score: {filters.scoreRange[0]} - {filters.scoreRange[1]}%
            </Label>
            <Slider
              value={filters.scoreRange}
              onValueChange={(value) =>
                onChange({ ...filters, scoreRange: value as [number, number] })
              }
              min={0}
              max={100}
              step={5}
              className="mt-2"
            />
          </div>
          <div>
            <Label className="text-xs text-muted-foreground">
              Match Score: {filters.matchScoreRange[0]} - {filters.matchScoreRange[1]}%
            </Label>
            <Slider
              value={filters.matchScoreRange}
              onValueChange={(value) =>
                onChange({ ...filters, matchScoreRange: value as [number, number] })
              }
              min={0}
              max={100}
              step={5}
              className="mt-2"
            />
          </div>
        </CollapsibleContent>
      </Collapsible>

      {/* Activity Section */}
      <Collapsible open={openSections.activity} onOpenChange={() => toggleSection("activity")}>
        <CollapsibleTrigger className="flex items-center gap-1 w-full text-sm font-medium hover:text-foreground text-muted-foreground">
          {openSections.activity ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
          Actividad
        </CollapsibleTrigger>
        <CollapsibleContent className="pt-2">
          <div className="flex items-center gap-2">
            <Clock className="h-3.5 w-3.5 text-muted-foreground" />
            <Select
              value={filters.activityFilter}
              onValueChange={(value) =>
                onChange({ ...filters, activityFilter: value as ActivityFilter })
              }
            >
              <SelectTrigger className="h-8 text-xs flex-1">
                <SelectValue placeholder="Filtrar por actividad" />
              </SelectTrigger>
              <SelectContent>
                {ACTIVITY_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value} className="text-xs">
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CollapsibleContent>
      </Collapsible>

      {/* Alerts Section */}
      <Collapsible open={openSections.alerts} onOpenChange={() => toggleSection("alerts")}>
        <CollapsibleTrigger className="flex items-center gap-1 w-full text-sm font-medium hover:text-foreground text-muted-foreground">
          {openSections.alerts ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
          Alertas
        </CollapsibleTrigger>
        <CollapsibleContent className="pt-2 space-y-2">
          <div className="flex items-center gap-2">
            <Checkbox
              id="hide-no-contactar"
              checked={filters.hideNoContactar}
              onCheckedChange={(checked) =>
                onChange({ ...filters, hideNoContactar: checked as boolean })
              }
            />
            <Label htmlFor="hide-no-contactar" className="text-xs flex items-center gap-1 cursor-pointer">
              <Ban className="h-3 w-3 text-destructive" />
              Ocultar "No contactar"
            </Label>
          </div>
          <div className="flex items-center gap-2">
            <Checkbox
              id="hide-conflictos"
              checked={filters.hideConflictos}
              onCheckedChange={(checked) =>
                onChange({ ...filters, hideConflictos: checked as boolean, onlyConflictos: false })
              }
            />
            <Label htmlFor="hide-conflictos" className="text-xs flex items-center gap-1 cursor-pointer">
              <AlertTriangle className="h-3 w-3 text-amber-500" />
              Ocultar conflictos
            </Label>
          </div>
          <div className="flex items-center gap-2">
            <Checkbox
              id="only-conflictos"
              checked={filters.onlyConflictos}
              onCheckedChange={(checked) =>
                onChange({ ...filters, onlyConflictos: checked as boolean, hideConflictos: false })
              }
            />
            <Label htmlFor="only-conflictos" className="text-xs flex items-center gap-1 cursor-pointer">
              <AlertTriangle className="h-3 w-3 text-amber-500" />
              Solo conflictos
            </Label>
          </div>
        </CollapsibleContent>
      </Collapsible>

      <Separator />

      {/* Clear All */}
      {activeFiltersCount > 0 && (
        <Button variant="ghost" size="sm" className="w-full text-xs" onClick={clearFilters}>
          Limpiar todos los filtros
        </Button>
      )}
    </div>
  );
}
