
# Fase 5: Scoring Inteligente de Mandatos con IA

## Objetivo
Crear un sistema de scoring que analice automaticamente las senales de actividad de cada mandato (reuniones, tareas, documentos, tiempo invertido, tiempo en etapa) y genere una recomendacion de probabilidad de cierre con justificacion, actualizando el campo `probability` existente.

## Senales que el modelo analizara

Para cada mandato, la Edge Function recopilara:

| Senal | Fuente | Peso logico |
|-------|--------|-------------|
| Etapa del pipeline | `mandatos.pipeline_stage` + `pipeline_stages.default_probability` | Base del scoring |
| Dias en etapa actual | `mandatos.pipeline_stage_changed_at` vs hoy | Estancamiento = riesgo |
| Dias sin actividad | `mandatos.last_activity_at` vs hoy | Inactividad = riesgo |
| Reuniones recientes | `company_meetings` vinculadas a empresa principal | Actividad positiva |
| Tareas pendientes/completadas | `tareas` del mandato | Progreso = positivo |
| Documentos adjuntos | `documentos` del mandato (NDA, DD, etc.) | Documentacion avanzada = positivo |
| Horas invertidas | `time_entries` del mandato | Inversion significativa |
| Valor del mandato | `mandatos.valor` | Contexto |
| Ofertas recibidas (venta) | `mandatos.numero_ofertas_recibidas` | Interes de mercado |
| Targets vinculados | `mandato_empresas` con rol target | Progreso en busqueda |

## Arquitectura

```text
  [Boton "Scoring IA"]          [Cron semanal (futuro)]
         |                              |
         v                              v
  POST /score-mandato  ───────────────────
         |
    1. Recopila senales (queries Supabase)
    2. Construye prompt con datos factuales
    3. Llama a google/gemini-3-flash-preview con tool calling
    4. Extrae: probability, confidence, reasoning, risk_factors, recommendations
    5. Actualiza mandatos.probability
    6. Guarda historial en mandato_scoring_history
    7. Log en ai_activity_log
         |
         v
  [Panel de scoring en MandatoDetalle]
```

## Archivos a crear

### 1. Migracion: `mandato_scoring_history`
Nueva tabla para guardar historial de scorings:
- `id` (uuid)
- `mandato_id` (uuid FK)
- `previous_probability` (integer)
- `new_probability` (integer)
- `ai_confidence` (numeric 0-1)
- `reasoning` (text) - explicacion del modelo
- `risk_factors` (jsonb) - array de factores de riesgo
- `positive_signals` (jsonb) - array de senales positivas
- `recommendations` (jsonb) - array de acciones sugeridas
- `signals_snapshot` (jsonb) - snapshot de los datos analizados
- `scored_by` (uuid) - usuario que lo solicito
- `created_at` (timestamptz)

RLS: Lectura para usuarios autenticados, insert solo via service role.

### 2. `supabase/functions/score-mandato/index.ts`
- Recibe `{ mandato_id }` + auth del usuario
- Ejecuta queries para recopilar todas las senales
- Construye un prompt estructurado con los datos factuales
- Usa tool calling con `google/gemini-3-flash-preview` para extraer:
  - `probability` (0-100)
  - `confidence` (0-1)
  - `reasoning` (texto en espanol)
  - `risk_factors` (array de strings)
  - `positive_signals` (array de strings)
  - `recommendations` (array de strings)
- Actualiza `mandatos.probability` con el nuevo valor
- Inserta registro en `mandato_scoring_history`
- Log en `ai_activity_log` (modulo: `mandato-scoring`)
- Manejo de errores 429/402

### 3. `src/hooks/useMandatoScoring.ts`
- `useMandatoScoringHistory(mandatoId)`: query para obtener historial de scorings
- `useScoreMandato()`: mutation que llama a la Edge Function
- Invalidacion de queries de mandatos y scoring al completar

### 4. `src/components/mandatos/MandatoScoringPanel.tsx`
Panel que se muestra en la pagina de detalle del mandato:

**Seccion superior:**
- Probabilidad actual con gauge visual (semicirculo con colores rojo/amarillo/verde)
- Badge de confianza del modelo (alta/media/baja)
- Boton "Recalcular con IA" (con icono Sparkles)
- Fecha del ultimo scoring

**Seccion de analisis (expandible):**
- Lista de senales positivas (iconos verdes)
- Lista de factores de riesgo (iconos rojos/amarillos)
- Recomendaciones de accion (iconos azules)
- Razonamiento completo del modelo

**Historial:**
- Mini timeline de cambios de probabilidad (ultimo 5)
- Muestra anterior vs nuevo con flecha y delta

### 5. `src/components/mandatos/ScoringGauge.tsx`
- Componente visual de semicirculo/arco SVG
- Colores: rojo (0-30), amarillo (31-60), verde (61-100)
- Numero grande en el centro
- Animacion suave al cambiar valor

## Archivos a modificar

### 6. `src/pages/MandatoDetalle.tsx`
- Importar y renderizar `MandatoScoringPanel` en la tab Resumen o como panel lateral
- Solo visible para mandatos de tipo M&A (no servicios)

### 7. `supabase/config.toml`
- Agregar `[functions.score-mandato]` con `verify_jwt = true`

## Detalles tecnicos

### Prompt del modelo
El system prompt instruye al modelo como analista M&A experto que evalua probabilidad de cierre. Recibe datos factuales estructurados y debe razonar sobre ellos considerando:
- La etapa actual y su probabilidad base
- Si hay estancamiento (muchos dias sin avanzar)
- Si hay actividad reciente (reuniones, tareas)
- Si la documentacion esta avanzada (NDA, DD completados)
- Si hay senales de mercado (ofertas, targets interesados)

### Tool calling para output estructurado
Se define una tool `evaluate_mandate_probability` con parametros tipados para garantizar que el modelo devuelve exactamente la estructura esperada.

### Seguridad
- Auth requerida (cualquier usuario CRM)
- La Edge Function usa service role para las queries pero valida que el usuario esta autenticado
- Solo lectura + update de probability + insert en historial
- No streaming (respuesta unica)
