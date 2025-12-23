
-- Deshabilitar triggers de sincronización Brevo para migración masiva
ALTER TABLE empresas DISABLE TRIGGER after_empresa_insert_or_update;
ALTER TABLE contactos DISABLE TRIGGER after_contacto_insert_or_update;
