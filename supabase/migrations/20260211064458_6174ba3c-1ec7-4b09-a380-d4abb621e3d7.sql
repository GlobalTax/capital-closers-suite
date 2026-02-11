
CREATE OR REPLACE FUNCTION public.search_contactos_paginated(
  search_query text,
  p_page int DEFAULT 1,
  p_page_size int DEFAULT 25
)
RETURNS TABLE(
  id uuid,
  nombre text,
  apellidos text,
  email text,
  telefono text,
  cargo text,
  empresa_principal_id uuid,
  linkedin text,
  notas text,
  avatar text,
  created_at timestamptz,
  updated_at timestamptz,
  empresa_nombre text,
  empresa_cif text,
  total_count bigint
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  normalized_query text;
  phone_query text;
  v_offset int;
BEGIN
  normalized_query := lower(trim(search_query));
  phone_query := regexp_replace(normalized_query, '[^0-9]', '', 'g');
  v_offset := (p_page - 1) * p_page_size;

  RETURN QUERY
  WITH matched AS (
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
      e.nombre AS empresa_nombre,
      e.cif AS empresa_cif,
      CASE
        WHEN lower(c.email) = normalized_query THEN 1
        WHEN lower(c.nombre) LIKE normalized_query || '%' THEN 2
        WHEN lower(c.apellidos) LIKE normalized_query || '%' THEN 3
        WHEN lower(c.nombre) LIKE '%' || normalized_query || '%'
          OR lower(c.apellidos) LIKE '%' || normalized_query || '%' THEN 4
        WHEN lower(c.email) LIKE '%' || normalized_query || '%' THEN 5
        WHEN lower(c.cargo) LIKE '%' || normalized_query || '%' THEN 6
        WHEN lower(e.nombre) LIKE '%' || normalized_query || '%' THEN 7
        WHEN lower(e.cif) LIKE '%' || normalized_query || '%' THEN 8
        ELSE 9
      END AS relevance
    FROM contactos c
    LEFT JOIN empresas e ON e.id = c.empresa_principal_id
    WHERE c.merged_into_contacto_id IS NULL
      AND (
        lower(c.nombre) LIKE '%' || normalized_query || '%'
        OR lower(c.apellidos) LIKE '%' || normalized_query || '%'
        OR lower(c.email) LIKE '%' || normalized_query || '%'
        OR lower(c.cargo) LIKE '%' || normalized_query || '%'
        OR lower(e.nombre) LIKE '%' || normalized_query || '%'
        OR lower(e.cif) LIKE '%' || normalized_query || '%'
        OR (
          length(phone_query) >= 3
          AND regexp_replace(coalesce(c.telefono, ''), '[^0-9]', '', 'g') LIKE '%' || phone_query || '%'
        )
      )
  ),
  counted AS (
    SELECT count(*) AS cnt FROM matched
  )
  SELECT
    m.id,
    m.nombre,
    m.apellidos,
    m.email,
    m.telefono,
    m.cargo,
    m.empresa_principal_id,
    m.linkedin,
    m.notas,
    m.avatar,
    m.created_at,
    m.updated_at,
    m.empresa_nombre,
    m.empresa_cif,
    counted.cnt AS total_count
  FROM matched m, counted
  ORDER BY m.relevance, m.nombre, m.apellidos
  OFFSET v_offset
  LIMIT p_page_size;
END;
$$;
