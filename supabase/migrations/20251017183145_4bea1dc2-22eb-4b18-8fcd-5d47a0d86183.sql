-- Ensure pgcrypto is available in extensions schema
CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA extensions;

-- Replace function to use fully-qualified gen_random_bytes
CREATE OR REPLACE FUNCTION public.generate_secure_temp_password()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  temp_password text;
BEGIN
  -- 15 random bytes in base64 (~20+ chars), sanitize and enforce complexity
  temp_password := encode(extensions.gen_random_bytes(15), 'base64');

  -- Sanitize problematic characters for passwords
  temp_password := replace(temp_password, '/', 'A');
  temp_password := replace(temp_password, '+', 'B');
  temp_password := replace(temp_password, '=', 'C');

  -- Ensure at least one digit and special char
  temp_password := temp_password || '1!';

  RETURN temp_password;
END;
$$;

COMMENT ON FUNCTION public.generate_secure_temp_password() IS 
  'Genera contraseñas temporales seguras usando extensions.gen_random_bytes() con sufijo para complejidad.';