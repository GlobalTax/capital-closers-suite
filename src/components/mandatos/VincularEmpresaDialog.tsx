import { useState } from "react";
import { Building2, Link2, Plus } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { EmpresaSelect } from "@/components/shared/EmpresaSelect";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useCreateEmpresa } from "@/hooks/queries/useEmpresas";
import type { Empresa } from "@/types";

interface VincularEmpresaDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onVincular: (empresaId: string) => Promise<void>;
  tipoMandato?: "compra" | "venta";
}

export function VincularEmpresaDialog({
  open,
  onOpenChange,
  onVincular,
  tipoMandato = "venta",
}: VincularEmpresaDialogProps) {
  const [selectedEmpresaId, setSelectedEmpresaId] = useState<string>();
  const [nuevaEmpresaNombre, setNuevaEmpresaNombre] = useState("");
  const [loading, setLoading] = useState(false);
  const createEmpresa = useCreateEmpresa();

  const handleVincularExistente = async () => {
    if (!selectedEmpresaId) return;
    setLoading(true);
    try {
      await onVincular(selectedEmpresaId);
      onOpenChange(false);
      setSelectedEmpresaId(undefined);
    } finally {
      setLoading(false);
    }
  };

  const handleCrearYVincular = async () => {
    if (!nuevaEmpresaNombre.trim()) return;
    setLoading(true);
    try {
      const nuevaEmpresa = await createEmpresa.mutateAsync({
        nombre: nuevaEmpresaNombre.trim(),
        sector: "Por definir",
        es_target: tipoMandato === "compra",
      });
      await onVincular(nuevaEmpresa.id);
      onOpenChange(false);
      setNuevaEmpresaNombre("");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Vincular Empresa
          </DialogTitle>
          <DialogDescription>
            Vincula una empresa existente o crea una nueva para este mandato.
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="existente" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="existente" className="flex items-center gap-1.5">
              <Link2 className="h-3.5 w-3.5" />
              Existente
            </TabsTrigger>
            <TabsTrigger value="nueva" className="flex items-center gap-1.5">
              <Plus className="h-3.5 w-3.5" />
              Nueva
            </TabsTrigger>
          </TabsList>

          <TabsContent value="existente" className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label>Seleccionar empresa</Label>
              <EmpresaSelect
                value={selectedEmpresaId}
                onValueChange={(id) => setSelectedEmpresaId(id)}
                placeholder="Buscar empresa..."
              />
            </div>
            <Button
              onClick={handleVincularExistente}
              disabled={!selectedEmpresaId || loading}
              className="w-full"
            >
              {loading ? "Vinculando..." : "Vincular Empresa"}
            </Button>
          </TabsContent>

          <TabsContent value="nueva" className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label>Nombre de la empresa</Label>
              <div className="relative">
                <Building2 className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Nombre de la nueva empresa"
                  value={nuevaEmpresaNombre}
                  onChange={(e) => setNuevaEmpresaNombre(e.target.value)}
                  className="pl-9"
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Se creará como {tipoMandato === "compra" ? "target" : "cliente"}. Podrás editar los detalles después.
              </p>
            </div>
            <Button
              onClick={handleCrearYVincular}
              disabled={!nuevaEmpresaNombre.trim() || loading}
              className="w-full"
            >
              {loading ? "Creando..." : "Crear y Vincular"}
            </Button>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
