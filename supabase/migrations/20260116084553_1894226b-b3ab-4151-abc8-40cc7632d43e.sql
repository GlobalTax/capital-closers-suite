-- Añadir campo año_datos_financieros a la tabla empresas
ALTER TABLE empresas 
ADD COLUMN IF NOT EXISTS año_datos_financieros integer;

COMMENT ON COLUMN empresas.año_datos_financieros 
IS 'Año al que corresponden los datos de facturación y EBITDA';