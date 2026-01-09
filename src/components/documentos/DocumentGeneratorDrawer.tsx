import { useState, useEffect } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { 
  Shield, 
  FileText, 
  Search, 
  Mail, 
  Download, 
  Eye, 
  Save,
  Loader2,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { useDocumentGenerator } from '@/hooks/useDocumentGenerator';
import { 
  type DocumentType, 
  type NDAData, 
  type MandatoVentaData, 
  type MandatoCompraData, 
  type LOIData,
  DOCUMENT_CONFIGS,
  DEFAULT_VALUES,
  SERVICIOS_MANDATO_VENTA,
  SERVICIOS_MANDATO_COMPRA,
  DD_ALCANCE_OPTIONS,
} from '@/types/document-generators';
import { format } from 'date-fns';

interface DocumentGeneratorDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mandatoId?: string;
  empresaData?: {
    nombre?: string;
    cif?: string;
    domicilio?: string;
    representante?: string;
  };
  mandatoTipo?: 'compra' | 'venta';
}

type Step = 'select' | 'form' | 'preview';

const DOCUMENT_ICONS: Record<DocumentType, typeof Shield> = {
  nda: Shield,
  mandato_venta: FileText,
  mandato_compra: Search,
  loi: Mail,
  psh: FileText,
};

