-- =====================================================
-- FASE 1: Modelo de Datos para Mandatos Buy-Side
-- =====================================================

-- 1. Añadir campos a mandato_empresas para pipeline y scoring
ALTER TABLE public.mandato_empresas 
ADD COLUMN IF NOT EXISTS funnel_stage text DEFAULT 'long_list' CHECK (funnel_stage IN ('long_list', 'short_list', 'finalista', 'descartado')),
ADD COLUMN IF NOT EXISTS pipeline_stage_target text DEFAULT 'identificada' CHECK (pipeline_stage_target IN ('identificada', 'contactada', 'nda_firmado', 'info_recibida', 'due_diligence', 'oferta', 'cierre')),
ADD COLUMN IF NOT EXISTS match_score integer DEFAULT 0 CHECK (match_score >= 0 AND match_score <= 100),
ADD COLUMN IF NOT EXISTS pipeline_stage_changed_at timestamp with time zone DEFAULT now();

-- 2. Crear tabla de scoring de targets
CREATE TABLE IF NOT EXISTS public.mandato_empresa_scoring (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  mandato_empresa_id uuid NOT NULL REFERENCES public.mandato_empresas(id) ON DELETE CASCADE,
  fit_estrategico integer NOT NULL DEFAULT 0 CHECK (fit_estrategico >= 0 AND fit_estrategico <= 100),
  fit_financiero integer NOT NULL DEFAULT 0 CHECK (fit_financiero >= 0 AND fit_financiero <= 100),
  fit_cultural integer NOT NULL DEFAULT 0 CHECK (fit_cultural >= 0 AND fit_cultural <= 100),
  score_total integer GENERATED ALWAYS AS ((fit_estrategico + fit_financiero + fit_cultural) / 3) STORED,
  notas text,
  scored_at timestamp with time zone DEFAULT now(),
  scored_by uuid REFERENCES auth.users(id),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(mandato_empresa_id)
);

-- 3. Crear tabla de ofertas/LOIs por target
CREATE TABLE IF NOT EXISTS public.target_ofertas (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  mandato_empresa_id uuid NOT NULL REFERENCES public.mandato_empresas(id) ON DELETE CASCADE,
  tipo text NOT NULL CHECK (tipo IN ('indicativa', 'loi', 'binding')),
  monto numeric NOT NULL CHECK (monto >= 0),
  fecha date NOT NULL DEFAULT CURRENT_DATE,
  estado text NOT NULL DEFAULT 'enviada' CHECK (estado IN ('enviada', 'aceptada', 'rechazada', 'contraoferta', 'expirada', 'retirada')),
  condiciones text,
  fecha_expiracion date,
  contraoferta_monto numeric CHECK (contraoferta_monto >= 0),
  notas text,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- 4. Crear índices para rendimiento
CREATE INDEX IF NOT EXISTS idx_mandato_empresas_funnel_stage ON public.mandato_empresas(funnel_stage);
CREATE INDEX IF NOT EXISTS idx_mandato_empresas_pipeline_stage_target ON public.mandato_empresas(pipeline_stage_target);
CREATE INDEX IF NOT EXISTS idx_mandato_empresa_scoring_mandato_empresa_id ON public.mandato_empresa_scoring(mandato_empresa_id);
CREATE INDEX IF NOT EXISTS idx_target_ofertas_mandato_empresa_id ON public.target_ofertas(mandato_empresa_id);
CREATE INDEX IF NOT EXISTS idx_target_ofertas_estado ON public.target_ofertas(estado);

-- 5. Habilitar RLS en las nuevas tablas
ALTER TABLE public.mandato_empresa_scoring ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.target_ofertas ENABLE ROW LEVEL SECURITY;

-- 6. Políticas RLS para mandato_empresa_scoring
CREATE POLICY "Usuarios autenticados pueden ver scoring" 
ON public.mandato_empresa_scoring 
FOR SELECT 
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Usuarios autenticados pueden crear scoring" 
ON public.mandato_empresa_scoring 
FOR INSERT 
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Usuarios autenticados pueden actualizar scoring" 
ON public.mandato_empresa_scoring 
FOR UPDATE 
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Usuarios autenticados pueden eliminar scoring" 
ON public.mandato_empresa_scoring 
FOR DELETE 
USING (auth.uid() IS NOT NULL);

-- 7. Políticas RLS para target_ofertas
CREATE POLICY "Usuarios autenticados pueden ver ofertas" 
ON public.target_ofertas 
FOR SELECT 
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Usuarios autenticados pueden crear ofertas" 
ON public.target_ofertas 
FOR INSERT 
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Usuarios autenticados pueden actualizar ofertas" 
ON public.target_ofertas 
FOR UPDATE 
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Usuarios autenticados pueden eliminar ofertas" 
ON public.target_ofertas 
FOR DELETE 
USING (auth.uid() IS NOT NULL);

-- 8. Trigger para actualizar updated_at en scoring
CREATE OR REPLACE TRIGGER update_mandato_empresa_scoring_updated_at
BEFORE UPDATE ON public.mandato_empresa_scoring
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- 9. Trigger para actualizar updated_at en ofertas
CREATE OR REPLACE TRIGGER update_target_ofertas_updated_at
BEFORE UPDATE ON public.target_ofertas
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- 10. Trigger para actualizar pipeline_stage_changed_at cuando cambia la etapa
CREATE OR REPLACE FUNCTION public.update_pipeline_stage_changed_at()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.pipeline_stage_target IS DISTINCT FROM NEW.pipeline_stage_target THEN
    NEW.pipeline_stage_changed_at = now();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE OR REPLACE TRIGGER update_mandato_empresas_pipeline_changed
BEFORE UPDATE ON public.mandato_empresas
FOR EACH ROW
EXECUTE FUNCTION public.update_pipeline_stage_changed_at();