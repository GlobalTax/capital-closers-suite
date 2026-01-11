import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, Plus, X, Link, Linkedin, Rocket, AlertTriangle } from "lucide-react";
import { toast } from "sonner";

import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { supabase } from "@/integrations/supabase/client";
import { useEmpresas } from "@/hooks/queries/useEmpresas";
import { useCreateContacto } from "@/hooks/queries/useContactos";

const urlSchema = z.object({
  url: z.string().url("Introduce una URL válida").refine(
    (url) => url.includes("apollo.io") || url.includes("linkedin.com/in"),
    "La URL debe ser de Apollo.io o LinkedIn"
  ),
});

const contactSchema = z.object({
  nombre: z.string().min(1, "El nombre es obligatorio"),
  apellidos: z.string().optional(),
  email: z.string().email("Email inválido").optional().or(z.literal("")),
  telefono: z.string().optional(),
  cargo: z.string().optional(),
  empresa_id: z.string().optional(),
  linkedin: z.string().optional(),
  notas: z.string().optional(),
});

type UrlFormData = z.infer<typeof urlSchema>;
type ContactFormData = z.infer<typeof contactSchema>;

type ExtractedContact = {
  nombre: string;
  apellidos?: string;
  email?: string;
  telefono?: string;
  cargo?: string;
  empresa?: string;
  linkedin?: string;
};

type UrlType = "apollo" | "linkedin" | null;

interface ImportFromLinkDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
  mandatoId?: string;
}

