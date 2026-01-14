-- Añadir campo potencial_searchfund a la tabla mandatos
-- Este campo permite marcar mandatos de venta como potenciales para Search Funds

ALTER TABLE mandatos 
ADD COLUMN potencial_searchfund BOOLEAN DEFAULT false;

-- Comentario descriptivo
COMMENT ON COLUMN mandatos.potencial_searchfund IS 'Indica si el mandato es potencial para Search Funds (principalmente para mandatos de venta)';