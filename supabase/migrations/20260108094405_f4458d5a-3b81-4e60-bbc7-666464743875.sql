-- Generar códigos automáticos para mandatos existentes usando CTE
WITH numbered AS (
  SELECT id, tipo,
    CASE tipo 
      WHEN 'venta' THEN 'V-'
      WHEN 'compra' THEN 'C-'
      ELSE 'M-'
    END || LPAD(ROW_NUMBER() OVER (PARTITION BY tipo ORDER BY created_at)::TEXT, 3, '0') AS new_codigo
  FROM mandatos
  WHERE codigo IS NULL
)
UPDATE mandatos m
SET codigo = n.new_codigo
FROM numbered n
WHERE m.id = n.id;

-- Función para auto-generar código en nuevos mandatos
CREATE OR REPLACE FUNCTION generate_mandato_codigo()
RETURNS TRIGGER AS $$
DECLARE
  prefix TEXT;
  next_num INT;
BEGIN
  IF NEW.codigo IS NULL OR NEW.codigo = '' THEN
    prefix := CASE NEW.tipo 
      WHEN 'venta' THEN 'V-'
      WHEN 'compra' THEN 'C-'
      ELSE 'M-'
    END;
    
    SELECT COALESCE(MAX(CAST(NULLIF(SUBSTRING(codigo FROM 3), '') AS INT)), 0) + 1
    INTO next_num
    FROM mandatos
    WHERE codigo LIKE prefix || '%' 
      AND codigo ~ ('^' || prefix || '[0-9]+$');
    
    NEW.codigo := prefix || LPAD(next_num::TEXT, 3, '0');
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Trigger para auto-generar código
DROP TRIGGER IF EXISTS before_mandato_insert_codigo ON mandatos;
CREATE TRIGGER before_mandato_insert_codigo
  BEFORE INSERT ON mandatos
  FOR EACH ROW
  EXECUTE FUNCTION generate_mandato_codigo();