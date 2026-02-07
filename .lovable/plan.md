

# Plan Maestro de Implementacion IA - CapittalCRM

## Resumen Ejecutivo

Plan en 4 fases para integrar 6 modulos de IA en CapittalCRM, aprovechando la infraestructura existente (Supabase Edge Functions, Firecrawl, Lovable AI Gateway). Cada fase entrega valor incremental y se construye sobre la anterior.

---

## Estado Actual del Codebase

| Componente | Estado | Madurez |
|---|---|---|
| Sistema de alertas (`mandato_alerts`, `generate_mandato_alerts`) | Funcional, 6 tipos de alerta | 90% |
| Enriquecimiento (`enrich-company-v2`, Firecrawl + LLM) | Funcional, manual | 70% |
| Reuniones (`company_meetings`, `interacciones`) | CRUD basico, sin IA | 40% |
| Tareas IA (`task-ai`, `task_events`) | Edge Function funcional | 60% |
| Relationship Scoring | No existe | 0% |
| Match Engine / pgvector | No existe | 0% |
| Insights de industria | No existe | 0% |
| Infraestructura transversal (pg_cron, ai_log, cache) | No existe | 0% |

---

## FASE 0: Infraestructura Transversal (Prerequisito)

**Duracion estimada: 1 sesion**

Todo lo que los demas modulos necesitan para funcionar correctamente.

### 0.1 Migracion SQL: Campos de tracking IA

Agregar a tablas existentes:

- `empresas`: `ai_enriched_at TIMESTAMPTZ`, `ai_enrichment_source TEXT`, `ai_confidence NUMERIC(3,2)`, `ai_fields_locked TEXT[]` (campos editados manualmente que la IA no debe sobreescribir)
- `company_meetings`: `ai_summary TEXT`, `ai_action_items JSONB`, `ai_key_quotes JSONB`, `ai_processed_at TIMESTAMPTZ`
- `contactos` (outbound_leads): `relationship_score INTEGER` (0-100), `relationship_tier TEXT` (A/B/C), `last_interaction_at TIMESTAMPTZ`, `score_updated_at TIMESTAMPTZ`

### 0.2 Tabla `ai_activity_log`

Para tracking de costos y auditoria de todas las llamadas IA:

```text
ai_activity_log
  id UUID PK
  module TEXT (enrichment, meeting_summary, scoring, alerts, insights, match)
  model TEXT (gpt-5-nano, gpt-5-mini, gemini-3-flash)
  input_tokens INTEGER
  output_tokens INTEGER
  estimated_cost_usd NUMERIC(10,6)
  entity_type TEXT (empresa, contacto, meeting, deal)
  entity_id UUID
  user_id UUID
  success BOOLEAN
  error_message TEXT
  created_at TIMESTAMPTZ
```

### 0.3 Habilitar pg_cron y pg_net

Crear migracion para habilitar las extensiones:

```text
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;
```

Esto permitira programar jobs automaticos para alertas, scoring, y re-enriquecimiento.

---

## FASE 1: Alertas IA + Resumen de Reuniones (Quick Wins)

**Duracion estimada: 2-3 sesiones**

Los dos modulos con mayor ROI inmediato, aprovechando infraestructura casi completa.

### 1.1 Alertas automaticas con pg_cron

- Configurar `cron.schedule` para ejecutar `generate_mandato_alerts()` diariamente a las 8:00 AM via `pg_net` llamando a una Edge Function wrapper
- La funcion ya genera 6 tipos de alertas; solo falta la automatizacion

### 1.2 Mensajes de alerta contextuales con IA

- Crear Edge Function `enhance-alert-message` que reciba el contexto de una alerta (tipo, entidad, metricas) y use `gpt-5-nano` via Lovable AI Gateway para generar un mensaje contextual y accionable
- Modificar `generate_mandato_alerts()` para que tras insertar alertas, llame a esta funcion via `pg_net` para enriquecer los mensajes
- Ejemplo: en vez de "Mandato inactivo 90 dias", generar "El mandato de venta de TechCorp lleva 90 dias sin actividad. La ultima interaccion fue una reunion con el CEO. Sugiero agendar un follow-up esta semana."

