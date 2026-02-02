

## Entendiendo el Cierre de Proyectos: Estado Actual y Mejoras

### Lo que Ya Existe

El sistema ya tiene un **flujo de cierre** con el diálogo `CloseMandatoDialog` que aparece cuando cambias el estado a "Cerrado" o "Cancelado":

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  Cerrar Mandato                                                              │
│  [Empresa Principal]                                                         │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ¿Cómo cerró este mandato?                                                  │
│                                                                              │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐                          │
│  │   GANADO    │  │   PERDIDO   │  │  CANCELADO  │                          │
│  │     🏆      │  │      ❌      │  │      ⛔      │                          │
│  └─────────────┘  └─────────────┘  └─────────────┘                          │
│                                                                              │
│  [Si ganado] → Pide valor real de cierre (€)                                │
│  [Si perdido/cancelado] → Pide razón obligatoria + notas                    │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### El Problema que Identificas

**El significado de "ganado" o "perdido" varía según el tipo de proyecto:**

| Categoría | ¿Qué significa "Ganado"? | ¿Qué significa "Perdido"? |
|-----------|-------------------------|---------------------------|
| **Operación M&A (Venta)** | Cerramos la venta al precio acordado | El vendedor eligió otra firma/canceló |
| **Operación M&A (Compra)** | El cliente compró un target | No encontramos target o el cliente desistió |
| **Due Diligence** | Entregamos el informe y cobramos | El cliente canceló el encargo |
| **Valoración** | Entregamos el informe y cobramos | El cliente canceló |
| **SPA/Legal** | Redactamos contratos y cobramos | El cliente fue a otro despacho |
| **Asesoría** | Servicio completado | Servicio cancelado |

---

### Propuesta: Adaptar el Cierre por Categoría

#### 1. Para Operaciones M&A (compra/venta)

Mantener el sistema actual pero mejorar la terminología:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  Cierre de Operación M&A                                                     │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐              │
│  │  DEAL CERRADO   │  │  NO SE CERRÓ    │  │    CANCELADO    │              │
│  │      🏆         │  │       ❌         │  │       ⛔         │              │
│  │ (Operación OK)  │  │ (Sin transacción)│  │ (Cliente desiste)│              │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘              │
│                                                                              │
│  [Deal Cerrado]                                                              │
│    • Valor del deal: €________                                              │
│    • Fee cobrado: €________                                                 │
│    • Fecha de cierre: ________                                              │
│                                                                              │
│  [No se cerró]                                                               │
│    • Razón: [Precio | Competidor | DD fallida | ...]                        │
│    • Notas de aprendizaje: ________________                                 │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

#### 2. Para Servicios (DD, Valoración, SPA, Asesoría)

Nueva terminología más apropiada:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  Cierre de Servicio                                                          │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌─────────────────┐  ┌─────────────────┐                                   │
│  │    ENTREGADO    │  │    CANCELADO    │                                   │
│  │       ✓         │  │       ⛔         │                                   │
│  │ (Servicio OK)   │  │ (No se presta)  │                                   │
│  └─────────────────┘  └─────────────────┘                                   │
│                                                                              │
│  [Entregado]                                                                 │
│    • Honorarios facturados: €________                                       │
│    • Fecha de entrega: ________                                             │
│    • Horas totales invertidas: 45h                                          │
│                                                                              │
│  [Cancelado]                                                                 │
│    • Razón: [Cliente cambió prioridades | Problema relación | ...]          │
│    • ¿Se facturó algo?: [Sí / No]  Importe: €________                       │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

### Cambios Técnicos Propuestos

#### 1. Modificar `CloseMandatoDialog.tsx`

Detectar la categoría del mandato y mostrar UI apropiada:

| Categoría | Opciones de Cierre | Campos |
|-----------|-------------------|--------|
| `operacion_ma` | Ganado / Perdido / Cancelado | Deal value, fee cobrado |
| `due_diligence` | Entregado / Cancelado | Honorarios, horas |
| `valoracion` | Entregado / Cancelado | Honorarios, horas |
| `spa_legal` | Entregado / Cancelado | Honorarios, horas |
| `asesoria` | Entregado / Cancelado | Honorarios, horas |

