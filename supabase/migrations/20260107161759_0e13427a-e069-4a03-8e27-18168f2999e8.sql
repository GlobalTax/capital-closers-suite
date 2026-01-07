-- Add PSH-specific fields to propuestas_honorarios
ALTER TABLE public.propuestas_honorarios
ADD COLUMN IF NOT EXISTS cliente_cif text,
ADD COLUMN IF NOT EXISTS cliente_domicilio text,
ADD COLUMN IF NOT EXISTS target_nombre text,
ADD COLUMN IF NOT EXISTS target_cif text,
ADD COLUMN IF NOT EXISTS target_domicilio text,
ADD COLUMN IF NOT EXISTS descripcion_transaccion text,
ADD COLUMN IF NOT EXISTS alcance_dd jsonb DEFAULT '{}',
ADD COLUMN IF NOT EXISTS honorarios_negociacion numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS clausulas_adicionales jsonb DEFAULT '{}',
ADD COLUMN IF NOT EXISTS plantilla_tipo text,
ADD COLUMN IF NOT EXISTS firma_cliente text,
ADD COLUMN IF NOT EXISTS firma_firma text,
ADD COLUMN IF NOT EXISTS empresa_cliente_id uuid REFERENCES public.empresas(id),
ADD COLUMN IF NOT EXISTS empresa_target_id uuid REFERENCES public.empresas(id);

-- Create PSH templates table
CREATE TABLE IF NOT EXISTS public.psh_plantillas (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nombre text NOT NULL,
  tipo_servicio text NOT NULL,
  descripcion text,
  alcance_default jsonb DEFAULT '{}',
  clausulas_default jsonb DEFAULT '{}',
  condiciones_pago_default text,
  is_active boolean DEFAULT true,
  display_order integer DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.psh_plantillas ENABLE ROW LEVEL SECURITY;

-- RLS policies for psh_plantillas (read-only for authenticated users)
CREATE POLICY "Authenticated users can view templates"
ON public.psh_plantillas
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Admin users can manage templates"
ON public.psh_plantillas
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.admin_users
    WHERE admin_users.user_id = auth.uid()
    AND admin_users.role IN ('super_admin', 'admin')
  )
);

-- Insert default templates
INSERT INTO public.psh_plantillas (nombre, tipo_servicio, descripcion, alcance_default, condiciones_pago_default, display_order) VALUES
(
  'Due Diligence Completa',
  'due_diligence',
  'Incluye revisión legal, fiscal, financiera y laboral',
  '{
    "legal": {"incluido": true, "importe": 1000, "alcance": ["Aspectos societarios y corporativos", "Contratación mercantil", "Activos y derechos", "Litigios y contingencias"]},
    "fiscal": {"incluido": true, "importe": 1000, "alcance": ["Impuesto sobre Sociedades", "IVA e impuestos indirectos", "Retenciones", "Inspecciones fiscales", "Operaciones vinculadas"]},
    "financiera": {"incluido": true, "importe": 1500, "alcance": ["Estados financieros históricos", "Análisis de EBITDA", "Deuda financiera neta", "Capital circulante"]},
    "laboral": {"incluido": true, "importe": 800, "alcance": ["Estructura de plantilla", "Contratos de trabajo", "Seguridad Social", "Procedimientos laborales"]}
  }',
  '60% a la firma de la propuesta. 40% al inicio de la negociación contractual o cierre de la operación.',
  1
),
(
  'Due Diligence Reducida',
  'due_diligence',
  'Revisión legal y fiscal únicamente',
  '{
    "legal": {"incluido": true, "importe": 1000, "alcance": ["Aspectos societarios y corporativos", "Contratación mercantil", "Litigios y contingencias"]},
    "fiscal": {"incluido": true, "importe": 1000, "alcance": ["Impuesto sobre Sociedades", "IVA", "Inspecciones fiscales"]},
    "financiera": {"incluido": false, "importe": 0, "alcance": []},
    "laboral": {"incluido": false, "importe": 0, "alcance": []}
  }',
  '50% a la firma. 50% a la entrega del informe.',
  2
),
(
  'Asesoramiento SPA',
  'spa',
  'Negociación y cierre del contrato de compraventa',
  '{
    "legal": {"incluido": false, "importe": 0, "alcance": []},
    "fiscal": {"incluido": false, "importe": 0, "alcance": []},
    "financiera": {"incluido": false, "importe": 0, "alcance": []},
    "laboral": {"incluido": false, "importe": 0, "alcance": []}
  }',
  '30% al inicio. 70% al cierre de la operación.',
  3
),
(
  'DD + SPA Combinado',
  'dd_spa',
  'Paquete completo de Due Diligence y asesoramiento en SPA',
  '{
    "legal": {"incluido": true, "importe": 1000, "alcance": ["Aspectos societarios y corporativos", "Contratación mercantil", "Activos y derechos", "Litigios y contingencias"]},
    "fiscal": {"incluido": true, "importe": 1000, "alcance": ["Impuesto sobre Sociedades", "IVA e impuestos indirectos", "Inspecciones fiscales"]},
    "financiera": {"incluido": true, "importe": 1500, "alcance": ["Estados financieros históricos", "Análisis de EBITDA", "Deuda financiera neta"]},
    "laboral": {"incluido": true, "importe": 800, "alcance": ["Estructura de plantilla", "Contratos de trabajo", "Seguridad Social"]}
  }',
  '40% a la firma. 30% al inicio de la negociación. 30% al cierre.',
  4
);

-- Create updated_at trigger for psh_plantillas
CREATE TRIGGER update_psh_plantillas_updated_at
BEFORE UPDATE ON public.psh_plantillas
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();