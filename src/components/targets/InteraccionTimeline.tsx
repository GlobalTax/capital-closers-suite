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
import { Mail, Phone, Users, FileText, Plus, MessageCircle, Linkedin, MapPin } from "lucide-react";
import type { Interaccion } from "@/services/interacciones";
import { createInteraccion } from "@/services/interacciones";
import { toast } from "sonner";
import { useForm } from "react-hook-form";

interface InteraccionTimelineProps {
  interacciones: Interaccion[];
  empresaId: string;
  mandatoId?: string;
  onUpdate: () => void;
}

const iconMap: Record<string, React.ElementType> = {
  email: Mail,
  llamada: Phone,
  reunion: Users,
  nota: FileText,
  whatsapp: MessageCircle,
  linkedin: Linkedin,
  visita: MapPin,
};

const colorMap: Record<string, string> = {
  email: "text-blue-500",
  llamada: "text-green-500",
  reunion: "text-purple-500",
  nota: "text-muted-foreground",
  whatsapp: "text-emerald-500",
  linkedin: "text-sky-600",
  visita: "text-orange-500",
};

interface FormData {
  tipo: 'llamada' | 'email' | 'reunion' | 'nota' | 'whatsapp' | 'linkedin' | 'visita';
  titulo: string;
  descripcion: string;
  fecha: string;
}

export function InteraccionTimeline({ interacciones, empresaId, mandatoId, onUpdate }: InteraccionTimelineProps) {
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const { register, handleSubmit, reset, setValue, watch } = useForm<FormData>({
    defaultValues: {
      tipo: "email",
      titulo: "",
      descripcion: "",
      fecha: new Date().toISOString().slice(0, 16),
    },
  });

  const onSubmit = async (data: FormData) => {
    setSaving(true);
    try {
      await createInteraccion({
        empresa_id: empresaId,
        mandato_id: mandatoId,
        tipo: data.tipo,
        titulo: data.titulo,
        descripcion: data.descripcion || undefined,
        fecha: new Date(data.fecha).toISOString(),
      });
      toast.success("Interacción registrada");
      setOpen(false);
      reset();
      onUpdate();
    } catch (error) {
      console.error("Error al crear interacción:", error);
      toast.error("Error al registrar interacción");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">Timeline de Interacciones</CardTitle>
          <Drawer open={open} onOpenChange={setOpen}>
            <DrawerTrigger asChild>
              <Button size="sm">
                <Plus className="w-4 h-4 mr-2" />
                Nueva Interacción
              </Button>
            </DrawerTrigger>
            <DrawerContent>
              <form onSubmit={handleSubmit(onSubmit)}>
                <DrawerHeader>
                  <DrawerTitle>Nueva Interacción</DrawerTitle>
                  <DrawerDescription>Registra una nueva interacción con la empresa</DrawerDescription>
                </DrawerHeader>
                <div className="px-4 space-y-4">
                  <div className="space-y-2">
                    <Label>Tipo de Interacción</Label>
                    <Select
                      value={watch("tipo")}
                      onValueChange={(value) => setValue("tipo", value as FormData['tipo'])}
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
                        <SelectItem value="whatsapp">
                          <div className="flex items-center gap-2">
                            <MessageCircle className="w-4 h-4" />
                            WhatsApp
                          </div>
                        </SelectItem>
                        <SelectItem value="linkedin">
                          <div className="flex items-center gap-2">
                            <Linkedin className="w-4 h-4" />
                            LinkedIn
                          </div>
                        </SelectItem>
                        <SelectItem value="visita">
                          <div className="flex items-center gap-2">
                            <MapPin className="w-4 h-4" />
                            Visita
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
                  <Button type="submit" disabled={saving}>
                    {saving ? "Guardando..." : "Guardar Interacción"}
                  </Button>
                  <DrawerClose asChild>
                    <Button variant="outline" type="button">Cancelar</Button>
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
                  const Icon = iconMap[interaccion.tipo] || FileText;
                  const colorClass = colorMap[interaccion.tipo] || "text-muted-foreground";

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
