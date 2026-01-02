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
import { Label } from "@/components/ui/label";
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
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { createEmpresa } from "@/services/empresas";
import { addEmpresaToMandato } from "@/services/mandatos";

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
  sector?: string;
  empleados?: number;
  sitio_web?: string;
  ubicacion?: string;
  linkedin?: string;
  twitter?: string;
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
  const [isSearching, setIsSearching] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [enrichedData, setEnrichedData] = useState<EnrichedData | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = async () => {
    if (!input.trim()) {
      toast.error("Introduce un nombre o URL");
      return;
    }

    setIsSearching(true);
    setError(null);
    setEnrichedData(null);

    try {
      const { data, error: fnError } = await supabase.functions.invoke("enrich-company", {
        body: { input: input.trim() },
      });

      if (fnError) throw new Error(fnError.message);
      if (!data.success) throw new Error(data.error || "No se pudieron obtener datos");

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
      // Create empresa
      const newEmpresa = await createEmpresa({
        nombre: enrichedData.nombre,
        descripcion: enrichedData.descripcion,
        sector: enrichedData.sector,
        empleados: enrichedData.empleados,
        sitio_web: enrichedData.sitio_web,
        ubicacion: enrichedData.ubicacion,
        es_target: true,
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
    setEnrichedData(null);
    setError(null);
    onOpenChange(false);
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
            Introduce un nombre de empresa o URL para extraer datos automáticamente
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
              <Button onClick={handleSearch} disabled={isSearching || !input.trim()}>
                {isSearching ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Search className="w-4 h-4" />
                )}
                <span className="ml-2">Buscar</span>
              </Button>
            </div>

            {/* Error */}
            {error && (
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
                      Esto puede tomar unos segundos
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
                    <h3 className="font-semibold">Datos de Empresa</h3>
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                  </div>

                  <Card className="p-4 space-y-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="text-lg font-semibold">{enrichedData.nombre}</h4>
                        {enrichedData.sector && (
                          <Badge variant="secondary" className="mt-1">
                            {enrichedData.sector}
                          </Badge>
                        )}
                      </div>
                      {enrichedData.sitio_web && (
                        <a
                          href={enrichedData.sitio_web}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary hover:underline flex items-center gap-1 text-sm"
                        >
                          <ExternalLink className="h-3 w-3" />
                          Web
                        </a>
                      )}
                    </div>

                    {enrichedData.descripcion && (
                      <p className="text-sm text-muted-foreground line-clamp-3">
                        {enrichedData.descripcion}
                      </p>
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
                  </Card>
                </div>

                <Separator />

                {/* Contacts */}
                {enrichedData.contactos.length > 0 && (
                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-primary" />
                      <h3 className="font-semibold">Contactos encontrados</h3>
                      <Badge variant="outline">{enrichedData.contactos.length}</Badge>
                    </div>

                    <div className="space-y-2">
                      {enrichedData.contactos.map((contact, idx) => (
                        <Card
                          key={idx}
                          className={`p-3 cursor-pointer transition-colors ${
                            contact.selected ? "border-primary/50 bg-primary/5" : ""
                          }`}
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
