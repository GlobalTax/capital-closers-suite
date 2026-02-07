

# Plan: Corregir `file_type` por `mime_type` en `send-teaser-email`

## Problema

La query en linea 101 selecciona `file_type` que no existe en la tabla `documentos`. La columna real es `mime_type`. Esto causa que:
- `doc.file_type` en linea 230 sea siempre `undefined`, cayendo al fallback "application/pdf"
- `doc.mime_type` en linea 197 sea `undefined`, impidiendo la deteccion de PDFs para watermark

## Cambios en `supabase/functions/send-teaser-email/index.ts`

| Linea | Actual | Correcto |
|-------|--------|----------|
| 101 | `teaser_document:documentos(id, file_name, storage_path, file_type)` | `teaser_document:documentos(id, file_name, storage_path, mime_type)` |
| 230 | `doc.file_type \|\| "application/pdf"` | `doc.mime_type \|\| "application/pdf"` |

Solo 2 cambios puntuales en un unico archivo. La referencia en linea 197 (`doc.mime_type?.includes("pdf")`) ya usa el nombre correcto y funcionara una vez que se seleccione `mime_type` en la query.

