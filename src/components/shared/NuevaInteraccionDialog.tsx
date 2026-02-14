import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, Plus } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { createInteraccion } from "@/services/interacciones.service";

interface NuevaInteraccionDialogProps {
  contactoId?: string;
  empresaId?: string;
  mandatoId?: string;
  onSuccess?: () => void;
  trigger?: React.ReactNode;
}

export function NuevaInteraccionDialog({ 
  contactoId, 
  empresaId, 
  mandatoId,
  onSuccess,
  trigger 
}: NuevaInteraccionDialogProps) {
  const [open, setOpen] = useState(false);
  const [fecha, setFecha] = useState<Date>(new Date());
  const [fechaSiguienteAccion, setFechaSiguienteAccion] = useState<Date>();
  const { register, handleSubmit, watch, setValue, reset } = useForm();
  const tipo = watch("tipo");

  const onSubmit = async (data: any) => {
    try {
      await createInteraccion({
        ...data,
        contacto_id: contactoId,
        empresa_id: empresaId,
        mandato_id: mandatoId,
        fecha: fecha.toISOString(),
        fecha_siguiente_accion: fechaSiguienteAccion?.toISOString().split('T')[0],
        duracion_minutos: data.duracion_minutos ? parseInt(data.duracion_minutos) : undefined,
      });

      toast.success("Interacción registrada correctamente");
      setOpen(false);
      reset();
      setFecha(new Date());
      setFechaSiguienteAccion(undefined);
      onSuccess?.();
    } catch (error) {
      console.error(error);
      toast.error("Error al registrar la interacción");
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Nueva Interacción
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Registrar Nueva Interacción</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="tipo">Tipo de Interacción *</Label>
              <Select onValueChange={(value) => setValue("tipo", value)} required>
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona el tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="llamada">📞 Llamada</SelectItem>
                  <SelectItem value="email">📧 Email</SelectItem>
                  <SelectItem value="whatsapp">💬 WhatsApp</SelectItem>
                  <SelectItem value="reunion">🤝 Reunión</SelectItem>
                  <SelectItem value="linkedin">💼 LinkedIn</SelectItem>
                  <SelectItem value="visita">📍 Visita</SelectItem>
                  <SelectItem value="nota">📝 Nota</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Fecha y Hora *</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start text-left font-normal">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {format(fecha, "PPP HH:mm", { locale: es })}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={fecha}
                    onSelect={(date) => date && setFecha(date)}
                    initialFocus
                  />
                  <div className="p-3 border-t">
                    <Label>Hora</Label>
                    <Input
                      type="time"
                      value={format(fecha, "HH:mm")}
                      onChange={(e) => {
                        const [hours, minutes] = e.target.value.split(':');
                        const newFecha = new Date(fecha);
                        newFecha.setHours(parseInt(hours), parseInt(minutes));
                        setFecha(newFecha);
                      }}
                    />
                  </div>
                </PopoverContent>
              </Popover>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="titulo">Título *</Label>
            <Input
              id="titulo"
              {...register("titulo", { required: true })}
              placeholder="Ej: Llamada de seguimiento sobre propuesta"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="descripcion">Descripción</Label>
            <Textarea
              id="descripcion"
              {...register("descripcion")}
              placeholder="Describe los detalles de la interacción..."
              rows={4}
            />
          </div>

          {(tipo === "llamada" || tipo === "reunion") && (
            <div className="space-y-2">
              <Label htmlFor="duracion_minutos">Duración (minutos)</Label>
              <Input
                id="duracion_minutos"
                type="number"
                {...register("duracion_minutos")}
                placeholder="30"
              />
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="resultado">Resultado</Label>
              <Select onValueChange={(value) => setValue("resultado", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona el resultado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="positivo">✅ Positivo</SelectItem>
                  <SelectItem value="neutral">➖ Neutral</SelectItem>
                  <SelectItem value="negativo">❌ Negativo</SelectItem>
                  <SelectItem value="pendiente_seguimiento">⏳ Pendiente Seguimiento</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="siguiente_accion">Siguiente Acción</Label>
            <Textarea
              id="siguiente_accion"
              {...register("siguiente_accion")}
              placeholder="¿Qué acción hay que realizar a continuación?"
              rows={2}
            />
          </div>

          <div className="space-y-2">
            <Label>Fecha de Siguiente Acción</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !fechaSiguienteAccion && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {fechaSiguienteAccion ? format(fechaSiguienteAccion, "PPP", { locale: es }) : "Selecciona una fecha"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={fechaSiguienteAccion}
                  onSelect={setFechaSiguienteAccion}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit">Guardar Interacción</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
