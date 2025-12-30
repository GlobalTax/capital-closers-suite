-- Habilitar REPLICA IDENTITY FULL para capturar todos los datos en cambios
ALTER TABLE contactos REPLICA IDENTITY FULL;

-- Añadir la tabla a la publicación de realtime
ALTER PUBLICATION supabase_realtime ADD TABLE contactos;