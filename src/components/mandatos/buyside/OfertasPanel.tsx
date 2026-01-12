import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  Plus, 
  FileText, 
  Calendar,
  DollarSign,
  ChevronRight,
  Loader2,
  MoreVertical,
  Trash2,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import type { 
  TargetOferta, 
  OfertaTipo, 
  OfertaEstado,
  OFERTA_TIPO_CONFIG,
  OFERTA_ESTADO_CONFIG,
} from "@/types";
import { cn } from "@/lib/utils";

interface OfertasPanelProps {
  ofertas: TargetOferta[];
  empresaNombre: string;
  onCreateOferta: (oferta: { tipo: OfertaTipo; monto: number; condiciones?: string; fecha_expiracion?: string; notas?: string }) => void;
  onUpdateEstado: (ofertaId: string, estado: OfertaEstado, contraofertaMonto?: number) => void;
  onDeleteOferta: (ofertaId: string) => void;
  isLoading?: boolean;
}

const TIPO_CONFIG: Record<OfertaTipo, { label: string; color: string }> = {
  indicativa: { label: 'Indicativa', color: '#94a3b8' },
  loi: { label: 'LOI', color: '#f59e0b' },
  binding: { label: 'Binding', color: '#22c55e' },
};

const ESTADO_CONFIG: Record<OfertaEstado, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  enviada: { label: 'Enviada', variant: 'default' },
  aceptada: { label: 'Aceptada', variant: 'default' },
  rechazada: { label: 'Rechazada', variant: 'destructive' },
  contraoferta: { label: 'Contraoferta', variant: 'secondary' },
  expirada: { label: 'Expirada', variant: 'outline' },
  retirada: { label: 'Retirada', variant: 'outline' },
};

export function OfertasPanel({ 
  ofertas, 
  empresaNombre,
  onCreateOferta, 
  onUpdateEstado,
  onDeleteOferta,
  isLoading = false,
}: OfertasPanelProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newOferta, setNewOferta] = useState({
    tipo: 'indicativa' as OfertaTipo,
    monto: '',
    condiciones: '',
    fecha_expiracion: '',
    notas: '',
  });

  const formatCurrency = (value: number) => {
    if (value >= 1000000) return `€${(value / 1000000).toFixed(2)}M`;
    if (value >= 1000) return `€${(value / 1000).toFixed(0)}K`;
    return `€${value}`;
  };

  const handleSubmit = () => {
    if (!newOferta.monto) return;
    
    onCreateOferta({
      tipo: newOferta.tipo,
      monto: parseFloat(newOferta.monto),
      condiciones: newOferta.condiciones || undefined,
      fecha_expiracion: newOferta.fecha_expiracion || undefined,
      notas: newOferta.notas || undefined,
    });

    setNewOferta({
      tipo: 'indicativa',
      monto: '',
      condiciones: '',
      fecha_expiracion: '',
      notas: '',
    });
    setDialogOpen(false);
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4 text-muted-foreground" />
            <CardTitle className="text-sm">Ofertas</CardTitle>
            {ofertas.length > 0 && (
              <Badge variant="secondary" className="text-xs">
                {ofertas.length}
              </Badge>
            )}
          </div>
          
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                <Plus className="h-3.5 w-3.5 mr-1" />
                Nueva
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Nueva Oferta - {empresaNombre}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Tipo de oferta</Label>
                    <Select 
                      value={newOferta.tipo} 
                      onValueChange={(v) => setNewOferta(s => ({ ...s, tipo: v as OfertaTipo }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="indicativa">Indicativa</SelectItem>
                        <SelectItem value="loi">LOI (Letter of Intent)</SelectItem>
                        <SelectItem value="binding">Binding</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Monto (€)</Label>
                    <Input
                      type="number"
                      placeholder="5000000"
                      value={newOferta.monto}
                      onChange={(e) => setNewOferta(s => ({ ...s, monto: e.target.value }))}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Fecha de expiración (opcional)</Label>
                  <Input
                    type="date"
                    value={newOferta.fecha_expiracion}
                    onChange={(e) => setNewOferta(s => ({ ...s, fecha_expiracion: e.target.value }))}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Condiciones (opcional)</Label>
                  <Textarea
                    placeholder="Términos y condiciones de la oferta..."
                    value={newOferta.condiciones}
                    onChange={(e) => setNewOferta(s => ({ ...s, condiciones: e.target.value }))}
                    rows={2}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Notas (opcional)</Label>
                  <Textarea
                    placeholder="Notas adicionales..."
                    value={newOferta.notas}
                    onChange={(e) => setNewOferta(s => ({ ...s, notas: e.target.value }))}
                    rows={2}
                  />
                </div>

                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setDialogOpen(false)}>
                    Cancelar
                  </Button>
                  <Button onClick={handleSubmit} disabled={!newOferta.monto || isLoading}>
                    {isLoading && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}
                    Crear oferta
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        {ofertas.length === 0 ? (
          <div className="text-center py-6 text-sm text-muted-foreground">
            No hay ofertas registradas
          </div>
        ) : (
          <div className="space-y-3">
            {ofertas.map((oferta, idx) => {
              const tipoConfig = TIPO_CONFIG[oferta.tipo];
              const estadoConfig = ESTADO_CONFIG[oferta.estado];

              return (
                <div 
                  key={oferta.id}
                  className={cn(
                    "relative pl-4 pb-3",
                    idx < ofertas.length - 1 && "border-b"
                  )}
                >
                  {/* Timeline dot */}
                  <div 
                    className="absolute left-0 top-1 w-2 h-2 rounded-full"
                    style={{ backgroundColor: tipoConfig.color }}
                  />
                  
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Badge 
                          variant="outline"
                          style={{ borderColor: tipoConfig.color, color: tipoConfig.color }}
                          className="text-xs"
                        >
                          {tipoConfig.label}
                        </Badge>
                        <span className="font-medium">
                          {formatCurrency(oferta.monto)}
                        </span>
                        <Badge variant={estadoConfig.variant} className="text-xs">
                          {estadoConfig.label}
                        </Badge>
                      </div>
                      
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-6 w-6">
                            <MoreVertical className="h-3.5 w-3.5" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => onUpdateEstado(oferta.id, 'aceptada')}>
                            Marcar como Aceptada
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => onUpdateEstado(oferta.id, 'rechazada')}>
                            Marcar como Rechazada
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => onUpdateEstado(oferta.id, 'contraoferta')}>
                            Contraoferta recibida
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => onDeleteOferta(oferta.id)}
                            className="text-destructive"
                          >
                            <Trash2 className="h-3.5 w-3.5 mr-1" />
                            Eliminar
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>

                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {format(new Date(oferta.fecha), "dd MMM yyyy", { locale: es })}
                      </span>
                      {oferta.fecha_expiracion && (
                        <span>
                          Expira: {format(new Date(oferta.fecha_expiracion), "dd MMM", { locale: es })}
                        </span>
                      )}
                      {oferta.contraoferta_monto && (
                        <span className="text-amber-600">
                          Contraoferta: {formatCurrency(oferta.contraoferta_monto)}
                        </span>
                      )}
                    </div>

                    {oferta.condiciones && (
                      <p className="text-xs text-muted-foreground line-clamp-2">
                        {oferta.condiciones}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
