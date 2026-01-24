-- Cambiar FK de mandato_time_entries a ON DELETE CASCADE
-- para evitar violación del constraint chk_mandato_or_lead al eliminar mandatos

ALTER TABLE mandato_time_entries 
  DROP CONSTRAINT mandato_time_entries_mandato_id_fkey;

ALTER TABLE mandato_time_entries 
  ADD CONSTRAINT mandato_time_entries_mandato_id_fkey 
  FOREIGN KEY (mandato_id) 
  REFERENCES mandatos(id) 
  ON DELETE CASCADE;