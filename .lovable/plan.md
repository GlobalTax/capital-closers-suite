

# Fase 1: Alertas pg_cron + Resumen IA de Reuniones

## Que se va a hacer

Dos funcionalidades de alto impacto inmediato:

1. **Automatizar alertas diarias** - Las alertas que hoy se generan manualmente pasaran a ejecutarse automaticamente cada dia a las 8:00 AM, y sus mensajes seran enriquecidos con contexto generado por IA.

2. **Resumen inteligente de reuniones** - Un boton "Resumir con IA" en cada tarjeta de reunion que genera automaticamente: resumen ejecutivo, puntos clave, acciones pendientes y citas destacadas.

---

## Parte 1: Alertas automaticas con pg_cron

### 1.1 Edge Function wrapper para alertas

Crear `supabase/functions/run-alerts-cron/index.ts`:
- Valida autenticacion via `x-cron-secret` header (para llamadas automaticas desde pg_cron) o via admin auth (para llamadas manuales)
- Ejecuta `generate_mandato_alerts()` via RPC con service role
- Registra ejecucion en `ai_activity_log`
- Registrar en `supabase/config.toml` con `verify_jwt = false`

### 1.2 Programar cron job via SQL directo (no migracion)

Usar `pg_cron` + `pg_net` para llamar a la Edge Function diariamente:
```text
cron.schedule('daily-alerts', '0 8 * * *', 
  net.http_post al endpoint run-alerts-cron con x-cron-secret header)
```

### 1.3 Edge Function para contextualizar alertas con IA

Crear `supabase/functions/enhance-alert-message/index.ts`:
- Recibe alert_id y contexto (tipo, entidad, metricas del metadata)
- Usa `openai/gpt-5-nano` via Lovable AI Gateway con tool calling para extraer JSON estructurado
- Genera mensaje contextual y accionable en espanol
- Actualiza el campo `description` de la alerta en BD
- Registra en `ai_activity_log` (modulo: "alerts", modelo: "gpt-5-nano")
- Registrar en `config.toml` con `verify_jwt = false`

### 1.4 Integrar enhance en el flujo de alertas

Modificar `run-alerts-cron` para que tras ejecutar `generate_mandato_alerts()`, consulte las alertas recien creadas (ultimas 24h, no dismissed) y llame a `enhance-alert-message` para cada una que aun no tenga mensaje enriquecido.

---

## Parte 2: Resumen IA de reuniones

### 2.1 Edge Function `summarize-meeting`

Crear `supabase/functions/summarize-meeting/index.ts`:
- Validacion admin auth (mismo patron que `task-ai`)
- Recibe `meeting_id`
- Lee `meeting_notes` + `preparation_notes` + `title` + `meeting_date` de `company_meetings`
- Lee nombre de empresa via `company_id -> empresas.nombre`
- Envia a `openai/gpt-5-mini` con prompt M&A estructurado usando tool calling:
  - Funcion `summarize_meeting` con parametros: `summary` (string), `key_points` (array), `action_items` (array con title/responsible/deadline), `key_quotes` (array)
- Guarda resultado en `company_meetings`: `ai_summary`, `ai_action_items`, `ai_key_quotes`, `ai_processed_at`
- Registra en `ai_activity_log` (modulo: "meeting_summary")
- Maneja errores 429/402
- Registrar en `config.toml` con `verify_jwt = false`

### 2.2 Hook `useMeetingAI`

Crear `src/hooks/queries/useMeetingAI.ts`:
- `useSummarizeMeeting()`: mutacion que llama a `supabase.functions.invoke('summarize-meeting', { body: { meeting_id } })`
- Al exito, invalida query de meetings para refrescar datos
- Maneja estados de carga y errores (incluidos 429/402 con toast descriptivo)

### 2.3 Componente `MeetingAISummary`

Crear `src/components/empresas/MeetingAISummary.tsx`:
- Recibe `meeting` (con campos ai_*)
- Si `ai_summary` existe, muestra:
  - Badge "Generado por IA" con icono Sparkles y timestamp
  - Resumen ejecutivo (parrafo)
  - Puntos clave (lista con bullets)
  - Acciones pendientes (lista con icono CheckCircle, responsable si existe)
  - Citas destacadas (blockquotes con estilo)
  - Boton "Regenerar" (icono RefreshCw)
- Si no existe, muestra placeholder invitando a usar el boton de resumir
- Estilo coherente con el diseno actual (Tailwind, shadcn)

### 2.4 Integrar en MeetingCard

Modificar `src/components/empresas/MeetingCard.tsx`:
- Agregar boton "Resumir con IA" (icono Sparkles) en la barra de acciones, junto a Editar/Eliminar
- Mostrar solo cuando hay `meeting_notes` y no se esta editando
- Estado loading con spinner mientras procesa
- Insertar componente `MeetingAISummary` despues de las notas de reunion (antes de Documents)

### 2.5 Actualizar tipo CompanyMeeting

Extender `src/services/companyMeetings.service.ts`:
- Agregar campos `ai_summary`, `ai_action_items`, `ai_key_quotes`, `ai_processed_at` al tipo `CompanyMeeting`
- No se necesitan cambios en las queries existentes ya que el `select("*")` los incluira automaticamente

---

## Archivos a crear/modificar

| Archivo | Accion |
|---|---|
| `supabase/functions/run-alerts-cron/index.ts` | NUEVO |
| `supabase/functions/enhance-alert-message/index.ts` | NUEVO |
| `supabase/functions/summarize-meeting/index.ts` | NUEVO |
| `supabase/config.toml` | EDITAR - agregar 3 funciones |
| `src/hooks/queries/useMeetingAI.ts` | NUEVO |
| `src/components/empresas/MeetingAISummary.tsx` | NUEVO |
| `src/components/empresas/MeetingCard.tsx` | EDITAR - boton IA + componente summary |
| `src/services/companyMeetings.service.ts` | EDITAR - extender tipo |
| SQL directo (no migracion) para pg_cron schedule | INSERT via herramienta |

