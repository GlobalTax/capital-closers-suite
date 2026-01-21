import { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { 
  Building2, 
  Mail, 
  Calendar, 
  TrendingUp, 
  Calculator,
  Megaphone,
  Clock,
  History
} from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { useAcquisitionChannels } from "@/hooks/useAcquisitionChannels";
import { updateLeadChannel } from "@/services/leadChannel.service";
import { LeadActivityTimeline } from "./LeadActivityTimeline";

// Helper para formatear moneda
const formatCurrency = (value: number | undefined): string => {
  if (value === undefined || value === null) return '-';
  if (value >= 1000000) {
    return `${(value / 1000000).toFixed(1)}M€`;
  } else if (value >= 1000) {
    return `${(value / 1000).toFixed(0)}K€`;
  }
  return `${value.toFixed(0)}€`;
};

export interface LeadDetailData {
  id: string;
  tipo: 'contact' | 'valuation' | 'collaborator';
  nombre: string;
  email: string;
  empresa?: string;
  status: string;
  fecha: string;
  dias: number;
  valoracion?: number;
  facturacion?: number;
  ebitda?: number;
  canal?: string;
  acquisition_channel_id?: string;
}

interface LeadDetailSheetProps {
  lead: LeadDetailData | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function LeadDetailSheet({ lead, open, onOpenChange }: LeadDetailSheetProps) {
  const queryClient = useQueryClient();
  const { data: channels = [] } = useAcquisitionChannels();
  const [selectedChannelId, setSelectedChannelId] = useState<string | undefined>(undefined);

  // Sincronizar el canal seleccionado cuando cambia el lead
  useEffect(() => {
    if (lead?.acquisition_channel_id) {
      setSelectedChannelId(lead.acquisition_channel_id);
    } else {
      setSelectedChannelId(undefined);
    }
  }, [lead?.acquisition_channel_id, lead?.id]);

  const updateChannelMutation = useMutation({
    mutationFn: async (channelId: string | null) => {
      if (!lead) throw new Error("No hay lead seleccionado");
      await updateLeadChannel(lead.id, lead.tipo, channelId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['gestion-leads'] });
      toast.success('Canal actualizado correctamente');
    },
    onError: (error) => {
      toast.error('Error al actualizar el canal');
      console.error(error);
    }
  });

  const handleChannelChange = (value: string) => {
    const channelId = value === "none" ? null : value;
    setSelectedChannelId(channelId || undefined);
    updateChannelMutation.mutate(channelId);
  };

  if (!lead) return null;

  const tipoLabels = {
    contact: 'Contacto',
    valuation: 'Valoración',
    collaborator: 'Colaborador'
  };

  const tipoBadgeColors = {
    contact: 'bg-blue-500',
    valuation: 'bg-purple-500',
    collaborator: 'bg-green-500'
  };

  const statusLabels: Record<string, string> = {
    new: 'Nuevo',
    contacted: 'En Contacto',
    qualified: 'Calificado',
    converted: 'Convertido'
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-[400px] sm:w-[540px] overflow-y-auto">
        <SheetHeader>
          <div className="flex items-center gap-2">
            <Badge className={`${tipoBadgeColors[lead.tipo]} text-white`}>
              {tipoLabels[lead.tipo]}
            </Badge>
            <Badge variant={lead.status === 'converted' ? 'default' : 'secondary'}>
              {statusLabels[lead.status] || lead.status}
            </Badge>
          </div>
          <SheetTitle className="text-xl">{lead.nombre}</SheetTitle>
          <SheetDescription className="flex items-center gap-2">
            <Mail className="w-4 h-4" />
            {lead.email}
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          {/* Información básica */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
              Información de contacto
            </h3>
            
            {lead.empresa && (
              <div className="flex items-center gap-3">
                <Building2 className="w-4 h-4 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Empresa</p>
                  <p className="font-medium">{lead.empresa}</p>
                </div>
              </div>
            )}

            <div className="flex items-center gap-3">
              <Calendar className="w-4 h-4 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Fecha de registro</p>
                <p className="font-medium">
                  {format(new Date(lead.fecha), "d 'de' MMMM, yyyy", { locale: es })}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Clock className="w-4 h-4 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Días sin actividad</p>
                <p className={`font-medium ${lead.dias > 7 ? 'text-destructive' : ''}`}>
                  {lead.dias} días
                </p>
              </div>
            </div>
          </div>

          <Separator />

          {/* Canal de Adquisición */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Megaphone className="w-4 h-4 text-muted-foreground" />
              <Label className="text-sm font-medium">Canal de Adquisición</Label>
            </div>
            <Select 
              value={selectedChannelId || "none"} 
              onValueChange={handleChannelChange}
              disabled={updateChannelMutation.isPending}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Seleccionar canal..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Sin canal asignado</SelectItem>
                {channels.map((channel) => (
                  <SelectItem key={channel.id} value={channel.id}>
                    {channel.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {updateChannelMutation.isPending && (
              <p className="text-xs text-muted-foreground">Guardando...</p>
            )}
          </div>

          {/* Datos financieros (solo para valuations) */}
          {lead.tipo === 'valuation' && (
            <>
              <Separator />
              <div className="space-y-4">
                <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                  Datos Financieros
                </h3>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800">
                    <div className="flex items-center gap-2 mb-1">
                      <TrendingUp className="w-4 h-4 text-amber-600" />
                      <span className="text-xs text-amber-700 dark:text-amber-400 uppercase">Valoración</span>
                    </div>
                    <p className="text-lg font-bold text-amber-700 dark:text-amber-400">
                      {formatCurrency(lead.valoracion)}
                    </p>
                  </div>

                  <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800">
                    <div className="flex items-center gap-2 mb-1">
                      <Building2 className="w-4 h-4 text-blue-600" />
                      <span className="text-xs text-blue-700 dark:text-blue-400 uppercase">Facturación</span>
                    </div>
                    <p className="text-lg font-bold text-blue-700 dark:text-blue-400">
                      {formatCurrency(lead.facturacion)}
                    </p>
                  </div>

                  <div className="p-3 rounded-lg bg-purple-50 dark:bg-purple-950/20 border border-purple-200 dark:border-purple-800 col-span-2">
                    <div className="flex items-center gap-2 mb-1">
                      <Calculator className="w-4 h-4 text-purple-600" />
                      <span className="text-xs text-purple-700 dark:text-purple-400 uppercase">EBITDA</span>
                    </div>
                    <p className="text-lg font-bold text-purple-700 dark:text-purple-400">
                      {formatCurrency(lead.ebitda)}
                    </p>
                  </div>
                </div>
              </div>
            </>
          )}

          <Separator />

          {/* Historial de Actividades */}
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide flex items-center gap-2">
              <History className="w-4 h-4" />
              Historial de Actividades
            </h3>
            <LeadActivityTimeline leadId={lead.id} leadType={lead.tipo} />
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
