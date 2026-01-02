import { useState, useEffect, useMemo } from "react";
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
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { fetchEmpresas } from "@/services/empresas";
import { addEmpresaToMandato } from "@/services/mandatos";
import type { Empresa, EmpresaRol } from "@/types";
import { Building2, Search, MapPin, Users, Loader2, X } from "lucide-react";

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
  defaultRol?: EmpresaRol;
}

export function AsociarEmpresaDialog({
  open,
  onOpenChange,
  mandatoId,
  onSuccess,
  defaultRol = "target",
}: AsociarEmpresaDialogProps) {
  const [empresas, setEmpresas] = useState<Empresa[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedEmpresas, setSelectedEmpresas] = useState<Empresa[]>([]);
  const [rol, setRol] = useState<EmpresaRol>(defaultRol);

  useEffect(() => {
    if (open) {
      loadEmpresas();
      setRol(defaultRol);
    }
  }, [open, defaultRol]);

  const filteredEmpresas = useMemo(() => {
    if (!searchQuery.trim()) {
      return empresas.slice(0, 20);
    }
    const query = searchQuery.toLowerCase();
    return empresas.filter(
      (e) =>
        e.nombre.toLowerCase().includes(query) ||
        e.sector?.toLowerCase().includes(query) ||
        e.ubicacion?.toLowerCase().includes(query)
    ).slice(0, 20);
  }, [searchQuery, empresas]);

  const loadEmpresas = async () => {
    setLoading(true);
    try {
      const data = await fetchEmpresas();
      setEmpresas(data);
    } catch (error) {
      console.error("Error cargando empresas:", error);
      toast.error("Error al cargar empresas");
    } finally {
      setLoading(false);
    }
  };

  const toggleEmpresa = (empresa: Empresa) => {
    setSelectedEmpresas((prev) => {
      const exists = prev.find((e) => e.id === empresa.id);
      if (exists) {
        return prev.filter((e) => e.id !== empresa.id);
      }
      return [...prev, empresa];
    });
  };

  const removeSelected = (empresaId: string) => {
    setSelectedEmpresas((prev) => prev.filter((e) => e.id !== empresaId));
  };

  const handleSubmit = async () => {
    if (selectedEmpresas.length === 0) {
      toast.error("Selecciona al menos una empresa");
      return;
    }

    setSubmitting(true);
    let successCount = 0;
    let errorCount = 0;

    try {
      for (const empresa of selectedEmpresas) {
        try {
          await addEmpresaToMandato(mandatoId, empresa.id, rol);
          successCount++;
        } catch (error: any) {
          console.error(`Error asociando ${empresa.nombre}:`, error);
          if (error.message?.includes("duplicate")) {
            // Already associated, count as success
            successCount++;
          } else {
            errorCount++;
          }
        }
      }

      if (successCount > 0) {
        toast.success(
          `${successCount} empresa${successCount > 1 ? "s" : ""} asociada${successCount > 1 ? "s" : ""} como ${rol}`
        );
      }
      if (errorCount > 0) {
        toast.error(`${errorCount} empresa${errorCount > 1 ? "s" : ""} no se pudieron asociar`);
      }

      resetForm();
      onOpenChange(false);
      onSuccess?.();
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setSelectedEmpresas([]);
    setSearchQuery("");
    setRol(defaultRol);
  };

  const isSelected = (empresaId: string) => selectedEmpresas.some((e) => e.id === empresaId);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Asociar Empresas Existentes</DialogTitle>
          <DialogDescription>
            Busca y selecciona empresas para asociarlas a este mandato
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Selected chips */}
          {selectedEmpresas.length > 0 && (
            <div className="flex flex-wrap gap-2 p-2 border rounded-lg bg-muted/30">
              {selectedEmpresas.map((empresa) => (
                <Badge
                  key={empresa.id}
                  variant="secondary"
                  className="pl-2 pr-1 py-1 gap-1"
                >
                  {empresa.nombre}
                  <button
                    type="button"
                    onClick={() => removeSelected(empresa.id)}
                    className="ml-1 hover:bg-destructive/20 rounded-full p-0.5"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </Badge>
              ))}
            </div>
          )}

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
            <Label>
              Seleccionar empresas
              {selectedEmpresas.length > 0 && (
                <span className="ml-2 text-primary">
                  ({selectedEmpresas.length} seleccionada{selectedEmpresas.length > 1 ? "s" : ""})
                </span>
              )}
            </Label>
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
                        isSelected(empresa.id) ? "bg-primary/5" : ""
                      }`}
                      onClick={() => toggleEmpresa(empresa)}
                    >
                      <Checkbox
                        checked={isSelected(empresa.id)}
                        className="mt-1"
                      />
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
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={selectedEmpresas.length === 0 || submitting}>
            {submitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Asociar {selectedEmpresas.length > 0 ? `${selectedEmpresas.length} Empresa${selectedEmpresas.length > 1 ? "s" : ""}` : "Empresas"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
