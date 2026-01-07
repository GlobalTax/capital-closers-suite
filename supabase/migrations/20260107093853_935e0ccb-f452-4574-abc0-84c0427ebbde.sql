-- Create propuestas_honorarios table
CREATE TABLE public.propuestas_honorarios (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  mandato_id UUID NOT NULL REFERENCES public.mandatos(id) ON DELETE CASCADE,
  version INTEGER NOT NULL DEFAULT 1,
  estado TEXT NOT NULL DEFAULT 'borrador' CHECK (estado IN ('borrador', 'enviada', 'aceptada', 'rechazada')),
  titulo TEXT NOT NULL,
  descripcion TEXT,
  importe_total NUMERIC(15,2) NOT NULL DEFAULT 0,
  estructura TEXT CHECK (estructura IN ('fijo', 'exito', 'mixto', 'horario')),
  desglose JSONB DEFAULT '[]'::jsonb,
  condiciones_pago TEXT,
  fecha_emision DATE,
  fecha_vencimiento DATE,
  fecha_respuesta TIMESTAMPTZ,
  motivo_rechazo TEXT,
  notas_internas TEXT,
  archivo_pdf_path TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.propuestas_honorarios ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view propuestas" 
ON public.propuestas_honorarios 
FOR SELECT 
USING (true);

CREATE POLICY "Users can create propuestas" 
ON public.propuestas_honorarios 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Users can update propuestas" 
ON public.propuestas_honorarios 
FOR UPDATE 
USING (true);

CREATE POLICY "Users can delete propuestas" 
ON public.propuestas_honorarios 
FOR DELETE 
USING (true);

-- Create indexes
CREATE INDEX idx_propuestas_mandato ON public.propuestas_honorarios(mandato_id);
CREATE INDEX idx_propuestas_estado ON public.propuestas_honorarios(estado);
CREATE INDEX idx_propuestas_vencimiento ON public.propuestas_honorarios(fecha_vencimiento);

-- Create trigger for updated_at
CREATE TRIGGER update_propuestas_honorarios_updated_at
BEFORE UPDATE ON public.propuestas_honorarios
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();