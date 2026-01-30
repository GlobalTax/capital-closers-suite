
## Plan: Aplicar Reglas Dinámicas en Formularios de Horas

### Estado Actual

La validación dinámica ya está integrada en 5 de 6 formularios. El problema principal es que:

1. **`validateByTaskType` usa longitud mínima hardcodeada (10)** en vez de `taskType.min_description_length`
2. **`QuickTimeEntryModal`** no usa validación dinámica
3. Los mensajes de error no muestran la longitud mínima configurada

---

### Cambios Requeridos

#### 1. Actualizar `validateByTaskType` para usar `min_description_length`

**Archivo: `src/lib/taskTypeValidation.ts`**

```typescript
// Línea 45: Cambiar hardcoded 10 → taskType.min_description_length
if (taskType.require_description) {
  const trimmed = values.description.trim();
  const minLength = taskType.min_description_length ?? 10;
  
  if (trimmed.length === 0) {
    errors.push('Descripción es obligatoria para este tipo de tarea');
  } else if (trimmed.length < minLength) {
    errors.push(`Descripción debe tener al menos ${minLength} caracteres`);
  }
}
```

**Añadir helper para obtener la longitud mínima:**

```typescript
export function getMinDescriptionLength(taskType: WorkTaskType | undefined): number {
  return taskType?.min_description_length ?? 10;
}
```

---

#### 2. Actualizar Formularios para Mostrar Longitud Mínima Dinámica

Los formularios ya validan correctamente, pero los contadores muestran "/10" hardcodeado. Necesitan:

| Archivo | Cambio |
|---------|--------|
| `TimeEntryInlineForm.tsx` | Usar `getMinDescriptionLength(selectedTaskType)` en contador |
| `TimeTrackingDialog.tsx` | Usar `getMinDescriptionLength(selectedTaskType)` en contador |
| `TimerAssignmentDialog.tsx` | Usar `getMinDescriptionLength(selectedTaskType)` en contador |
| `DayInlineAddForm.tsx` | Usar `getMinDescriptionLength(selectedTaskType)` en contador |
| `EditableTimeEntryRow.tsx` | Usar `getMinDescriptionLength(selectedTaskType)` en contador |

**Ejemplo de cambio en cada formulario:**

```typescript
// Importar helper
import { validateByTaskType, getFieldRequirement, getMinDescriptionLength } from "@/lib/taskTypeValidation";

// En el contador (ejemplo TimeEntryInlineForm línea 461-462):
// ANTES:
{description.trim().length > 0 && description.trim().length < 10 && (
  <span className="text-xs text-destructive">{description.trim().length}/10 mín</span>
)}

// DESPUÉS:
const minDescLength = getMinDescriptionLength(selectedTaskType);
{description.trim().length > 0 && description.trim().length < minDescLength && (
  <span className="text-xs text-destructive">{description.trim().length}/{minDescLength} mín</span>
)}
```

---

#### 3. Integrar Validación en `QuickTimeEntryModal`

**Archivo: `src/components/leads/QuickTimeEntryModal.tsx`**

Este formulario es especial (para leads), pero debe usar validación dinámica:

```typescript
// Añadir imports
import { useFilteredWorkTaskTypes } from "@/hooks/useWorkTaskTypes";
import { validateByTaskType, getFieldRequirement } from "@/lib/taskTypeValidation";

// Añadir estado para workTaskTypeId seleccionado
const [selectedWorkTaskTypeId, setSelectedWorkTaskTypeId] = useState('');
const { data: workTaskTypes = [] } = useFilteredWorkTaskTypes(selectedMandatoId || PROSPECCION_MANDATO_ID);
const selectedTaskType = workTaskTypes.find(t => t.id === selectedWorkTaskTypeId);

// En handleSubmit, añadir validación dinámica
if (selectedTaskType) {
  const validation = validateByTaskType(selectedTaskType, {
    mandatoId: selectedMandatoId || PROSPECCION_MANDATO_ID,
    leadId: lead.id,
    description
  });
  
  if (!validation.isValid) {
    toast.error(validation.errors.join('. '));
    return;
  }
}
```

---

### Flujo de Validación

```text
Usuario selecciona tipo de tarea
        │
        ▼
┌─────────────────────────────────────┐
│ selectedTaskType = workTaskTypes    │
│   .find(t => t.id === workTaskTypeId)│
└─────────────────────────────────────┘
        │
        ▼
┌─────────────────────────────────────┐
│ validateByTaskType(selectedTaskType,│
│   { mandatoId, leadId, description })│
└─────────────────────────────────────┘
        │
        ▼
┌─────────────────────────────────────────────────────┐
│ Si require_mandato && !mandatoId → Error            │
│ Si require_lead && !leadId → Error                  │
│ Si require_description:                             │
│   - Si vacío → Error                                │
│   - Si length < min_description_length → Error      │
└─────────────────────────────────────────────────────┘
```

---

### Archivos a Modificar

| Archivo | Cambios |
|---------|---------|
| `src/lib/taskTypeValidation.ts` | Usar `min_description_length`, añadir `getMinDescriptionLength` helper |
| `src/components/mandatos/TimeEntryInlineForm.tsx` | Usar longitud mínima dinámica en contador |
| `src/components/mandatos/TimeTrackingDialog.tsx` | Usar longitud mínima dinámica en contador |
| `src/components/timer/TimerAssignmentDialog.tsx` | Usar longitud mínima dinámica en contador |
| `src/components/mandatos/DayInlineAddForm.tsx` | Usar longitud mínima dinámica en contador |
| `src/components/mandatos/EditableTimeEntryRow.tsx` | Usar longitud mínima dinámica en contador |
| `src/components/leads/QuickTimeEntryModal.tsx` | Integrar validación dinámica completa |

---

### Criterios de Aceptación

- La longitud mínima de descripción se lee de `taskType.min_description_length`
- Los contadores de caracteres muestran la longitud mínima configurada
- `QuickTimeEntryModal` valida según el tipo de tarea seleccionado
- Los mensajes de error indican la longitud mínima correcta
- Tipos de tarea inactivos no aparecen en selectores (ya implementado via `useFilteredWorkTaskTypes`)

---

### Sección Técnica

**Por qué centralizar en `validateByTaskType`:**
- Evita duplicar lógica en 6 formularios
- Cambios futuros en reglas se aplican en un solo lugar
- Consistencia garantizada en todos los puntos de entrada

**Compatibilidad:**
- Si `min_description_length` es `null`/`undefined`, se usa fallback de 10
- Los tipos existentes funcionan con los defaults de la migración (20 caracteres)
