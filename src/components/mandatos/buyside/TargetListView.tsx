import { useState, useMemo } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Building2,
  TrendingUp,
  Ban,
  AlertTriangle,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  MapPin,
  Archive,
  Unlink,
} from "lucide-react";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { cn } from "@/lib/utils";
import { TargetQuickTags } from "./TargetQuickTags";
import {
  type MandatoEmpresaBuySide,
  type BuyerType,
  BUYER_TYPE_CONFIG,
  TARGET_FUNNEL_CONFIG,
  TARGET_PIPELINE_CONFIG,
} from "@/types";

type SortField = "nombre" | "sector" | "score" | "match" | "funnel" | "pipeline" | "geografia";
type SortDirection = "asc" | "desc";

interface TargetListViewProps {
  targets: MandatoEmpresaBuySide[];
  selectedIds: string[];
  onSelectionChange: (ids: string[]) => void;
  onTargetClick: (target: MandatoEmpresaBuySide) => void;
  distinctTags: string[];
  onAddTag: (targetId: string, tag: string) => void;
  onRemoveTag: (targetId: string, tag: string) => void;
  onBuyerTypeChange: (targetId: string, type: BuyerType | null) => void;
  onUnlinkTarget: (targetId: string) => void;
}

export function TargetListView({
  targets,
  selectedIds,
  onSelectionChange,
  onTargetClick,
  distinctTags,
  onAddTag,
  onRemoveTag,
  onBuyerTypeChange,
  onUnlinkTarget,
}: TargetListViewProps) {
  const [sortField, setSortField] = useState<SortField>("nombre");
  const [unlinkTargetId, setUnlinkTargetId] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(prev => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const sortedTargets = useMemo(() => {
    return [...targets].sort((a, b) => {
      let comparison = 0;

      switch (sortField) {
        case "nombre":
          comparison = (a.empresa?.nombre || "").localeCompare(b.empresa?.nombre || "");
          break;
        case "sector":
          comparison = (a.empresa?.sector || "").localeCompare(b.empresa?.sector || "");
          break;
        case "score":
          comparison = (a.scoring?.score_total || 0) - (b.scoring?.score_total || 0);
          break;
        case "match":
          comparison = (a.match_score || 0) - (b.match_score || 0);
          break;
        case "funnel":
          const funnelOrderA = TARGET_FUNNEL_CONFIG[a.funnel_stage || "long_list"].order;
          const funnelOrderB = TARGET_FUNNEL_CONFIG[b.funnel_stage || "long_list"].order;
          comparison = funnelOrderA - funnelOrderB;
          break;
        case "pipeline":
          const pipelineOrderA = TARGET_PIPELINE_CONFIG[a.pipeline_stage_target || "identificada"].order;
          const pipelineOrderB = TARGET_PIPELINE_CONFIG[b.pipeline_stage_target || "identificada"].order;
          comparison = pipelineOrderA - pipelineOrderB;
          break;
        case "geografia":
          comparison = (a.geografia || "").localeCompare(b.geografia || "");
          break;
      }

      return sortDirection === "asc" ? comparison : -comparison;
    });
  }, [targets, sortField, sortDirection]);

  const toggleSelectAll = () => {
    if (selectedIds.length === targets.length) {
      onSelectionChange([]);
    } else {
      onSelectionChange(targets.map(t => t.id));
    }
  };

  const toggleSelect = (id: string) => {
    if (selectedIds.includes(id)) {
      onSelectionChange(selectedIds.filter(i => i !== id));
    } else {
      onSelectionChange([...selectedIds, id]);
    }
  };

  const SortButton = ({ field, children }: { field: SortField; children: React.ReactNode }) => (
    <Button
      variant="ghost"
      size="sm"
      className="h-auto p-0 font-medium text-xs hover:bg-transparent"
      onClick={() => handleSort(field)}
    >
      {children}
      {sortField === field ? (
        sortDirection === "asc" ? (
          <ArrowUp className="ml-1 h-3 w-3" />
        ) : (
          <ArrowDown className="ml-1 h-3 w-3" />
        )
      ) : (
        <ArrowUpDown className="ml-1 h-3 w-3 opacity-50" />
      )}
    </Button>
  );

  const getScoreColor = (score: number) => {
    if (score >= 70) return "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400";
    if (score >= 40) return "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400";
    return "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400";
  };

  const formatCurrency = (value: number | undefined) => {
    if (!value) return "-";
    if (value >= 1000000) return `€${(value / 1000000).toFixed(1)}M`;
    if (value >= 1000) return `€${(value / 1000).toFixed(0)}K`;
    return `€${value}`;
  };

  return (
    <>
    <TooltipProvider>
      <div className="border rounded-lg bg-card">
        <ScrollArea className="h-[calc(100vh-420px)]">
          <Table>
            <TableHeader className="sticky top-0 z-10">
              <TableRow>
                <TableHead className="w-[40px]">
                  <Checkbox
                    checked={selectedIds.length === targets.length && targets.length > 0}
                    onCheckedChange={toggleSelectAll}
                  />
                </TableHead>
                <TableHead>
                  <SortButton field="nombre">Empresa</SortButton>
                </TableHead>
                <TableHead>
                  <SortButton field="sector">Sector</SortButton>
                </TableHead>
                <TableHead>
                  <SortButton field="geografia">Geografía</SortButton>
                </TableHead>
                <TableHead className="text-center">Tipo</TableHead>
                <TableHead className="text-center">
                  <SortButton field="score">Fit Score</SortButton>
                </TableHead>
                <TableHead className="text-center">
                  <SortButton field="match">Match</SortButton>
                </TableHead>
                <TableHead>
                  <SortButton field="funnel">Funnel</SortButton>
                </TableHead>
                <TableHead>
                  <SortButton field="pipeline">Pipeline</SortButton>
                </TableHead>
                <TableHead>Tags</TableHead>
                <TableHead className="w-[60px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedTargets.map(target => {
                const funnelConfig = TARGET_FUNNEL_CONFIG[target.funnel_stage || "long_list"];
                const pipelineConfig = TARGET_PIPELINE_CONFIG[target.pipeline_stage_target || "identificada"];

                  return (
                    <TableRow
                      key={target.id}
                      className={cn(
                        "cursor-pointer",
                        selectedIds.includes(target.id) && "bg-muted/50",
                        target.is_archived && "opacity-50 bg-muted/30",
                        target.no_contactar && !target.is_archived && "opacity-60"
                      )}
                      onClick={() => onTargetClick(target)}
                    >
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <Checkbox
                        checked={selectedIds.includes(target.id)}
                        onCheckedChange={() => toggleSelect(target.id)}
                      />
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Building2 className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                        <div className="min-w-0">
                          <div className="font-medium truncate max-w-[180px]">
                            {target.empresa?.nombre || "Sin nombre"}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {formatCurrency(target.empresa?.facturacion || target.empresa?.revenue)}
                          </div>
                        </div>
                        {/* Alert Icons */}
                        {target.no_contactar && (
                          <Tooltip>
                            <TooltipTrigger>
                              <Ban className="h-3.5 w-3.5 text-destructive" />
                            </TooltipTrigger>
                            <TooltipContent>
                              <p className="text-xs">No contactar</p>
                              {target.no_contactar_motivo && (
                                <p className="text-xs text-muted-foreground">{target.no_contactar_motivo}</p>
                              )}
                            </TooltipContent>
                          </Tooltip>
                        )}
                        {target.tiene_conflicto && (
                          <Tooltip>
                            <TooltipTrigger>
                              <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />
                            </TooltipTrigger>
                            <TooltipContent>
                              <p className="text-xs">Posible conflicto</p>
                              {target.conflicto_descripcion && (
                                <p className="text-xs text-muted-foreground">{target.conflicto_descripcion}</p>
                              )}
                            </TooltipContent>
                          </Tooltip>
                        )}
                        {target.is_archived && (
                          <Tooltip>
                            <TooltipTrigger>
                              <Archive className="h-3.5 w-3.5 text-muted-foreground" />
                            </TooltipTrigger>
                            <TooltipContent>
                              <p className="text-xs">Archivado</p>
                            </TooltipContent>
                          </Tooltip>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground truncate max-w-[120px]">
                      {target.empresa?.sector || "-"}
                    </TableCell>
                    <TableCell>
                      {target.geografia ? (
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <MapPin className="h-3 w-3" />
                          {target.geografia}
                        </div>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell className="text-center" onClick={(e) => e.stopPropagation()}>
                      {target.buyer_type ? (
                        <Badge
                          variant="outline"
                          className="text-xs"
                          style={{
                            borderColor: BUYER_TYPE_CONFIG[target.buyer_type].color,
                            color: BUYER_TYPE_CONFIG[target.buyer_type].color,
                          }}
                        >
                          {BUYER_TYPE_CONFIG[target.buyer_type].label}
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground text-xs">-</span>
                      )}
                    </TableCell>
                    <TableCell className="text-center">
                      {target.scoring ? (
                        <Badge className={cn("text-xs", getScoreColor(target.scoring.score_total))}>
                          {target.scoring.score_total}%
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground text-xs">-</span>
                      )}
                    </TableCell>
                    <TableCell className="text-center">
                      {target.match_score ? (
                        <Badge variant="secondary" className="text-xs gap-0.5">
                          <TrendingUp className="h-2.5 w-2.5" />
                          {target.match_score}%
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground text-xs">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className="text-xs"
                        style={{ borderColor: funnelConfig.color, color: funnelConfig.color }}
                      >
                        {funnelConfig.label}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="text-xs">
                        {pipelineConfig.label}
                      </Badge>
                    </TableCell>
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <TargetQuickTags
                        tags={target.tags || []}
                        buyerType={target.buyer_type}
                        distinctTags={distinctTags}
                        onAddTag={(tag) => onAddTag(target.id, tag)}
                        onRemoveTag={(tag) => onRemoveTag(target.id, tag)}
                        onBuyerTypeChange={(type) => onBuyerTypeChange(target.id, type)}
                        compact
                      />
                    </TableCell>
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 w-7 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                        onClick={() => setUnlinkTargetId(target.id)}
                      >
                        <Unlink className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
              {targets.length === 0 && (
                <TableRow>
                  <TableCell colSpan={11} className="h-32 text-center text-muted-foreground">
                    No hay targets que coincidan con los filtros
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </ScrollArea>
      </div>
    </TooltipProvider>

    <ConfirmDialog
      open={unlinkTargetId !== null}
      onOpenChange={(open) => { if (!open) setUnlinkTargetId(null); }}
      titulo="¿Desvincular target?"
      descripcion="Se eliminará la relación con este proyecto, incluyendo scoring y ofertas asociadas. La empresa seguirá existiendo en el CRM."
      onConfirmar={() => {
        if (unlinkTargetId) {
          onUnlinkTarget(unlinkTargetId);
          setUnlinkTargetId(null);
        }
      }}
      textoConfirmar="Desvincular"
      variant="destructive"
    />
    </>
  );
}
