import { useState } from "react";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { useNavigate } from "react-router-dom";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Building2,
  Users,
  MessageSquare,
  FileText,
  TrendingUp,
  ExternalLink,
  DollarSign,
  Target,
  ArrowRight,
  Archive,
  ArchiveRestore,
  Ban,
  AlertTriangle,
  Unlink,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { TargetScoringPanel } from "./TargetScoringPanel";
import { TargetContactosList } from "./TargetContactosList";
import { TargetOfertasList } from "./TargetOfertasList";
import { TargetClassificationSection } from "./TargetClassificationSection";
import { InteraccionTimeline } from "@/components/targets/InteraccionTimeline";
import { NuevoContactoDrawer } from "@/components/contactos/NuevoContactoDrawer";
import { ImportFromLinkDrawer } from "@/components/contactos/ImportFromLinkDrawer";
import { AsociarContactoEmpresaDialog } from "@/components/contactos/AsociarContactoEmpresaDialog";
import { NuevaInteraccionDialog } from "@/components/shared/NuevaInteraccionDialog";
import { useQuery } from "@tanstack/react-query";
import { getContactosByEmpresa, fetchInteraccionesByEmpresa } from "@/services/interacciones.service";
import { useTargetTags } from "@/hooks/useTargetTags";
import type {
  MandatoEmpresaBuySide,
  TargetFunnelStage,
  TargetPipelineStage,
  TargetScoring,
  OfertaTipo,
  BuyerType,
} from "@/types";
import { TARGET_FUNNEL_CONFIG, TARGET_PIPELINE_CONFIG, BUYER_TYPE_CONFIG } from "@/types";

interface TargetDetailDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  target: MandatoEmpresaBuySide | null;
  mandatoId: string;
  onMoveToFunnel: (targetId: string, stage: TargetFunnelStage) => void;
  onMoveToPipeline: (targetId: string, stage: TargetPipelineStage) => void;
  onUpdateScoring: (targetId: string, scoring: Partial<TargetScoring>) => void;
  onCreateOferta: (targetId: string, oferta: { tipo: OfertaTipo; monto: number; condiciones?: string }) => void;
  onArchiveTarget?: (targetId: string) => void;
  onUnarchiveTarget?: (targetId: string) => void;
  onUnlinkTarget?: (targetId: string) => void;
  isMoving?: boolean;
  isSavingScoring?: boolean;
  isSavingOferta?: boolean;
  isArchiving?: boolean;
  isUnlinking?: boolean;
  onRefresh: () => void;
}

