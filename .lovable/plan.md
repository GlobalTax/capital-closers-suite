
## Plan: Arreglar KPI "Targets Activos" en Mandatos Buy-Side

### Resumen del Problema

El KPI "Targets Activos" muestra 0 porque los datos del pipeline de targets no se pasan al componente `MandatoKPIs`. La información ya existe en el hook `useTargetPipeline`, pero no se conecta a la pagina principal del mandato.

| Elemento | Fuente Actual | Valor | Estado |
|----------|---------------|-------|--------|
| "Targets (5)" badge | `mandato.empresas.length` | 5 | Correcto |
| "Long List = 5" | `useTargetPipeline().stats` | 5 | Correcto |
| "Targets Activos" | `activeTargets` (default: 0) | 0 | **ROTO** - No se pasa el prop |

---

### Solucion

Conectar el hook `useTargetPipeline` en `MandatoDetalle.tsx` y pasar las stats a `MandatoKPIs`.

---

### Cambios Necesarios

#### 1. Actualizar MandatoDetalle.tsx

Importar y usar el hook para mandatos Buy-Side:

```typescript
import { useTargetPipeline } from "@/hooks/useTargetPipeline";

// Dentro del componente:
const isBuySide = mandato?.tipo === "compra";

const { 
  stats: targetStats, 
  targets,
  isLoading: isLoadingTargets 
} = useTargetPipeline(isBuySide ? mandato?.id : undefined);

// Pasar los datos al componente KPIs:
<MandatoKPIs 
  mandato={mandato} 
  checklistProgress={totalProgress}
  overdueTasks={overdueTasks.length}
  // Nuevos props para Buy-Side:
  activeTargets={targetStats?.total || 0}
  conversionRate={targetStats?.conversionRate || 0}
  avgScore={targetStats?.averageScore || 0}
  offersSent={targetStats?.totalOfertas || 0}
/>
```

**Notas importantes:**
- Solo se activa el hook si el mandato es Buy-Side (`tipo === "compra"`)
- Evita doble carga: el hook ya se usa en TargetsTabBuySide, pero React Query cachea los datos
- Los queryKeys son iguales, asi que no hay requests duplicados

---

### Definicion de "Target Activo"

Basado en el codigo existente en `getTargetPipelineStats()`:

```sql
-- Un target es "activo" si:
SELECT * FROM mandato_empresas
WHERE mandato_id = :mandatoId
  AND rol = 'target'
-- No hay filtro de archived/deleted porque no existen esas columnas
```

Por tanto, `stats.total` = todos los targets del mandato = "activos" en el contexto actual.

Si en el futuro se anade logica de archivado:
- Se deberia anadir columna `is_archived` o `deleted_at` a `mandato_empresas`
- Actualizar la query para excluirlos: `WHERE deleted_at IS NULL AND is_archived = false`
- El funnel stage `descartado` NO significa inactivo (sigue siendo un target, solo que descartado del proceso)

---

### Archivos a Modificar

| Archivo | Cambios |
|---------|---------|
| `src/pages/MandatoDetalle.tsx` | Importar `useTargetPipeline`, pasar props a `MandatoKPIs` |

---

### Flujo de Datos Corregido

```
MandatoDetalle.tsx
      |
      v
useTargetPipeline(mandato.id)  -- Solo si tipo === "compra"
      |
      +-- stats.total -----------> activeTargets
      +-- stats.conversionRate --> conversionRate  
      +-- stats.averageScore ----> avgScore
      +-- stats.totalOfertas ----> offersSent
      |
      v
<MandatoKPIs {...props} />
      |
      v
Muestra: "Targets Activos: 5"
```

---

### Consistencia Garantizada

Con este cambio:

| Elemento | Fuente | Consistente |
|----------|--------|-------------|
| "Targets (N)" badge | `targetsCount` (mandato.empresas.length) | Si |
| "Targets Activos" KPI | `targetStats.total` | Si |
| Long List / Short List / Finalistas | `targetStats.byFunnelStage` | Si |
| Vista Kanban/Lista | `useTargetPipeline().targets` | Si |

Todos usan el mismo origen de datos (React Query con key `['target-pipeline-stats', mandatoId]`).

---

### Casos de Prueba

| Escenario | Resultado Esperado |
|-----------|-------------------|
| Mandato Buy-Side con 5 targets | Targets Activos = 5, Long List = 5 |
| Mover target a Short List | Targets Activos sigue igual (5), Long List baja, Short List sube |
| Descartar target | Targets Activos sigue igual (target descartado sigue existiendo) |
| Crear nuevo target | Targets Activos sube a 6 (cache invalidado) |
| Mandato Sell-Side | KPIs de Sell-Side (no muestra Targets Activos) |

---

### Seccion Tecnica

**React Query caching:**
- El hook `useTargetPipeline` usa `staleTime: 2 * 60 * 1000` (2 minutos)
- Cuando se usa en `MandatoDetalle.tsx` Y en `TargetsTabBuySide.tsx`, React Query devuelve datos cacheados
- No hay requests duplicados porque comparten el mismo `queryKey`

**Invalidacion de cache:**
- Las mutations en `useTargetPipeline` ya invalidan `['target-pipeline-stats', mandatoId]`
- Cuando el usuario mueve un target o crea una oferta, el KPI se actualiza automaticamente

**Performance:**
- Condicionalmente activo: `enabled: !!mandatoId && isBuySide`
- Para mandatos Sell-Side no se ejecuta la query de targets
