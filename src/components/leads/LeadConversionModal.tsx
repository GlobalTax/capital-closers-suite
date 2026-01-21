import { useState, useEffect, useMemo } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
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
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Building2, User, Briefcase, ArrowRight, CheckCircle2, Loader2, Euro, TrendingUp, Calendar, Percent } from "lucide-react";
import { toast } from "sonner";
import { convertLeadToClient, getConversionSuggestions, type ConversionData } from "@/services/leadConversion";
import { MANDATO_CATEGORIAS, MANDATO_CATEGORIA_LABELS, PIPELINE_STAGES, PIPELINE_STAGE_LABELS } from "@/lib/constants";

interface LeadConversionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  lead: {
    id: string;
    tipo: 'contact' | 'valuation' | 'collaborator';
    nombre: string;
    email: string;
    empresa?: string;
    sector?: string;
    valoracion?: number;
    facturacion?: number;
    ebitda?: number;
    phone?: string;
  };
}

const MANDATO_TIPOS = [
  { value: 'venta', label: 'Sell-Side (Venta)' },
  { value: 'compra', label: 'Buy-Side (Compra)' },
];

const ESTRUCTURA_HONORARIOS = [
  { value: 'exito', label: 'A Éxito', description: '% del valor del deal' },
  { value: 'mixto', label: 'Mixto', description: 'Retainer + % éxito' },
  { value: 'fijo', label: 'Fee Fijo', description: 'Importe fijo total' },
  { value: 'horario', label: 'Por Horas', description: 'Tarifa horaria' },
];

// Generate mandate code based on year and sequence
const generateMandatoCodigo = () => {
  const year = new Date().getFullYear();
  const random = Math.floor(Math.random() * 999) + 1;
  return `CAP-${year}-${String(random).padStart(3, '0')}`;
};

