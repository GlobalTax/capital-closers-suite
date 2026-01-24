-- Añadir columna de favoritos a mandatos
ALTER TABLE mandatos
ADD COLUMN IF NOT EXISTS is_favorite boolean DEFAULT false;

-- Índice para ordenar favoritos primero eficientemente
CREATE INDEX IF NOT EXISTS idx_mandatos_favorite 
ON mandatos(is_favorite DESC, created_at DESC);