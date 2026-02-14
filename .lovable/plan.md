

# Integrar Claude (Anthropic) para Generacion de Contenido

## Objetivo

Usar Claude para las funciones de IA que generan texto largo y de alta calidad, manteniendo el Lovable AI Gateway para tareas simples (parsing, alertas, matching).

## Funciones a migrar a Claude

| Edge Function | Que hace | Por que Claude |
|---|---|---|
| `generate-deal-document` | Genera Teasers y CIMs (documentos largos M&A) | Redaccion profesional extensa |
| `refine-slide-copy` | Refina copy de presentaciones | Tono preciso y matizado |
| `generate-executive-report` | Reporte ejecutivo semanal | Narrativa estructurada |
| `crm-assistant` | Asistente conversacional (streaming) | Respuestas mas naturales y contextuales |

## Funciones que se quedan en Lovable AI Gateway

- `task-ai` (parsing de tareas)
- `enhance-alert-message` (alertas cortas)
- `summarize-meeting` (resumen estructurado)
- `match-buyers` (scoring numerico)
- `translate-slides` (traduccion)
- `generate-slide-outline` (outline estructurado)
- `batch-enrich-companies` (extraccion de datos)

## Implementacion

### Paso 1: Configurar secret

Solicitar al usuario su `ANTHROPIC_API_KEY` y guardarla como secret de Supabase.

### Paso 2: Crear modulo compartido de llamada a Claude

Crear una funcion helper reutilizable dentro de cada Edge Function que llame a la API de Anthropic (`https://api.anthropic.com/v1/messages`) con:
- Header `x-api-key` y `anthropic-version: 2023-06-01`
- Modelo: `claude-sonnet-4-20250514` (mejor relacion calidad/coste para contenido)
- Soporte para tool calling (misma estructura de tools que ya usan las funciones)

### Paso 3: Migrar `generate-deal-document`

- Reemplazar la llamada a `ai.gateway.lovable.dev` por la API de Anthropic
- Adaptar el formato de mensajes (Anthropic usa `system` como parametro separado, no como mensaje)
- Adaptar tool calling al formato de Anthropic (`tools` con `input_schema` en vez de `parameters`)
- Mantener el logging en `ai_activity_log` con modelo `claude-sonnet-4-20250514`

### Paso 4: Migrar `refine-slide-copy`

- Misma adaptacion de formato
- Mantener la logica de deteccion de template (MA Sell Teaser, Firm Deck, etc.)

### Paso 5: Migrar `generate-executive-report`

- Adaptar llamada y formato de respuesta
- Mantener estructura de secciones del reporte

### Paso 6: Migrar `crm-assistant` (streaming)

- Adaptar el streaming SSE de Anthropic (usa `event: content_block_delta` en vez del formato OpenAI)
- Adaptar tool calling de Anthropic (2 fases: tool_use -> tool_result)
- Mantener las 6 tools existentes del asistente

### Paso 7: Fallback automatico

Si la API de Anthropic falla (timeout, rate limit), hacer fallback al Lovable AI Gateway con el modelo actual para no dejar al usuario sin servicio.

## Detalle tecnico

**Formato de llamada Anthropic:**
```text
POST https://api.anthropic.com/v1/messages
Headers:
  x-api-key: ANTHROPIC_API_KEY
  anthropic-version: 2023-06-01
  content-type: application/json

Body:
  model: claude-sonnet-4-20250514
  max_tokens: 4096
  system: "..." (separado del array messages)
  messages: [{ role: "user", content: "..." }]
  tools: [{ name, description, input_schema }]
```

**Diferencias clave vs OpenAI format:**
- `system` es parametro top-level, no un mensaje
- Tool calling usa `input_schema` en vez de `parameters`
- Streaming usa eventos `content_block_delta` con `delta.text`
- Las respuestas de tools van como `tool_result` en vez de `tool` role

**Modelo recomendado:** `claude-sonnet-4-20250514` - mejor equilibrio entre calidad de redaccion y coste. Para CIMs muy largos se podria usar `claude-sonnet-4-20250514` con `max_tokens: 8192`.

