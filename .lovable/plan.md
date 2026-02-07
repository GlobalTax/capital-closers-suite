
# Fase 1: Implementación Completa

Sin el CRON_SECRET, las Edge Functions validarán usando el SERVICE_ROLE_KEY (ya disponible) para llamadas internas desde pg_cron, y admin auth para llamadas manuales desde el frontend.

## Archivos a crear

### 1. `supabase/functions/run-alerts-cron/index.ts`
- Auth dual: SERVICE_ROLE_KEY para pg_cron, o admin auth para manual
- Ejecuta `generate_mandato_alerts()` via RPC con service role
- Busca alertas recién creadas (últimas 24h, sin description) y llama a `enhance-alert-message` para cada una
- Registra en `ai_activity_log`

### 2. `supabase/functions/enhance-alert-message/index.ts`
- Recibe `alert_id`, lee contexto de la alerta + mandato + empresa
- Llama a `openai/gpt-5-nano` via Lovable AI Gateway
- Genera mensaje contextual en español (2-3 frases con acción sugerida)
- Actualiza campo `description` de la alerta
- Registra tokens/costo en `ai_activity_log`

### 3. `supabase/functions/summarize-meeting/index.ts`
- Admin auth (mismo patrón que `task-ai`)
- Recibe `meeting_id`, lee notas + empresa
- Usa `openai/gpt-5-mini` con tool calling para extraer: summary, key_points, action_items (con responsible/deadline), key_quotes
- Guarda en campos `ai_summary`, `ai_action_items`, `ai_key_quotes`, `ai_processed_at`
- Maneja errores 429/402
- Registra en `ai_activity_log`

### 4. `src/hooks/queries/useMeetingAI.ts`
- Hook `useSummarizeMeeting()` que invoca la Edge Function
- Invalida queries de meetings al éxito
- Toast de éxito/error con mensajes claros para 429/402

### 5. `src/components/empresas/MeetingAISummary.tsx`
- Componente que muestra: badge "Resumen IA", resumen ejecutivo, acciones pendientes (con responsable/deadline), citas destacadas como blockquotes
- Botón "Regenerar" con spinner
- Estilo purple/violet coherente para diferenciar contenido IA

## Archivos a modificar

### 6. `supabase/config.toml`
Agregar las 3 funciones nuevas con `verify_jwt = false`:
- `run-alerts-cron`
- `enhance-alert-message`
- `summarize-meeting`

### 7. `src/services/companyMeetings.service.ts`
Extender interface `CompanyMeeting` con campos IA:
- `ai_summary: string | null`
- `ai_action_items: any[] | null`
- `ai_key_quotes: string[] | null`
- `ai_processed_at: string | null`

### 8. `src/components/empresas/MeetingCard.tsx`
- Importar `Sparkles`, `Loader2` de lucide + `MeetingAISummary` + `useSummarizeMeeting`
- Agregar botón "Resumir con IA" junto a Editar/Eliminar (visible solo cuando hay `meeting_notes` y no se está editando)
- Insertar `MeetingAISummary` entre las notas y los documentos

## pg_cron schedule (SQL directo, no migración)

Programar ejecución diaria a las 8:00 AM UTC llamando a `run-alerts-cron` via `pg_net.http_post` con el SERVICE_ROLE_KEY en el header Authorization.

## Resumen de seguridad

- Todas las funciones validan admin auth o SERVICE_ROLE_KEY
- LOVABLE_API_KEY ya está configurado
- No se necesitan secrets adicionales
- pg_cron usa SERVICE_ROLE_KEY para autenticar las llamadas