### 1.3 Resumen IA de reuniones (MVP)

- Agregar campos `ai_summary`, `ai_action_items`, `ai_key_quotes`, `ai_processed_at` a `company_meetings` (en Fase 0)
- Crear Edge Function `summarize-meeting` que:
  - Reciba `meeting_id`
  - Lea `meeting_notes` + `preparation_notes` de la BD
  - Envie a `gpt-5-mini` via Lovable AI Gateway con prompt estructurado para M&A
  - Devuelva: resumen ejecutivo, puntos clave (bullets), acciones pendientes (con responsable si mencionado), citas destacadas
  - Guarde resultado en la BD y registre en `ai_activity_log`
- En el frontend: agregar boton "Resumir con IA" en el componente `MeetingCard` / detalle de reunion
- Mostrar resumen con indicador visual "Generado por IA" y boton "Regenerar"
- Las acciones pendientes extraidas pueden convertirse en tareas automaticamente (usando la tabla `tareas` existente)

### 1.4 UI de resultados IA en reuniones

- Componente `MeetingAISummary` que muestre:
  - Resumen ejecutivo (1 parrafo)
  - Puntos clave (bullets)
  - Acciones pendientes (con checkbox para crear tarea)
  - Citas destacadas (blockquotes)
- Integracion con el flujo existente de `CompanyMeetingsTab`

---

## FASE 2: Enriquecimiento Automatico + Relationship Scoring

**Duracion estimada: 3-4 sesiones**

### 2.1 Auto-trigger de enriquecimiento

- Crear Edge Function `enrichment-trigger` (wrapper liviano)
- Configurar trigger SQL `AFTER INSERT ON empresas` que use `pg_net.http_post` para llamar a `enrich-company-v2` automaticamente cuando se crea una empresa con `sitio_web IS NOT NULL`
- Respetar campo `ai_fields_locked`: no sobreescribir campos editados manualmente
- Actualizar `ai_enriched_at` y `ai_confidence` tras enriquecimiento exitoso

### 2.2 Re-enriquecimiento periodico

- Crear job `pg_cron` mensual que identifique empresas con `ai_enriched_at < NOW() - INTERVAL '3 months'` y las encole para re-procesamiento
- Edge Function `enrichment-batch` que procese N empresas por invocacion (max 10 por lote para no exceder timeout)
- Comparar datos nuevos vs existentes; solo actualizar si hay cambios significativos
- Generar alerta si se detectan cambios importantes (ej: nuevo CEO, ronda de financiacion)

### 2.3 Relationship Scoring heuristico

- Crear tabla `contact_relationships` para mapear conexiones entre contactos:

```text
contact_relationships
  id UUID PK
  contact_a_id UUID FK -> outbound_leads
  contact_b_id UUID FK -> outbound_leads
  relationship_type TEXT (colleague, introduced_by, shared_deal, shared_company)
  strength INTEGER (0-100)
  source TEXT (manual, ai_inferred, linkedin)
  created_at TIMESTAMPTZ
```

- Crear Edge Function `calculate-relationship-scores` que:
  - Para cada contacto, consulte `interacciones` asociadas (via `contacto_id` o `empresa_id`)
  - Calcule score heuristico (0-100) basado en:
    - Recencia: ultima interaccion (peso 40%)
    - Frecuencia: numero de interacciones en ultimos 90 dias (peso 30%)
    - Variedad: tipos distintos de interaccion - email, reunion, llamada (peso 15%)
    - Resultado: interacciones con resultado positivo (peso 15%)
  - Actualice `relationship_score` y `relationship_tier` (A: 75-100, B: 40-74, C: 0-39)
- Programar con `pg_cron` ejecucion nocturna
- En UI: mostrar score como badge/indicador en listados de contactos, con color segun tier

### 2.4 Alertas de relaciones frias

- Extender `generate_mandato_alerts` para incluir nuevo tipo: `relationship_cold`
- Trigger: contacto con `relationship_tier = 'A'` cuyo score baje a 'B' o inferior
- Usar `enhance-alert-message` para generar mensaje contextual sugeriendo reconexion

