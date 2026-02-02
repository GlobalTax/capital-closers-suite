-- Add closing-related fields to mandatos table
ALTER TABLE public.mandatos 
ADD COLUMN IF NOT EXISTS fee_facturado numeric,
ADD COLUMN IF NOT EXISTS horas_invertidas numeric,
ADD COLUMN IF NOT EXISTS parcialmente_facturado boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS importe_parcial numeric,
ADD COLUMN IF NOT EXISTS fecha_entrega date;

-- Add comments for documentation
COMMENT ON COLUMN public.mandatos.fee_facturado IS 'Honorarios realmente facturados al cerrar';
COMMENT ON COLUMN public.mandatos.horas_invertidas IS 'Total horas invertidas al cerrar (calculado)';
COMMENT ON COLUMN public.mandatos.parcialmente_facturado IS 'Si se facturó algo aunque se canceló';
COMMENT ON COLUMN public.mandatos.importe_parcial IS 'Importe facturado si se canceló parcialmente';
COMMENT ON COLUMN public.mandatos.fecha_entrega IS 'Fecha de entrega del servicio';