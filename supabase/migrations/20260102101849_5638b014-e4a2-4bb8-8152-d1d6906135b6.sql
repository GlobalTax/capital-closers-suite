-- Índice compuesto para consultas de horas por usuario y rango de tiempo
-- Útil para: "Mis Horas", reportes de equipo, filtros de timesheet
-- Los índices individuales (user_id) y (start_time) ya existen pero no optimizan
-- consultas que combinan ambos campos

CREATE INDEX IF NOT EXISTS idx_time_entries_user_start_time 
ON mandato_time_entries(user_id, start_time DESC);

-- Comentario explicativo
COMMENT ON INDEX idx_time_entries_user_start_time IS 
'Índice compuesto para consultas de horas por usuario ordenadas por fecha. Optimiza páginas MisHoras y HorasEquipo.';