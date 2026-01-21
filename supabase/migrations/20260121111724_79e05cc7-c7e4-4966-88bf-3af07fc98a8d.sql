-- Eliminar el índice único que bloquea la creación de targets con contactos existentes
-- Esto permite reutilizar contactos en múltiples empresas/mandatos
DROP INDEX IF EXISTS idx_contactos_email_unique_lower;