export function TargetDetailDrawer({
  open,
  onOpenChange,
  target,
  mandatoId,
  onMoveToFunnel,
  onMoveToPipeline,
  onUpdateScoring,
  onCreateOferta,
  onArchiveTarget,
  onUnarchiveTarget,
  onUnlinkTarget,
  isMoving = false,
  isSavingScoring = false,
  isSavingOferta = false,
  isArchiving = false,
  isUnlinking = false,
  onRefresh,
}: TargetDetailDrawerProps) {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("info");
  const [nuevoContactoOpen, setNuevoContactoOpen] = useState(false);
  const [importLinkOpen, setImportLinkOpen] = useState(false);
  const [asociarContactoOpen, setAsociarContactoOpen] = useState(false);
  const [nuevaInteraccionOpen, setNuevaInteraccionOpen] = useState(false);
  const [confirmArchiveOpen, setConfirmArchiveOpen] = useState(false);
  const [confirmUnlinkOpen, setConfirmUnlinkOpen] = useState(false);

  const empresa = target?.empresa;
  const empresaId = empresa?.id;

  // Target tags management
  const {
    distinctTags,
    updateBuyerType,
    updateGeografia,
    addTag,
    removeTag,
    setNoContactar,
    setConflicto,
    updateNotasInternas,
  } = useTargetTags(mandatoId);

  // Fetch contactos de la empresa
  const { data: contactos = [], refetch: refetchContactos } = useQuery({
    queryKey: ["contactos-empresa", empresaId],
    queryFn: () => getContactosByEmpresa(empresaId!),
    enabled: !!empresaId && open,
  });

  // Fetch interacciones de la empresa
  const { data: interacciones = [], refetch: refetchInteracciones } = useQuery({
    queryKey: ["interacciones-empresa", empresaId],
    queryFn: () => fetchInteraccionesByEmpresa(empresaId!),
    enabled: !!empresaId && open,
  });

  if (!target || !empresa) return null;

  const funnelStage = target.funnel_stage || "long_list";
  const pipelineStage = target.pipeline_stage_target || "identificada";
  const scoring = target.scoring;
  const ofertas = target.ofertas || [];
  const matchScore = target.match_score || 0;

  const formatCurrency = (value: number | undefined) => {
    if (!value) return "-";
    if (value >= 1000000) return `€${(value / 1000000).toFixed(1)}M`;
    if (value >= 1000) return `€${(value / 1000).toFixed(0)}K`;
    return `€${value}`;
  };

  const getScoreColor = (score: number) => {
    if (score >= 70) return "text-green-600 bg-green-100 dark:bg-green-900/30 dark:text-green-400";
    if (score >= 40) return "text-amber-600 bg-amber-100 dark:bg-amber-900/30 dark:text-amber-400";
    return "text-red-600 bg-red-100 dark:bg-red-900/30 dark:text-red-400";
  };

  const handleRefreshAll = () => {
    refetchContactos();
    refetchInteracciones();
    onRefresh();
  };

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent className="w-full sm:max-w-lg p-0 flex flex-col">
          {/* Header */}
          <SheetHeader className="px-6 py-4 border-b">
            <div className="flex items-start gap-3">
              <div className="w-12 h-12 rounded-lg bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center flex-shrink-0">
                <Target className="h-6 w-6 text-orange-600 dark:text-orange-400" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <SheetTitle className="text-lg truncate">{empresa.nombre}</SheetTitle>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={() => {
                      onOpenChange(false);
                      navigate(`/empresas/${empresa.id}`);
                    }}
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                  </Button>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground flex-wrap mt-1">
                  {empresa.sector && <span>{empresa.sector}</span>}
                  {(empresa.facturacion || empresa.revenue) && (
                    <>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <DollarSign className="h-3 w-3" />
                        {formatCurrency(empresa.facturacion || empresa.revenue)}
                      </span>
                    </>
                  )}
                  {empresa.empleados && (
                    <>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <Users className="h-3 w-3" />
                        {empresa.empleados}
                      </span>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Badges de scores */}
            <div className="flex items-center gap-2 mt-3 flex-wrap">
              <Badge
                variant="outline"
                style={{
                  borderColor: TARGET_FUNNEL_CONFIG[funnelStage].color,
                  color: TARGET_FUNNEL_CONFIG[funnelStage].color,
                }}
              >
                {TARGET_FUNNEL_CONFIG[funnelStage].label}
              </Badge>
              <Badge variant="secondary">
                {TARGET_PIPELINE_CONFIG[pipelineStage].label}
              </Badge>
              {scoring && (
                <Badge className={cn("text-xs", getScoreColor(scoring.score_total))}>
                  Score: {scoring.score_total}%
                </Badge>
              )}
              {matchScore > 0 && (
                <Badge variant="outline" className="text-xs gap-0.5">
                  <TrendingUp className="h-2.5 w-2.5" />
                  Match: {matchScore}%
                </Badge>
              )}
              {target.buyer_type && (
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
              )}
              {target.no_contactar && (
                <Badge variant="destructive" className="text-xs gap-0.5">
                  <Ban className="h-2.5 w-2.5" />
                  No contactar
                </Badge>
              )}
              {target.tiene_conflicto && (
                <Badge variant="outline" className="text-xs gap-0.5 border-amber-500 text-amber-600">
                  <AlertTriangle className="h-2.5 w-2.5" />
                  Conflicto
                </Badge>
              )}
              {target.is_archived && (
                <Badge variant="secondary" className="text-xs gap-0.5 opacity-70">
                  <Archive className="h-2.5 w-2.5" />
                  Archivado
                </Badge>
              )}
            </div>
          </SheetHeader>

          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col overflow-hidden">
            <TabsList className="grid grid-cols-4 mx-6 mt-4">
              <TabsTrigger value="info" className="text-xs">
                <Building2 className="h-3.5 w-3.5 mr-1" />
                Info
              </TabsTrigger>
              <TabsTrigger value="contactos" className="text-xs">
                <Users className="h-3.5 w-3.5 mr-1" />
                <span className="hidden sm:inline">Contactos</span>
                <Badge variant="secondary" className="ml-1 h-4 px-1 text-xs">
                  {contactos.length}
                </Badge>
              </TabsTrigger>
              <TabsTrigger value="timeline" className="text-xs">
                <MessageSquare className="h-3.5 w-3.5 mr-1" />
                <span className="hidden sm:inline">Timeline</span>
              </TabsTrigger>
              <TabsTrigger value="ofertas" className="text-xs">
                <FileText className="h-3.5 w-3.5 mr-1" />
                <span className="hidden sm:inline">Ofertas</span>
                {ofertas.length > 0 && (
                  <Badge variant="secondary" className="ml-1 h-4 px-1 text-xs">
                    {ofertas.length}
                  </Badge>
                )}
              </TabsTrigger>
            </TabsList>

            <ScrollArea className="flex-1 px-6">
              <TabsContent value="info" className="mt-4 space-y-4">
                {/* Scoring Panel */}
                <TargetScoringPanel
                  scoring={scoring}
                  matchScore={matchScore}
                  onSave={(data) => onUpdateScoring(target.id, data)}
                  isSaving={isSavingScoring}
                />

                {/* Controles de etapa */}
                <div className="space-y-3">
                  <h4 className="text-sm font-medium">Mover en Pipeline</h4>

                  {/* Funnel Stage */}
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground w-16">Funnel:</span>
                    <Select
                      value={funnelStage}
                      onValueChange={(value) => onMoveToFunnel(target.id, value as TargetFunnelStage)}
                      disabled={isMoving}
                    >
                      <SelectTrigger className="flex-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(TARGET_FUNNEL_CONFIG).map(([key, config]) => (
                          <SelectItem key={key} value={key}>
                            <div className="flex items-center gap-2">
                              <div
                                className="w-2 h-2 rounded-full"
                                style={{ backgroundColor: config.color }}
                              />
                              {config.label}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Pipeline Stage */}
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground w-16">Etapa:</span>
                    <Select
                      value={pipelineStage}
                      onValueChange={(value) => onMoveToPipeline(target.id, value as TargetPipelineStage)}
                      disabled={isMoving}
                    >
                      <SelectTrigger className="flex-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(TARGET_PIPELINE_CONFIG)
                          .sort(([, a], [, b]) => a.order - b.order)
                          .map(([key, config]) => (
                            <SelectItem key={key} value={key}>
                              <div className="flex items-center gap-2">
                                <div
                                  className="w-2 h-2 rounded-full"
                                  style={{ backgroundColor: config.color }}
                                />
                                {config.label}
                              </div>
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <Separator />

                {/* Clasificación y alertas */}
                <TargetClassificationSection
                  target={target}
                  distinctTags={distinctTags}
                  onBuyerTypeChange={(type) => updateBuyerType.mutate({ targetId: target.id, buyerType: type })}
                  onGeografiaChange={(geo) => updateGeografia.mutate({ targetId: target.id, geografia: geo })}
                  onAddTag={(tag) => addTag.mutate({ targetId: target.id, tag })}
                  onRemoveTag={(tag) => removeTag.mutate({ targetId: target.id, tag })}
                  onNoContactarChange={(value, motivo) => setNoContactar.mutate({ targetId: target.id, value, motivo })}
                  onConflictoChange={(value, descripcion) => setConflicto.mutate({ targetId: target.id, value, descripcion })}
                  onNotasInternasChange={(notas) => updateNotasInternas.mutate({ targetId: target.id, notas })}
                />

                <Separator />

                {/* Info adicional empresa */}
                <div className="space-y-2">
                  <h4 className="text-sm font-medium">Información de la empresa</h4>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div className="text-muted-foreground">CIF:</div>
                    <div>{empresa.cif || "-"}</div>
                    <div className="text-muted-foreground">Sector:</div>
                    <div>{empresa.sector || "-"}</div>
                    <div className="text-muted-foreground">Subsector:</div>
                    <div>{empresa.subsector || "-"}</div>
                    <div className="text-muted-foreground">Ubicación:</div>
                    <div>{empresa.ubicacion || "-"}</div>
                    <div className="text-muted-foreground">Facturación:</div>
                    <div>{formatCurrency(empresa.facturacion || empresa.revenue)}</div>
                    <div className="text-muted-foreground">EBITDA:</div>
                    <div>{formatCurrency(empresa.ebitda)}</div>
                    <div className="text-muted-foreground">Empleados:</div>
                    <div>{empresa.empleados || "-"}</div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="contactos" className="mt-4">
                <TargetContactosList
                  contactos={contactos}
                  empresaId={empresa.id}
                  onAddContacto={() => setNuevoContactoOpen(true)}
                  onImportFromLink={() => setImportLinkOpen(true)}
                  onAsociarExistente={() => setAsociarContactoOpen(true)}
                  onInteraccion={(contactoId) => {
                    setNuevaInteraccionOpen(true);
                  }}
                />
              </TabsContent>

              <TabsContent value="timeline" className="mt-4">
                <InteraccionTimeline
                  interacciones={interacciones}
                  empresaId={empresa.id}
                  mandatoId={mandatoId}
                  onUpdate={handleRefreshAll}
                />
              </TabsContent>

              <TabsContent value="ofertas" className="mt-4 pb-4">
                <TargetOfertasList
                  ofertas={ofertas}
                  onCreateOferta={(data) => onCreateOferta(target.id, data)}
                  isSaving={isSavingOferta}
                />
              </TabsContent>
            </ScrollArea>
          </Tabs>

          {/* Footer actions */}
          <div className="px-6 py-4 border-t flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                className={target.is_archived ? "text-green-600 hover:text-green-700" : "text-amber-600 hover:text-amber-700"}
                onClick={() => {
                  if (target.is_archived) {
                    onUnarchiveTarget?.(target.id);
                  } else {
                    setConfirmArchiveOpen(true);
                  }
                }}
                disabled={isArchiving || isUnlinking}
              >
                {target.is_archived ? (
                  <>
                    <ArchiveRestore className="h-4 w-4 mr-1" />
                    Restaurar
                  </>
                ) : (
                  <>
                    <Archive className="h-4 w-4 mr-1" />
                    Archivar
                  </>
                )}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="text-destructive hover:text-destructive"
                onClick={() => setConfirmUnlinkOpen(true)}
                disabled={isArchiving || isUnlinking}
              >
                <Unlink className="h-4 w-4 mr-1" />
                Desvincular
              </Button>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                onOpenChange(false);
                navigate(`/empresas/${empresa.id}`);
              }}
            >
              Ver ficha empresa
              <ArrowRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        </SheetContent>
      </Sheet>

      {/* Sub-modales */}
      <NuevoContactoDrawer
        open={nuevoContactoOpen}
        onOpenChange={setNuevoContactoOpen}
        defaultEmpresaId={empresa.id}
        mandatoId={mandatoId}
        onSuccess={() => {
          refetchContactos();
          setNuevoContactoOpen(false);
        }}
      />

      <ImportFromLinkDrawer
        open={importLinkOpen}
        onOpenChange={setImportLinkOpen}
        mandatoId={mandatoId}
        onSuccess={() => {
          refetchContactos();
          setImportLinkOpen(false);
        }}
      />

      <AsociarContactoEmpresaDialog
        open={asociarContactoOpen}
        onOpenChange={setAsociarContactoOpen}
        empresaId={empresa.id}
        empresaNombre={empresa.nombre}
        onSuccess={() => {
          refetchContactos();
        }}
      />

      {nuevaInteraccionOpen && (
        <NuevaInteraccionDialog
          empresaId={empresa.id}
          mandatoId={mandatoId}
          onSuccess={() => {
            handleRefreshAll();
            setNuevaInteraccionOpen(false);
          }}
          trigger={<span />}
        />
      )}

      <ConfirmDialog
        open={confirmArchiveOpen}
        onOpenChange={setConfirmArchiveOpen}
        titulo="¿Archivar este target?"
        descripcion={`El target "${empresa.nombre}" será excluido de los KPIs activos y del Kanban. Podrás restaurarlo más tarde desde la vista de archivados.`}
        onConfirmar={() => {
          onArchiveTarget?.(target.id);
          setConfirmArchiveOpen(false);
        }}
        textoConfirmar="Archivar"
        textoCancelar="Cancelar"
      />

      <ConfirmDialog
        open={confirmUnlinkOpen}
        onOpenChange={setConfirmUnlinkOpen}
        titulo="¿Desvincular este target?"
        descripcion={`Se eliminará permanentemente la relación de "${empresa.nombre}" con este mandato, incluyendo su scoring, ofertas y datos asociados. La empresa seguirá existiendo en el sistema. Esta acción no se puede deshacer.`}
        onConfirmar={() => {
          onUnlinkTarget?.(target.id);
          setConfirmUnlinkOpen(false);
        }}
        textoConfirmar="Desvincular"
        textoCancelar="Cancelar"
      />
    </>
  );
}