export function DocumentGeneratorDrawer({
  open,
  onOpenChange,
  mandatoId,
  empresaData,
  mandatoTipo,
}: DocumentGeneratorDrawerProps) {
  const [step, setStep] = useState<Step>('select');
  const [selectedType, setSelectedType] = useState<DocumentType | null>(null);
  const [formData, setFormData] = useState<Record<string, any>>({});
  
  const { 
    isGenerating, 
    isSaving, 
    previewUrl, 
    generatePreview, 
    downloadDocument, 
    saveToMandato,
    clearPreview,
  } = useDocumentGenerator();

  // Reset state when drawer closes
  useEffect(() => {
    if (!open) {
      setStep('select');
      setSelectedType(null);
      setFormData({});
      clearPreview();
    }
  }, [open, clearPreview]);

  // Initialize form with default values when type is selected
  useEffect(() => {
    if (selectedType) {
      const defaults: Record<string, any> = {
        fecha: format(new Date(), 'yyyy-MM-dd'),
        lugar: 'Madrid',
        ...DEFAULT_VALUES,
      };

      // Pre-fill with empresa data if available
      if (empresaData) {
        if (selectedType === 'nda') {
          defaults.empresa_nombre = empresaData.nombre || '';
          defaults.empresa_cif = empresaData.cif || '';
          defaults.empresa_domicilio = empresaData.domicilio || '';
          defaults.empresa_representante = empresaData.representante || '';
        } else if (selectedType === 'mandato_venta') {
          defaults.target_nombre = empresaData.nombre || '';
          defaults.target_cif = empresaData.cif || '';
          defaults.cliente_nombre = empresaData.nombre || '';
          defaults.cliente_cif = empresaData.cif || '';
          defaults.cliente_domicilio = empresaData.domicilio || '';
          defaults.cliente_representante = empresaData.representante || '';
          defaults.servicios = [...SERVICIOS_MANDATO_VENTA];
          defaults.exclusividad = true;
          defaults.renovacion_automatica = true;
        } else if (selectedType === 'mandato_compra') {
          defaults.cliente_nombre = empresaData.nombre || '';
          defaults.cliente_cif = empresaData.cif || '';
          defaults.cliente_domicilio = empresaData.domicilio || '';
          defaults.cliente_representante = empresaData.representante || '';
          defaults.servicios = [...SERVICIOS_MANDATO_COMPRA];
          defaults.sectores_objetivo = [];
          defaults.geografia_objetivo = ['España'];
          defaults.exclusividad = true;
          defaults.renovacion_automatica = true;
        } else if (selectedType === 'loi') {
          defaults.target_nombre = empresaData.nombre || '';
          defaults.target_cif = empresaData.cif || '';
          defaults.vendedor_nombre = empresaData.nombre || '';
          defaults.vendedor_cif = empresaData.cif || '';
          defaults.vendedor_domicilio = empresaData.domicilio || '';
          defaults.vendedor_representante = empresaData.representante || '';
          defaults.dd_alcance = [...DD_ALCANCE_OPTIONS.slice(0, 4)];
          defaults.exclusividad = true;
          defaults.vinculante = false;
          defaults.porcentaje_adquisicion = 100;
        }
      }

      setFormData(defaults);
    }
  }, [selectedType, empresaData]);

  const handleSelectType = (type: DocumentType) => {
    setSelectedType(type);
    setStep('form');
  };

  const handleBack = () => {
    if (step === 'preview') {
      setStep('form');
      clearPreview();
    } else if (step === 'form') {
      setStep('select');
      setSelectedType(null);
      setFormData({});
    }
  };

  const handlePreview = () => {
    if (!selectedType) return;
    generatePreview(selectedType, formData as any);
    setStep('preview');
  };

  const handleDownload = () => {
    if (!selectedType) return;
    downloadDocument(selectedType, formData as any);
  };

  const handleSave = async () => {
    if (!selectedType || !mandatoId) return;
    const success = await saveToMandato(selectedType, formData as any, mandatoId);
    if (success) {
      onOpenChange(false);
    }
  };

  const updateFormData = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const renderTypeSelector = () => (
    <div className="grid gap-4 p-4">
      <p className="text-sm text-muted-foreground">
        Selecciona el tipo de documento que deseas generar:
      </p>
      {DOCUMENT_CONFIGS.filter(c => c.type !== 'psh').map((config) => {
        const Icon = DOCUMENT_ICONS[config.type];
        return (
          <button
            key={config.type}
            onClick={() => handleSelectType(config.type)}
            className="flex items-start gap-4 p-4 rounded-lg border hover:bg-accent transition-colors text-left"
          >
            <div className="p-2 rounded-lg bg-primary/10">
              <Icon className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1">
              <h3 className="font-medium">{config.label}</h3>
              <p className="text-sm text-muted-foreground mt-1">
                {config.description}
              </p>
            </div>
          </button>
        );
      })}
    </div>
  );

  const renderNDAForm = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Fecha</Label>
          <Input 
            type="date" 
            value={formData.fecha || ''} 
            onChange={(e) => updateFormData('fecha', e.target.value)} 
          />
        </div>
        <div className="space-y-2">
          <Label>Lugar</Label>
          <Input 
            value={formData.lugar || ''} 
            onChange={(e) => updateFormData('lugar', e.target.value)} 
          />
        </div>
      </div>

      <Separator />
      <h4 className="font-medium">Parte Reveladora</h4>
      
      <div className="grid gap-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Nombre empresa *</Label>
            <Input 
              value={formData.empresa_nombre || ''} 
              onChange={(e) => updateFormData('empresa_nombre', e.target.value)} 
            />
          </div>
          <div className="space-y-2">
            <Label>CIF</Label>
            <Input 
              value={formData.empresa_cif || ''} 
              onChange={(e) => updateFormData('empresa_cif', e.target.value)} 
            />
          </div>
        </div>
        <div className="space-y-2">
          <Label>Domicilio</Label>
          <Input 
            value={formData.empresa_domicilio || ''} 
            onChange={(e) => updateFormData('empresa_domicilio', e.target.value)} 
          />
        </div>
        <div className="space-y-2">
          <Label>Representante</Label>
          <Input 
            value={formData.empresa_representante || ''} 
            onChange={(e) => updateFormData('empresa_representante', e.target.value)} 
          />
        </div>
      </div>

      <Separator />
      <h4 className="font-medium">Parte Receptora</h4>
      
      <div className="grid gap-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Nombre empresa *</Label>
            <Input 
              value={formData.contraparte_nombre || ''} 
              onChange={(e) => updateFormData('contraparte_nombre', e.target.value)} 
            />
          </div>
          <div className="space-y-2">
            <Label>CIF</Label>
            <Input 
              value={formData.contraparte_cif || ''} 
              onChange={(e) => updateFormData('contraparte_cif', e.target.value)} 
            />
          </div>
        </div>
        <div className="space-y-2">
          <Label>Domicilio</Label>
          <Input 
            value={formData.contraparte_domicilio || ''} 
            onChange={(e) => updateFormData('contraparte_domicilio', e.target.value)} 
          />
        </div>
        <div className="space-y-2">
          <Label>Representante</Label>
          <Input 
            value={formData.contraparte_representante || ''} 
            onChange={(e) => updateFormData('contraparte_representante', e.target.value)} 
          />
        </div>
      </div>

      <Separator />
      <h4 className="font-medium">Detalles del NDA</h4>

      <div className="grid gap-4">
        <div className="space-y-2">
          <Label>Tipo de operación</Label>
          <Select 
            value={formData.tipo_operacion || 'venta'} 
            onValueChange={(v) => updateFormData('tipo_operacion', v)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="compra">Compra</SelectItem>
              <SelectItem value="venta">Venta</SelectItem>
              <SelectItem value="inversion">Inversión</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Descripción de la operación</Label>
          <Textarea 
            value={formData.descripcion_operacion || ''} 
            onChange={(e) => updateFormData('descripcion_operacion', e.target.value)}
            placeholder="Ej: la totalidad del capital social de EMPRESA TARGET, S.L."
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Duración (meses)</Label>
            <Input 
              type="number" 
              value={formData.duracion_meses || 12} 
              onChange={(e) => updateFormData('duracion_meses', parseInt(e.target.value))} 
            />
          </div>
          <div className="space-y-2">
            <Label>Penalización (€)</Label>
            <Input 
              type="number" 
              value={formData.penalizacion_euros || ''} 
              onChange={(e) => updateFormData('penalizacion_euros', e.target.value ? parseInt(e.target.value) : undefined)}
              placeholder="Opcional"
            />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Jurisdicción</Label>
            <Input 
              value={formData.jurisdiccion || DEFAULT_VALUES.jurisdiccion} 
              onChange={(e) => updateFormData('jurisdiccion', e.target.value)} 
            />
          </div>
          <div className="space-y-2">
            <Label>Ley aplicable</Label>
            <Input 
              value={formData.ley_aplicable || DEFAULT_VALUES.ley_aplicable} 
              onChange={(e) => updateFormData('ley_aplicable', e.target.value)} 
            />
          </div>
        </div>
      </div>
    </div>
  );

  const renderMandatoVentaForm = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Fecha</Label>
          <Input 
            type="date" 
            value={formData.fecha || ''} 
            onChange={(e) => updateFormData('fecha', e.target.value)} 
          />
        </div>
        <div className="space-y-2">
          <Label>Lugar</Label>
          <Input 
            value={formData.lugar || ''} 
            onChange={(e) => updateFormData('lugar', e.target.value)} 
          />
        </div>
      </div>

      <Separator />
      <h4 className="font-medium">Datos del Asesor</h4>
      
      <div className="grid gap-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Nombre *</Label>
            <Input 
              value={formData.asesor_nombre || DEFAULT_VALUES.asesor_nombre} 
              onChange={(e) => updateFormData('asesor_nombre', e.target.value)} 
            />
          </div>
          <div className="space-y-2">
            <Label>CIF</Label>
            <Input 
              value={formData.asesor_cif || DEFAULT_VALUES.asesor_cif} 
              onChange={(e) => updateFormData('asesor_cif', e.target.value)} 
            />
          </div>
        </div>
        <div className="space-y-2">
          <Label>Representante</Label>
          <Input 
            value={formData.asesor_representante || DEFAULT_VALUES.asesor_representante} 
            onChange={(e) => updateFormData('asesor_representante', e.target.value)} 
          />
        </div>
      </div>

      <Separator />
      <h4 className="font-medium">Cliente (Vendedor)</h4>
      
      <div className="grid gap-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Nombre *</Label>
            <Input 
              value={formData.cliente_nombre || ''} 
              onChange={(e) => updateFormData('cliente_nombre', e.target.value)} 
            />
          </div>
          <div className="space-y-2">
            <Label>CIF</Label>
            <Input 
              value={formData.cliente_cif || ''} 
              onChange={(e) => updateFormData('cliente_cif', e.target.value)} 
            />
          </div>
        </div>
        <div className="space-y-2">
          <Label>Domicilio</Label>
          <Input 
            value={formData.cliente_domicilio || ''} 
            onChange={(e) => updateFormData('cliente_domicilio', e.target.value)} 
          />
        </div>
        <div className="space-y-2">
          <Label>Representante</Label>
          <Input 
            value={formData.cliente_representante || ''} 
            onChange={(e) => updateFormData('cliente_representante', e.target.value)} 
          />
        </div>
      </div>

      <Separator />
      <h4 className="font-medium">Empresa Objetivo (Target)</h4>
      
      <div className="grid gap-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Nombre *</Label>
            <Input 
              value={formData.target_nombre || ''} 
              onChange={(e) => updateFormData('target_nombre', e.target.value)} 
            />
          </div>
          <div className="space-y-2">
            <Label>CIF</Label>
            <Input 
              value={formData.target_cif || ''} 
              onChange={(e) => updateFormData('target_cif', e.target.value)} 
            />
          </div>
        </div>
        <div className="space-y-2">
          <Label>Descripción / Actividad</Label>
          <Textarea 
            value={formData.target_descripcion || ''} 
            onChange={(e) => updateFormData('target_descripcion', e.target.value)}
          />
        </div>
      </div>

      <Separator />
      <h4 className="font-medium">Condiciones del Mandato</h4>

      <div className="grid gap-4">
        <div className="flex items-center justify-between">
          <Label>Exclusividad</Label>
          <Switch 
            checked={formData.exclusividad || false} 
            onCheckedChange={(v) => updateFormData('exclusividad', v)} 
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Duración (meses)</Label>
            <Input 
              type="number" 
              value={formData.duracion_meses || 12} 
              onChange={(e) => updateFormData('duracion_meses', parseInt(e.target.value))} 
            />
          </div>
          <div className="space-y-2">
            <Label>Preaviso (días)</Label>
            <Input 
              type="number" 
              value={formData.preaviso_dias || 30} 
              onChange={(e) => updateFormData('preaviso_dias', parseInt(e.target.value))} 
            />
          </div>
        </div>
        <div className="flex items-center justify-between">
          <Label>Renovación automática</Label>
          <Switch 
            checked={formData.renovacion_automatica || false} 
            onCheckedChange={(v) => updateFormData('renovacion_automatica', v)} 
          />
        </div>
      </div>

      <Separator />
      <h4 className="font-medium">Valoración y Honorarios</h4>

      <div className="grid gap-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Valoración mín. (€)</Label>
            <Input 
              type="number" 
              value={formData.valoracion_indicativa_min || ''} 
              onChange={(e) => updateFormData('valoracion_indicativa_min', e.target.value ? parseInt(e.target.value) : undefined)} 
            />
          </div>
          <div className="space-y-2">
            <Label>Valoración máx. (€)</Label>
            <Input 
              type="number" 
              value={formData.valoracion_indicativa_max || ''} 
              onChange={(e) => updateFormData('valoracion_indicativa_max', e.target.value ? parseInt(e.target.value) : undefined)} 
            />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Honorario fijo (€)</Label>
            <Input 
              type="number" 
              value={formData.honorario_fijo || ''} 
              onChange={(e) => updateFormData('honorario_fijo', e.target.value ? parseInt(e.target.value) : undefined)} 
            />
          </div>
          <div className="space-y-2">
            <Label>Honorario éxito (%)</Label>
            <Input 
              type="number" 
              step="0.5"
              value={formData.honorario_exito_porcentaje || 3} 
              onChange={(e) => updateFormData('honorario_exito_porcentaje', parseFloat(e.target.value))} 
            />
          </div>
        </div>
        <div className="space-y-2">
          <Label>Honorario mínimo (€)</Label>
          <Input 
            type="number" 
            value={formData.honorario_minimo || ''} 
            onChange={(e) => updateFormData('honorario_minimo', e.target.value ? parseInt(e.target.value) : undefined)} 
          />
        </div>
      </div>

      <Separator />
      <h4 className="font-medium">Servicios Incluidos</h4>
      <div className="space-y-2">
        {SERVICIOS_MANDATO_VENTA.map((servicio) => (
          <div key={servicio} className="flex items-center space-x-2">
            <Checkbox 
              checked={(formData.servicios || []).includes(servicio)}
              onCheckedChange={(checked) => {
                const current = formData.servicios || [];
                if (checked) {
                  updateFormData('servicios', [...current, servicio]);
                } else {
                  updateFormData('servicios', current.filter((s: string) => s !== servicio));
                }
              }}
            />
            <label className="text-sm">{servicio}</label>
          </div>
        ))}
      </div>
    </div>
  );

  const renderMandatoCompraForm = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Fecha</Label>
          <Input type="date" value={formData.fecha || ''} onChange={(e) => updateFormData('fecha', e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label>Lugar</Label>
          <Input value={formData.lugar || ''} onChange={(e) => updateFormData('lugar', e.target.value)} />
        </div>
      </div>

      <Separator />
      <h4 className="font-medium">Cliente (Comprador)</h4>
      
      <div className="grid gap-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Nombre *</Label>
            <Input value={formData.cliente_nombre || ''} onChange={(e) => updateFormData('cliente_nombre', e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>CIF</Label>
            <Input value={formData.cliente_cif || ''} onChange={(e) => updateFormData('cliente_cif', e.target.value)} />
          </div>
        </div>
        <div className="space-y-2">
          <Label>Domicilio</Label>
          <Input value={formData.cliente_domicilio || ''} onChange={(e) => updateFormData('cliente_domicilio', e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label>Representante</Label>
          <Input value={formData.cliente_representante || ''} onChange={(e) => updateFormData('cliente_representante', e.target.value)} />
        </div>
      </div>

      <Separator />
      <h4 className="font-medium">Criterios de Búsqueda</h4>
      
      <div className="grid gap-4">
        <div className="space-y-2">
          <Label>Sectores objetivo</Label>
          <Input 
            value={(formData.sectores_objetivo || []).join(', ')} 
            onChange={(e) => updateFormData('sectores_objetivo', e.target.value.split(',').map(s => s.trim()).filter(Boolean))}
            placeholder="Ej: Tecnología, Salud, Industrial"
          />
        </div>
        <div className="space-y-2">
          <Label>Geografía objetivo</Label>
          <Input 
            value={(formData.geografia_objetivo || []).join(', ')} 
            onChange={(e) => updateFormData('geografia_objetivo', e.target.value.split(',').map(s => s.trim()).filter(Boolean))}
            placeholder="Ej: España, Portugal"
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Facturación mín. (€)</Label>
            <Input type="number" value={formData.facturacion_min || ''} onChange={(e) => updateFormData('facturacion_min', e.target.value ? parseInt(e.target.value) : undefined)} />
          </div>
          <div className="space-y-2">
            <Label>Facturación máx. (€)</Label>
            <Input type="number" value={formData.facturacion_max || ''} onChange={(e) => updateFormData('facturacion_max', e.target.value ? parseInt(e.target.value) : undefined)} />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>EBITDA mín. (€)</Label>
            <Input type="number" value={formData.ebitda_min || ''} onChange={(e) => updateFormData('ebitda_min', e.target.value ? parseInt(e.target.value) : undefined)} />
          </div>
          <div className="space-y-2">
            <Label>EBITDA máx. (€)</Label>
            <Input type="number" value={formData.ebitda_max || ''} onChange={(e) => updateFormData('ebitda_max', e.target.value ? parseInt(e.target.value) : undefined)} />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Inversión mín. (€)</Label>
            <Input type="number" value={formData.inversion_min || ''} onChange={(e) => updateFormData('inversion_min', e.target.value ? parseInt(e.target.value) : undefined)} />
          </div>
          <div className="space-y-2">
            <Label>Inversión máx. (€)</Label>
            <Input type="number" value={formData.inversion_max || ''} onChange={(e) => updateFormData('inversion_max', e.target.value ? parseInt(e.target.value) : undefined)} />
          </div>
        </div>
      </div>

      <Separator />
      <h4 className="font-medium">Condiciones y Honorarios</h4>
      
      <div className="grid gap-4">
        <div className="flex items-center justify-between">
          <Label>Exclusividad</Label>
          <Switch checked={formData.exclusividad || false} onCheckedChange={(v) => updateFormData('exclusividad', v)} />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Duración (meses)</Label>
            <Input type="number" value={formData.duracion_meses || 12} onChange={(e) => updateFormData('duracion_meses', parseInt(e.target.value))} />
          </div>
          <div className="space-y-2">
            <Label>Honorario éxito (%)</Label>
            <Input type="number" step="0.5" value={formData.honorario_exito_porcentaje || 3} onChange={(e) => updateFormData('honorario_exito_porcentaje', parseFloat(e.target.value))} />
          </div>
        </div>
      </div>

      <Separator />
      <h4 className="font-medium">Servicios Incluidos</h4>
      <div className="space-y-2">
        {SERVICIOS_MANDATO_COMPRA.map((servicio) => (
          <div key={servicio} className="flex items-center space-x-2">
            <Checkbox 
              checked={(formData.servicios || []).includes(servicio)}
              onCheckedChange={(checked) => {
                const current = formData.servicios || [];
                if (checked) {
                  updateFormData('servicios', [...current, servicio]);
                } else {
                  updateFormData('servicios', current.filter((s: string) => s !== servicio));
                }
              }}
            />
            <label className="text-sm">{servicio}</label>
          </div>
        ))}
      </div>
    </div>
  );

  const renderLOIForm = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Fecha</Label>
          <Input type="date" value={formData.fecha || ''} onChange={(e) => updateFormData('fecha', e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label>Lugar</Label>
          <Input value={formData.lugar || ''} onChange={(e) => updateFormData('lugar', e.target.value)} />
        </div>
      </div>

      <Separator />
      <h4 className="font-medium">Comprador</h4>
      
      <div className="grid gap-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Nombre *</Label>
            <Input value={formData.comprador_nombre || ''} onChange={(e) => updateFormData('comprador_nombre', e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>CIF</Label>
            <Input value={formData.comprador_cif || ''} onChange={(e) => updateFormData('comprador_cif', e.target.value)} />
          </div>
        </div>
        <div className="space-y-2">
          <Label>Domicilio</Label>
          <Input value={formData.comprador_domicilio || ''} onChange={(e) => updateFormData('comprador_domicilio', e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label>Representante</Label>
          <Input value={formData.comprador_representante || ''} onChange={(e) => updateFormData('comprador_representante', e.target.value)} />
        </div>
      </div>

      <Separator />
      <h4 className="font-medium">Vendedor</h4>
      
      <div className="grid gap-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Nombre *</Label>
            <Input value={formData.vendedor_nombre || ''} onChange={(e) => updateFormData('vendedor_nombre', e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>CIF</Label>
            <Input value={formData.vendedor_cif || ''} onChange={(e) => updateFormData('vendedor_cif', e.target.value)} />
          </div>
        </div>
        <div className="space-y-2">
          <Label>Domicilio</Label>
          <Input value={formData.vendedor_domicilio || ''} onChange={(e) => updateFormData('vendedor_domicilio', e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label>Representante</Label>
          <Input value={formData.vendedor_representante || ''} onChange={(e) => updateFormData('vendedor_representante', e.target.value)} />
        </div>
      </div>

      <Separator />
      <h4 className="font-medium">Objeto de la Transacción</h4>
      
      <div className="grid gap-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Nombre Target *</Label>
            <Input value={formData.target_nombre || ''} onChange={(e) => updateFormData('target_nombre', e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>% Adquisición</Label>
            <Input type="number" value={formData.porcentaje_adquisicion || 100} onChange={(e) => updateFormData('porcentaje_adquisicion', parseInt(e.target.value))} />
          </div>
        </div>
        <div className="space-y-2">
          <Label>Precio Indicativo (€) *</Label>
          <Input type="number" value={formData.precio_indicativo || ''} onChange={(e) => updateFormData('precio_indicativo', parseInt(e.target.value))} />
        </div>
        <div className="space-y-2">
          <Label>Estructura de pago</Label>
          <Input value={formData.estructura_pago || ''} onChange={(e) => updateFormData('estructura_pago', e.target.value)} placeholder="Ej: 80% al cierre, 20% earn-out" />
        </div>
      </div>

      <Separator />
      <h4 className="font-medium">Due Diligence</h4>
      
      <div className="grid gap-4">
        <div className="space-y-2">
          <Label>Plazo DD (días)</Label>
          <Input type="number" value={formData.dd_plazo_dias || 45} onChange={(e) => updateFormData('dd_plazo_dias', parseInt(e.target.value))} />
        </div>
        <div className="space-y-2">
          <Label>Alcance del DD</Label>
          <div className="grid grid-cols-2 gap-2">
            {DD_ALCANCE_OPTIONS.map((option) => (
              <div key={option} className="flex items-center space-x-2">
                <Checkbox 
                  checked={(formData.dd_alcance || []).includes(option)}
                  onCheckedChange={(checked) => {
                    const current = formData.dd_alcance || [];
                    if (checked) {
                      updateFormData('dd_alcance', [...current, option]);
                    } else {
                      updateFormData('dd_alcance', current.filter((s: string) => s !== option));
                    }
                  }}
                />
                <label className="text-sm">{option}</label>
              </div>
            ))}
          </div>
        </div>
      </div>

      <Separator />
      <h4 className="font-medium">Exclusividad y Validez</h4>
      
      <div className="grid gap-4">
        <div className="flex items-center justify-between">
          <Label>Exclusividad</Label>
          <Switch checked={formData.exclusividad || false} onCheckedChange={(v) => updateFormData('exclusividad', v)} />
        </div>
        {formData.exclusividad && (
          <div className="space-y-2">
            <Label>Días de exclusividad</Label>
            <Input type="number" value={formData.exclusividad_dias || 60} onChange={(e) => updateFormData('exclusividad_dias', parseInt(e.target.value))} />
          </div>
        )}
        <div className="space-y-2">
          <Label>Validez LOI (días)</Label>
          <Input type="number" value={formData.validez_dias || 30} onChange={(e) => updateFormData('validez_dias', parseInt(e.target.value))} />
        </div>
        <div className="flex items-center justify-between">
          <Label>LOI Vinculante</Label>
          <Switch checked={formData.vinculante || false} onCheckedChange={(v) => updateFormData('vinculante', v)} />
        </div>
      </div>
    </div>
  );

  const renderForm = () => {
    switch (selectedType) {
      case 'nda':
        return renderNDAForm();
      case 'mandato_venta':
        return renderMandatoVentaForm();
      case 'mandato_compra':
        return renderMandatoCompraForm();
      case 'loi':
        return renderLOIForm();
      default:
        return null;
    }
  };

  const renderPreview = () => (
    <div className="flex flex-col h-full">
      {previewUrl ? (
        <iframe 
          src={previewUrl} 
          className="flex-1 w-full border rounded-lg"
          title="Vista previa del documento"
        />
      ) : (
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      )}
    </div>
  );

  const getStepTitle = () => {
    switch (step) {
      case 'select':
        return 'Generar Documento';
      case 'form':
        return DOCUMENT_CONFIGS.find(c => c.type === selectedType)?.label || 'Configurar Documento';
      case 'preview':
        return 'Vista Previa';
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-2xl flex flex-col">
        <SheetHeader>
          <div className="flex items-center gap-2">
            {step !== 'select' && (
              <Button variant="ghost" size="icon" onClick={handleBack}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
            )}
            <SheetTitle>{getStepTitle()}</SheetTitle>
          </div>
          <SheetDescription>
            {step === 'select' && 'Selecciona el tipo de documento a generar'}
            {step === 'form' && 'Completa los datos del documento'}
            {step === 'preview' && 'Revisa el documento antes de descargarlo o guardarlo'}
          </SheetDescription>
        </SheetHeader>

        <div className="flex-1 overflow-hidden">
          {step === 'select' && (
            <ScrollArea className="h-full">
              {renderTypeSelector()}
            </ScrollArea>
          )}
          
          {step === 'form' && (
            <ScrollArea className="h-full pr-4">
              {renderForm()}
            </ScrollArea>
          )}
          
          {step === 'preview' && renderPreview()}
        </div>

        {step === 'form' && (
          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button variant="outline" onClick={handleBack}>
              Cancelar
            </Button>
            <Button onClick={handlePreview} disabled={isGenerating}>
              {isGenerating ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Eye className="h-4 w-4 mr-2" />
              )}
              Vista Previa
            </Button>
          </div>
        )}

        {step === 'preview' && (
          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button variant="outline" onClick={handleBack}>
              <ChevronLeft className="h-4 w-4 mr-2" />
              Editar
            </Button>
            <Button variant="outline" onClick={handleDownload}>
              <Download className="h-4 w-4 mr-2" />
              Descargar
            </Button>
            {mandatoId && (
              <Button onClick={handleSave} disabled={isSaving}>
                {isSaving ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Save className="h-4 w-4 mr-2" />
                )}
                Guardar en Mandato
              </Button>
            )}
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
