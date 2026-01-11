import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
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
  ArrowRight,
} from 'lucide-react';
import { useDocumentGenerator } from '@/hooks/useDocumentGenerator';
import { 
  type DocumentType, 
  DOCUMENT_CONFIGS,
  DEFAULT_VALUES,
  SERVICIOS_MANDATO_VENTA,
  SERVICIOS_MANDATO_COMPRA,
  DD_ALCANCE_OPTIONS,
} from '@/types/document-generators';
import { format } from 'date-fns';

interface DocumentGeneratorPanelProps {
  mandatoId?: string;
  empresaNombre?: string;
  empresaData?: {
    nombre?: string;
    cif?: string;
    domicilio?: string;
    representante?: string;
  };
  onDocumentSaved?: () => void;
}

type Step = 'select' | 'form' | 'preview';

const DOCUMENT_ICONS: Record<DocumentType, typeof Shield> = {
  nda: Shield,
  mandato_venta: FileText,
  mandato_compra: Search,
  loi: Mail,
  psh: FileText,
};

export function DocumentGeneratorPanel({
  mandatoId,
  empresaNombre,
  empresaData,
  onDocumentSaved,
}: DocumentGeneratorPanelProps) {
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

  // Initialize form with default values when type is selected
  useEffect(() => {
    if (selectedType) {
      const defaults: Record<string, any> = {
        fecha: format(new Date(), 'yyyy-MM-dd'),
        lugar: 'Madrid',
        ...DEFAULT_VALUES,
      };

      // Pre-fill with empresa data if available
      if (empresaData || empresaNombre) {
        const nombre = empresaData?.nombre || empresaNombre || '';
        if (selectedType === 'nda') {
          defaults.empresa_nombre = nombre;
          defaults.empresa_cif = empresaData?.cif || '';
          defaults.empresa_domicilio = empresaData?.domicilio || '';
          defaults.empresa_representante = empresaData?.representante || '';
        } else if (selectedType === 'mandato_venta') {
          defaults.target_nombre = nombre;
          defaults.cliente_nombre = nombre;
          defaults.cliente_cif = empresaData?.cif || '';
          defaults.cliente_domicilio = empresaData?.domicilio || '';
          defaults.cliente_representante = empresaData?.representante || '';
          defaults.servicios = [...SERVICIOS_MANDATO_VENTA];
          defaults.exclusividad = true;
          defaults.renovacion_automatica = true;
        } else if (selectedType === 'mandato_compra') {
          defaults.cliente_nombre = nombre;
          defaults.cliente_cif = empresaData?.cif || '';
          defaults.cliente_domicilio = empresaData?.domicilio || '';
          defaults.cliente_representante = empresaData?.representante || '';
          defaults.servicios = [...SERVICIOS_MANDATO_COMPRA];
          defaults.sectores_objetivo = [];
          defaults.geografia_objetivo = ['España'];
          defaults.exclusividad = true;
          defaults.renovacion_automatica = true;
        } else if (selectedType === 'loi') {
          defaults.target_nombre = nombre;
          defaults.vendedor_nombre = nombre;
          defaults.vendedor_cif = empresaData?.cif || '';
          defaults.vendedor_domicilio = empresaData?.domicilio || '';
          defaults.vendedor_representante = empresaData?.representante || '';
          defaults.dd_alcance = [...DD_ALCANCE_OPTIONS.slice(0, 4)];
          defaults.exclusividad = true;
          defaults.vinculante = false;
          defaults.porcentaje_adquisicion = 100;
        }
      }

      setFormData(defaults);
    }
  }, [selectedType, empresaData, empresaNombre]);

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

  const handleReset = () => {
    setStep('select');
    setSelectedType(null);
    setFormData({});
    clearPreview();
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
      onDocumentSaved?.();
      handleReset();
    }
  };

  const updateFormData = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const renderTypeSelector = () => (
    <div className="grid md:grid-cols-2 gap-4">
      {DOCUMENT_CONFIGS.filter(c => c.type !== 'psh').map((config) => {
        const Icon = DOCUMENT_ICONS[config.type];
        return (
          <Card
            key={config.type}
            className="cursor-pointer hover:border-primary/50 hover:bg-accent/50 transition-all group"
            onClick={() => handleSelectType(config.type)}
          >
            <CardHeader className="pb-3">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors">
                  <Icon className="h-5 w-5 text-primary" />
                </div>
                <CardTitle className="text-base">{config.label}</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <CardDescription>{config.description}</CardDescription>
              <div className="flex items-center gap-1 text-primary text-sm mt-3">
                Seleccionar <ArrowRight className="h-4 w-4" />
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );

  const renderFormField = (
    label: string,
    field: string,
    type: 'text' | 'number' | 'date' | 'textarea' = 'text',
    placeholder?: string,
    required?: boolean
  ) => (
    <div className="space-y-2">
      <Label>{label}{required && ' *'}</Label>
      {type === 'textarea' ? (
        <Textarea 
          value={formData[field] || ''} 
          onChange={(e) => updateFormData(field, e.target.value)}
          placeholder={placeholder}
        />
      ) : (
        <Input 
          type={type}
          value={formData[field] || ''} 
          onChange={(e) => updateFormData(field, type === 'number' ? (e.target.value ? parseFloat(e.target.value) : '') : e.target.value)}
          placeholder={placeholder}
        />
      )}
    </div>
  );

  const renderNDAForm = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
        {renderFormField('Fecha', 'fecha', 'date')}
        {renderFormField('Lugar', 'lugar')}
      </div>

      <Separator />
      <h4 className="font-medium">Parte Reveladora</h4>
      <div className="grid gap-4">
        <div className="grid grid-cols-2 gap-4">
          {renderFormField('Nombre empresa', 'empresa_nombre', 'text', '', true)}
          {renderFormField('CIF', 'empresa_cif')}
        </div>
        {renderFormField('Domicilio', 'empresa_domicilio')}
        {renderFormField('Representante', 'empresa_representante')}
      </div>

      <Separator />
      <h4 className="font-medium">Parte Receptora</h4>
      <div className="grid gap-4">
        <div className="grid grid-cols-2 gap-4">
          {renderFormField('Nombre empresa', 'contraparte_nombre', 'text', '', true)}
          {renderFormField('CIF', 'contraparte_cif')}
        </div>
        {renderFormField('Domicilio', 'contraparte_domicilio')}
        {renderFormField('Representante', 'contraparte_representante')}
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
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="compra">Compra</SelectItem>
              <SelectItem value="venta">Venta</SelectItem>
              <SelectItem value="inversion">Inversión</SelectItem>
            </SelectContent>
          </Select>
        </div>
        {renderFormField('Descripción de la operación', 'descripcion_operacion', 'textarea', 'Ej: la totalidad del capital social de EMPRESA TARGET, S.L.')}
        <div className="grid grid-cols-2 gap-4">
          {renderFormField('Duración (meses)', 'duracion_meses', 'number')}
          {renderFormField('Penalización (€)', 'penalizacion_euros', 'number', 'Opcional')}
        </div>
        <div className="grid grid-cols-2 gap-4">
          {renderFormField('Jurisdicción', 'jurisdiccion')}
          {renderFormField('Ley aplicable', 'ley_aplicable')}
        </div>
      </div>
    </div>
  );

  const renderMandatoVentaForm = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
        {renderFormField('Fecha', 'fecha', 'date')}
        {renderFormField('Lugar', 'lugar')}
      </div>

      <Separator />
      <h4 className="font-medium">Datos del Asesor</h4>
      <div className="grid gap-4">
        <div className="grid grid-cols-2 gap-4">
          {renderFormField('Nombre', 'asesor_nombre', 'text', '', true)}
          {renderFormField('CIF', 'asesor_cif')}
        </div>
        {renderFormField('Representante', 'asesor_representante')}
      </div>

      <Separator />
      <h4 className="font-medium">Cliente (Vendedor)</h4>
      <div className="grid gap-4">
        <div className="grid grid-cols-2 gap-4">
          {renderFormField('Nombre', 'cliente_nombre', 'text', '', true)}
          {renderFormField('CIF', 'cliente_cif')}
        </div>
        {renderFormField('Domicilio', 'cliente_domicilio')}
        {renderFormField('Representante', 'cliente_representante')}
      </div>

      <Separator />
      <h4 className="font-medium">Empresa Objetivo (Target)</h4>
      <div className="grid gap-4">
        <div className="grid grid-cols-2 gap-4">
          {renderFormField('Nombre', 'target_nombre', 'text', '', true)}
          {renderFormField('CIF', 'target_cif')}
        </div>
        {renderFormField('Descripción / Actividad', 'target_descripcion', 'textarea')}
      </div>

      <Separator />
      <h4 className="font-medium">Condiciones del Mandato</h4>
      <div className="grid gap-4">
        <div className="flex items-center justify-between">
          <Label>Exclusividad</Label>
          <Switch checked={formData.exclusividad || false} onCheckedChange={(v) => updateFormData('exclusividad', v)} />
        </div>
        <div className="grid grid-cols-2 gap-4">
          {renderFormField('Duración (meses)', 'duracion_meses', 'number')}
          {renderFormField('Preaviso (días)', 'preaviso_dias', 'number')}
        </div>
        <div className="flex items-center justify-between">
          <Label>Renovación automática</Label>
          <Switch checked={formData.renovacion_automatica || false} onCheckedChange={(v) => updateFormData('renovacion_automatica', v)} />
        </div>
      </div>

      <Separator />
      <h4 className="font-medium">Valoración y Honorarios</h4>
      <div className="grid gap-4">
        <div className="grid grid-cols-2 gap-4">
          {renderFormField('Valoración mín. (€)', 'valoracion_indicativa_min', 'number')}
          {renderFormField('Valoración máx. (€)', 'valoracion_indicativa_max', 'number')}
        </div>
        <div className="grid grid-cols-2 gap-4">
          {renderFormField('Honorario fijo (€)', 'honorario_fijo', 'number')}
          {renderFormField('Honorario éxito (%)', 'honorario_exito_porcentaje', 'number')}
        </div>
        {renderFormField('Honorario mínimo (€)', 'honorario_minimo', 'number')}
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
        {renderFormField('Fecha', 'fecha', 'date')}
        {renderFormField('Lugar', 'lugar')}
      </div>

      <Separator />
      <h4 className="font-medium">Cliente (Comprador)</h4>
      <div className="grid gap-4">
        <div className="grid grid-cols-2 gap-4">
          {renderFormField('Nombre', 'cliente_nombre', 'text', '', true)}
          {renderFormField('CIF', 'cliente_cif')}
        </div>
        {renderFormField('Domicilio', 'cliente_domicilio')}
        {renderFormField('Representante', 'cliente_representante')}
      </div>

      <Separator />
      <h4 className="font-medium">Criterios de Búsqueda</h4>
      <div className="grid gap-4">
        {renderFormField('Sectores objetivo', 'sectores_objetivo_text', 'text', 'Ej: Tecnología, Salud, Industrial')}
        {renderFormField('Geografía objetivo', 'geografia_objetivo_text', 'text', 'Ej: España, Portugal')}
        <div className="grid grid-cols-2 gap-4">
          {renderFormField('Facturación mín. (€)', 'facturacion_min', 'number')}
          {renderFormField('Facturación máx. (€)', 'facturacion_max', 'number')}
        </div>
        <div className="grid grid-cols-2 gap-4">
          {renderFormField('EBITDA mín. (€)', 'ebitda_min', 'number')}
          {renderFormField('EBITDA máx. (€)', 'ebitda_max', 'number')}
        </div>
        <div className="grid grid-cols-2 gap-4">
          {renderFormField('Inversión mín. (€)', 'inversion_min', 'number')}
          {renderFormField('Inversión máx. (€)', 'inversion_max', 'number')}
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
          {renderFormField('Duración (meses)', 'duracion_meses', 'number')}
          {renderFormField('Honorario éxito (%)', 'honorario_exito_porcentaje', 'number')}
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
        {renderFormField('Fecha', 'fecha', 'date')}
        {renderFormField('Lugar', 'lugar')}
      </div>

      <Separator />
      <h4 className="font-medium">Comprador</h4>
      <div className="grid gap-4">
        <div className="grid grid-cols-2 gap-4">
          {renderFormField('Nombre', 'comprador_nombre', 'text', '', true)}
          {renderFormField('CIF', 'comprador_cif')}
        </div>
        {renderFormField('Domicilio', 'comprador_domicilio')}
        {renderFormField('Representante', 'comprador_representante')}
      </div>

      <Separator />
      <h4 className="font-medium">Vendedor</h4>
      <div className="grid gap-4">
        <div className="grid grid-cols-2 gap-4">
          {renderFormField('Nombre', 'vendedor_nombre', 'text', '', true)}
          {renderFormField('CIF', 'vendedor_cif')}
        </div>
        {renderFormField('Domicilio', 'vendedor_domicilio')}
        {renderFormField('Representante', 'vendedor_representante')}
      </div>

      <Separator />
      <h4 className="font-medium">Objeto de la Transacción</h4>
      <div className="grid gap-4">
        <div className="grid grid-cols-2 gap-4">
          {renderFormField('Nombre Target', 'target_nombre', 'text', '', true)}
          {renderFormField('% Adquisición', 'porcentaje_adquisicion', 'number')}
        </div>
        {renderFormField('Precio Indicativo (€)', 'precio_indicativo', 'number', '', true)}
        {renderFormField('Estructura de pago', 'estructura_pago', 'text', 'Ej: 80% al cierre, 20% earn-out')}
      </div>

      <Separator />
      <h4 className="font-medium">Due Diligence</h4>
      <div className="grid gap-4">
        {renderFormField('Plazo DD (días)', 'dd_plazo_dias', 'number')}
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
        {formData.exclusividad && renderFormField('Días de exclusividad', 'exclusividad_dias', 'number')}
        {renderFormField('Validez LOI (días)', 'validez_dias', 'number')}
        <div className="flex items-center justify-between">
          <Label>LOI Vinculante</Label>
          <Switch checked={formData.vinculante || false} onCheckedChange={(v) => updateFormData('vinculante', v)} />
        </div>
      </div>
    </div>
  );

  const renderForm = () => {
    switch (selectedType) {
      case 'nda': return renderNDAForm();
      case 'mandato_venta': return renderMandatoVentaForm();
      case 'mandato_compra': return renderMandatoCompraForm();
      case 'loi': return renderLOIForm();
      default: return null;
    }
  };

  const renderPreview = () => (
    <div className="flex flex-col h-[600px]">
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
      case 'select': return 'Selecciona el tipo de documento';
      case 'form': return DOCUMENT_CONFIGS.find(c => c.type === selectedType)?.label || 'Configurar Documento';
      case 'preview': return 'Vista Previa';
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          {step !== 'select' && (
            <Button variant="ghost" size="icon" onClick={handleBack}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
          )}
          <div>
            <CardTitle>{getStepTitle()}</CardTitle>
            {step === 'select' && (
              <CardDescription className="mt-1">
                Genera documentos legales profesionales con datos pre-rellenados
              </CardDescription>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {step === 'select' && renderTypeSelector()}
        
        {step === 'form' && (
          <div className="space-y-6">
            <ScrollArea className="h-[500px] pr-4">
              {renderForm()}
            </ScrollArea>
            <div className="flex justify-end gap-2 pt-4 border-t">
              <Button variant="outline" onClick={handleBack}>
                <ChevronLeft className="mr-2 h-4 w-4" />
                Atrás
              </Button>
              <Button onClick={handlePreview} disabled={isGenerating}>
                {isGenerating ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Eye className="mr-2 h-4 w-4" />
                )}
                Vista Previa
              </Button>
            </div>
          </div>
        )}

        {step === 'preview' && (
          <div className="space-y-6">
            {renderPreview()}
            <div className="flex justify-between pt-4 border-t">
              <Button variant="outline" onClick={handleBack}>
                <ChevronLeft className="mr-2 h-4 w-4" />
                Editar
              </Button>
              <div className="flex gap-2">
                <Button variant="outline" onClick={handleDownload}>
                  <Download className="mr-2 h-4 w-4" />
                  Descargar
                </Button>
                {mandatoId && (
                  <Button onClick={handleSave} disabled={isSaving}>
                    {isSaving ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Save className="mr-2 h-4 w-4" />
                    )}
                    Guardar en Mandato
                  </Button>
                )}
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