#### 2. Añadir Nuevos Campos a la Tabla `mandatos`

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `fee_facturado` | `numeric` | Honorarios realmente facturados |
| `horas_invertidas` | `numeric` | Total horas al cerrar (calculado de time entries) |
| `parcialmente_facturado` | `boolean` | Si se facturó algo aunque se canceló |
| `importe_parcial` | `numeric` | Lo que se facturó si se canceló |

#### 3. Añadir Razones Específicas para Servicios

En `constants.ts`:

```typescript
export const SERVICE_CANCEL_REASONS = [
  { value: 'cambio_prioridades', label: 'Cliente cambió prioridades' },
  { value: 'presupuesto', label: 'Problemas de presupuesto' },
  { value: 'competidor', label: 'Eligió otro proveedor' },
  { value: 'scope_change', label: 'Cambio de alcance excesivo' },
  { value: 'timing', label: 'Timing inadecuado' },
  { value: 'relacion', label: 'Problema en la relación' },
  { value: 'otro', label: 'Otra razón' },
] as const;
```

---

### Archivos a Modificar

| Archivo | Cambios |
|---------|---------|
| `src/components/mandatos/CloseMandatoDialog.tsx` | Bifurcar UI según categoría |
| `src/lib/constants.ts` | Añadir razones de cancelación para servicios |
| `src/types/index.ts` | Añadir nuevos tipos |
| **Migración SQL** | Añadir campos `fee_facturado`, `horas_invertidas`, etc. |

---

### Archivos a Crear

| Archivo | Descripción |
|---------|-------------|
| `src/components/mandatos/CloseServiceDialog.tsx` | Diálogo especializado para cerrar servicios |
| `src/components/mandatos/CloseDealDialog.tsx` | Diálogo especializado para cerrar operaciones M&A |

---

### Resumen Visual del Flujo

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                         FLUJO DE CIERRE ADAPTATIVO                           │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│    Usuario cambia estado a "Cerrado" o "Cancelado"                          │
│                              │                                               │
│                              ▼                                               │
│                   ┌──────────────────────┐                                   │
│                   │ ¿Qué tipo de proyecto?│                                   │
│                   └──────────┬───────────┘                                   │
│                              │                                               │
│          ┌───────────────────┼───────────────────┐                          │
│          │                   │                   │                           │
│          ▼                   ▼                   ▼                           │
│  ┌───────────────┐  ┌───────────────┐  ┌───────────────┐                    │
│  │ Operación M&A │  │ Due Diligence │  │   Servicio    │                    │
│  │   (compra/    │  │  Valoración   │  │  (Asesoría)   │                    │
│  │    venta)     │  │   SPA/Legal   │  │               │                    │
│  └───────┬───────┘  └───────┬───────┘  └───────┬───────┘                    │
│          │                   │                   │                           │
│          ▼                   ▼                   ▼                           │
│  ┌───────────────┐  ┌───────────────┐  ┌───────────────┐                    │
│  │ CloseDeal     │  │ CloseService  │  │ CloseService  │                    │
│  │ Dialog        │  │ Dialog        │  │ Dialog        │                    │
│  │               │  │               │  │               │                    │
│  │ • Ganado      │  │ • Entregado   │  │ • Entregado   │                    │
│  │ • Perdido     │  │ • Cancelado   │  │ • Cancelado   │                    │
│  │ • Cancelado   │  │               │  │               │                    │
│  │               │  │ + Honorarios  │  │ + Honorarios  │                    │
│  │ + Deal value  │  │ + Horas       │  │ + Horas       │                    │
│  │ + Fee cobrado │  │               │  │               │                    │
│  └───────────────┘  └───────────────┘  └───────────────┘                    │
│                                                                              │
└──────────────────────────────────────────────────────────────────────────────┘
```

---

### Beneficios

1. **Terminología correcta**: "Entregado" tiene más sentido que "Ganado" para un servicio
2. **Métricas precisas**: Capturamos honorarios facturados y horas invertidas
3. **Mejor análisis Win/Loss**: Podemos separar razones de pérdida en M&A vs cancelación de servicios
4. **Facturación parcial**: Contemplamos casos donde se cancela pero se cobra algo
5. **Consistencia**: El flujo de cierre se adapta al contexto del proyecto

