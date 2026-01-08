-- Añadir columna codigo editable a mandatos
ALTER TABLE mandatos ADD COLUMN IF NOT EXISTS codigo TEXT;

-- Crear índice único para el código
CREATE UNIQUE INDEX IF NOT EXISTS idx_mandatos_codigo ON mandatos(codigo) WHERE codigo IS NOT NULL;