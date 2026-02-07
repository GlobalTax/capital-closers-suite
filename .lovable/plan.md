
# Fase 3: Dashboard de IA - Metricas, Tokens, Costos y Actividad

## Objetivo

Crear un panel centralizado en `/admin/ai-dashboard` que permita a administradores monitorear todo el uso de IA en el CRM: tokens consumidos, costos estimados, tasa de exito, y actividad reciente por modulo.

## Datos disponibles

La tabla `ai_activity_log` ya registra toda la actividad de las Edge Functions de IA con los siguientes campos:
- `module`: identificador del modulo (meeting_summary, alerts, batch-enrichment, alerts_cron, task-ai)
- `model`: modelo usado (gpt-5-nano, gpt-5-mini, etc.)
- `input_tokens` / `output_tokens`: consumo de tokens
- `estimated_cost_usd`: costo estimado por llamada
- `success` / `error_message`: resultado de la operacion
- `duration_ms`: tiempo de respuesta
- `entity_type` / `entity_id`: entidad afectada
- `created_at`: timestamp

Actualmente la tabla esta vacia (las funciones estan desplegadas pero aun no se han ejecutado), por lo que el dashboard mostrara estados vacios con buen UX.

## Archivos a crear

### 1. `src/hooks/queries/useAIDashboard.ts`
- Hook con queries para obtener metricas agregadas desde `ai_activity_log`
- Queries:
  - **Totales**: sum tokens, sum cost, count total, count success/errors
  - **Por modulo**: agrupado por `module` con totales de tokens, costo, llamadas
  - **Por modelo**: agrupado por `model`
  - **Actividad reciente**: ultimos 50 registros con orden descendente
  - **Serie temporal**: agrupado por dia (ultimos 30 dias) para grafico de lineas
- Filtro por rango de fechas (default: ultimos 30 dias)

### 2. `src/pages/admin/AIDashboard.tsx`
Pagina principal del dashboard con las siguientes secciones:

**Header**: Titulo "Dashboard de IA", selector de rango de fechas (7d / 30d / 90d / Todo)

**Tarjetas KPI** (fila superior, 5 cards):
- Total llamadas IA
- Tokens consumidos (input + output)
- Costo total estimado (USD)
- Tasa de exito (%)
- Latencia promedio (ms)

**Grafico de uso diario** (recharts AreaChart):
- Eje X: fechas
- Area 1: tokens por dia
- Area 2: costo por dia
- Tooltip con detalles

**Tabla: Uso por Modulo** (desglose):
- Columnas: Modulo, Llamadas, Tokens IN, Tokens OUT, Costo, Exito %, Latencia media
- Iconos por modulo (Sparkles, Brain, Zap, etc.)

**Tabla: Uso por Modelo**:
- Columnas: Modelo, Llamadas, Tokens totales, Costo, Latencia media

**Timeline: Actividad Reciente**:
- Ultimas 50 operaciones con: timestamp, modulo, modelo, tokens, costo, estado (badge verde/rojo), entidad vinculada
- ScrollArea con altura fija

### 3. `src/components/ai-dashboard/AIKPICards.tsx`
- Componente reutilizable para las 5 tarjetas de metricas
- Skeleton loading state
- Estado vacio cuando no hay datos

### 4. `src/components/ai-dashboard/AIUsageChart.tsx`
- Grafico de area con recharts
- Dos series: tokens y costo
- Responsive, con eje Y dual
- Estado vacio con mensaje "Sin datos de actividad aun"

### 5. `src/components/ai-dashboard/AIModuleBreakdown.tsx`
- Tabla con desglose por modulo
- Progress bars para porcentaje de uso relativo
- Iconos y colores por modulo

### 6. `src/components/ai-dashboard/AIActivityTimeline.tsx`
- Lista de actividad reciente
- Badges de estado (exito/error)
- Formato de fecha relativo (hace 2 min, hace 1 hora)
- Click para expandir detalles de error si aplica

## Archivos a modificar

### 7. `src/App.tsx`
- Agregar ruta `/admin/ai-dashboard` con ProtectedRoute requiredRole="admin"
- Import lazy del componente AIDashboard

## Detalles tecnicos

- Todas las queries usan el cliente Supabase existente (no se necesitan Edge Functions nuevas)
- Los datos se leen directamente de `ai_activity_log` con queries agregadas
- Se usa recharts (ya instalado) para graficos
- Patron de componentes consistente con EnrichmentDashboard y TaskAIQA
- staleTime de 2 minutos para las queries
- No se requiere migracion de base de datos (la tabla ya existe con RLS)
