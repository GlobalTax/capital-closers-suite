import { useState, useEffect } from "react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { fetchEmpresas } from "@/services/empresas";
import { addEmpresaToMandato } from "@/services/mandatos";
import type { Empresa, EmpresaRol } from "@/types";
import { Building2, Search, MapPin, Users, Loader2 } from "lucide-react";

const ROLES: { value: EmpresaRol; label: string }[] = [
  { value: "target", label: "Target" },
  { value: "compradora", label: "Compradora" },
  { value: "vendedora", label: "Vendedora" },
  { value: "comparable", label: "Comparable" },
  { value: "competidora", label: "Competidora" },
  { value: "otro", label: "Otro" },
];

interface AsociarEmpresaDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mandatoId: string;
  onSuccess?: () => void;
}

export function AsociarEmpresaDialog({
  open,
  onOpenChange,
  mandatoId,
  onSuccess,
}: AsociarEmpresaDialogProps) {
  const [empresas, setEmpresas] = useState<Empresa[]>([]);
  const [filteredEmpresas, setFilteredEmpresas] = useState<Empresa[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedEmpresa, setSelectedEmpresa] = useState<Empresa | null>(null);
  const [rol, setRol] = useState<EmpresaRol>("target");
  const [notas, setNotas] = useState("");

  useEffect(() => {
    if (open) {
      loadEmpresas();
    }
  }, [open]);

  useEffect(() => {
    if (searchQuery) {
      const filtered = empresas.filter(
        (e) =>
          e.nombre.toLowerCase().includes(searchQuery.toLowerCase()) ||
          e.sector?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          e.ubicacion?.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredEmpresas(filtered);
    } else {
      setFilteredEmpresas(empresas.slice(0, 10));
    }
  }, [searchQuery, empresas]);

  const loadEmpresas = async () => {
    setLoading(true);
    try {
      const data = await fetchEmpresas();
      setEmpresas(data);
      setFilteredEmpresas(data.slice(0, 10));
    } catch (error) {
      console.error("Error cargando empresas:", error);
      toast.error("Error al cargar empresas");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!selectedEmpresa) {
      toast.error("Selecciona una empresa");
      return;
    }

    setSubmitting(true);
    try {
      await addEmpresaToMandato(mandatoId, selectedEmpresa.id, rol, notas || undefined);
      toast.success(`${selectedEmpresa.nombre} asociada como ${rol}`);
      resetForm();
      onOpenChange(false);
      onSuccess?.();
    } catch (error: any) {
      console.error("Error asociando empresa:", error);
      toast.error(error.message || "Error al asociar empresa");
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setSelectedEmpresa(null);
    setSearchQuery("");
    setRol("target");
    setNotas("");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Asociar Empresa Existente</DialogTitle>
          <DialogDescription>
            Busca y asocia una empresa existente a este mandato
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Search */}
          <div className="space-y-2">
            <Label>Buscar empresa</Label>
            <div className="relative">
              <Search className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Nombre, sector o ubicación..."
                className="pl-9"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          {/* Results */}
          <div className="space-y-2">
            <Label>Seleccionar empresa</Label>
            <div className="border rounded-lg max-h-48 overflow-y-auto">
              {loading ? (
                <div className="p-4 space-y-2">
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-12 w-full" />
                  ))}
                </div>
              ) : filteredEmpresas.length === 0 ? (
                <div className="p-4 text-center text-muted-foreground text-sm">
                  No se encontraron empresas
                </div>
              ) : (
                <div className="divide-y">
                  {filteredEmpresas.map((empresa) => (
                    <button
                      key={empresa.id}
                      type="button"
                      className={`w-full p-3 text-left hover:bg-accent transition-colors flex items-start gap-3 ${
                        selectedEmpresa?.id === empresa.id ? "bg-accent" : ""
                      }`}
                      onClick={() => setSelectedEmpresa(empresa)}
                    >
                      <div className="w-10 h-10 rounded bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <Building2 className="w-5 h-5 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium truncate">{empresa.nombre}</div>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          {empresa.sector && <span>{empresa.sector}</span>}
                          {empresa.ubicacion && (
                            <span className="flex items-center gap-0.5">
                              <MapPin className="w-3 h-3" />
                              {empresa.ubicacion}
                            </span>
                          )}
                          {empresa.empleados && (
                            <span className="flex items-center gap-0.5">
                              <Users className="w-3 h-3" />
                              {empresa.empleados}
                            </span>
                          )}
                        </div>
                      </div>
                      {empresa.es_target && (
                        <Badge variant="secondary" className="text-xs">
                          Target
                        </Badge>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {selectedEmpresa && (
            <>
              {/* Selected indicator */}
              <div className="p-3 bg-primary/5 rounded-lg border border-primary/20">
                <div className="text-sm font-medium">Empresa seleccionada:</div>
                <div className="text-primary font-semibold">{selectedEmpresa.nombre}</div>
              </div>

              {/* Role */}
              <div className="space-y-2">
                <Label>Rol en el mandato</Label>
                <Select value={rol} onValueChange={(v) => setRol(v as EmpresaRol)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ROLES.map((r) => (
                      <SelectItem key={r.value} value={r.value}>
                        {r.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Notes */}
              <div className="space-y-2">
                <Label>Notas (opcional)</Label>
                <Textarea
                  placeholder="Notas adicionales sobre esta asociación..."
                  value={notas}
                  onChange={(e) => setNotas(e.target.value)}
                  rows={2}
                />
              </div>
            </>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={!selectedEmpresa || submitting}>
            {submitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Asociar Empresa
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