export function ImportFromLinkDrawer({
  open,
  onOpenChange,
  onSuccess,
  mandatoId,
}: ImportFromLinkDrawerProps) {
  const [urls, setUrls] = useState<string[]>([]);
  const [currentUrlInput, setCurrentUrlInput] = useState("");
  const [isExtracting, setIsExtracting] = useState(false);
  const [extractedContacts, setExtractedContacts] = useState<ExtractedContact[]>([]);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [matchedEmpresas, setMatchedEmpresas] = useState<Record<number, string>>({});

  const { data: empresas = [] } = useEmpresas();
  const createContacto = useCreateContacto();

  const urlForm = useForm<UrlFormData>({
    resolver: zodResolver(urlSchema),
    defaultValues: { url: "" },
  });

  const contactForm = useForm<ContactFormData>({
    resolver: zodResolver(contactSchema),
  });

  const getUrlType = (url: string): UrlType => {
    if (url.includes("apollo.io")) return "apollo";
    if (url.includes("linkedin.com/in")) return "linkedin";
    return null;
  };

  const isValidUrl = (url: string): boolean => {
    try {
      new URL(url);
      return url.includes("apollo.io") || url.includes("linkedin.com/in");
    } catch {
      return false;
    }
  };

  const addUrl = () => {
    const url = currentUrlInput.trim();
    if (url && isValidUrl(url) && !urls.includes(url)) {
      setUrls([...urls, url]);
      setCurrentUrlInput("");
      urlForm.reset();
    } else if (url && !isValidUrl(url)) {
      toast.error("URL inválida. Debe ser de Apollo.io o LinkedIn.");
    }
  };

  const removeUrl = (index: number) => {
    setUrls(urls.filter((_, i) => i !== index));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addUrl();
    }
  };

  const findMatchingEmpresa = (empresaName?: string): string | undefined => {
    if (!empresaName) return undefined;
    const normalizedName = empresaName.toLowerCase().trim();
    const match = empresas.find(
      (e) =>
        e.nombre.toLowerCase().includes(normalizedName) ||
        normalizedName.includes(e.nombre.toLowerCase())
    );
    return match?.id;
  };

  const extractContacts = async () => {
    if (urls.length === 0) {
      toast.error("Añade al menos una URL");
      return;
    }

    setIsExtracting(true);
    setExtractedContacts([]);
    const newMatchedEmpresas: Record<number, string> = {};

    try {
      const results: ExtractedContact[] = [];

      for (let i = 0; i < urls.length; i++) {
        const url = urls[i];
        toast.info(`Extrayendo ${i + 1}/${urls.length}...`);

        const { data, error } = await supabase.functions.invoke("extract-apollo-contact", {
          body: { url },
        });

        if (error) {
          console.error("Error extracting:", error);
          toast.error(`Error con URL ${i + 1}: ${error.message}`);
          continue;
        }

        if (data?.contact) {
          results.push(data.contact);
          const matchedId = findMatchingEmpresa(data.contact.empresa);
          if (matchedId) {
            newMatchedEmpresas[results.length - 1] = matchedId;
          }
        }
      }

      if (results.length > 0) {
        setExtractedContacts(results);
        setMatchedEmpresas(newMatchedEmpresas);
        toast.success(`${results.length} contacto(s) extraído(s)`);
      } else {
        toast.error("No se pudieron extraer contactos");
      }
    } catch (err) {
      console.error("Extraction error:", err);
      toast.error("Error al extraer los contactos");
    } finally {
      setIsExtracting(false);
    }
  };

  const startEditing = (index: number) => {
    const contact = extractedContacts[index];
    contactForm.reset({
      nombre: contact.nombre || "",
      apellidos: contact.apellidos || "",
      email: contact.email || "",
      telefono: contact.telefono || "",
      cargo: contact.cargo || "",
      empresa_id: matchedEmpresas[index] || "",
      linkedin: contact.linkedin || "",
      notas: "",
    });
    setEditingIndex(index);
  };

  const saveEdit = (data: ContactFormData) => {
    if (editingIndex === null) return;

    const updated = [...extractedContacts];
    updated[editingIndex] = {
      ...updated[editingIndex],
      nombre: data.nombre,
      apellidos: data.apellidos,
      email: data.email,
      telefono: data.telefono,
      cargo: data.cargo,
      linkedin: data.linkedin,
    };
    setExtractedContacts(updated);

    if (data.empresa_id) {
      setMatchedEmpresas({ ...matchedEmpresas, [editingIndex]: data.empresa_id });
    }

    setEditingIndex(null);
    contactForm.reset();
  };

  const removeContact = (index: number) => {
    setExtractedContacts(extractedContacts.filter((_, i) => i !== index));
    const newMatched = { ...matchedEmpresas };
    delete newMatched[index];
    // Reindex
    const reindexed: Record<number, string> = {};
    Object.entries(newMatched).forEach(([key, value]) => {
      const numKey = parseInt(key);
      if (numKey > index) {
        reindexed[numKey - 1] = value;
      } else {
        reindexed[numKey] = value;
      }
    });
    setMatchedEmpresas(reindexed);
  };

  const saveAllContacts = async () => {
    if (extractedContacts.length === 0) return;

    setIsSaving(true);
    let successCount = 0;

    try {
      for (let i = 0; i < extractedContacts.length; i++) {
        const contact = extractedContacts[i];
        const empresaId = matchedEmpresas[i];

        const contactData = {
          nombre: contact.nombre,
          apellidos: contact.apellidos || null,
          email: contact.email || null,
          telefono: contact.telefono || null,
          cargo: contact.cargo || null,
          empresa_id: empresaId || null,
          linkedin: contact.linkedin || null,
          notas: `Importado desde ${contact.linkedin?.includes("linkedin") ? "LinkedIn" : "Apollo"}`,
        };

        await createContacto.mutateAsync(contactData);

        // If mandatoId provided, associate contact with mandato
        if (mandatoId && empresaId) {
          // The contact will be associated through the empresa
        }

        successCount++;
      }

      toast.success(`${successCount} contacto(s) creado(s) correctamente`);
      handleClose();
      onSuccess?.();
    } catch (err) {
      console.error("Save error:", err);
      toast.error("Error al guardar los contactos");
    } finally {
      setIsSaving(false);
    }
  };

  const handleClose = () => {
    setUrls([]);
    setCurrentUrlInput("");
    setExtractedContacts([]);
    setEditingIndex(null);
    setMatchedEmpresas({});
    urlForm.reset();
    contactForm.reset();
    onOpenChange(false);
  };

  const hasLinkedInUrls = urls.some((url) => getUrlType(url) === "linkedin");

  return (
    <Sheet open={open} onOpenChange={handleClose}>
      <SheetContent className="w-full sm:max-w-xl overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <Link className="h-5 w-5" />
            Importar desde Apollo o LinkedIn
          </SheetTitle>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          {/* URL Input Section */}
          {extractedContacts.length === 0 && (
            <>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>URLs de perfiles</Label>
                  <div className="flex gap-2">
                    <Input
                      placeholder="https://app.apollo.io/... o https://linkedin.com/in/..."
                      value={currentUrlInput}
                      onChange={(e) => setCurrentUrlInput(e.target.value)}
                      onKeyDown={handleKeyDown}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={addUrl}
                      disabled={!currentUrlInput.trim()}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Pega URLs de Apollo.io o LinkedIn y pulsa Enter o el botón +
                  </p>
                </div>

                {/* URL List */}
                {urls.length > 0 && (
                  <div className="space-y-2">
                    <Label>URLs añadidas ({urls.length})</Label>
                    <div className="space-y-2 max-h-40 overflow-y-auto">
                      {urls.map((url, index) => {
                        const urlType = getUrlType(url);
                        return (
                          <div
                            key={index}
                            className="flex items-center gap-2 p-2 bg-muted rounded-md text-sm"
                          >
                            {urlType === "linkedin" ? (
                              <Linkedin className="h-4 w-4 text-blue-600 flex-shrink-0" />
                            ) : (
                              <Rocket className="h-4 w-4 text-orange-500 flex-shrink-0" />
                            )}
                            <span className="flex-1 truncate">{url}</span>
                            <Badge variant={urlType === "linkedin" ? "default" : "secondary"} className="flex-shrink-0">
                              {urlType === "linkedin" ? "LinkedIn" : "Apollo"}
                            </Badge>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6 flex-shrink-0"
                              onClick={() => removeUrl(index)}
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* LinkedIn Warning */}
                {hasLinkedInUrls && (
                  <Alert>
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                      LinkedIn no muestra email ni teléfono públicamente. Solo se extraerán nombre, cargo y empresa.
                    </AlertDescription>
                  </Alert>
                )}

                <Button
                  onClick={extractContacts}
                  disabled={urls.length === 0 || isExtracting}
                  className="w-full"
                >
                  {isExtracting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Extrayendo...
                    </>
                  ) : (
                    `Extraer ${urls.length} contacto(s)`
                  )}
                </Button>
              </div>
            </>
          )}

          {/* Extracted Contacts Preview */}
          {extractedContacts.length > 0 && editingIndex === null && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label>Contactos extraídos ({extractedContacts.length})</Label>
                <Button variant="ghost" size="sm" onClick={() => setExtractedContacts([])}>
                  Volver
                </Button>
              </div>

              <div className="space-y-3 max-h-[50vh] overflow-y-auto">
                {extractedContacts.map((contact, index) => (
                  <Card key={index}>
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start">
                        <div className="space-y-1 flex-1">
                          <div className="flex items-center gap-2">
                            <p className="font-medium">
                              {contact.nombre} {contact.apellidos}
                            </p>
                            {contact.linkedin?.includes("linkedin") ? (
                              <Linkedin className="h-3 w-3 text-blue-600" />
                            ) : (
                              <Rocket className="h-3 w-3 text-orange-500" />
                            )}
                          </div>
                          {contact.cargo && (
                            <p className="text-sm text-muted-foreground">{contact.cargo}</p>
                          )}
                          {contact.empresa && (
                            <div className="flex items-center gap-2">
                              <p className="text-sm">{contact.empresa}</p>
                              {matchedEmpresas[index] && (
                                <Badge variant="outline" className="text-xs">
                                  Vinculada
                                </Badge>
                              )}
                            </div>
                          )}
                          {contact.email && (
                            <p className="text-sm text-muted-foreground">{contact.email}</p>
                          )}
                        </div>
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => startEditing(index)}
                          >
                            Editar
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive"
                            onClick={() => removeContact(index)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              <Button
                onClick={saveAllContacts}
                disabled={isSaving}
                className="w-full"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Guardando...
                  </>
                ) : (
                  `Crear ${extractedContacts.length} contacto(s)`
                )}
              </Button>
            </div>
          )}

          {/* Edit Contact Form */}
          {editingIndex !== null && (
            <Form {...contactForm}>
              <form onSubmit={contactForm.handleSubmit(saveEdit)} className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label>Editar contacto</Label>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setEditingIndex(null)}
                  >
                    Cancelar
                  </Button>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={contactForm.control}
                    name="nombre"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nombre *</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={contactForm.control}
                    name="apellidos"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Apellidos</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={contactForm.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input type="email" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={contactForm.control}
                  name="telefono"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Teléfono</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={contactForm.control}
                  name="cargo"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Cargo</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={contactForm.control}
                  name="empresa_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Empresa</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Seleccionar empresa..." />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {empresas.map((empresa) => (
                            <SelectItem key={empresa.id} value={empresa.id}>
                              {empresa.nombre}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={contactForm.control}
                  name="linkedin"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>LinkedIn</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="https://linkedin.com/in/..." />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button type="submit" className="w-full">
                  Guardar cambios
                </Button>
              </form>
            </Form>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
