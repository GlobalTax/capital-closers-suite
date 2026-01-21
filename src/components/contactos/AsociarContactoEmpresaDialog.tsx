import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ContactoSearchList } from "./ContactoSearchList";
import { searchContactos, asociarContactoAEmpresa } from "@/services/contactos";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { Search, Loader2, Link, UserPlus } from "lucide-react";
import type { Contacto } from "@/types";

interface AsociarContactoEmpresaDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  empresaId: string;
  empresaNombre?: string;
  onSuccess?: () => void;
}

export function AsociarContactoEmpresaDialog({
  open,
  onOpenChange,
  empresaId,
  empresaNombre,
  onSuccess,
}: AsociarContactoEmpresaDialogProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedContacto, setSelectedContacto] = useState<Contacto | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Búsqueda de contactos
  const { data: contactos = [], isLoading: isSearching } = useQuery({
    queryKey: ["contactos-search", searchQuery],
    queryFn: () => searchContactos(searchQuery),
    enabled: searchQuery.length >= 2,
    staleTime: 30000,
  });

  const handleClose = () => {
    setSearchQuery("");
    setSelectedContacto(null);
    onOpenChange(false);
  };

  const handleSubmit = async () => {
    if (!selectedContacto) {
      toast.error("Selecciona un contacto");
      return;
    }

    setIsSubmitting(true);
    try {
      await asociarContactoAEmpresa(selectedContacto.id, empresaId);
      
      toast.success("Contacto asociado", {
        description: `${selectedContacto.nombre} ${selectedContacto.apellidos || ''} ahora está vinculado a ${empresaNombre || 'la empresa'}.`,
      });
      
      handleClose();
      onSuccess?.();
    } catch (error: any) {
      console.error("[AsociarContactoEmpresaDialog] Error:", error);
      toast.error("Error al asociar contacto", {
        description: error.message || "No se pudo vincular el contacto a la empresa",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Link className="h-5 w-5" />
            Asociar Contacto Existente
          </DialogTitle>
          <DialogDescription>
            Busca y selecciona un contacto del CRM para vincularlo a{" "}
            {empresaNombre ? <strong>{empresaNombre}</strong> : "esta empresa"}.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Búsqueda */}
          <div className="space-y-2">
            <Label htmlFor="search-contacto">Buscar contacto</Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="search-contacto"
                placeholder="Nombre, email o empresa..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
                autoFocus
              />
            </div>
          </div>

          {/* Resultados de búsqueda */}
          <div className="min-h-[200px] max-h-[300px] overflow-y-auto border rounded-md">
            {searchQuery.length < 2 ? (
              <div className="flex flex-col items-center justify-center h-[200px] text-center text-muted-foreground p-4">
                <UserPlus className="h-10 w-10 mb-2 opacity-50" />
                <p className="text-sm">Escribe al menos 2 caracteres para buscar</p>
              </div>
            ) : isSearching ? (
              <div className="flex items-center justify-center h-[200px]">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : contactos.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-[200px] text-center text-muted-foreground p-4">
                <p className="text-sm">No se encontraron contactos</p>
                <p className="text-xs mt-1">Prueba con otro término de búsqueda</p>
              </div>
            ) : (
              <ContactoSearchList
                contactos={contactos}
                selectedId={selectedContacto?.id}
                onSelect={setSelectedContacto}
              />
            )}
          </div>

          {/* Contacto seleccionado */}
          {selectedContacto && (
            <div className="bg-primary/5 border border-primary/20 rounded-md p-3">
              <p className="text-sm font-medium">Contacto seleccionado:</p>
              <p className="text-sm text-muted-foreground">
                {selectedContacto.nombre} {selectedContacto.apellidos || ""}
                {selectedContacto.email && ` — ${selectedContacto.email}`}
              </p>
              {selectedContacto.empresa_principal && (
                <p className="text-xs text-muted-foreground mt-1">
                  Empresa actual: {selectedContacto.empresa_principal.nombre}
                </p>
              )}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={isSubmitting}>
            Cancelar
          </Button>
          <Button 
            onClick={handleSubmit} 
            disabled={!selectedContacto || isSubmitting}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Asociando...
              </>
            ) : (
              <>
                <Link className="h-4 w-4 mr-2" />
                Asociar Contacto
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
