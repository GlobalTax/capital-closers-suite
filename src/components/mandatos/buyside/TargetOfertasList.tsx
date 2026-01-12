import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  FileText,
  Plus,
  ChevronDown,
  ChevronUp,
  Calendar,
  DollarSign,
  Loader2,
} from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import type { TargetOferta, OfertaTipo } from "@/types";
import { OFERTA_TIPO_CONFIG, OFERTA_ESTADO_CONFIG } from "@/types";
import { cn } from "@/lib/utils";

interface TargetOfertasListProps {
  ofertas: TargetOferta[];
  onCreateOferta: (data: { tipo: OfertaTipo; monto: number; condiciones?: string }) => void;
  isSaving?: boolean;
}

export function TargetOfertasList({
  ofertas,
  onCreateOferta,
  isSaving = false,
}: TargetOfertasListProps) {
  const [isCreating, setIsCreating] = useState(false);
  const [newOferta, setNewOferta] = useState({
    tipo: "indicativa" as OfertaTipo,
    monto: "",
    condiciones: "",
  });

  const handleSubmit = () => {
    const monto = parseFloat(newOferta.monto);
    if (isNaN(monto) || monto <= 0) return;

    onCreateOferta({
      tipo: newOferta.tipo,
      monto,
      condiciones: newOferta.condiciones || undefined,
    });

    setNewOferta({ tipo: "indicativa", monto: "", condiciones: "" });
    setIsCreating(false);
  };

  const formatCurrency = (value: number) => {
    if (value >= 1000000) return `€${(value / 1000000).toFixed(2)}M`;
    if (value >= 1000) return `€${(value / 1000).toFixed(0)}K`;
    return `€${value.toLocaleString("es-ES")}`;
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-medium">Ofertas ({ofertas.length})</h4>
        {!isCreating && (
          <Button variant="outline" size="sm" onClick={() => setIsCreating(true)}>
            <Plus className="h-3.5 w-3.5 mr-1" />
            Nueva oferta
          </Button>
        )}
      </div>

      {/* Form nueva oferta */}
      <Collapsible open={isCreating} onOpenChange={setIsCreating}>
        <CollapsibleContent>
          <Card className="border-dashed">
            <CardContent className="p-4 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs text-muted-foreground">Tipo</label>
                  <Select
                    value={newOferta.tipo}
                    onValueChange={(v) => setNewOferta((o) => ({ ...o, tipo: v as OfertaTipo }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(OFERTA_TIPO_CONFIG).map(([key, config]) => (
                        <SelectItem key={key} value={key}>
                          {config.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs text-muted-foreground">Monto (€)</label>
                  <Input
                    type="number"
                    placeholder="1000000"
                    value={newOferta.monto}
                    onChange={(e) => setNewOferta((o) => ({ ...o, monto: e.target.value }))}
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs text-muted-foreground">Condiciones (opcional)</label>
                <Textarea
                  placeholder="Condiciones de la oferta..."
                  value={newOferta.condiciones}
                  onChange={(e) => setNewOferta((o) => ({ ...o, condiciones: e.target.value }))}
                  rows={2}
                />
              </div>
              <div className="flex items-center gap-2 justify-end">
                <Button variant="ghost" size="sm" onClick={() => setIsCreating(false)}>
                  Cancelar
                </Button>
                <Button
                  size="sm"
                  onClick={handleSubmit}
                  disabled={!newOferta.monto || isSaving}
                >
                  {isSaving ? (
                    <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                  ) : (
                    <Plus className="h-4 w-4 mr-1" />
                  )}
                  Crear oferta
                </Button>
              </div>
            </CardContent>
          </Card>
        </CollapsibleContent>
      </Collapsible>

      {/* Lista de ofertas */}
      {ofertas.length === 0 && !isCreating ? (
        <Card>
          <CardContent className="py-8 text-center">
            <FileText className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
            <p className="text-sm text-muted-foreground mb-4">
              No hay ofertas registradas para este target
            </p>
            <Button variant="outline" size="sm" onClick={() => setIsCreating(true)}>
              <Plus className="h-3.5 w-3.5 mr-1" />
              Crear primera oferta
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {ofertas.map((oferta) => {
            const tipoConfig = OFERTA_TIPO_CONFIG[oferta.tipo];
            const estadoConfig = OFERTA_ESTADO_CONFIG[oferta.estado];

            return (
              <Card key={oferta.id} className="p-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Badge
                        variant="outline"
                        style={{ borderColor: tipoConfig.color, color: tipoConfig.color }}
                      >
                        {tipoConfig.label}
                      </Badge>
                      <Badge
                        variant="secondary"
                        className={cn(
                          oferta.estado === "aceptada" && "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
                          oferta.estado === "rechazada" && "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
                          oferta.estado === "retirada" && "bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400"
                        )}
                      >
                        {estadoConfig.label}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-3 text-sm">
                      <span className="flex items-center gap-1 font-medium">
                        <DollarSign className="h-3.5 w-3.5 text-muted-foreground" />
                        {formatCurrency(oferta.monto)}
                      </span>
                      <span className="flex items-center gap-1 text-muted-foreground text-xs">
                        <Calendar className="h-3 w-3" />
                        {format(new Date(oferta.created_at), "d MMM yyyy", { locale: es })}
                      </span>
                    </div>
                    {oferta.condiciones && (
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                        {oferta.condiciones}
                      </p>
                    )}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
