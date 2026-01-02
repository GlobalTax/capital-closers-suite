import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, Loader2, Globe, AlertTriangle, Check } from "lucide-react";
import { toast } from "sonner";
import { createEmpresa, findSimilarEmpresas } from "@/services/empresas";
import { addEmpresaToMandato } from "@/services/mandatos";
import type { Empresa } from "@/types";

const SECTORES = [
  "Tecnología",
  "Retail",
  "Industrial",
  "Servicios",
  "Sanidad",
  "Educación",
  "Hostelería",
  "Logística",
  "Construcción",
  "Finanzas",
  "Inmobiliario",
  "Energía",
  "Agroalimentario",
  "Otro",
];

interface QuickAddTargetProps {
  mandatoId: string;
  onSuccess: () => void;
  onEnrichFromWeb?: (name: string, url?: string) => void;
}

interface SimilarEmpresa {
  id: string;
  nombre: string;
  sector?: string;
  similarity: number;
}

export function QuickAddTarget({ mandatoId, onSuccess, onEnrichFromWeb }: QuickAddTargetProps) {
  const [nombre, setNombre] = useState("");
  const [sector, setSector] = useState("");
  const [url, setUrl] = useState("");
  const [showUrl, setShowUrl] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isChecking, setIsChecking] = useState(false);
  const [similarEmpresas, setSimilarEmpresas] = useState<SimilarEmpresa[]>([]);
  const [showSimilar, setShowSimilar] = useState(false);

  const checkDuplicates = async (name: string) => {
    if (name.length < 3) {
      setSimilarEmpresas([]);
      setShowSimilar(false);
      return;
    }

    setIsChecking(true);
    try {
      const similar = await findSimilarEmpresas(name);
      setSimilarEmpresas(similar);
      setShowSimilar(similar.length > 0);
    } catch (error) {
      console.error("Error checking duplicates:", error);
    } finally {
      setIsChecking(false);
    }
  };

  const handleNombreChange = (value: string) => {
    setNombre(value);
    // Debounce duplicate check
    const timeoutId = setTimeout(() => checkDuplicates(value), 300);
    return () => clearTimeout(timeoutId);
  };

  const handleUseSimilar = async (empresa: SimilarEmpresa) => {
    setIsSubmitting(true);
    try {
      await addEmpresaToMandato(mandatoId, empresa.id, "target");
      toast.success(`${empresa.nombre} asociada como target`);
      resetForm();
      onSuccess();
    } catch (error: any) {
      if (error.message?.includes("duplicate")) {
        toast.error("Esta empresa ya está asociada al mandato");
      } else {
        toast.error("Error al asociar empresa");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmit = async () => {
    if (!nombre.trim()) {
      toast.error("El nombre es obligatorio");
      return;
    }
    if (!sector) {
      toast.error("El sector es obligatorio");
      return;
    }

    setIsSubmitting(true);
    try {
      // Si hay URL, sugerir enriquecimiento
      if (url.trim() && onEnrichFromWeb) {
        onEnrichFromWeb(nombre.trim(), url.trim());
        resetForm();
        return;
      }

      // Crear empresa
      const newEmpresa = await createEmpresa({
        nombre: nombre.trim(),
        sector,
        sitio_web: url.trim() || undefined,
        es_target: true,
      });

      // Asociar al mandato
      await addEmpresaToMandato(mandatoId, newEmpresa.id, "target");

      toast.success(`${nombre} creada y asociada como target`);
      resetForm();
      onSuccess();
    } catch (error: any) {
      console.error("Error creating target:", error);
      toast.error(error.message || "Error al crear target");
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setNombre("");
    setSector("");
    setUrl("");
    setShowUrl(false);
    setSimilarEmpresas([]);
    setShowSimilar(false);
  };

  return (
    <div className="space-y-2">
      <Card className="p-3">
        <div className="flex flex-wrap items-center gap-2">
          <Input
            placeholder="Nombre de la empresa..."
            value={nombre}
            onChange={(e) => handleNombreChange(e.target.value)}
            className="flex-1 min-w-[180px]"
            disabled={isSubmitting}
          />
          <Select value={sector} onValueChange={setSector} disabled={isSubmitting}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Sector" />
            </SelectTrigger>
            <SelectContent>
              {SECTORES.map((s) => (
                <SelectItem key={s} value={s}>
                  {s}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {showUrl ? (
            <Input
              placeholder="https://..."
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className="w-[200px]"
              disabled={isSubmitting}
            />
          ) : (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowUrl(true)}
              disabled={isSubmitting}
              className="text-muted-foreground"
            >
              <Globe className="w-4 h-4 mr-1" />
              URL
            </Button>
          )}

          <Button
            onClick={handleSubmit}
            disabled={isSubmitting || !nombre.trim() || !sector}
            size="sm"
          >
            {isSubmitting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Plus className="w-4 h-4" />
            )}
            <span className="ml-1 hidden sm:inline">Añadir</span>
          </Button>
        </div>
      </Card>

      {/* Similar companies warning */}
      {showSimilar && similarEmpresas.length > 0 && (
        <Card className="p-3 border-amber-500/50 bg-amber-500/5">
          <div className="flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
            <div className="flex-1 space-y-2">
              <p className="text-sm font-medium text-amber-700 dark:text-amber-400">
                Empresas similares encontradas
              </p>
              <div className="space-y-1">
                {similarEmpresas.slice(0, 3).map((emp) => (
                  <div
                    key={emp.id}
                    className="flex items-center justify-between p-2 bg-background rounded border"
                  >
                    <div>
                      <span className="font-medium text-sm">{emp.nombre}</span>
                      {emp.sector && (
                        <Badge variant="outline" className="ml-2 text-xs">
                          {emp.sector}
                        </Badge>
                      )}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleUseSimilar(emp)}
                      disabled={isSubmitting}
                    >
                      <Check className="w-3 h-3 mr-1" />
                      Usar esta
                    </Button>
                  </div>
                ))}
              </div>
              <p className="text-xs text-muted-foreground">
                Puedes usar una existente o continuar creando una nueva
              </p>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
