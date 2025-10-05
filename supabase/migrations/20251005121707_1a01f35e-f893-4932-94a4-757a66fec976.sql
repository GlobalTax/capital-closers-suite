-- Añadir campos específicos para mandatos de COMPRA
ALTER TABLE public.mandatos 
ADD COLUMN IF NOT EXISTS perfil_empresa_buscada TEXT,
ADD COLUMN IF NOT EXISTS rango_inversion_min NUMERIC,
ADD COLUMN IF NOT EXISTS rango_inversion_max NUMERIC,
ADD COLUMN IF NOT EXISTS sectores_interes TEXT[],
ADD COLUMN IF NOT EXISTS timeline_objetivo TEXT;

-- Añadir campos específicos para mandatos de VENTA
ALTER TABLE public.mandatos 
ADD COLUMN IF NOT EXISTS valoracion_esperada NUMERIC,
ADD COLUMN IF NOT EXISTS tipo_comprador_buscado TEXT,
ADD COLUMN IF NOT EXISTS estado_negociacion TEXT,
ADD COLUMN IF NOT EXISTS numero_ofertas_recibidas INTEGER DEFAULT 0;

-- Añadir comentarios para documentación
COMMENT ON COLUMN public.mandatos.perfil_empresa_buscada IS 'Descripción del perfil ideal de empresa a comprar';
COMMENT ON COLUMN public.mandatos.rango_inversion_min IS 'Inversión mínima para mandatos de compra';
COMMENT ON COLUMN public.mandatos.rango_inversion_max IS 'Inversión máxima para mandatos de compra';
COMMENT ON COLUMN public.mandatos.sectores_interes IS 'Array de sectores de interés para mandatos de compra';
COMMENT ON COLUMN public.mandatos.timeline_objetivo IS 'Timeline esperado del proceso para mandatos de compra';
COMMENT ON COLUMN public.mandatos.valoracion_esperada IS 'Valoración esperada para mandatos de venta';
COMMENT ON COLUMN public.mandatos.tipo_comprador_buscado IS 'Perfil de comprador buscado para mandatos de venta';
COMMENT ON COLUMN public.mandatos.estado_negociacion IS 'Estado actual de la negociación para mandatos de venta';
COMMENT ON COLUMN public.mandatos.numero_ofertas_recibidas IS 'Contador de ofertas recibidas para mandatos de venta';