---

## FASE 3: Match Engine + Insights de Industria

**Duracion estimada: 4-5 sesiones**

### 3.1 Infraestructura vectorial (pgvector)

- Habilitar extension `pgvector` en Supabase
- Agregar columna `embedding vector(1536)` a tablas clave: `empresas`, `outbound_leads`
- Crear indice HNSW para busqueda eficiente
- Edge Function `generate-embeddings` que use Lovable AI Gateway para generar embeddings de texto (descripcion + sector + keywords) y los almacene

### 3.2 Match Engine MVP

- Edge Function `find-similar` que:
  - Reciba un `empresa_id` o deal
  - Genere embedding de la consulta
  - Busque los 10 mas similares via `<->` en pgvector
  - Pase los top 5 a `gpt-5-mini` para generar explicaciones y ranking final
  - Devuelva lista rankeada con justificaciones
- UI: seccion "Empresas Similares" en ficha de empresa y "Inversores Sugeridos" en ficha de mandato
- Registrar en `ai_activity_log`

### 3.3 Insights de industria (MVP)

- Edge Function `industry-brief` que:
  - Reciba sector y nombre de empresa
  - Use `firecrawl-search` para buscar noticias y datos del sector
  - Procese con LLM para generar brief estructurado: competidores, tendencias, riesgos
  - Cache resultado por 7 dias (evitar re-generar para mismo sector)
- UI: boton "Analisis Sectorial IA" en ficha de empresa
- Componente `IndustryBriefPanel` con secciones colapsables

### 3.4 Monitoreo semanal de sectores

- Job `pg_cron` semanal que para cada sector activo (con deals en pipeline) ejecute una busqueda de noticias via Firecrawl
- Almacenar hallazgos en tabla `sector_insights`
- Mostrar en dashboard como "Insights de la Semana"

---

## FASE 4: Transcripcion de Audio + Automatizaciones Avanzadas

**Duracion estimada: 3-4 sesiones**

### 4.1 Upload y transcripcion de audio

- Crear bucket `meeting-audio` en Supabase Storage
- Componente de upload de audio en detalle de reunion (usando `react-dropzone` ya instalado)
- Edge Function `transcribe-audio` que use ElevenLabs STT (scribe_v2) o Whisper para convertir audio a texto
- Guardar transcripcion en `company_meetings.meeting_notes` y luego ejecutar pipeline de resumen (Fase 1.3)

### 4.2 Creacion automatica de tareas desde reuniones

- Cuando `summarize-meeting` extraiga acciones pendientes, ofrecer boton "Crear tareas" que inserte en tabla `tareas` con `ai_generated = true`
- Mapear responsables mencionados en la reunion a usuarios del sistema (fuzzy match por nombre)

### 4.3 Draft de email de follow-up

- Extender alertas de `relationship_cold` para incluir borrador de email generado por IA
- Edge Function que genere texto de reconexion basado en contexto (ultima reunion, temas tratados)
- Mostrar en la alerta con boton "Copiar borrador"

### 4.4 Deal scoring predictivo (exploratorio)

- Usar datos historicos de mandatos (etapas, tiempos, interacciones) para calcular probabilidad de cierre
- Inicialmente heuristico; si hay suficientes datos, entrenar modelo simple

---

## Diagrama de Dependencias entre Fases

```text
FASE 0 (Infraestructura)
   |
   +---> FASE 1a (Alertas pg_cron)
   |        |
   +---> FASE 1b (Resumen Reuniones)
   |        |
   +---> FASE 2a (Auto-enriquecimiento)
   |        |
   +---> FASE 2b (Relationship Scoring) ---> FASE 2c (Alertas relaciones)
   |
   +---> FASE 3a (pgvector) ---> FASE 3b (Match Engine)
   |                         +---> FASE 3c (Insights industria)
   |
   +---> FASE 4 (Audio, auto-tareas, drafts)
```

Fases 1a, 1b, 2a pueden ejecutarse en paralelo tras Fase 0. Fase 3 requiere pgvector. Fase 4 es independiente pero se beneficia de todas las anteriores.

---

## Estrategia de Costos

