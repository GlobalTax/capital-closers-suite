import { useState } from "react";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
  DrawerFooter,
  DrawerClose,
} from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card } from "@/components/ui/card";
import {
  Globe,
  Search,
  Building2,
  User,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Sparkles,
  ExternalLink,
  FileText,
  Target,
  Info,
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { createEmpresa } from "@/services/empresas";
import { addEmpresaToMandato } from "@/services/mandatos";
import { cn } from "@/lib/utils";

interface EnrichedContact {
  nombre: string;
  cargo?: string;
  email?: string;
  linkedin?: string;
  selected: boolean;
}

interface EnrichedData {
  nombre: string;
  descripcion?: string;
  actividades_destacadas?: string[];
  cnae_codigo?: string;
  cnae_descripcion?: string;
  sector?: string;
  sector_id?: string;
  sector_confianza?: 'alto' | 'medio' | 'bajo';
  empleados?: number;
  sitio_web?: string;
  ubicacion?: string;
  linkedin?: string;
  twitter?: string;
  fuente: string;
  contactos: EnrichedContact[];
}

interface EnrichFromWebDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mandatoId: string;
  initialName?: string;
  initialUrl?: string;
  onSuccess: () => void;
}

export function EnrichFromWebDrawer({
  open,
  onOpenChange,
  mandatoId,
  initialName = "",
  initialUrl = "",
  onSuccess,
}: EnrichFromWebDrawerProps) {
  const [input, setInput] = useState(initialUrl || initialName);
  const [manualUrl, setManualUrl] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [enrichedData, setEnrichedData] = useState<EnrichedData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [requireManualUrl, setRequireManualUrl] = useState(false);
  const [searchAttempted, setSearchAttempted] = useState(false);

  const handleSearch = async (urlOverride?: string) => {
    const searchInput = urlOverride || input.trim();
    if (!searchInput) {
      toast.error("Introduce un nombre o URL");
      return;
    }

    setIsSearching(true);
    setError(null);
    setEnrichedData(null);
    setRequireManualUrl(false);
    setSearchAttempted(true);

    try {
      // Use the v2 function with better source handling
      const { data, error: fnError } = await supabase.functions.invoke("enrich-company-v2", {
        body: { 
          input: searchInput,
          manualUrl: urlOverride || undefined
        },
      });

      if (fnError) throw new Error(fnError.message);
      
      if (!data.success) {
        if (data.requireManualUrl) {
          setRequireManualUrl(true);
          setError(data.error || "No se encontró información automáticamente");
          return;
        }
        throw new Error(data.error || "No se pudieron obtener datos");
      }

      const contacts = (data.data.contactos || []).map((c: any) => ({
        ...c,
        selected: true,
      }));

      setEnrichedData({
        ...data.data,
        contactos: contacts,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Error desconocido";
      setError(message);
      toast.error(message);
    } finally {
      setIsSearching(false);
    }
  };

  const toggleContact = (index: number) => {
    if (!enrichedData) return;
    const updated = [...enrichedData.contactos];
    updated[index] = { ...updated[index], selected: !updated[index].selected };
    setEnrichedData({ ...enrichedData, contactos: updated });
  };

  const handleCreate = async () => {
    if (!enrichedData?.nombre) {
      toast.error("Nombre de empresa requerido");
      return;
    }

    setIsCreating(true);
    try {
      // Create empresa with enriched data
      const newEmpresa = await createEmpresa({
        nombre: enrichedData.nombre,
        descripcion: enrichedData.descripcion,
        sector: enrichedData.sector,
        sector_id: enrichedData.sector_id,
        empleados: enrichedData.empleados,
        sitio_web: enrichedData.sitio_web,
        ubicacion: enrichedData.ubicacion,
        es_target: true,
        // New enrichment fields
        cnae_codigo: enrichedData.cnae_codigo,
        cnae_descripcion: enrichedData.cnae_descripcion,
        actividades_destacadas: enrichedData.actividades_destacadas,
        fuente_enriquecimiento: enrichedData.fuente,
        fecha_enriquecimiento: new Date().toISOString(),
      });

      // Associate to mandate
      await addEmpresaToMandato(mandatoId, newEmpresa.id, "target");

      // Create selected contacts
      const selectedContacts = enrichedData.contactos.filter((c) => c.selected && c.nombre);
      for (const contact of selectedContacts) {
        await supabase.from("contactos").insert({
          nombre: contact.nombre.split(" ")[0],
          apellidos: contact.nombre.split(" ").slice(1).join(" ") || null,
          cargo: contact.cargo,
          email: contact.email,
          linkedin: contact.linkedin,
          empresa_principal_id: newEmpresa.id,
        });
      }

      toast.success(
        `${enrichedData.nombre} creada con ${selectedContacts.length} contacto(s)`
      );
      onOpenChange(false);
      onSuccess();
    } catch (err) {
      console.error("Error creating:", err);
      toast.error("Error al crear target");
    } finally {
      setIsCreating(false);
    }
  };

  const handleClose = () => {
    setInput("");
    setManualUrl("");
    setEnrichedData(null);
    setError(null);
    setRequireManualUrl(false);
    setSearchAttempted(false);
    onOpenChange(false);
  };

  const confidenceColors = {
    alto: "bg-green-100 text-green-700 border-green-200",
    medio: "bg-yellow-100 text-yellow-700 border-yellow-200",
    bajo: "bg-red-100 text-red-700 border-red-200",
  };

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="max-h-[90vh]">
        <DrawerHeader className="text-left">
          <DrawerTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5 text-primary" />
            Enriquecer desde Web
          </DrawerTitle>
          <DrawerDescription>
            Introduce un nombre de empresa o URL para extraer datos de fuentes fiables (Empresite, web oficial)
          </DrawerDescription>
        </DrawerHeader>

        <ScrollArea className="flex-1 px-4">
          <div className="space-y-6 pb-4">
            {/* Search Input */}
            <div className="flex gap-2">
              <Input
                placeholder="Nombre de empresa o https://..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                className="flex-1"
                disabled={isSearching}
              />
              <Button onClick={() => handleSearch()} disabled={isSearching || !input.trim()}>
                {isSearching ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Search className="w-4 h-4" />
                )}
                <span className="ml-2">Buscar</span>
              </Button>
            </div>

            {/* Manual URL Fallback */}
            {requireManualUrl && !enrichedData && (
              <Card className="p-4 border-amber-500/30 bg-amber-500/5">
                <div className="flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
                  <div className="flex-1 space-y-3">
                    <div>
                      <p className="font-medium text-amber-700">No se encontró información automáticamente</p>
                      <p className="text-sm text-muted-foreground mt-1">
                        Introduce la URL directa de la empresa o su ficha en Empresite
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Input 
                        placeholder="https://empresite.eleconomista.es/..." 
                        value={manualUrl}
                        onChange={(e) => setManualUrl(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && manualUrl && handleSearch(manualUrl)}
                        className="flex-1"
                      />
                      <Button 
                        variant="secondary"
                        onClick={() => handleSearch(manualUrl)}
                        disabled={!manualUrl || isSearching}
                      >
                        {isSearching ? <Loader2 className="w-4 h-4 animate-spin" /> : "Buscar"}
                      </Button>
                    </div>
                  </div>
                </div>
              </Card>
            )}

            {/* Error (non-manual) */}
            {error && !requireManualUrl && (
              <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 text-destructive">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <p className="text-sm">{error}</p>
              </div>
            )}

            {/* Processing indicator */}
            {isSearching && (
              <Card className="p-6">
                <div className="flex flex-col items-center gap-3 text-center">
                  <Loader2 className="h-8 w-8 text-primary animate-spin" />
                  <div>
                    <p className="font-medium">Buscando información...</p>
                    <p className="text-sm text-muted-foreground">
                      Consultando fuentes: Empresite, web oficial...
                    </p>
                  </div>
                </div>
              </Card>
            )}

            {/* Enriched Data */}
            {enrichedData && (
              <div className="space-y-6">
                {/* Company Info */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <Building2 className="h-4 w-4 text-primary" />
                    <h3 className="font-medium">Datos de Empresa</h3>
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                  </div>

                  <Card className="p-4 space-y-4">
                    <div className="flex items-start justify-between">
                      <div className="space-y-2">
                        <h4 className="text-lg font-medium">{enrichedData.nombre}</h4>
                        <div className="flex flex-wrap gap-2">
                          {enrichedData.sector && (
                            <Badge variant="secondary" className="flex items-center gap-1">
                              <Target className="h-3 w-3" />
                              {enrichedData.sector}
                            </Badge>
                          )}
                          {enrichedData.sector_confianza && (
                            <Badge 
                              variant="outline" 
                              className={cn("text-xs", confidenceColors[enrichedData.sector_confianza])}
                            >
                              Confianza: {enrichedData.sector_confianza}
                            </Badge>
                          )}
                        </div>
                      </div>
                      {enrichedData.sitio_web && (
                        <a
                          href={enrichedData.sitio_web}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary hover:underline flex items-center gap-1 text-sm shrink-0"
                        >
                          <ExternalLink className="h-3 w-3" />
                          Web
                        </a>
                      )}
                    </div>

                    {enrichedData.descripcion && (
                      <p className="text-sm text-muted-foreground">
                        {enrichedData.descripcion}
                      </p>
                    )}

                    {/* Activities */}
                    {enrichedData.actividades_destacadas && enrichedData.actividades_destacadas.length > 0 && (
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-sm font-medium">
                          <FileText className="h-3.5 w-3.5 text-muted-foreground" />
                          Actividades destacadas
                        </div>
                        <ul className="text-sm text-muted-foreground space-y-1 pl-5">
                          {enrichedData.actividades_destacadas.map((act, idx) => (
                            <li key={idx} className="list-disc">{act}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* CNAE */}
                    {enrichedData.cnae_codigo && (
                      <div className="flex items-center gap-2 text-sm">
                        <Badge variant="outline" className="font-mono">
                          CNAE: {enrichedData.cnae_codigo}
                        </Badge>
                        {enrichedData.cnae_descripcion && (
                          <span className="text-muted-foreground">{enrichedData.cnae_descripcion}</span>
                        )}
                      </div>
                    )}

                    <div className="flex flex-wrap gap-3 text-sm">
                      {enrichedData.empleados && (
                        <span className="text-muted-foreground">
                          ~{enrichedData.empleados} empleados
                        </span>
                      )}
                      {enrichedData.ubicacion && (
                        <span className="text-muted-foreground">📍 {enrichedData.ubicacion}</span>
                      )}
                    </div>

                    {(enrichedData.linkedin || enrichedData.twitter) && (
                      <div className="flex gap-2 pt-2">
                        {enrichedData.linkedin && (
                          <a
                            href={enrichedData.linkedin}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-blue-600 hover:underline"
                          >
                            LinkedIn
                          </a>
                        )}
                        {enrichedData.twitter && (
                          <a
                            href={enrichedData.twitter}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-sky-500 hover:underline"
                          >
                            Twitter
                          </a>
                        )}
                      </div>
                    )}

                    {/* Source attribution */}
                    <div className="pt-2 border-t">
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Info className="h-3 w-3" />
                        <span>Fuente: </span>
                        <a 
                          href={enrichedData.fuente} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-primary hover:underline truncate max-w-[300px]"
                        >
                          {enrichedData.fuente}
                        </a>
                      </div>
                    </div>
                  </Card>
                </div>

                <Separator />

                {/* Contacts */}
                {enrichedData.contactos.length > 0 && (
                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-primary" />
                      <h3 className="font-medium">Contactos encontrados</h3>
                      <Badge variant="outline">{enrichedData.contactos.length}</Badge>
                    </div>

                    <div className="space-y-2">
                      {enrichedData.contactos.map((contact, idx) => (
                        <Card
                          key={idx}
                          className={cn(
                            "p-3 cursor-pointer transition-colors",
                            contact.selected ? "border-primary/50 bg-primary/5" : ""
                          )}
                          onClick={() => toggleContact(idx)}
                        >
                          <div className="flex items-center gap-3">
                            <Checkbox
                              checked={contact.selected}
                              onCheckedChange={() => toggleContact(idx)}
                            />
                            <div className="flex-1 min-w-0">
                              <div className="font-medium truncate">{contact.nombre}</div>
                              <div className="text-xs text-muted-foreground truncate">
                                {[contact.cargo, contact.email].filter(Boolean).join(" • ")}
                              </div>
                            </div>
                          </div>
                        </Card>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </ScrollArea>

        <DrawerFooter className="flex-row gap-2">
          <DrawerClose asChild>
            <Button variant="outline" className="flex-1" onClick={handleClose}>
              Cancelar
            </Button>
          </DrawerClose>

          {enrichedData && (
            <Button className="flex-1" onClick={handleCreate} disabled={isCreating}>
              {isCreating ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Sparkles className="h-4 w-4 mr-1" />
              )}
              Crear Target
            </Button>
          )}
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}