export function LeadConversionModal({ open, onOpenChange, lead }: LeadConversionModalProps) {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  
  // Step 1: Empresa
  const [empresaNombre, setEmpresaNombre] = useState('');
  const [empresaCif, setEmpresaCif] = useState('');
  const [empresaSector, setEmpresaSector] = useState('');
  
  // Step 2: Mandato básico
  const [mandatoCodigo, setMandatoCodigo] = useState('');
  const [mandatoDescripcion, setMandatoDescripcion] = useState('');
  const [mandatoTipo, setMandatoTipo] = useState<'venta' | 'compra'>('venta');
  const [mandatoCategoria, setMandatoCategoria] = useState('operacion_ma');
  const [mandatoValor, setMandatoValor] = useState('');
  const [pipelineStage, setPipelineStage] = useState('prospeccion');
  const [fechaCierreEsperada, setFechaCierreEsperada] = useState('');
  
  // Step 2: Estructura de honorarios
  const [estructuraHonorarios, setEstructuraHonorarios] = useState('exito');
  const [porcentajeExito, setPorcentajeExito] = useState('');
  const [feeMinimo, setFeeMinimo] = useState('');
  const [feeFijo, setFeeFijo] = useState('');
  const [retainerMensual, setRetainerMensual] = useState('');
  
  // Step 3: Contacto
  const [contactoNombre, setContactoNombre] = useState('');
  const [contactoApellidos, setContactoApellidos] = useState('');
  const [contactoEmail, setContactoEmail] = useState('');
  const [contactoTelefono, setContactoTelefono] = useState('');
  const [contactoCargo, setContactoCargo] = useState('');

  // Calculate estimated fees
  const honorariosEstimados = useMemo(() => {
    const valor = parseFloat(mandatoValor) || 0;
    const porcentaje = parseFloat(porcentajeExito) || 0;
    const fijo = parseFloat(feeFijo) || 0;
    const retainer = parseFloat(retainerMensual) || 0;
    const minimo = parseFloat(feeMinimo) || 0;
    
    switch (estructuraHonorarios) {
      case 'exito': {
        const exitoFee = valor * (porcentaje / 100);
        return {
          total: Math.max(exitoFee, minimo),
          breakdown: `${porcentaje}% de ${formatCurrency(valor)}${minimo > 0 ? ` (mín. ${formatCurrency(minimo)})` : ''}`,
          type: 'Éxito'
        };
      }
      case 'mixto': {
        const exitoFee = valor * (porcentaje / 100);
        const retainerTotal = retainer * 6; // Estimado 6 meses
        return {
          total: exitoFee + retainerTotal,
          breakdown: `${formatCurrency(retainer)}/mes × 6 meses + ${porcentaje}% éxito`,
          type: 'Mixto'
        };
      }
      case 'fijo':
        return {
          total: fijo,
          breakdown: 'Fee fijo acordado',
          type: 'Fijo'
        };
      default:
        return null;
    }
  }, [mandatoValor, porcentajeExito, feeFijo, retainerMensual, feeMinimo, estructuraHonorarios]);

  // Initialize form with suggestions
  useEffect(() => {
    if (open && lead) {
      const suggestions = getConversionSuggestions(lead);
      
      setEmpresaNombre(suggestions.empresa?.nombre || lead.empresa || '');
      setEmpresaSector(suggestions.empresa?.sector || lead.sector || '');
      
      setMandatoCodigo(generateMandatoCodigo());
      setMandatoDescripcion(suggestions.mandato?.descripcion || '');
      setMandatoValor(lead.valoracion?.toString() || '');
      
      setContactoNombre(suggestions.contacto?.nombre || '');
      setContactoApellidos(suggestions.contacto?.apellidos || '');
      setContactoEmail(suggestions.contacto?.email || lead.email);
      setContactoTelefono(suggestions.contacto?.telefono || lead.phone || '');
      
      // Reset fee fields
      setPorcentajeExito('');
      setFeeMinimo('');
      setFeeFijo('');
      setRetainerMensual('');
      setFechaCierreEsperada('');
      setPipelineStage('prospeccion');
      setMandatoCategoria('operacion_ma');
      setEstructuraHonorarios('exito');
      
      setStep(1);
    }
  }, [open, lead]);

  const mutation = useMutation({
    mutationFn: async () => {
      const conversionData: ConversionData = {
        empresa: {
          nombre: empresaNombre,
          cif: empresaCif || undefined,
          sector: empresaSector || undefined,
          facturacion: lead.facturacion,
          ebitda: lead.ebitda,
        },
        mandato: {
          codigo: mandatoCodigo,
          descripcion: mandatoDescripcion,
          tipo: mandatoTipo,
          categoria: mandatoCategoria,
          valor: mandatoValor ? parseFloat(mandatoValor) : undefined,
          estructura_honorarios: estructuraHonorarios,
          porcentaje_exito: porcentajeExito ? parseFloat(porcentajeExito) : undefined,
          fee_fijo: feeFijo ? parseFloat(feeFijo) : undefined,
          retainer_mensual: retainerMensual ? parseFloat(retainerMensual) : undefined,
          fee_minimo: feeMinimo ? parseFloat(feeMinimo) : undefined,
          pipeline_stage: pipelineStage,
          fecha_cierre_esperada: fechaCierreEsperada || undefined,
        },
        contacto: {
          nombre: contactoNombre,
          apellidos: contactoApellidos || undefined,
          email: contactoEmail,
          telefono: contactoTelefono || undefined,
          cargo: contactoCargo || undefined,
          rol_en_mandato: 'cliente',
        },
      };

      const result = await convertLeadToClient(lead.id, lead.tipo, conversionData);
      
      if (!result.success) {
        throw new Error(result.error);
      }
      
      return result;
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['gestion-leads'] });
      queryClient.invalidateQueries({ queryKey: ['mandatos'] });
      queryClient.invalidateQueries({ queryKey: ['empresas'] });
      queryClient.invalidateQueries({ queryKey: ['contactos'] });
      
      toast.success('Lead convertido a cliente correctamente', {
        action: {
          label: 'Ver mandato',
          onClick: () => navigate(`/mandatos/${result.mandatoId}`),
        },
      });
      
      onOpenChange(false);
    },
    onError: (error: any) => {
      toast.error(error.message || 'Error al convertir el lead');
    },
  });

  const handleSubmit = () => {
    if (step < 3) {
      // Validate current step before proceeding
      if (step === 1 && !empresaNombre.trim()) {
        toast.error('El nombre de la empresa es obligatorio');
        return;
      }
      if (step === 2) {
        if (!mandatoCodigo.trim() || !mandatoDescripcion.trim()) {
          toast.error('El código y descripción del mandato son obligatorios');
          return;
        }
        // Validate fee structure
        if ((estructuraHonorarios === 'exito' || estructuraHonorarios === 'mixto') && !porcentajeExito) {
          toast.error('El porcentaje de éxito es obligatorio para esta estructura');
          return;
        }
        if (estructuraHonorarios === 'fijo' && !feeFijo) {
          toast.error('El fee fijo es obligatorio para esta estructura');
          return;
        }
        if (estructuraHonorarios === 'mixto' && !retainerMensual) {
          toast.error('El retainer mensual es obligatorio para estructura mixta');
          return;
        }
      }
      setStep(step + 1);
      return;
    }
    
    // Final validation
    if (!contactoNombre.trim() || !contactoEmail.trim()) {
      toast.error('El nombre y email del contacto son obligatorios');
      return;
    }
    
    mutation.mutate();
  };

  const renderStepIndicator = () => (
    <div className="flex items-center justify-center gap-2 mb-6">
      {[1, 2, 3].map((s) => (
        <div key={s} className="flex items-center">
          <div
            className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
              s === step
                ? 'bg-primary text-primary-foreground'
                : s < step
                ? 'bg-green-500 text-white'
                : 'bg-muted text-muted-foreground'
            }`}
          >
            {s < step ? <CheckCircle2 className="h-4 w-4" /> : s}
          </div>
          {s < 3 && (
            <ArrowRight className={`h-4 w-4 mx-2 ${s < step ? 'text-green-500' : 'text-muted-foreground'}`} />
          )}
        </div>
      ))}
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[650px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Briefcase className="h-5 w-5" />
            Apertura de Cliente
          </DialogTitle>
          <DialogDescription>
            Crear empresa, mandato con honorarios y contacto principal
          </DialogDescription>
        </DialogHeader>

        {renderStepIndicator()}

        <div className="min-h-[380px]">
          {/* Step 1: Empresa */}
          {step === 1 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-4">
                <Building2 className="h-5 w-5 text-muted-foreground" />
                <h3 className="font-medium">Datos de la Empresa</h3>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <Label>Nombre de la empresa *</Label>
                  <Input
                    value={empresaNombre}
                    onChange={(e) => setEmpresaNombre(e.target.value)}
                    placeholder="Nombre de la empresa"
                  />
                </div>
                <div>
                  <Label>CIF</Label>
                  <Input
                    value={empresaCif}
                    onChange={(e) => setEmpresaCif(e.target.value)}
                    placeholder="B12345678"
                  />
                </div>
                <div>
                  <Label>Sector</Label>
                  <Input
                    value={empresaSector}
                    onChange={(e) => setEmpresaSector(e.target.value)}
                    placeholder="Tecnología, Salud..."
                  />
                </div>
              </div>
              
              {(lead.facturacion || lead.ebitda || lead.valoracion) && (
                <>
                  <Separator />
                  <div className="flex gap-2 flex-wrap">
                    {lead.valoracion && (
                      <Badge variant="secondary">
                        Valoración: {formatCurrency(lead.valoracion)}
                      </Badge>
                    )}
                    {lead.facturacion && (
                      <Badge variant="secondary">
                        Facturación: {formatCurrency(lead.facturacion)}
                      </Badge>
                    )}
                    {lead.ebitda && (
                      <Badge variant="secondary">
                        EBITDA: {formatCurrency(lead.ebitda)}
                      </Badge>
                    )}
                  </div>
                </>
              )}
            </div>
          )}

          {/* Step 2: Mandato */}
          {step === 2 && (
            <div className="space-y-5">
              <div className="flex items-center gap-2">
                <Briefcase className="h-5 w-5 text-muted-foreground" />
                <h3 className="font-medium">Datos del Mandato</h3>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Código *</Label>
                  <Input
                    value={mandatoCodigo}
                    onChange={(e) => setMandatoCodigo(e.target.value.toUpperCase())}
                    placeholder="CAP-2026-001"
                  />
                </div>
                <div>
                  <Label>Categoría</Label>
                  <Select value={mandatoCategoria} onValueChange={setMandatoCategoria}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {MANDATO_CATEGORIAS.map((cat) => (
                        <SelectItem key={cat} value={cat}>
                          {MANDATO_CATEGORIA_LABELS[cat]?.label || cat}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Tipo *</Label>
                  <Select value={mandatoTipo} onValueChange={(v) => setMandatoTipo(v as any)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {MANDATO_TIPOS.map((tipo) => (
                        <SelectItem key={tipo.value} value={tipo.value}>
                          {tipo.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Valor estimado (€)</Label>
                  <div className="relative">
                    <Euro className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      type="number"
                      value={mandatoValor}
                      onChange={(e) => setMandatoValor(e.target.value)}
                      placeholder="2500000"
                      className="pl-9"
                    />
                  </div>
                </div>
                <div className="col-span-2">
                  <Label>Descripción *</Label>
                  <Textarea
                    value={mandatoDescripcion}
                    onChange={(e) => setMandatoDescripcion(e.target.value)}
                    placeholder="Descripción del mandato..."
                    rows={2}
                  />
                </div>
              </div>

              <Separator />
              
              {/* Estructura de Honorarios */}
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                  <h4 className="text-sm font-medium">Estructura de Honorarios</h4>
                </div>
                
                <div className="grid grid-cols-4 gap-2">
                  {ESTRUCTURA_HONORARIOS.map((est) => (
                    <button
                      key={est.value}
                      type="button"
                      onClick={() => setEstructuraHonorarios(est.value)}
                      className={`p-3 rounded-lg border text-left transition-all ${
                        estructuraHonorarios === est.value
                          ? 'border-primary bg-primary/5 ring-1 ring-primary'
                          : 'border-border hover:border-primary/50'
                      }`}
                    >
                      <div className="font-medium text-sm">{est.label}</div>
                      <div className="text-xs text-muted-foreground">{est.description}</div>
                    </button>
                  ))}
                </div>

                {/* Fee fields based on structure */}
                <div className="grid grid-cols-2 gap-4">
                  {(estructuraHonorarios === 'exito' || estructuraHonorarios === 'mixto') && (
                    <>
                      <div>
                        <Label className="flex items-center gap-1">
                          <Percent className="h-3 w-3" />
                          Porcentaje de Éxito *
                        </Label>
                        <div className="relative">
                          <Input
                            type="number"
                            step="0.1"
                            value={porcentajeExito}
                            onChange={(e) => setPorcentajeExito(e.target.value)}
                            placeholder="3.5"
                            className="pr-8"
                          />
                          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">%</span>
                        </div>
                      </div>
                      {estructuraHonorarios === 'exito' && (
                        <div>
                          <Label>Fee Mínimo (€)</Label>
                          <div className="relative">
                            <Euro className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                              type="number"
                              value={feeMinimo}
                              onChange={(e) => setFeeMinimo(e.target.value)}
                              placeholder="50000"
                              className="pl-9"
                            />
                          </div>
                        </div>
                      )}
                    </>
                  )}

                  {estructuraHonorarios === 'mixto' && (
                    <div>
                      <Label>Retainer Mensual (€) *</Label>
                      <div className="relative">
                        <Euro className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          type="number"
                          value={retainerMensual}
                          onChange={(e) => setRetainerMensual(e.target.value)}
                          placeholder="5000"
                          className="pl-9"
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">/mes</span>
                      </div>
                    </div>
                  )}

                  {estructuraHonorarios === 'fijo' && (
                    <div className="col-span-2">
                      <Label>Fee Fijo Total (€) *</Label>
                      <div className="relative">
                        <Euro className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          type="number"
                          value={feeFijo}
                          onChange={(e) => setFeeFijo(e.target.value)}
                          placeholder="75000"
                          className="pl-9"
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Estimated fees preview */}
                {honorariosEstimados && honorariosEstimados.total > 0 && (
                  <Card className="bg-primary/5 border-primary/20">
                    <CardContent className="py-3 px-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-xs text-muted-foreground">Honorarios estimados ({honorariosEstimados.type})</div>
                          <div className="text-sm text-muted-foreground">{honorariosEstimados.breakdown}</div>
                        </div>
                        <div className="text-xl font-bold text-primary">
                          ~{formatCurrency(honorariosEstimados.total)}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>

              <Separator />

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    Fecha cierre esperada
                  </Label>
                  <Input
                    type="date"
                    value={fechaCierreEsperada}
                    onChange={(e) => setFechaCierreEsperada(e.target.value)}
                  />
                </div>
                <div>
                  <Label>Pipeline Stage</Label>
                  <Select value={pipelineStage} onValueChange={setPipelineStage}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {PIPELINE_STAGES.map((stage) => (
                        <SelectItem key={stage} value={stage}>
                          {PIPELINE_STAGE_LABELS[stage] || stage}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Contacto */}
          {step === 3 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-4">
                <User className="h-5 w-5 text-muted-foreground" />
                <h3 className="font-medium">Datos del Contacto Principal</h3>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Nombre *</Label>
                  <Input
                    value={contactoNombre}
                    onChange={(e) => setContactoNombre(e.target.value)}
                    placeholder="Nombre"
                  />
                </div>
                <div>
                  <Label>Apellidos</Label>
                  <Input
                    value={contactoApellidos}
                    onChange={(e) => setContactoApellidos(e.target.value)}
                    placeholder="Apellidos"
                  />
                </div>
                <div>
                  <Label>Email *</Label>
                  <Input
                    type="email"
                    value={contactoEmail}
                    onChange={(e) => setContactoEmail(e.target.value)}
                    placeholder="email@empresa.com"
                  />
                </div>
                <div>
                  <Label>Teléfono</Label>
                  <Input
                    value={contactoTelefono}
                    onChange={(e) => setContactoTelefono(e.target.value)}
                    placeholder="+34 600 000 000"
                  />
                </div>
                <div className="col-span-2">
                  <Label>Cargo</Label>
                  <Input
                    value={contactoCargo}
                    onChange={(e) => setContactoCargo(e.target.value)}
                    placeholder="CEO, Director General..."
                  />
                </div>
              </div>

              {/* Summary before conversion */}
              <Separator className="my-4" />
              
              <div className="space-y-3">
                <h4 className="text-sm font-medium text-muted-foreground">Resumen de apertura</h4>
                <div className="grid grid-cols-3 gap-3">
                  <Card className="p-3">
                    <div className="flex items-center gap-2 mb-1">
                      <Building2 className="h-4 w-4 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground">Empresa</span>
                    </div>
                    <div className="font-medium text-sm truncate">{empresaNombre}</div>
                  </Card>
                  <Card className="p-3">
                    <div className="flex items-center gap-2 mb-1">
                      <Briefcase className="h-4 w-4 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground">Mandato</span>
                    </div>
                    <div className="font-medium text-sm truncate">{mandatoCodigo}</div>
                    {honorariosEstimados && (
                      <div className="text-xs text-primary">~{formatCurrency(honorariosEstimados.total)}</div>
                    )}
                  </Card>
                  <Card className="p-3">
                    <div className="flex items-center gap-2 mb-1">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground">Contacto</span>
                    </div>
                    <div className="font-medium text-sm truncate">{contactoNombre}</div>
                  </Card>
                </div>
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="flex justify-between">
          <div>
            {step > 1 && (
              <Button type="button" variant="ghost" onClick={() => setStep(step - 1)}>
                Atrás
              </Button>
            )}
          </div>
          <div className="flex gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSubmit} disabled={mutation.isPending}>
              {mutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Creando...
                </>
              ) : step < 3 ? (
                'Siguiente'
              ) : (
                'Abrir Cliente'
              )}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Helper function
function formatCurrency(value: number): string {
  if (value >= 1000000) {
    return `${(value / 1000000).toFixed(1)}M€`;
  } else if (value >= 1000) {
    return `${(value / 1000).toFixed(0)}K€`;
  }
  return `${value.toLocaleString('es-ES')}€`;
}
