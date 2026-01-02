import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { GitMerge, Search, AlertTriangle, User, Building2, Mail, Loader2 } from "lucide-react";
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
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useContactosSearch } from "@/hooks/useContactosSearch";
import { mergeContactos } from "@/services/contactoMerge.service";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import type { Contacto } from "@/types";

interface MergeContactoDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sourceContacto: Contacto;
}

export function MergeContactoDialog({ open, onOpenChange, sourceContacto }: MergeContactoDialogProps) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTarget, setSelectedTarget] = useState<Contacto | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [step, setStep] = useState<"search" | "confirm">("search");
  
  const { contactos, loading: searchLoading } = useContactosSearch(searchQuery);
  
  // Filtrar el contacto origen de los resultados
  const filteredContactos = contactos.filter(c => c.id !== sourceContacto.id);
  
  const getInitials = (nombre: string, apellidos?: string) => {
    return `${nombre.charAt(0)}${apellidos?.charAt(0) || ""}`.toUpperCase();
  };
  
  const handleSelectTarget = (contacto: Contacto) => {
    setSelectedTarget(contacto);
    setStep("confirm");
  };
  
  const handleBack = () => {
    setStep("search");
    setSelectedTarget(null);
  };
  
  const handleMerge = async () => {
    if (!selectedTarget) return;
    
    setIsLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user?.id) {
        toast.error("Debes estar autenticado para fusionar contactos");
        return;
      }
      
      const result = await mergeContactos(sourceContacto.id, selectedTarget.id, user.id);
      
      const totalMoved = result.counts.interacciones + result.counts.mandatos + result.counts.documentos;
      toast.success(`Contacto fusionado correctamente. ${totalMoved} elementos transferidos.`);
      
      // Invalidar queries
      queryClient.invalidateQueries({ queryKey: ['contactos'] });
      queryClient.invalidateQueries({ queryKey: ['contacto', sourceContacto.id] });
      queryClient.invalidateQueries({ queryKey: ['contacto', selectedTarget.id] });
      
      onOpenChange(false);
      navigate(`/contactos/${selectedTarget.id}`);
    } catch (error: any) {
      toast.error(error?.message || "Error al fusionar contactos");
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleClose = () => {
    setSearchQuery("");
    setSelectedTarget(null);
    setStep("search");
    onOpenChange(false);
  };
  
  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <GitMerge className="h-5 w-5" />
            Fusionar Contacto
          </DialogTitle>
          <DialogDescription>
            {step === "search" 
              ? "Busca y selecciona el contacto destino donde se moverán todas las relaciones."
              : "Revisa y confirma la fusión de contactos."
            }
          </DialogDescription>
        </DialogHeader>
        
        {step === "search" ? (
          <div className="space-y-4">
            {/* Contacto origen */}
            <div className="p-3 bg-muted rounded-lg">
              <p className="text-xs text-muted-foreground mb-2">Contacto a fusionar (origen):</p>
              <div className="flex items-center gap-3">
                <Avatar className="h-10 w-10">
                  <AvatarFallback>{getInitials(sourceContacto.nombre, sourceContacto.apellidos)}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium">{sourceContacto.nombre} {sourceContacto.apellidos}</p>
                  <p className="text-sm text-muted-foreground">{sourceContacto.email}</p>
                </div>
              </div>
            </div>
            
            {/* Búsqueda */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar contacto destino por nombre, email, empresa..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            
            {/* Resultados */}
            <div className="max-h-60 overflow-y-auto space-y-2">
              {searchLoading && (
                <div className="flex items-center justify-center py-4">
                  <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                </div>
              )}
              
              {!searchLoading && filteredContactos.length === 0 && searchQuery.length >= 2 && (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No se encontraron contactos
                </p>
              )}
              
              {filteredContactos.map((contacto) => (
                <div
                  key={contacto.id}
                  className="flex items-center gap-3 p-3 border rounded-lg hover:bg-accent cursor-pointer transition-colors"
                  onClick={() => handleSelectTarget(contacto)}
                >
                  <Avatar className="h-10 w-10">
                    <AvatarFallback>{getInitials(contacto.nombre, contacto.apellidos)}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{contacto.nombre} {contacto.apellidos}</p>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      {contacto.email && (
                        <span className="flex items-center gap-1 truncate">
                          <Mail className="h-3 w-3" />
                          {contacto.email}
                        </span>
                      )}
                      {contacto.empresa_principal && (
                        <span className="flex items-center gap-1 truncate">
                          <Building2 className="h-3 w-3" />
                          {contacto.empresa_principal.nombre}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Preview de fusión */}
            <div className="grid grid-cols-[1fr_auto_1fr] gap-4 items-center">
              {/* Origen */}
              <div className="p-3 border rounded-lg bg-destructive/5 border-destructive/20">
                <p className="text-xs text-muted-foreground mb-2">Se eliminará de listados:</p>
                <div className="flex items-center gap-2">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="text-xs">{getInitials(sourceContacto.nombre, sourceContacto.apellidos)}</AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <p className="font-medium text-sm truncate">{sourceContacto.nombre} {sourceContacto.apellidos}</p>
                    <p className="text-xs text-muted-foreground truncate">{sourceContacto.email}</p>
                  </div>
                </div>
              </div>
              
              {/* Flecha */}
              <GitMerge className="h-5 w-5 text-muted-foreground" />
              
              {/* Destino */}
              <div className="p-3 border rounded-lg bg-primary/5 border-primary/20">
                <p className="text-xs text-muted-foreground mb-2">Recibirá todo:</p>
                <div className="flex items-center gap-2">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="text-xs">{getInitials(selectedTarget!.nombre, selectedTarget!.apellidos)}</AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <p className="font-medium text-sm truncate">{selectedTarget!.nombre} {selectedTarget!.apellidos}</p>
                    <p className="text-xs text-muted-foreground truncate">{selectedTarget!.email}</p>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Warning */}
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <strong>Esta acción no se puede deshacer.</strong> Todas las interacciones, mandatos y documentos del contacto origen se moverán al contacto destino.
              </AlertDescription>
            </Alert>
          </div>
        )}
        
        <DialogFooter>
          {step === "search" ? (
            <Button variant="outline" onClick={handleClose}>
              Cancelar
            </Button>
          ) : (
            <>
              <Button variant="outline" onClick={handleBack} disabled={isLoading}>
                Volver
              </Button>
              <Button 
                variant="destructive" 
                onClick={handleMerge}
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Fusionando...
                  </>
                ) : (
                  <>
                    <GitMerge className="h-4 w-4 mr-2" />
                    Confirmar Fusión
                  </>
                )}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