| Modulo | Modelo recomendado | Frecuencia | Costo estimado/mes (500 empresas) |
|---|---|---|---|
| Alertas IA | gpt-5-nano | Diario | ~$2 |
| Resumen reuniones | gpt-5-mini | Bajo demanda | ~$5 (50 reuniones) |
| Enriquecimiento | gpt-5-mini + Firecrawl | Trigger + trimestral | ~$15 |
| Relationship Scoring | Heuristico (sin LLM) | Nocturno | $0 |
| Match Engine | gpt-5-mini + embeddings | Bajo demanda | ~$8 |
| Insights industria | gpt-5-mini + Firecrawl | Semanal + demanda | ~$20 |
| **Total estimado** | | | **~$50/mes** |

### Controles de costo implementados:
- `ai_activity_log` para monitoreo real
- Cache de resultados (no re-generar si no hay cambios)
- `ai_fields_locked` para evitar re-enriquecimiento innecesario
- Batching: procesar en lotes de 10, no todo de golpe
- Tiering de modelos: nano para trivial, mini para complejo

---

## Detalle Tecnico: Archivos a Crear/Modificar por Fase

### Fase 0
| Archivo | Accion |
|---|---|
| `supabase/migrations/xxx_ai_infrastructure.sql` | NUEVO - Campos IA, tabla ai_activity_log, pg_cron, pg_net |

### Fase 1
| Archivo | Accion |
|---|---|
| `supabase/functions/summarize-meeting/index.ts` | NUEVO - Edge Function resumen IA |
| `supabase/functions/enhance-alert-message/index.ts` | NUEVO - Contextualizar alertas con LLM |
| `src/components/companies/meetings/MeetingAISummary.tsx` | NUEVO - UI del resumen IA |
| `src/components/companies/meetings/MeetingCard.tsx` | EDITAR - Agregar boton "Resumir con IA" |
| `src/hooks/queries/useMeetingAI.ts` | NUEVO - Hook para llamar a summarize-meeting |
| `src/services/alerts.service.ts` | EDITAR - Integrar alertas mejoradas |
| pg_cron INSERT (via SQL directo, no migracion) | NUEVO - Job diario para alertas |

### Fase 2
| Archivo | Accion |
|---|---|
| `supabase/migrations/xxx_relationship_scoring.sql` | NUEVO - Tabla contact_relationships, trigger enriquecimiento |
| `supabase/functions/calculate-relationship-scores/index.ts` | NUEVO - Scoring heuristico |
| `supabase/functions/enrichment-trigger/index.ts` | NUEVO - Wrapper para auto-enriquecimiento |
| `src/components/contacts/RelationshipScoreBadge.tsx` | NUEVO - Badge visual de score |
| `src/hooks/queries/useRelationshipScore.ts` | NUEVO - Hook para scores |

### Fase 3
| Archivo | Accion |
|---|---|
| `supabase/migrations/xxx_pgvector_setup.sql` | NUEVO - Extension pgvector, columnas embedding |
| `supabase/functions/generate-embeddings/index.ts` | NUEVO - Generar vectores |
| `supabase/functions/find-similar/index.ts` | NUEVO - Match engine |
| `supabase/functions/industry-brief/index.ts` | NUEVO - Analisis sectorial |
| `src/components/companies/SimilarCompaniesPanel.tsx` | NUEVO - UI similares |
| `src/components/companies/IndustryBriefPanel.tsx` | NUEVO - UI insights |

### Fase 4
| Archivo | Accion |
|---|---|
| `supabase/functions/transcribe-audio/index.ts` | NUEVO - ASR |
| `src/components/companies/meetings/AudioUpload.tsx` | NUEVO - Upload audio |
| Migracion bucket `meeting-audio` | NUEVO |

---

## Recomendacion de Inicio

Empezar por **Fase 0 + Fase 1** en la proxima sesion. La Fase 0 es una unica migracion SQL. La Fase 1a (pg_cron para alertas) es un INSERT SQL rapido. La Fase 1b (resumen de reuniones) es la funcionalidad IA mas tangible y de mayor impacto para el equipo, ya que ahorra tiempo real en cada reunion.

