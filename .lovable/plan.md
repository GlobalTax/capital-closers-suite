
# Fase 4: Asistente IA Conversacional para el CRM

## Objetivo
Crear un chat IA flotante accesible desde cualquier pagina del CRM que permita consultar datos con lenguaje natural: empresas, mandatos, contactos, tareas, y metricas generales.

## Arquitectura

El asistente funciona en dos capas:

1. **Edge Function `crm-assistant`**: Recibe el mensaje del usuario + historial de conversacion. Usa tool calling (Lovable AI Gateway con `google/gemini-3-flash-preview`) para que el modelo decida que datos consultar de Supabase, ejecuta las queries con service role, y devuelve la respuesta en streaming.

2. **Componente flotante `CRMAssistant`**: Boton fijo en esquina inferior derecha con panel de chat desplegable. Renderiza mensajes con markdown, soporta streaming token-by-token.

## Herramientas disponibles para el modelo (tool calling)

El modelo tendra acceso a estas herramientas que se ejecutan server-side:

| Tool | Descripcion | Query Supabase |
|------|------------|----------------|
| `search_empresas` | Buscar empresas por nombre, sector, ubicacion, facturacion | `empresas` con filtros ilike/range |
| `search_contactos` | Buscar contactos por nombre, empresa, cargo | `contactos` + join `empresas` |
| `search_mandatos` | Buscar mandatos por estado, tipo, empresa | `mandatos` + join `empresas` |
| `get_tareas_pendientes` | Listar tareas pendientes, filtrar por asignado/prioridad | `tareas` con filtros |
| `get_stats_resumen` | Metricas generales: total empresas, mandatos activos, tareas pendientes | counts agregados |
| `get_empresa_detalle` | Detalle completo de una empresa por ID o nombre | `empresas` + `contactos` + `mandatos` |

## Archivos a crear

### 1. `supabase/functions/crm-assistant/index.ts`
- Validacion de auth (usuario autenticado, no requiere admin)
- System prompt con contexto M&A y las tools disponibles
- Recibe `messages[]` (historial completo)
- Llama a Lovable AI Gateway con streaming + tool calling
- Cuando el modelo invoca una tool, ejecuta la query Supabase con service role
- Re-envia resultado de la tool al modelo para que genere la respuesta final
- Respuesta final en streaming SSE
- Logging en `ai_activity_log` (modulo: `crm-assistant`)
- Manejo de errores 429/402

### 2. `src/hooks/useCRMAssistant.ts`
- Estado de mensajes `{role, content}[]`
- Funcion `sendMessage(text)` que hace streaming SSE al edge function
- Actualiza ultimo mensaje assistant token-by-token (patron del codebase)
- Estado: `isStreaming`, `messages`, `error`
- `clearHistory()` para reiniciar conversacion

### 3. `src/components/assistant/CRMAssistantButton.tsx`
- Boton flotante fijo en esquina inferior derecha (z-50)
- Icono `MessageCircle` / `Sparkles` con badge animado
- Toggle para abrir/cerrar el panel
- Se oculta en rutas publicas

### 4. `src/components/assistant/CRMAssistantPanel.tsx`
- Panel tipo chat (400px ancho, 500px alto) con sombra elevada
- Header con titulo "Asistente IA" y boton cerrar
- ScrollArea con mensajes renderizados con `react-markdown`
- Input con boton enviar (Enter para enviar, Shift+Enter salto de linea)
- Estado vacio con sugerencias rapidas:
  - "Cuantas empresas tenemos en el sector tecnologia?"
  - "Mandatos activos y su estado"
  - "Tareas pendientes para hoy"
  - "Resumen general del CRM"
- Indicador de streaming (puntos animados)
- Manejo de errores inline

### 5. `src/components/assistant/CRMAssistant.tsx`
- Componente wrapper que combina Button + Panel
- Usa `useCRMAssistant` hook
- Controla estado open/closed

## Archivos a modificar

### 6. `src/components/layout/AppLayout.tsx`
- Agregar `<CRMAssistant />` dentro del layout para que aparezca en todas las paginas protegidas

### 7. `supabase/config.toml`
- Agregar `[functions.crm-assistant]` con `verify_jwt = true`

## Detalles tecnicos

### System Prompt del asistente
```
Eres el asistente de IA de Capittal Partners CRM. Ayudas a los usuarios a consultar
datos del CRM usando lenguaje natural en español. Tienes acceso a herramientas para
buscar empresas, contactos, mandatos y tareas. Responde siempre en español, de forma
concisa y profesional. Usa tablas markdown cuando presentes multiples resultados.
Cuando no encuentres datos, sugerile al usuario refinar su busqueda.
```

### Flujo de una consulta
1. Usuario escribe: "empresas del sector salud con mas de 50 empleados"
2. Frontend envia POST con `messages[]` al edge function
3. Edge function llama al modelo con tools habilitadas
4. Modelo decide invocar `search_empresas({ sector: "salud", min_empleados: 50 })`
5. Edge function ejecuta query en Supabase, obtiene resultados
6. Re-envia resultados al modelo como tool response
7. Modelo genera respuesta en lenguaje natural con tabla markdown
8. Se hace streaming SSE al frontend

### Streaming
- El edge function hace la llamada inicial (non-streaming) para resolver tools
- La llamada final (con resultados) se hace con streaming para la respuesta al usuario
- Frontend parsea SSE linea-por-linea siguiendo el patron existente del codebase

### Modelo
- `google/gemini-3-flash-preview` (default del proyecto) para balance velocidad/calidad
- Temperature: 0.3 para respuestas factuales

### Limites de seguridad
- Maximo 50 resultados por query para evitar respuestas enormes
- Solo lectura (SELECT) - el asistente no puede modificar datos
- Auth requerida (cualquier usuario del CRM, no solo admin)
- Historial solo en memoria del cliente (no se persiste en DB)
