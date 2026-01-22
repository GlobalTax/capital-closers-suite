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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { EmpresaSelect } from "@/components/shared/EmpresaSelect";
import { useCreateEmpresa } from "@/hooks/queries/useEmpresas";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Building2, Plus, Loader2 } from "lucide-react";
import type { Empresa } from "@/types";

interface AsignarEmpresaMasivaDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mandatoIds: string[];
  onSuccess?: () => void;
}

export function AsignarEmpresaMasivaDialog({
  open,
  onOpenChange,
  mandatoIds,
  onSuccess,
}: AsignarEmpresaMasivaDialogProps) {
  const [selectedEmpresaId, setSelectedEmpresaId] = useState<string | undefined>();
  const [nuevaEmpresaNombre, setNuevaEmpresaNombre] = useState("");
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("existente");

  const createEmpresa = useCreateEmpresa();

  const handleAsignarExistente = async () => {
    if (!selectedEmpresaId) {
      toast.error("Selecciona una empresa");
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from("mandatos")
        .update({ empresa_principal_id: selectedEmpresaId })
        .in("id", mandatoIds);

      if (error) throw error;

      toast.success(`Empresa asignada a ${mandatoIds.length} mandato(s)`);
      resetForm();
      onSuccess?.();
      onOpenChange(false);
    } catch (error) {
      console.error("Error asignando empresa:", error);
      toast.error("Error al asignar la empresa");
    } finally {
      setLoading(false);
    }
  };

  const handleCrearYAsignar = async () => {
    if (!nuevaEmpresaNombre.trim()) {
      toast.error("Ingresa el nombre de la empresa");
      return;
    }

    setLoading(true);
    try {
      // Crear la nueva empresa
      const nuevaEmpresa = await createEmpresa.mutateAsync({
        nombre: nuevaEmpresaNombre.trim(),
        sector: "Por definir",
        es_target: false,
      });

      // Asignar a todos los mandatos
      const { error } = await supabase
        .from("mandatos")
        .update({ empresa_principal_id: nuevaEmpresa.id })
        .in("id", mandatoIds);

      if (error) throw error;

      toast.success(`Empresa "${nuevaEmpresaNombre}" creada y asignada a ${mandatoIds.length} mandato(s)`);
      resetForm();
      onSuccess?.();
      onOpenChange(false);
    } catch (error) {
      console.error("Error creando y asignando empresa:", error);
      toast.error("Error al crear y asignar la empresa");
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setSelectedEmpresaId(undefined);
    setNuevaEmpresaNombre("");
    setActiveTab("existente");
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      resetForm();
    }
    onOpenChange(newOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Asignar Empresa
          </DialogTitle>
          <DialogDescription>
            Asignar empresa a {mandatoIds.length} mandato{mandatoIds.length !== 1 ? "s" : ""} seleccionado{mandatoIds.length !== 1 ? "s" : ""}
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="existente">
              <Building2 className="h-4 w-4 mr-2" />
              Existente
            </TabsTrigger>
            <TabsTrigger value="nueva">
              <Plus className="h-4 w-4 mr-2" />
              Nueva
            </TabsTrigger>
          </TabsList>

          <TabsContent value="existente" className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label>Buscar empresa</Label>
              <EmpresaSelect
                value={selectedEmpresaId}
                onValueChange={(id) => setSelectedEmpresaId(id)}
                placeholder="Buscar por nombre o CIF..."
                allowClear
              />
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => handleOpenChange(false)} disabled={loading}>
                Cancelar
              </Button>
              <Button onClick={handleAsignarExistente} disabled={loading || !selectedEmpresaId}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Asignar a {mandatoIds.length}
              </Button>
            </DialogFooter>
          </TabsContent>

          <TabsContent value="nueva" className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label htmlFor="nombre">Nombre de la empresa</Label>
              <Input
                id="nombre"
                value={nuevaEmpresaNombre}
                onChange={(e) => setNuevaEmpresaNombre(e.target.value)}
                placeholder="Ej: Empresa XYZ S.L."
              />
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => handleOpenChange(false)} disabled={loading}>
                Cancelar
              </Button>
              <Button onClick={handleCrearYAsignar} disabled={loading || !nuevaEmpresaNombre.trim()}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Crear y Asignar
              </Button>
            </DialogFooter>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
