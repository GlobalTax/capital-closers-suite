import { useState } from "react";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Building2,
  Tag,
  MapPin,
  AlertTriangle,
  Ban,
  FileText,
  Save,
  X,
  Plus,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { BUYER_TYPE_CONFIG, type BuyerType, type MandatoEmpresaBuySide } from "@/types";

interface TargetClassificationSectionProps {
  target: MandatoEmpresaBuySide;
  distinctTags: string[];
  onBuyerTypeChange: (type: BuyerType | null) => void;
  onGeografiaChange: (geografia: string) => void;
  onAddTag: (tag: string) => void;
  onRemoveTag: (tag: string) => void;
  onNoContactarChange: (value: boolean, motivo?: string) => void;
  onConflictoChange: (value: boolean, descripcion?: string) => void;
  onNotasInternasChange: (notas: string) => void;
  isSaving?: boolean;
}

export function TargetClassificationSection({
  target,
  distinctTags,
  onBuyerTypeChange,
  onGeografiaChange,
  onAddTag,
  onRemoveTag,
  onNoContactarChange,
  onConflictoChange,
  onNotasInternasChange,
  isSaving = false,
}: TargetClassificationSectionProps) {
  const [newTag, setNewTag] = useState("");
  const [noContactarMotivo, setNoContactarMotivo] = useState(target.no_contactar_motivo || "");
  const [conflictoDescripcion, setConflictoDescripcion] = useState(target.conflicto_descripcion || "");
  const [notasInternas, setNotasInternas] = useState(target.notas_internas || "");
  const [hasChanges, setHasChanges] = useState(false);

  const handleAddTag = () => {
    if (newTag.trim()) {
      onAddTag(newTag.trim());
      setNewTag("");
    }
  };

  const handleSaveNotas = () => {
    onNotasInternasChange(notasInternas);
    setHasChanges(false);
  };

  return (
    <div className="space-y-4">
      <h4 className="text-sm font-medium flex items-center gap-2">
        <Tag className="h-4 w-4 text-muted-foreground" />
        Clasificación
      </h4>

      {/* Tipo de Comprador */}
      <div className="space-y-2">
        <Label className="text-xs text-muted-foreground">Tipo de Comprador</Label>
        <Select
          value={target.buyer_type || "none"}
          onValueChange={(value) => onBuyerTypeChange(value === "none" ? null : value as BuyerType)}
        >
          <SelectTrigger className="h-8">
            <SelectValue placeholder="Seleccionar tipo..." />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">Sin asignar</SelectItem>
            {(Object.entries(BUYER_TYPE_CONFIG) as [BuyerType, typeof BUYER_TYPE_CONFIG[BuyerType]][]).map(
              ([type, config]) => (
                <SelectItem key={type} value={type}>
                  <div className="flex items-center gap-2">
                    <div
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: config.color }}
                    />
                    {config.label}
                  </div>
                </SelectItem>
              )
            )}
          </SelectContent>
        </Select>
      </div>

      {/* Geografía */}
      <div className="space-y-2">
        <Label className="text-xs text-muted-foreground flex items-center gap-1">
          <MapPin className="h-3 w-3" />
          Geografía
        </Label>
        <Input
          placeholder="ej: España, Europa, Latam..."
          value={target.geografia || ""}
          onChange={(e) => onGeografiaChange(e.target.value)}
          className="h-8 text-sm"
        />
      </div>

      {/* Tags */}
      <div className="space-y-2">
        <Label className="text-xs text-muted-foreground">Tags</Label>
        <div className="flex flex-wrap gap-1.5">
          {(target.tags || []).map(tag => (
            <Badge key={tag} variant="secondary" className="text-xs">
              {tag}
              <button
                onClick={() => onRemoveTag(tag)}
                className="ml-1 hover:text-destructive"
              >
                <X className="h-2.5 w-2.5" />
              </button>
            </Badge>
          ))}
          <div className="flex items-center gap-1">
            <Input
              placeholder="Nuevo tag..."
              value={newTag}
              onChange={(e) => setNewTag(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleAddTag()}
              className="h-6 w-24 text-xs"
            />
            <Button
              variant="ghost"
              size="sm"
              className="h-6 px-2"
              onClick={handleAddTag}
              disabled={!newTag.trim()}
            >
              <Plus className="h-3 w-3" />
            </Button>
          </div>
        </div>
        {distinctTags.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-1">
            {distinctTags
              .filter(t => !(target.tags || []).includes(t))
              .slice(0, 5)
              .map(tag => (
                <Badge
                  key={tag}
                  variant="outline"
                  className="text-xs cursor-pointer hover:bg-secondary"
                  onClick={() => onAddTag(tag)}
                >
                  + {tag}
                </Badge>
              ))}
          </div>
        )}
      </div>

      <Separator />

      {/* Alertas */}
      <div className="space-y-3">
        <h4 className="text-sm font-medium flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          Alertas
        </h4>

        {/* No Contactar */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Checkbox
              id="no-contactar"
              checked={target.no_contactar || false}
              onCheckedChange={(checked) => {
                if (!checked) {
                  onNoContactarChange(false);
                }
              }}
            />
            <Label
              htmlFor="no-contactar"
              className={cn(
                "text-sm flex items-center gap-1 cursor-pointer",
                target.no_contactar && "text-destructive"
              )}
            >
              <Ban className="h-3.5 w-3.5" />
              No contactar
            </Label>
          </div>
          {target.no_contactar && (
            <div className="ml-6 flex gap-2">
              <Input
                placeholder="Motivo..."
                value={noContactarMotivo}
                onChange={(e) => setNoContactarMotivo(e.target.value)}
                className="h-7 text-xs flex-1"
              />
              <Button
                variant="secondary"
                size="sm"
                className="h-7 px-2"
                onClick={() => onNoContactarChange(true, noContactarMotivo)}
              >
                <Save className="h-3 w-3" />
              </Button>
            </div>
          )}
          {!target.no_contactar && (
            <Button
              variant="ghost"
              size="sm"
              className="ml-6 h-6 text-xs text-muted-foreground"
              onClick={() => onNoContactarChange(true)}
            >
              Marcar como no contactar
            </Button>
          )}
        </div>

        {/* Conflicto */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Checkbox
              id="conflicto"
              checked={target.tiene_conflicto || false}
              onCheckedChange={(checked) => {
                if (!checked) {
                  onConflictoChange(false);
                }
              }}
            />
            <Label
              htmlFor="conflicto"
              className={cn(
                "text-sm flex items-center gap-1 cursor-pointer",
                target.tiene_conflicto && "text-amber-600"
              )}
            >
              <AlertTriangle className="h-3.5 w-3.5" />
              Posible conflicto
            </Label>
          </div>
          {target.tiene_conflicto && (
            <div className="ml-6 flex gap-2">
              <Input
                placeholder="Descripción del conflicto..."
                value={conflictoDescripcion}
                onChange={(e) => setConflictoDescripcion(e.target.value)}
                className="h-7 text-xs flex-1"
              />
              <Button
                variant="secondary"
                size="sm"
                className="h-7 px-2"
                onClick={() => onConflictoChange(true, conflictoDescripcion)}
              >
                <Save className="h-3 w-3" />
              </Button>
            </div>
          )}
          {!target.tiene_conflicto && (
            <Button
              variant="ghost"
              size="sm"
              className="ml-6 h-6 text-xs text-muted-foreground"
              onClick={() => onConflictoChange(true)}
            >
              Marcar conflicto potencial
            </Button>
          )}
        </div>
      </div>

      <Separator />

      {/* Notas Internas */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label className="text-sm font-medium flex items-center gap-2">
            <FileText className="h-4 w-4 text-muted-foreground" />
            Notas Internas
          </Label>
          {hasChanges && (
            <Button
              variant="secondary"
              size="sm"
              className="h-6 text-xs"
              onClick={handleSaveNotas}
              disabled={isSaving}
            >
              <Save className="h-3 w-3 mr-1" />
              Guardar
            </Button>
          )}
        </div>
        <Textarea
          placeholder="Notas internas sobre este target (solo visible para el equipo)..."
          value={notasInternas}
          onChange={(e) => {
            setNotasInternas(e.target.value);
            setHasChanges(true);
          }}
          className="min-h-[80px] text-sm resize-none"
        />
      </div>
    </div>
  );
}
