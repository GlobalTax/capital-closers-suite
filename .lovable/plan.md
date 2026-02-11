
# Mejorar relevancia de cargo en search_contactos_paginated

## Estado actual

La RPC `search_contactos_paginated` **ya busca por cargo** en el WHERE (`lower(c.cargo) LIKE '%' || normalized_query || '%'`). Buscar "director" ya devuelve 21 resultados correctamente.

Sin embargo, el cargo NO tiene su propia posicion en el ranking de relevancia, asi que los resultados con match en cargo se mezclan con el bucket generico (relevancia 8).

## Cambio propuesto

Unica modificacion: anadir cargo como nivel de relevancia 6 en el CASE, desplazando empresa a 7, CIF a 8 y "otros" a 9.

### Migracion SQL

Actualizar la funcion `search_contactos_paginated` cambiando solo el bloque CASE:

```sql
CASE
  WHEN lower(c.email) = normalized_query THEN 1
  WHEN lower(c.nombre) LIKE normalized_query || '%' THEN 2
  WHEN lower(c.apellidos) LIKE normalized_query || '%' THEN 3
  WHEN lower(c.nombre) LIKE '%' || normalized_query || '%'
    OR lower(c.apellidos) LIKE '%' || normalized_query || '%' THEN 4
  WHEN lower(c.email) LIKE '%' || normalized_query || '%' THEN 5
  WHEN lower(c.cargo) LIKE '%' || normalized_query || '%' THEN 6   -- NUEVO
  WHEN lower(e.nombre) LIKE '%' || normalized_query || '%' THEN 7  -- era 6
  WHEN lower(e.cif) LIKE '%' || normalized_query || '%' THEN 8    -- era 7
  ELSE 9                                                           -- era 8
END AS relevance
```

### Archivos a modificar

| Archivo | Cambio |
|---|---|
| Nueva migracion SQL | Actualizar CASE de relevancia en `search_contactos_paginated` |

No hay cambios en frontend. El servicio y hooks siguen funcionando igual.
