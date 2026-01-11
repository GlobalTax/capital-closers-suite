import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { 
  Drawer, 
  DrawerContent, 
  DrawerHeader, 
  DrawerTitle, 
  DrawerDescription,
  DrawerFooter,
  DrawerClose
} from '@/components/ui/drawer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Upload, 
  Sparkles, 
  Building2, 
  User, 
  Loader2,
  Image as ImageIcon,
  AlertCircle,
  CheckCircle2
} from 'lucide-react';
import { useAIImport, ExtractedData } from '@/hooks/useAIImport';
import { addEmpresaToMandato } from '@/services/mandatos';
import { cn } from '@/lib/utils';

interface AIImportDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultMode?: 'empresa' | 'contacto' | 'both';
  mandatoId?: string;
  onSuccess?: (data: { empresaId?: string; contactoId?: string }) => void;
}

export function AIImportDrawer({ 
  open, 
  onOpenChange, 
  defaultMode = 'both',
  mandatoId,
  onSuccess 
}: AIImportDrawerProps) {
  const {
    isProcessing,
    extractedData,
    imagePreview,
    error,
    processImage,
    updateExtractedData,
    createEmpresa,
    createContacto,
    createBoth,
    reset,
  } = useAIImport();

  const [isCreating, setIsCreating] = useState(false);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (file) {
      processImage(file);
    }
  }, [processImage]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg', '.webp']
    },
    maxFiles: 1,
    disabled: isProcessing,
  });

  const handleClose = () => {
    reset();
    onOpenChange(false);
  };

  const handleCreate = async (mode: 'empresa' | 'contacto' | 'both') => {
    setIsCreating(true);
    try {
      let result: { empresaId?: string | null; contactoId?: string | null } = {};
      
      if (mode === 'empresa') {
        result.empresaId = await createEmpresa();
      } else if (mode === 'contacto') {
        result.contactoId = await createContacto();
      } else {
        result = await createBoth();
      }

      // If we have a mandatoId and an empresa was created, associate it as target
      if (mandatoId && result.empresaId) {
        try {
          await addEmpresaToMandato(mandatoId, result.empresaId, 'target');
        } catch (err) {
          console.error('Error associating to mandate:', err);
          // Don't fail the whole operation for this
        }
      }

      if (result.empresaId || result.contactoId) {
        onSuccess?.({ 
          empresaId: result.empresaId || undefined, 
          contactoId: result.contactoId || undefined 
        });
        handleClose();
      }
    } finally {
      setIsCreating(false);
    }
  };

  const updateField = (
    section: 'empresa' | 'contacto',
    field: string,
    value: string | number | null
  ) => {
    if (!extractedData) return;
    
    const updated: ExtractedData = {
      ...extractedData,
      [section]: {
        ...extractedData[section],
        [field]: value === '' ? null : value
      }
    };
    updateExtractedData(updated);
  };

  const hasEmpresaData = extractedData?.empresa.nombre;
  const hasContactoData = extractedData?.contacto.nombre;

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="max-h-[90vh]">
        <DrawerHeader className="text-left">
          <DrawerTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Importar con IA
            {mandatoId && (
              <Badge variant="outline" className="ml-2 text-xs">
                Se asociará como Target
              </Badge>
            )}
          </DrawerTitle>
          <DrawerDescription>
            Sube una captura de pantalla y extraeremos automáticamente los datos de empresa y contacto
          </DrawerDescription>
        </DrawerHeader>

        <ScrollArea className="flex-1 px-4">
          <div className="space-y-6 pb-4">
            {/* Dropzone */}
            <div
              {...getRootProps()}
              className={cn(
                "border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors",
                isDragActive ? "border-primary bg-primary/5" : "border-muted-foreground/25 hover:border-primary/50",
                isProcessing && "opacity-50 cursor-not-allowed"
              )}
            >
              <input {...getInputProps()} />
              {isProcessing ? (
                <div className="flex flex-col items-center gap-3">
                  <Loader2 className="h-10 w-10 text-primary animate-spin" />
                  <p className="text-sm text-muted-foreground">Procesando imagen con IA...</p>
                </div>
              ) : imagePreview ? (
                <div className="space-y-3">
                  <img 
                    src={imagePreview} 
                    alt="Preview" 
                    className="max-h-32 mx-auto rounded-md border"
                  />
                  <p className="text-xs text-muted-foreground">
                    Haz clic o arrastra para cambiar la imagen
                  </p>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-3">
                  <div className="p-3 rounded-full bg-muted">
                    <Upload className="h-6 w-6 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="font-medium">Arrastra una imagen aquí</p>
                    <p className="text-sm text-muted-foreground">
                      o haz clic para seleccionar
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Badge variant="outline">PNG</Badge>
                    <Badge variant="outline">JPG</Badge>
                    <Badge variant="outline">WEBP</Badge>
                  </div>
                </div>
              )}
            </div>

            {/* Error */}
            {error && (
              <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 text-destructive">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <p className="text-sm">{error}</p>
              </div>
            )}

            {/* Extracted Data */}
            {extractedData && (
              <div className="space-y-6">
                {/* Empresa */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <Building2 className="h-4 w-4 text-primary" />
                    <h3 className="font-medium">Datos de Empresa</h3>
                    {hasEmpresaData && (
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                    )}
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <div className="col-span-2">
                      <Label htmlFor="empresa-nombre">Nombre *</Label>
                      <Input
                        id="empresa-nombre"
                        value={extractedData.empresa.nombre || ''}
                        onChange={(e) => updateField('empresa', 'nombre', e.target.value)}
                        placeholder="Nombre de la empresa"
                      />
                    </div>
                    <div>
                      <Label htmlFor="empresa-cif">CIF</Label>
                      <Input
                        id="empresa-cif"
                        value={extractedData.empresa.cif || ''}
                        onChange={(e) => updateField('empresa', 'cif', e.target.value)}
                        placeholder="B12345678"
                      />
                    </div>
                    <div>
                      <Label htmlFor="empresa-sector">Sector</Label>
                      <Input
                        id="empresa-sector"
                        value={extractedData.empresa.sector || ''}
                        onChange={(e) => updateField('empresa', 'sector', e.target.value)}
                        placeholder="Tecnología"
                      />
                    </div>
                    <div>
                      <Label htmlFor="empresa-empleados">Empleados</Label>
                      <Input
                        id="empresa-empleados"
                        type="number"
                        value={extractedData.empresa.empleados || ''}
                        onChange={(e) => updateField('empresa', 'empleados', e.target.value ? Number(e.target.value) : null)}
                        placeholder="50"
                      />
                    </div>
                    <div>
                      <Label htmlFor="empresa-facturacion">Facturación (€)</Label>
                      <Input
                        id="empresa-facturacion"
                        type="number"
                        value={extractedData.empresa.facturacion || ''}
                        onChange={(e) => updateField('empresa', 'facturacion', e.target.value ? Number(e.target.value) : null)}
                        placeholder="1000000"
                      />
                    </div>
                    <div className="col-span-2">
                      <Label htmlFor="empresa-web">Sitio Web</Label>
                      <Input
                        id="empresa-web"
                        value={extractedData.empresa.sitio_web || ''}
                        onChange={(e) => updateField('empresa', 'sitio_web', e.target.value)}
                        placeholder="https://ejemplo.com"
                      />
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Contacto */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-primary" />
                    <h3 className="font-medium">Datos de Contacto</h3>
                    {hasContactoData && (
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                    )}
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label htmlFor="contacto-nombre">Nombre *</Label>
                      <Input
                        id="contacto-nombre"
                        value={extractedData.contacto.nombre || ''}
                        onChange={(e) => updateField('contacto', 'nombre', e.target.value)}
                        placeholder="Juan"
                      />
                    </div>
                    <div>
                      <Label htmlFor="contacto-apellidos">Apellidos</Label>
                      <Input
                        id="contacto-apellidos"
                        value={extractedData.contacto.apellidos || ''}
                        onChange={(e) => updateField('contacto', 'apellidos', e.target.value)}
                        placeholder="García"
                      />
                    </div>
                    <div className="col-span-2">
                      <Label htmlFor="contacto-email">Email</Label>
                      <Input
                        id="contacto-email"
                        type="email"
                        value={extractedData.contacto.email || ''}
                        onChange={(e) => updateField('contacto', 'email', e.target.value)}
                        placeholder="juan@ejemplo.com"
                      />
                    </div>
                    <div>
                      <Label htmlFor="contacto-telefono">Teléfono</Label>
                      <Input
                        id="contacto-telefono"
                        value={extractedData.contacto.telefono || ''}
                        onChange={(e) => updateField('contacto', 'telefono', e.target.value)}
                        placeholder="+34 600 000 000"
                      />
                    </div>
                    <div>
                      <Label htmlFor="contacto-cargo">Cargo</Label>
                      <Input
                        id="contacto-cargo"
                        value={extractedData.contacto.cargo || ''}
                        onChange={(e) => updateField('contacto', 'cargo', e.target.value)}
                        placeholder="Director"
                      />
                    </div>
                    <div className="col-span-2">
                      <Label htmlFor="contacto-linkedin">LinkedIn</Label>
                      <Input
                        id="contacto-linkedin"
                        value={extractedData.contacto.linkedin || ''}
                        onChange={(e) => updateField('contacto', 'linkedin', e.target.value)}
                        placeholder="https://linkedin.com/in/..."
                      />
                    </div>
                  </div>
                </div>
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
          
          {extractedData && (
            <>
              {hasEmpresaData && !mandatoId && (
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => handleCreate('empresa')}
                  disabled={isCreating}
                >
                  {isCreating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Building2 className="h-4 w-4 mr-1" />}
                  Solo Empresa
                </Button>
              )}
              {hasContactoData && !mandatoId && (
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => handleCreate('contacto')}
                  disabled={isCreating}
                >
                  {isCreating ? <Loader2 className="h-4 w-4 animate-spin" /> : <User className="h-4 w-4 mr-1" />}
                  Solo Contacto
                </Button>
              )}
              {hasEmpresaData && (
                <Button
                  className="flex-1"
                  onClick={() => handleCreate(mandatoId ? 'empresa' : 'both')}
                  disabled={isCreating}
                >
                  {isCreating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4 mr-1" />}
                  {mandatoId ? 'Crear Target' : (hasContactoData ? 'Crear Ambos' : 'Crear Empresa')}
                </Button>
              )}
            </>
          )}
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}
