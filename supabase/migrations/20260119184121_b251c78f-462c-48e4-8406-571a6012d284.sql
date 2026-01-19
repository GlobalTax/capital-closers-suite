-- Crear tipo enum para clasificación de valor de trabajo
CREATE TYPE time_entry_value_type AS ENUM ('core_ma', 'soporte', 'bajo_valor');

-- Comentario para documentación
COMMENT ON TYPE time_entry_value_type IS 'Clasificación del valor aportado: core_ma (trabajo M&A directo), soporte (apoyo a operaciones), bajo_valor (tareas administrativas/rutinarias)';

-- Añadir columna value_type a mandato_time_entries (nullable para compatibilidad)
ALTER TABLE mandato_time_entries 
ADD COLUMN value_type time_entry_value_type DEFAULT NULL;

-- Crear índices para consultas agregadas eficientes
CREATE INDEX idx_time_entries_value_type ON mandato_time_entries(value_type);
CREATE INDEX idx_time_entries_mandato_value ON mandato_time_entries(mandato_id, value_type);

-- Añadir categoría de valor por defecto a cada tipo de tarea
ALTER TABLE work_task_types 
ADD COLUMN default_value_type time_entry_value_type DEFAULT 'core_ma';

-- Actualizar categorías por defecto según tipo de tarea existente
-- Core M&A: trabajo directo en operaciones
UPDATE work_task_types SET default_value_type = 'core_ma' 
WHERE name IN ('Potenciales Compradores / Vendedores', 'Reunion / Puesta en Contacto', 'IM', 'Teaser', 'Datapack', 'Due Diligence', 'Negociación', 'Cierre');

-- Soporte: apoyo a operaciones activas  
UPDATE work_task_types SET default_value_type = 'soporte' 
WHERE name IN ('Leads', 'Material Interno', 'Outbound', 'Preparación', 'Coordinación');

-- Bajo valor: tareas administrativas/rutinarias
UPDATE work_task_types SET default_value_type = 'bajo_valor' 
WHERE name IN ('Estudios Sectoriales', 'Administración', 'Formación');

-- Crear vista materializada para estadísticas por tipo de valor (opcional, para dashboards)
CREATE OR REPLACE VIEW v_time_entry_value_stats AS
SELECT 
  mandato_id,
  value_type,
  COUNT(*) as entries_count,
  SUM(duration_minutes) as total_minutes,
  ROUND(SUM(duration_minutes) / 60.0, 2) as total_hours
FROM mandato_time_entries
WHERE status = 'approved'
GROUP BY mandato_id, value_type;