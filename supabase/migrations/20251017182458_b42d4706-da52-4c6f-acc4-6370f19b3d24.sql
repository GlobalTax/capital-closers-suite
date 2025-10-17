-- Función de generación segura de contraseñas temporales
CREATE OR REPLACE FUNCTION public.generate_secure_temp_password()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  temp_password text;
BEGIN
  -- Generar 15 bytes aleatorios en base64 → ~20 caracteres
  temp_password := encode(gen_random_bytes(15), 'base64');
  
  -- Sanear caracteres problemáticos
  temp_password := replace(temp_password, '/', 'A');
  temp_password := replace(temp_password, '+', 'B');
  temp_password := replace(temp_password, '=', 'C');
  
  -- Añadir sufijo para garantizar complejidad
  temp_password := temp_password || '1!';
  
  RETURN temp_password;
END;
$$;

COMMENT ON FUNCTION public.generate_secure_temp_password() IS 
  'Genera contraseñas temporales seguras de ~22 caracteres con sufijos que garantizan complejidad';