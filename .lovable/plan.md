

# Buscador dedicado para /contactos

## Resumen

Anadir un campo de busqueda especifico en la pagina `/contactos` que filtre server-side con paginacion, combinable con los filtros existentes (Todos/Pendientes/Vencidas/Sin actividad). Reutiliza y mejora la funcion RPC existente `search_contactos_full`.

## Cambios

### 1. Nueva RPC: `search_contactos_paginated` (migracion SQL)

Crear una nueva funcion RPC que extienda la busqueda actual con:
- Paginacion (parametros `p_page`, `p_page_size`)
- Busqueda por CIF de la empresa asociada
- Normalizacion de telefono (quitar espacios, guiones, +) para comparar
- Devolver `total_count` para calcular paginas
- Ordenacion por relevancia basica: email exacto primero, luego nombre empieza por, luego contiene

```sql
CREATE OR REPLACE FUNCTION search_contactos_paginated(
  search_query text,
  p_page int DEFAULT 1,
  p_page_size int DEFAULT 25
)
RETURNS TABLE(
  id uuid, nombre text, apellidos text, email text, telefono text,
  cargo text, empresa_principal_id uuid, linkedin text, notas text,
  avatar text, created_at timestamptz, updated_at timestamptz,
  empresa_nombre text, empresa_cif text, total_count bigint
)
```

La busqueda normaliza el input de telefono (quita +, espacios, guiones) y lo compara contra una version normalizada del campo telefono.

### 2. Servicio: `searchContactosPaginated` en `src/services/contactos.ts`

Nueva funcion que llama al RPC con query, page y pageSize, y devuelve un `PaginatedResult<Contacto>`.

### 3. Hook: `useContactosSearchPaginated` en `src/hooks/queries/useContactos.ts`

Nuevo hook con react-query que:
- Acepta `query`, `page`, `pageSize`
- Solo se activa si `query.length >= 2`
- Usa `keepPreviousData` para transiciones suaves
- Query key: `['contactos', 'search', query, page, pageSize]`

### 4. UI: Campo de busqueda en `src/pages/Contactos.tsx`

- Anadir un `Input` con icono Search y boton X para limpiar, justo encima de los filtros rapidos
- Estado `searchQuery` con debounce de 300ms
- Cuando hay query activa: usar el hook de busqueda en vez del paginado normal
- Resetear a pagina 1 cuando cambia la query
- Los filtros de accion (Pendientes/Vencidas/Sin actividad) siguen funcionando sobre los resultados
- Placeholder: "Buscar por nombre, email, empresa, telefono o CIF..."
- Mensaje "No se han encontrado contactos" cuando no hay resultados

### Flujo de datos

```text
Input (debounce 300ms)
  |
  v
searchQuery vacio?
  |-- SI --> useContactosPaginated (comportamiento actual)
  |-- NO --> useContactosSearchPaginated (RPC nueva)
              |
              v
          Resultados paginados + filtros de accion locales
```

### Archivos a crear/modificar

| Archivo | Cambio |
|---|---|
| Nueva migracion SQL | Funcion `search_contactos_paginated` |
| `src/services/contactos.ts` | Funcion `searchContactosPaginated()` |
| `src/hooks/queries/useContactos.ts` | Hook `useContactosSearchPaginated()` |
| `src/pages/Contactos.tsx` | Input de busqueda + logica de conmutacion entre paginado normal y busqueda |

No se modifica ningun componente compartido ni el buscador global existente.
