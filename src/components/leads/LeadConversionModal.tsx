import { useState, useEffect } from "react";
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
import { Building2, User, Briefcase, ArrowRight, CheckCircle2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { convertLeadToClient, getConversionSuggestions, type ConversionData } from "@/services/leadConversion";

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
  { value: 'exito', label: 'Éxito' },
  { value: 'mixto', label: 'Mixto' },
  { value: 'fijo', label: 'Fijo' },
  { value: 'horario', label: 'Por horas' },
];

export function LeadConversionModal({ open, onOpenChange, lead }: LeadConversionModalProps) {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  
  // Form state
  const [empresaNombre, setEmpresaNombre] = useState('');
  const [empresaCif, setEmpresaCif] = useState('');
  const [empresaSector, setEmpresaSector] = useState('');
  
  const [mandatoCodigo, setMandatoCodigo] = useState('');
  const [mandatoDescripcion, setMandatoDescripcion] = useState('');
  const [mandatoTipo, setMandatoTipo] = useState<'venta' | 'compra'>('venta');
  const [mandatoValor, setMandatoValor] = useState('');
  const [estructuraHonorarios, setEstructuraHonorarios] = useState('exito');
  
  const [contactoNombre, setContactoNombre] = useState('');
  const [contactoApellidos, setContactoApellidos] = useState('');
  const [contactoEmail, setContactoEmail] = useState('');
  const [contactoTelefono, setContactoTelefono] = useState('');
  const [contactoCargo, setContactoCargo] = useState('');

  // Initialize form with suggestions
  useEffect(() => {
    if (open && lead) {
      const suggestions = getConversionSuggestions(lead);
      
      setEmpresaNombre(suggestions.empresa?.nombre || lead.empresa || '');
      setEmpresaSector(suggestions.empresa?.sector || lead.sector || '');
      
      setMandatoDescripcion(suggestions.mandato?.descripcion || '');
      setMandatoValor(lead.valoracion?.toString() || '');
      
      setContactoNombre(suggestions.contacto?.nombre || '');
      setContactoApellidos(suggestions.contacto?.apellidos || '');
      setContactoEmail(suggestions.contacto?.email || lead.email);
      setContactoTelefono(suggestions.contacto?.telefono || lead.phone || '');
      
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
          valor: mandatoValor ? parseFloat(mandatoValor) : undefined,
          estructura_honorarios: estructuraHonorarios,
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
      setStep(step + 1);
      return;
    }
    
    // Validation
    if (!empresaNombre.trim()) {
      toast.error('El nombre de la empresa es obligatorio');
      setStep(1);
      return;
    }
    if (!mandatoCodigo.trim() || !mandatoDescripcion.trim()) {
      toast.error('El código y descripción del mandato son obligatorios');
      setStep(2);
      return;
    }
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
      <DialogContent className="sm:max-w-[550px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Briefcase className="h-5 w-5" />
            Convertir Lead a Cliente
          </DialogTitle>
          <DialogDescription>
            Crear empresa, mandato y contacto a partir del lead
          </DialogDescription>
        </DialogHeader>

        {renderStepIndicator()}

        <div className="min-h-[300px]">
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
                        Valoración: {(lead.valoracion / 1000000).toFixed(1)}M€
                      </Badge>
                    )}
                    {lead.facturacion && (
                      <Badge variant="secondary">
                        Facturación: {(lead.facturacion / 1000000).toFixed(1)}M€
                      </Badge>
                    )}
                    {lead.ebitda && (
                      <Badge variant="secondary">
                        EBITDA: {(lead.ebitda / 1000).toFixed(0)}K€
                      </Badge>
                    )}
                  </div>
                </>
              )}
            </div>
          )}

          {/* Step 2: Mandato */}
          {step === 2 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-4">
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
                <div className="col-span-2">
                  <Label>Descripción *</Label>
                  <Textarea
                    value={mandatoDescripcion}
                    onChange={(e) => setMandatoDescripcion(e.target.value)}
                    placeholder="Descripción del mandato..."
                    rows={2}
                  />
                </div>
                <div>
                  <Label>Valor estimado (€)</Label>
                  <Input
                    type="number"
                    value={mandatoValor}
                    onChange={(e) => setMandatoValor(e.target.value)}
                    placeholder="1000000"
                  />
                </div>
                <div>
                  <Label>Estructura honorarios</Label>
                  <Select value={estructuraHonorarios} onValueChange={setEstructuraHonorarios}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {ESTRUCTURA_HONORARIOS.map((est) => (
                        <SelectItem key={est.value} value={est.value}>
                          {est.label}
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
                  Convirtiendo...
                </>
              ) : step < 3 ? (
                'Siguiente'
              ) : (
                'Convertir a Cliente'
              )}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
