

# Plan: Corregir columnas en Data Room (access-cim-document + frontend)

## Problema

El codigo usa columnas que no existen en la tabla `documentos`:

| Codigo actual (incorrecto) | Columna real en DB |
|---|---|
| `nombre` | `file_name` |
| `file_path` | `storage_path` |
| `file_size` | `file_size_bytes` |

Esto causa que el listado y la descarga fallen silenciosamente.

## Cambios

### 1. `supabase/functions/access-cim-document/index.ts`

**Accion "list" (linea 154):** Cambiar el select de:
```
'id, nombre, descripcion, tipo, file_path, file_size, created_at'
```
a:
```
'id, file_name, descripcion, tipo, storage_path, file_size_bytes, created_at'
```

**Accion "download" (linea 197):** Cambiar el select de:
```
'id, nombre, file_path, mandato_id, is_data_room, is_active'
```
a:
```
'id, file_name, storage_path, mandato_id, is_data_room, is_active'
```

**Linea 229** (signed URL): Cambiar `document.file_path` a `document.storage_path`

**Linea 262** (response): Cambiar `document.nombre` a `document.file_name`

### 2. `src/hooks/useDataRoomAccess.ts`

Actualizar la interfaz `DataRoomDocument` (lineas 15-23):

```typescript
export interface DataRoomDocument {
  id: string;
  file_name: string;
  descripcion: string | null;
  tipo: string | null;
  storage_path: string;
  file_size_bytes: number | null;
  created_at: string;
}
```

### 3. `src/components/dataroom/DataRoomDocumentList.tsx`

Tres cambios puntuales donde se leen los campos:

- **Linea 111:** `doc.file_path.split(...)` a `doc.storage_path.split(...) || doc.file_name`
- **Linea 125:** `doc.nombre` a `doc.file_name`
- **Linea 132:** `doc.file_size` a `doc.file_size_bytes`

## Archivos a modificar

| Archivo | Cambio |
|---|---|
| `supabase/functions/access-cim-document/index.ts` | Columnas en select + referencias |
| `src/hooks/useDataRoomAccess.ts` | Interfaz DataRoomDocument |
| `src/components/dataroom/DataRoomDocumentList.tsx` | Referencias a campos en UI |

