import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Search, Loader2 } from "lucide-react";
import { ContactoSearchList } from "./ContactoSearchList";
import { useContactosSearch } from "@/hooks/useContactosSearch";
import { addContactoToMandato } from "@/services/mandatos";
import type { Contacto, ContactoRol } from "@/types";
import { toast } from "@/hooks/use-toast";
import { handleError } from "@/lib/error-handler";

const ROLES: ContactoRol[] = [
  "vendedor",
  "comprador",
  "asesor",
  "intermediario",
  "otro",
];

const asociarSchema = z.object({
  rol: z.enum(["vendedor", "comprador", "asesor", "intermediario", "otro"] as const, {
    required_error: "Selecciona un rol",
  }),
  notas: z.string().optional(),
});

type AsociarFormValues = z.infer<typeof asociarSchema>;

interface AsociarContactoDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mandatoId: string;
  onSuccess: () => void;
}

export function AsociarContactoDialog({
  open,
  onOpenChange,
  mandatoId,
  onSuccess,
}: AsociarContactoDialogProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedContacto, setSelectedContacto] = useState<Contacto | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const { contactos, loading: searchLoading } = useContactosSearch(searchQuery);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    reset,
  } = useForm<AsociarFormValues>({
    resolver: zodResolver(asociarSchema),
  });

  const handleClose = () => {
    setSearchQuery("");
    setSelectedContacto(null);
    reset();
    onOpenChange(false);
  };

  const onSubmit = async (values: AsociarFormValues) => {
    if (!selectedContacto) {
      toast({
        title: "Error",
        description: "Debes seleccionar un contacto",
        variant: "destructive",
      });
      return;
    }

    setSubmitting(true);
    try {
      await addContactoToMandato(
        mandatoId,
        selectedContacto.id,
        values.rol,
        values.notas
      );
      
      toast({
        title: "Éxito",
        description: "Contacto asociado al mandato correctamente",
      });
      
      handleClose();
      onSuccess();
    } catch (error: any) {
      // Check for duplicate key error
      if (error?.supabaseError?.code === '23505') {
        toast({
          title: "Contacto ya asociado",
          description: "Este contacto ya está vinculado a este mandato",
          variant: "destructive",
        });
      } else {
        handleError(error, 'Asociar contacto');
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Asociar Contacto Existente</DialogTitle>
          <DialogDescription>
            Busca y vincula un contacto existente a este mandato
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Búsqueda */}
          <div className="space-y-2">
            <Label htmlFor="search">Buscar contacto</Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="search"
                placeholder="Buscar por nombre, email, teléfono, cargo o empresa..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
              {searchLoading && (
                <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              Escribe al menos 2 caracteres para buscar
            </p>
          </div>

          {/* Resultados de búsqueda */}
          {searchQuery.length >= 2 && (
            <div className="space-y-2">
              <Label>Resultados ({contactos.length})</Label>
              <ContactoSearchList
                contactos={contactos}
                selectedId={selectedContacto?.id}
                onSelect={setSelectedContacto}
              />
            </div>
          )}

          {/* Vista previa del contacto seleccionado */}
          {selectedContacto && (
            <div className="p-4 border rounded-lg bg-muted/30 space-y-4">
              <h4 className="font-medium">Contacto seleccionado:</h4>
              <div className="text-sm space-y-1">
                <p><strong>Nombre:</strong> {selectedContacto.nombre} {selectedContacto.apellidos}</p>
                {selectedContacto.cargo && <p><strong>Cargo:</strong> {selectedContacto.cargo}</p>}
                <p><strong>Email:</strong> {selectedContacto.email}</p>
                {selectedContacto.telefono && <p><strong>Teléfono:</strong> {selectedContacto.telefono}</p>}
                {selectedContacto.empresa_principal && (
                  <p><strong>Empresa:</strong> {selectedContacto.empresa_principal.nombre}</p>
                )}
              </div>
            </div>
          )}

          {/* Rol */}
          <div className="space-y-2">
            <Label htmlFor="rol">
              Rol en el mandato <span className="text-destructive">*</span>
            </Label>
            <Select onValueChange={(value) => setValue("rol", value as ContactoRol)}>
              <SelectTrigger id="rol">
                <SelectValue placeholder="Selecciona un rol" />
              </SelectTrigger>
              <SelectContent>
                {ROLES.map((rol) => (
                  <SelectItem key={rol} value={rol}>
                    {rol.replace("_", " ").toUpperCase()}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.rol && (
              <p className="text-sm text-destructive">{errors.rol.message}</p>
            )}
          </div>

          {/* Notas */}
          <div className="space-y-2">
            <Label htmlFor="notas">Notas sobre su participación</Label>
            <Textarea
              id="notas"
              placeholder="Ej: Responsable de la negociación de precio..."
              {...register("notas")}
              rows={3}
            />
          </div>

          <DialogFooter className="gap-2">
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancelar
            </Button>
            <Button 
              type="submit" 
              disabled={!selectedContacto || submitting}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Asociar Contacto
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
