import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Mail, Phone, Users, FileText, Plus, Calendar } from "lucide-react";
import type { Interaccion } from "@/types";
import { updateTarget } from "@/services/api";
import { toast } from "sonner";
import { useForm } from "react-hook-form";

interface InteraccionTimelineProps {
  interacciones: Interaccion[];
  targetId: string;
  onUpdate: () => void;
}

const iconMap = {
  email: Mail,
  llamada: Phone,
  reunion: Users,
  nota: FileText,
};

const colorMap = {
  email: "text-blue-500",
  llamada: "text-green-500",
  reunion: "text-purple-500",
  nota: "text-gray-500",
};

export function InteraccionTimeline({ interacciones, targetId, onUpdate }: InteraccionTimelineProps) {
  const [open, setOpen] = useState(false);
  const { register, handleSubmit, reset, setValue, watch } = useForm({
    defaultValues: {
      tipo: "email" as const,
      titulo: "",
      descripcion: "",
      fecha: new Date().toISOString().slice(0, 16),
    },
  });

  const onSubmit = async (data: any) => {
    try {
      const nuevaInteraccion: Interaccion = {
        id: `INT-${Date.now()}`,
        tipo: data.tipo,
        titulo: data.titulo,
        descripcion: data.descripcion,
        fecha: new Date(data.fecha).toISOString(),
        responsable: "Usuario Actual",
      };

      await updateTarget(targetId, {
        interacciones: [...interacciones, nuevaInteraccion],
        ultimaActividad: new Date().toISOString().split("T")[0],
      });

      toast.success("Interacción registrada correctamente");
      setOpen(false);
      reset();
      onUpdate();
    } catch (error) {
      toast.error("Error al registrar interacción");
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Timeline de Interacciones</CardTitle>
          <Drawer open={open} onOpenChange={setOpen}>
            <DrawerTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Nueva Interacción
              </Button>
            </DrawerTrigger>
            <DrawerContent>
              <form onSubmit={handleSubmit(onSubmit)}>
                <DrawerHeader>
                  <DrawerTitle>Nueva Interacción</DrawerTitle>
                  <DrawerDescription>Registra una nueva interacción con el target</DrawerDescription>
                </DrawerHeader>
                <div className="px-4 space-y-4">
                  <div className="space-y-2">
                    <Label>Tipo de Interacción</Label>
                    <Select
                      value={watch("tipo")}
                      onValueChange={(value) => setValue("tipo", value as any)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="email">
                          <div className="flex items-center gap-2">
                            <Mail className="w-4 h-4" />
                            Email
                          </div>
                        </SelectItem>
                        <SelectItem value="llamada">
                          <div className="flex items-center gap-2">
                            <Phone className="w-4 h-4" />
                            Llamada
                          </div>
                        </SelectItem>
                        <SelectItem value="reunion">
                          <div className="flex items-center gap-2">
                            <Users className="w-4 h-4" />
                            Reunión
                          </div>
                        </SelectItem>
                        <SelectItem value="nota">
                          <div className="flex items-center gap-2">
                            <FileText className="w-4 h-4" />
                            Nota
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="titulo">Título</Label>
                    <Input
                      id="titulo"
                      {...register("titulo", { required: true })}
                      placeholder="Ej: Primera llamada de contacto"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="descripcion">Descripción</Label>
                    <Textarea
                      id="descripcion"
                      {...register("descripcion")}
                      placeholder="Detalles de la interacción..."
                      rows={3}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="fecha">Fecha y Hora</Label>
                    <Input id="fecha" type="datetime-local" {...register("fecha")} />
                  </div>
                </div>
                <DrawerFooter>
                  <Button type="submit">Guardar Interacción</Button>
                  <DrawerClose asChild>
                    <Button variant="outline">Cancelar</Button>
                  </DrawerClose>
                </DrawerFooter>
              </form>
            </DrawerContent>
          </Drawer>
        </div>
      </CardHeader>
      <CardContent>
        {interacciones.length > 0 ? (
          <div className="relative">
            <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-border" />
            <div className="space-y-6">
              {interacciones
                .sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime())
                .map((interaccion) => {
                  const Icon = iconMap[interaccion.tipo];
                  const colorClass = colorMap[interaccion.tipo];

                  return (
                    <div key={interaccion.id} className="relative pl-10">
                      <div
                        className={`absolute left-0 w-8 h-8 rounded-full bg-background border-2 border-border flex items-center justify-center ${colorClass}`}
                      >
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="bg-muted/50 rounded-lg p-4 space-y-2">
                        <div className="flex items-start justify-between">
                          <div>
                            <h4 className="font-medium">{interaccion.titulo}</h4>
                            <p className="text-xs text-muted-foreground">
                              {interaccion.responsable} •{" "}
                              {new Date(interaccion.fecha).toLocaleDateString("es-ES", {
                                year: "numeric",
                                month: "long",
                                day: "numeric",
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </p>
                          </div>
                        </div>
                        {interaccion.descripcion && (
                          <p className="text-sm text-muted-foreground">{interaccion.descripcion}</p>
                        )}
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <FileText className="w-12 h-12 mx-auto mb-2 opacity-20" />
            <p>No hay interacciones registradas</p>
            <p className="text-sm">Haz clic en "Nueva Interacción" para comenzar</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
