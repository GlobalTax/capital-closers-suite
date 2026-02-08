

# Fase 6: Reportes Ejecutivos Semanales con IA

## Objetivo
Crear un sistema que genere automaticamente un reporte ejecutivo semanal de mandatos activos usando IA, con resumen de actividad, metricas clave y proximos pasos, y lo envie por email a socios/directores configurables.

## Arquitectura

```text
  [Cron semanal: lunes 8:00 AM]     [Boton manual "Generar Reporte"]
         |                                    |
         v                                    v
  POST /generate-executive-report  ────────────
         |
    1. Recopila datos de mandatos activos (queries Supabase)
    2. Agrega metricas: pipeline, horas, tareas, reuniones
    3. Llama a google/gemini-3-flash-preview para generar narrativa
    4. Construye HTML del email profesional
    5. Envia via send-email (Resend)
    6. Guarda registro en executive_reports
    7. Log en ai_activity_log
         |
         v
  [Email HTML profesional a socios]
  [Historial visible en /reportes]
```

## Datos que el reporte incluira

| Seccion | Fuente | Descripcion |
|---------|--------|-------------|
| Resumen ejecutivo | IA (Gemini) | Parrafo narrativo con lo mas relevante de la semana |
| Mandatos activos | `mandatos` + `pipeline_stages` | Tabla con nombre, etapa, probabilidad, dias en etapa |
| Movimientos de pipeline | `mandatos` (stage changed this week) | Mandatos que avanzaron o retrocedieron |
| Mandatos en riesgo | `mandatos` (inactivos >14 dias o estancados) | Alertas de deals frios |
| Horas del equipo | `time_entries` (semana actual) | Total horas por mandato y usuario |
| Reuniones realizadas | `company_meetings` (semana actual) | Conteo y listado de reuniones |
| Tareas completadas vs pendientes | `tareas` | Ratio de progreso |
| Proximos pasos sugeridos | IA (Gemini) | Recomendaciones por mandato prioritario |
| Cierres esperados | `mandatos` con `estimated_close_date` proximo | Pipeline de cierre inminente |

## Archivos a crear

### 1. Migracion: `executive_reports`
Nueva tabla para guardar historial de reportes generados:
- `id` (uuid PK)
- `report_date` (date) - fecha del reporte (lunes de la semana)
- `period_start` (date) - inicio del periodo cubierto
- `period_end` (date) - fin del periodo cubierto
- `summary_text` (text) - resumen narrativo generado por IA
- `metrics_snapshot` (jsonb) - metricas al momento del reporte
- `mandatos_snapshot` (jsonb) - estado de mandatos activos
- `recommendations` (jsonb) - proximos pasos sugeridos por IA
- `recipients` (text[]) - emails a los que se envio
- `email_sent` (boolean default false)
- `email_sent_at` (timestamptz)
- `generated_by` (uuid) - usuario que lo genero (null si fue cron)
- `created_at` (timestamptz default now())

RLS: Lectura para usuarios autenticados.

### 2. `supabase/functions/generate-executive-report/index.ts`
Edge Function principal:
- Autenticacion dual: usuario autenticado O cron-secret para ejecucion programada
- Recopila todos los datos de la semana en paralelo (mandatos activos, time_entries, tareas, reuniones, movimientos de pipeline)
- Construye un prompt estructurado con todos los datos factuales
- Llama a Lovable AI Gateway (`google/gemini-3-flash-preview`) con tool calling para extraer:
  - `executive_summary` (texto narrativo en espanol, 2-3 parrafos)
  - `highlights` (array de logros/avances de la semana)
  - `risks` (array de mandatos en riesgo con razon)
  - `recommendations` (array de acciones sugeridas para cada mandato prioritario)
- Genera HTML profesional del email con branding Capittal
- Envia via la funcion `send-email` existente (Resend)
- Guarda registro en `executive_reports`
- Log en `ai_activity_log` (modulo: `executive-report`)
- Manejo de errores 429/402

### 3. `src/hooks/useExecutiveReports.ts`
- `useExecutiveReports()`: query para listar historial de reportes generados
- `useGenerateExecutiveReport()`: mutation para disparar generacion manual
- `useReportRecipients()`: query/mutation para gestionar destinatarios

### 4. `src/components/reportes/ExecutiveReportPanel.tsx`
Panel dentro de la pagina /reportes (nueva tab "Reportes IA"):
- Boton "Generar Reporte Semanal" con icono Sparkles
- Configuracion de destinatarios (emails de socios/directores)
- Lista de reportes generados con fecha, estado de envio, preview
- Modal de preview del reporte HTML antes de enviar
- Indicador de ultimo reporte generado

### 5. Migracion: `executive_report_recipients`
Tabla para configurar destinatarios:
- `id` (uuid PK)
- `email` (text NOT NULL)
- `name` (text)
- `active` (boolean default true)
- `created_at` (timestamptz default now())

### 6. Cron job (SQL insert, no migracion)
Programar ejecucion semanal los lunes a las 8:00 AM via pg_cron + pg_net, llamando a `generate-executive-report` con el cron-secret.

## Archivos a modificar

### 7. `src/pages/Reportes.tsx`
- Agregar nueva tab "Reportes IA" con el `ExecutiveReportPanel`

### 8. `supabase/config.toml`
- Agregar `[functions.generate-executive-report]` con `verify_jwt = false` (permite cron + auth manual en codigo)

## Detalles tecnicos

### System prompt del modelo
Instruye al modelo como director de M&A que redacta un reporte semanal para el comite de socios. Debe ser conciso, profesional, en espanol, con enfasis en: deals que avanzaron, deals en riesgo, uso del tiempo del equipo, y acciones concretas para la proxxima semana.

### Tool calling para output estructurado
Se define una tool `generate_executive_report` con parametros:
- `executive_summary` (string): Resumen narrativo de 2-3 parrafos
- `highlights` (array de strings): 3-5 logros principales
- `risks` (array de objetos {mandato, reason, suggested_action}): Mandatos en riesgo
- `recommendations` (array de objetos {mandato, action, priority}): Proximos pasos

### Email HTML
- Diseno profesional con colores Capittal (#1a365d azul oscuro, #2d3748 gris)
- Header con logo y fecha
- Secciones claramente separadas: Resumen, Pipeline, Riesgos, Metricas, Recomendaciones
- Tablas responsive para datos de mandatos
- Footer con disclaimer "Generado por IA - Capittal Partners CRM"

### Seguridad
- Autenticacion dual: Bearer token de usuario O x-cron-secret para cron
- La Edge Function usa service role para queries
- Destinatarios solo configurables por usuarios autenticados
- Email enviado via infraestructura Resend existente

### Patron de cron (reutiliza patron existente)
Igual que `daily-hours-report`: cron.schedule con pg_net llamando al endpoint con Authorization header del anon key y x-cron-secret.

