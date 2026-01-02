-- Create RPC for full contact search including company name
CREATE OR REPLACE FUNCTION public.search_contactos_full(search_query TEXT)
RETURNS TABLE (
  id UUID,
  nombre TEXT,
  apellidos TEXT,
  email TEXT,
  telefono TEXT,
  cargo TEXT,
  empresa_principal_id UUID,
  linkedin TEXT,
  notas TEXT,
  avatar TEXT,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  empresa_nombre TEXT
) 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    c.id,
    c.nombre,
    c.apellidos,
    c.email,
    c.telefono,
    c.cargo,
    c.empresa_principal_id,
    c.linkedin,
    c.notas,
    c.avatar,
    c.created_at,
    c.updated_at,
    e.nombre AS empresa_nombre
  FROM contactos c
  LEFT JOIN empresas e ON c.empresa_principal_id = e.id
  WHERE 
    c.nombre ILIKE '%' || search_query || '%'
    OR c.apellidos ILIKE '%' || search_query || '%'
    OR c.email ILIKE '%' || search_query || '%'
    OR c.telefono ILIKE '%' || search_query || '%'
    OR c.cargo ILIKE '%' || search_query || '%'
    OR e.nombre ILIKE '%' || search_query || '%'
  ORDER BY c.nombre ASC
  LIMIT 20;
END;
$$;