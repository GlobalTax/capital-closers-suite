
## Plan: Rediseñar KPIs de Mandatos Buy-Side

### Problema Actual

Los KPIs actuales para mandatos de compra muestran:
- Targets Activos: 0 (no se calcula)
- Conversión: 0% (no se calcula)
- Score Promedio: 0 (no se calcula)
- Ofertas: 0 (no se calcula)
- En Búsqueda: 6 días

Estos datos no se están alimentando correctamente y además no aportan valor accionable.

### Solución: KPIs Accionables para Buy-Side

Reemplazar los KPIs actuales por métricas que ayuden a gestionar el proceso de adquisición:

| KPI Actual | Nuevo KPI | Por qué es más útil |
|------------|-----------|---------------------|
| Estado | **Pipeline Stage** | Muestra en qué fase del proceso está el mandato |
| Targets Activos | **Funnel Summary** | Breakdown visual: Long List / Short List / Finalistas |
| Conversión | **Próximo Paso** | Targets con contacto pendiente o sin actividad reciente |
| Score Promedio | **Ofertas Activas** | Cuántas ofertas enviadas + aceptadas/rechazadas |
| Ofertas | **Valor Estimado** | Rango de valor de las empresas target |
| En Búsqueda | **Última Actividad** | Cuándo fue la última interacción en el proceso |

### Diseño de Nuevos KPIs

```
┌──────────┐ ┌──────────────────┐ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐
│ Estado   │ │ Pipeline         │ │ Ofertas      │ │ Siguiente    │ │ Valor Est.   │ │ Actividad    │
│ ●activo  │ │ 15 → 5 → 2      │ │ 3 enviadas   │ │ 4 pendientes │ │ 2-8M€        │ │ hace 2 días  │
│ Buy-Side │ │ Long→Short→Fin  │ │ 1 aceptada   │ │ de contacto  │ │ de EV        │ │ Reunión XYZ  │
└──────────┘ └──────────────────┘ └──────────────┘ └──────────────┘ └──────────────┘ └──────────────┘
```

### Cambios Técnicos

#### 1. Crear hook para calcular KPIs de Buy-Side
**Archivo nuevo:** `src/hooks/useBuySideKPIs.ts`

Este hook calculará todas las métricas necesarias a partir de los targets del mandato:
- Estadísticas del funnel (long_list, short_list, finalista)
- Conteo de ofertas por estado
- Targets pendientes de contacto (sin actividad > 7 días)
- Rango de valores estimados
- Última actividad registrada

#### 2. Actualizar componente MandatoKPIs
**Archivo:** `src/features/mandatos/components/MandatoKPIs.tsx`

Modificar la sección de Buy-Side para mostrar:
- **Card 1:** Estado + tipo (mantener)
- **Card 2:** Resumen Funnel (15 → 5 → 2) con mini badges
- **Card 3:** Ofertas (enviadas/aceptadas/rechazadas)
- **Card 4:** Pendientes (targets sin contacto reciente)
- **Card 5:** Valor estimado (rango min-max)
- **Card 6:** Última actividad (hace X días + descripción breve)

#### 3. Pasar datos desde MandatoDetalle
**Archivo:** `src/pages/MandatoDetalle.tsx`

Integrar el nuevo hook y pasar los KPIs calculados al componente.

### Archivos a Crear

| Archivo | Descripción |
|---------|-------------|
| `src/hooks/useBuySideKPIs.ts` | Hook que calcula todos los KPIs de Buy-Side |

### Archivos a Modificar

| Archivo | Cambio |
|---------|--------|
| `src/features/mandatos/components/MandatoKPIs.tsx` | Rediseñar KPIs de Buy-Side |
| `src/pages/MandatoDetalle.tsx` | Usar hook y pasar datos |

### Beneficios

1. **Datos reales** - Todos los KPIs se calculan a partir de datos existentes
2. **Accionables** - "4 pendientes de contacto" indica qué hacer a continuación
3. **Contexto visual** - El mini-funnel muestra el pipeline de un vistazo
4. **Valor del deal** - Rango de EV de los targets activos
5. **Seguimiento** - Última actividad para detectar mandatos inactivos
