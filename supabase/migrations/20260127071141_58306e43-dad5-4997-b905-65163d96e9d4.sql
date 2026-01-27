-- Agregar campo campaign_type a buyer_contacts para discriminar campañas de compra vs venta
ALTER TABLE buyer_contacts 
ADD COLUMN IF NOT EXISTS campaign_type TEXT DEFAULT 'buy';

-- Agregar constraint check para valores válidos
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'buyer_contacts_campaign_type_check'
  ) THEN
    ALTER TABLE buyer_contacts 
    ADD CONSTRAINT buyer_contacts_campaign_type_check 
    CHECK (campaign_type IN ('buy', 'sell'));
  END IF;
END $$;

-- Actualizar registros existentes a 'buy' (por si acaso alguno es NULL)
UPDATE buyer_contacts SET campaign_type = 'buy' WHERE campaign_type IS NULL;

-- Crear índice para consultas eficientes por tipo de campaña
CREATE INDEX IF NOT EXISTS idx_buyer_contacts_campaign_type 
ON buyer_contacts(campaign_type);

-- Comentario descriptivo
COMMENT ON COLUMN buyer_contacts.campaign_type IS 'Tipo de campaña: buy (compra/inversores) o sell (venta/leads)';