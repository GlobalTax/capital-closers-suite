

# Fix: Modulo /admin/modelos - Subida, Registro y Descarga de Archivos

## Diagnostico

Se identificaron 5 problemas que impiden el funcionamiento:

### Problema 1: Bucket inexistente (CRITICO)
El codigo usa `document-templates` como bucket de storage, pero **ese bucket no existe** en Supabase. Los buckets disponibles son: `documents`, `mandato-documentos`, `operation-documents`, etc. Cualquier intento de subida falla con "Bucket not found".

### Problema 2: Validacion solo acepta Word (CRITICO)
El archivo `modelos.service.ts` solo permite `.doc` y `.docx`:
```text
ALLOWED_EXTENSIONS = ['.doc', '.docx']
ALLOWED_MIME_TYPES = ['application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
```
Se requiere tambien: `.pdf`, `.ppt`, `.pptx`, `.xls`, `.xlsx`, `.csv`

### Problema 3: Validacion MIME demasiado estricta
Algunos navegadores envian MIME types inconsistentes (ej: `application/octet-stream` para `.docx`). La validacion actual rechaza archivos validos si el MIME no coincide exactamente.

### Problema 4: Sin politicas de storage
Al no existir el bucket, tampoco hay politicas RLS de storage. Sin ellas, ni admins ni usuarios autenticados pueden subir/descargar.

### Problema 5: Upload sin contentType
La llamada a `supabase.storage.upload()` no envia `contentType`, lo que puede causar problemas al descargar (el archivo se guarda como `application/octet-stream`).

## Plan de cambios

### 1. Migracion SQL: Crear bucket + politicas de storage

Crear el bucket `document-templates` (privado) y anadir 4 politicas de storage:
- SELECT: admins pueden leer/descargar
- INSERT: admins pueden subir
- UPDATE: admins pueden actualizar
- DELETE: admins pueden eliminar

Todas usando la funcion `is_user_admin(auth.uid())` que ya existe en el sistema.

### 2. Actualizar `src/services/modelos.service.ts`

Cambiar la funcion `validateWordFile` a una funcion general `validateModeloFile`:

| Aspecto | Antes | Despues |
|---------|-------|---------|
| Extensiones | `.doc`, `.docx` | `.doc`, `.docx`, `.pdf`, `.ppt`, `.pptx`, `.xls`, `.xlsx`, `.csv` |
| Validacion MIME | Estricta por MIME type | Solo por extension (MIME como fallback informativo) |
| Nombre funcion | `validateWordFile` | `validateModeloFile` |
| ContentType en upload | No se envia | Se envia deducido por extension |
| Ruta storage | `modelos/{cat}/{uuid}-{filename}` | `modelos/{cat}/{yyyy}/{mm}/{uuid}_{sanitized}` |

Mapa de MIME types por extension (para contentType en upload):
```text
.doc   -> application/msword
.docx  -> application/vnd.openxmlformats-officedocument.wordprocessingml.document
.pdf   -> application/pdf
.ppt   -> application/vnd.ms-powerpoint
.pptx  -> application/vnd.openxmlformats-officedocument.presentationml.presentation
.xls   -> application/vnd.ms-excel
.xlsx  -> application/vnd.openxmlformats-officedocument.spreadsheetml.sheet
.csv   -> text/csv
```

Sanitizar nombre de archivo: reemplazar espacios y caracteres especiales con `_`, eliminar acentos.

### 3. Actualizar `src/components/modelos/ModeloUploadDialog.tsx`

- Cambiar `validateWordFile` por `validateModeloFile`
- Actualizar el atributo `accept` del input file para incluir todas las extensiones
- Cambiar el texto "Archivo Word *" por "Archivo *"
- Actualizar texto de formatos permitidos

### 4. Actualizar `src/hooks/queries/useModelos.ts`

Cambio minimo: actualizar el mensaje de error de "Selecciona un archivo Word" si aparece (ya esta en el dialog, no en el hook).

## Archivos afectados

| Archivo | Accion |
|---------|--------|
| `supabase/migrations/xxx_create_document_templates_bucket.sql` | NUEVO - Crear bucket + politicas storage |
| `src/services/modelos.service.ts` | EDITAR - Ampliar validacion, sanitizar rutas, enviar contentType |
| `src/components/modelos/ModeloUploadDialog.tsx` | EDITAR - Actualizar accept, labels, funcion de validacion |

## Lo que NO cambia

- Tabla `document_templates`: ya tiene todos los campos necesarios, no se modifica
- Politicas RLS de la tabla: ya funcionan correctamente (admin can manage + anyone can view active)
- Logica de descarga: ya usa `download()` correctamente, solo se beneficia del contentType correcto
- Logica de eliminacion (soft delete): funciona correctamente
- UI general: sin cambios de layout ni componentes nuevos
- Otros modulos de documentos: no se tocan

