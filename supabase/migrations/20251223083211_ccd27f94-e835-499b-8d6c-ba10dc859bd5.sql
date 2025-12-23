
-- Reactivar triggers de sincronización Brevo
ALTER TABLE empresas ENABLE TRIGGER after_empresa_insert_or_update;
ALTER TABLE contactos ENABLE TRIGGER after_contacto_insert_or_update;
