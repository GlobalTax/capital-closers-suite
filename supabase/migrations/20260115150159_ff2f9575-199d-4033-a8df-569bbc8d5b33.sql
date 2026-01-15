-- Asegurar que sf_matches tiene las columnas necesarias para gestión de mandatos
ALTER TABLE sf_matches ADD COLUMN IF NOT EXISTS notes TEXT;
ALTER TABLE sf_matches ADD COLUMN IF NOT EXISTS contacted_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE sf_matches ADD COLUMN IF NOT EXISTS last_interaction_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE sf_matches ADD COLUMN IF NOT EXISTS teaser_sent_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE sf_matches ADD COLUMN IF NOT EXISTS nda_sent_at TIMESTAMP WITH TIME ZONE;

-- Añadir índice para búsquedas rápidas por mandato
CREATE INDEX IF NOT EXISTS idx_sf_matches_mandato 
ON sf_matches(crm_entity_id) 
WHERE crm_entity_type = 'mandato';

-- Comentarios descriptivos
COMMENT ON COLUMN sf_matches.notes IS 'Notas internas sobre el match';
COMMENT ON COLUMN sf_matches.contacted_at IS 'Fecha del primer contacto';
COMMENT ON COLUMN sf_matches.last_interaction_at IS 'Fecha de última interacción';
COMMENT ON COLUMN sf_matches.teaser_sent_at IS 'Fecha de envío del teaser';
COMMENT ON COLUMN sf_matches.nda_sent_at IS 'Fecha de envío/firma del NDA';