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
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, Plus, Trash2, ExternalLink, Building2, CheckCircle2, AlertCircle, Sparkles } from "lucide-react";
import { useEmpresas } from "@/hooks/queries/useEmpresas";
import { useCreateContacto } from "@/hooks/queries/useContactos";
import type { Empresa } from "@/types";

interface ApolloContactData {
  nombre: string;
  apellidos?: string;
  cargo?: string;
  email?: string;
  telefono?: string;
  empresa_nombre?: string;
  linkedin?: string;
  apollo_url: string;
}

interface ExtractedContact extends ApolloContactData {
  id: string;
  selected: boolean;
  status: 'pending' | 'extracting' | 'success' | 'error';
  error?: string;
  matchedEmpresaId?: string;
}

interface ImportFromApolloDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
  mandatoId?: string;
  defaultEmpresaId?: string;
}

export function ImportFromApolloDrawer({ 
  open, 
  onOpenChange, 
  onSuccess,
  mandatoId,
  defaultEmpresaId,
}: ImportFromApolloDrawerProps) {
  const [urls, setUrls] = useState<string[]>(['']);
  const [extractedContacts, setExtractedContacts] = useState<ExtractedContact[]>([]);
  const [isExtracting, setIsExtracting] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  const { data: empresas = [] } = useEmpresas();
  const createContacto = useCreateContacto();

  const handleAddUrl = () => {
    setUrls([...urls, '']);
  };

  const handleRemoveUrl = (index: number) => {
    if (urls.length > 1) {
      setUrls(urls.filter((_, i) => i !== index));
    }
  };

  const handleUrlChange = (index: number, value: string) => {
    const newUrls = [...urls];
    newUrls[index] = value;
    setUrls(newUrls);
  };

  const findMatchingEmpresa = (empresaNombre: string | undefined): string | undefined => {
    // If defaultEmpresaId is provided, always use it
    if (defaultEmpresaId) return defaultEmpresaId;
    
    if (!empresaNombre) return undefined;
    
    const normalizedSearch = empresaNombre.toLowerCase().trim();
    
    const match = empresas.find((e: Empresa) => {
      const normalizedNombre = e.nombre.toLowerCase().trim();
      return normalizedNombre.includes(normalizedSearch) || 
             normalizedSearch.includes(normalizedNombre);
    });
    
    return match?.id;
  };

  const handleExtract = async () => {
    const validUrls = urls.filter(url => url.trim() && url.includes('apollo.io'));
    
    if (validUrls.length === 0) {
      toast.error('Introduce al menos un enlace válido de Apollo.io');
      return;
    }

    setIsExtracting(true);
    setExtractedContacts([]);

    // Initialize contacts with pending status
    const initialContacts: ExtractedContact[] = validUrls.map((url, index) => ({
      id: `contact-${index}-${Date.now()}`,
      nombre: '',
      apollo_url: url,
      selected: true,
      status: 'pending' as const,
    }));
    setExtractedContacts(initialContacts);

    // Process each URL
    for (let i = 0; i < validUrls.length; i++) {
      const url = validUrls[i];
      
      // Update status to extracting
      setExtractedContacts(prev => prev.map((c, idx) => 
        idx === i ? { ...c, status: 'extracting' as const } : c
      ));

      try {
        const { data, error } = await supabase.functions.invoke('extract-apollo-contact', {
          body: { url }
        });

        if (error) throw new Error(error.message);
        if (!data.success) throw new Error(data.error || 'Extraction failed');

        const contactData = data.data as ApolloContactData;
        const matchedEmpresaId = findMatchingEmpresa(contactData.empresa_nombre);

        setExtractedContacts(prev => prev.map((c, idx) => 
          idx === i ? {
            ...c,
            ...contactData,
            status: 'success' as const,
            matchedEmpresaId,
          } : c
        ));
      } catch (err) {
        console.error('Error extracting contact:', err);
        setExtractedContacts(prev => prev.map((c, idx) => 
          idx === i ? {
            ...c,
            status: 'error' as const,
            error: err instanceof Error ? err.message : 'Error desconocido',
          } : c
        ));
      }
    }

    setIsExtracting(false);
  };

  const handleToggleContact = (id: string) => {
    setExtractedContacts(prev => prev.map(c => 
      c.id === id ? { ...c, selected: !c.selected } : c
    ));
  };

  const handleEmpresaChange = (id: string, empresaId: string) => {
    setExtractedContacts(prev => prev.map(c => 
      c.id === id ? { ...c, matchedEmpresaId: empresaId === 'none' ? undefined : empresaId } : c
    ));
  };

  const handleCreateContacts = async () => {
    const contactsToCreate = extractedContacts.filter(c => c.selected && c.status === 'success');
    
    if (contactsToCreate.length === 0) {
      toast.error('Selecciona al menos un contacto para crear');
      return;
    }

    setIsCreating(true);
    let created = 0;
    let errors = 0;

    for (const contact of contactsToCreate) {
      try {
        // Create the contact
        const { data: newContact, error: createError } = await supabase
          .from('contactos')
          .insert({
            nombre: contact.nombre,
            apellidos: contact.apellidos,
            cargo: contact.cargo,
            email: contact.email,
            telefono: contact.telefono,
            linkedin: contact.linkedin,
            empresa_principal_id: contact.matchedEmpresaId,
          })
          .select()
          .single();

        if (createError) throw createError;

        // If mandatoId is provided, link the contact to the mandate
        if (mandatoId && newContact) {
          await supabase.from('mandato_contactos').insert({
            mandato_id: mandatoId,
            contacto_id: newContact.id,
            rol: 'Interlocutor',
          });
        }

        created++;
      } catch (err) {
        console.error('Error creating contact:', err);
        errors++;
      }
    }

    setIsCreating(false);

    if (created > 0) {
      toast.success(`${created} contacto${created > 1 ? 's' : ''} creado${created > 1 ? 's' : ''} correctamente`);
      onSuccess?.();
      handleClose();
    }
    
    if (errors > 0) {
      toast.error(`Error al crear ${errors} contacto${errors > 1 ? 's' : ''}`);
    }
  };

  const handleClose = () => {
    setUrls(['']);
    setExtractedContacts([]);
    onOpenChange(false);
  };

  const selectedCount = extractedContacts.filter(c => c.selected && c.status === 'success').length;
  const successCount = extractedContacts.filter(c => c.status === 'success').length;

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="max-h-[90vh]">
        <DrawerHeader>
          <DrawerTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Importar desde Apollo.io
          </DrawerTitle>
          <DrawerDescription>
            Pega enlaces de perfiles de Apollo para extraer automáticamente los datos de contacto
          </DrawerDescription>
        </DrawerHeader>

        <div className="px-4 pb-4 space-y-4 overflow-hidden flex flex-col">
          {/* URL inputs */}
          <div className="space-y-3">
            <Label>Enlaces de Apollo</Label>
            {urls.map((url, index) => (
              <div key={index} className="flex gap-2">
                <Input
                  placeholder="https://app.apollo.io/#/people/..."
                  value={url}
                  onChange={(e) => handleUrlChange(index, e.target.value)}
                  disabled={isExtracting}
                />
                {urls.length > 1 && (
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={() => handleRemoveUrl(index)}
                    disabled={isExtracting}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            ))}
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleAddUrl}
                disabled={isExtracting}
              >
                <Plus className="h-4 w-4 mr-1" />
                Añadir otro enlace
              </Button>
              <Button 
                onClick={handleExtract} 
                disabled={isExtracting || urls.every(u => !u.trim())}
              >
                {isExtracting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Extrayendo...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4 mr-2" />
                    Extraer datos
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* Extracted contacts */}
          {extractedContacts.length > 0 && (
            <>
              <Separator />
              <div className="flex items-center justify-between">
                <Label>Contactos encontrados</Label>
                <Badge variant="secondary">
                  {successCount} de {extractedContacts.length} extraídos
                </Badge>
              </div>
              
              <ScrollArea className="flex-1 max-h-[40vh] pr-4">
                <div className="space-y-3">
                  {extractedContacts.map((contact) => (
                    <div 
                      key={contact.id} 
                      className={`p-4 border rounded-lg space-y-3 ${
                        contact.status === 'error' ? 'border-destructive/50 bg-destructive/5' :
                        contact.status === 'success' ? 'border-green-500/30 bg-green-50/50 dark:bg-green-950/20' :
                        ''
                      }`}
                    >
                      {/* Status row */}
                      <div className="flex items-start gap-3">
                        {contact.status === 'success' && (
                          <Checkbox
                            checked={contact.selected}
                            onCheckedChange={() => handleToggleContact(contact.id)}
                          />
                        )}
                        
                        <div className="flex-1 min-w-0">
                          {contact.status === 'pending' && (
                            <div className="flex items-center gap-2 text-muted-foreground">
                              <div className="h-4 w-4 rounded-full border-2 border-muted" />
                              <span className="text-sm">Pendiente</span>
                            </div>
                          )}
                          
                          {contact.status === 'extracting' && (
                            <div className="flex items-center gap-2 text-primary">
                              <Loader2 className="h-4 w-4 animate-spin" />
                              <span className="text-sm">Extrayendo datos...</span>
                            </div>
                          )}
                          
                          {contact.status === 'error' && (
                            <div className="flex items-center gap-2 text-destructive">
                              <AlertCircle className="h-4 w-4" />
                              <span className="text-sm">{contact.error}</span>
                            </div>
                          )}
                          
                          {contact.status === 'success' && (
                            <div className="space-y-2">
                              <div className="flex items-center gap-2">
                                <CheckCircle2 className="h-4 w-4 text-green-600" />
                                <span className="font-medium">
                                  {contact.nombre} {contact.apellidos}
                                </span>
                                {contact.cargo && (
                                  <Badge variant="outline" className="text-xs">
                                    {contact.cargo}
                                  </Badge>
                                )}
                              </div>
                              
                              <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm text-muted-foreground">
                                {contact.email && (
                                  <span className="truncate">📧 {contact.email}</span>
                                )}
                                {contact.telefono && (
                                  <span>📞 {contact.telefono}</span>
                                )}
                                {contact.empresa_nombre && (
                                  <span className="truncate">🏢 {contact.empresa_nombre}</span>
                                )}
                                {contact.linkedin && (
                                  <a 
                                    href={contact.linkedin} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-1 hover:text-primary"
                                  >
                                    <ExternalLink className="h-3 w-3" />
                                    LinkedIn
                                  </a>
                                )}
                              </div>

                              {/* Empresa selector */}
                              <div className="flex items-center gap-2 mt-2">
                                <Building2 className="h-4 w-4 text-muted-foreground" />
                                <Select
                                  value={contact.matchedEmpresaId || 'none'}
                                  onValueChange={(value) => handleEmpresaChange(contact.id, value)}
                                >
                                  <SelectTrigger className="h-8 text-sm flex-1">
                                    <SelectValue placeholder="Vincular a empresa..." />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="none">Sin vincular</SelectItem>
                                    {empresas.map((empresa: Empresa) => (
                                      <SelectItem key={empresa.id} value={empresa.id}>
                                        {empresa.nombre}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                                {contact.matchedEmpresaId && contact.empresa_nombre && (
                                  <Badge variant="secondary" className="text-xs whitespace-nowrap">
                                    Auto-match
                                  </Badge>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </>
          )}
        </div>

        <DrawerFooter className="flex-row gap-2">
          <DrawerClose asChild>
            <Button variant="outline" className="flex-1" onClick={handleClose}>
              Cancelar
            </Button>
          </DrawerClose>
          <Button 
            className="flex-1" 
            onClick={handleCreateContacts}
            disabled={selectedCount === 0 || isCreating}
          >
            {isCreating ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Creando...
              </>
            ) : (
              `Crear ${selectedCount} contacto${selectedCount !== 1 ? 's' : ''}`
            )}
          </Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}
