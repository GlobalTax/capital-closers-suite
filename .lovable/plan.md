

## Plan: Completar UI Admin de Tipos de Tarea

### Estado Actual

La página `ConfiguracionTareasTiempo.tsx` ya tiene:
- Nombre y descripción
- Reglas de validación (require_mandato, require_lead, require_description, min_description_length)
- Default billable

**Campos que faltan en la UI:**

| Campo | Tipo en BD | Valores | Estado UI |
|-------|------------|---------|-----------|
| `context` | text | 'all', 'mandate', 'prospection', 'internal' | Falta |
| `default_value_type` | enum | 'core_ma', 'soporte', 'bajo_valor' | Falta |

---

### Cambios Requeridos

#### 1. Actualizar Tipos TypeScript

**Archivo: `src/services/workTaskTypes.service.ts`**

Añadir `default_value_type` al tipo y hacer `context` editable:

```typescript
export type TimeEntryValueType = 'core_ma' | 'soporte' | 'bajo_valor';

export interface WorkTaskType {
  // ... campos existentes
  default_value_type: TimeEntryValueType;
}

export interface UpdateWorkTaskTypeData {
  // ... campos existentes
  context?: WorkTaskTypeContext;
  default_value_type?: TimeEntryValueType;
}

export interface CreateWorkTaskTypeData {
  // ... campos existentes
  context?: WorkTaskTypeContext;
  default_value_type?: TimeEntryValueType;
}
```

---

#### 2. Actualizar FormData e UI

**Archivo: `src/pages/ConfiguracionTareasTiempo.tsx`**

Añadir al FormData:
```typescript
interface FormData {
  name: string;
  description: string;
  context: WorkTaskTypeContext;           // NUEVO
  default_value_type: TimeEntryValueType; // NUEVO
  require_mandato: boolean;
  require_lead: boolean;
  require_description: boolean;
  min_description_length: number;
  default_billable: boolean;
}
```

Añadir controles Select en el diálogo:

```text
--- Categorización ---
Contexto:          [v Todos los mandatos         ]
                     - Mandatos
                     - Prospección
                     - Interno

Tipo de valor:     [v Core M&A                   ]
                     - Soporte
                     - Bajo Valor
```

---

#### 3. Mejoras Visuales en Tabla

Añadir columna "Contexto" con badge de color:

| Contexto | Color |
|----------|-------|
| all | Gris (default) |
| mandate | Azul |
| prospection | Naranja |
| internal | Morado |

---

### Flujo de UI Propuesto

**Diálogo Crear/Editar:**

```text
+----------------------------------------------------+
| Nuevo/Editar Tipo de Tarea                    [X]  |
+----------------------------------------------------+
|                                                    |
| Nombre *                                           |
| [_________________________________________________]|
|                                                    |
| Descripcion (opcional)                             |
| [_________________________________________________]|
|                                                    |
| ---------------- Categorización ----------------   |
|                                                    |
| Contexto               Tipo de Valor               |
| [v Todos los mandatos] [v Core M&A            ]    |
|                                                    |
| ------------- Reglas de Validacion -------------   |
|                                                    |
| [x] Requiere seleccionar Mandato                   |
| [ ] Requiere seleccionar Lead                      |
| [x] Requiere descripcion                           |
|     Longitud minima: [20] caracteres               |
|                                                    |
| -------------- Valores por Defecto -------------   |
|                                                    |
| [x] Facturable por defecto                         |
|                                                    |
|                      [Cancelar]  [Guardar Cambios] |
+----------------------------------------------------+
```

---

### Archivos a Modificar

| Archivo | Cambios |
|---------|---------|
| `src/services/workTaskTypes.service.ts` | Añadir `TimeEntryValueType`, actualizar interfaces con `context` y `default_value_type` |
| `src/pages/ConfiguracionTareasTiempo.tsx` | Añadir campos context y default_value_type al form, selectores, columna contexto en tabla |

---

### Criterios de Aceptacion

- Admin puede configurar contexto (all/mandate/prospection/internal)
- Admin puede configurar tipo de valor (core_ma/soporte/bajo_valor)
- Las reglas de validacion se guardan correctamente
- Tipos inactivos no aparecen en formularios de tiempo (ya funciona via `useActiveWorkTaskTypes`)
- La tabla muestra badges visuales de contexto

