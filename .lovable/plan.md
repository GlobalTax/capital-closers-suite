
## Plan: Validaciones Dinámicas por Tipo de Tarea

### Resumen

Implementar reglas de validación dinámicas en los formularios de registro de tiempo, basadas en las propiedades del tipo de tarea seleccionado:
- `require_mandato` = true → Mandato obligatorio
- `require_lead` = true → Lead obligatorio  
- `require_description` = true → Descripción obligatoria

---

### 1. Nuevas Columnas en Base de Datos

Añadir a `work_task_types`:

| Columna | Tipo | Default | Descripción |
|---------|------|---------|-------------|
| `require_mandato` | `boolean` | `true` | Si el mandato es obligatorio |
| `require_lead` | `boolean` | `false` | Si el lead es obligatorio |
| `require_description` | `boolean` | `false` | Si la descripción es obligatoria |

```sql
ALTER TABLE work_task_types
ADD COLUMN IF NOT EXISTS require_mandato boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS require_lead boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS require_description boolean DEFAULT false;
```

**Configuración inicial sugerida:**

| Tipo de Tarea | require_mandato | require_lead | require_description |
|--------------|-----------------|--------------|---------------------|
| Reunión / Puesta en Contacto | true | false | true |
| IM | true | false | false |
| Teaser | true | false | false |
| Datapack | true | false | false |
| Leads | true | true | false |
| Llamada inicial | true | true | true |
| Email de seguimiento | true | true | false |
| Reunión de captación | true | true | true |
| Propuesta comercial | true | true | true |
| (resto) | true | false | false |

---

### 2. Actualizar Tipos e Interfaces

Modificar `src/services/workTaskTypes.service.ts`:

```typescript
export interface WorkTaskType {
  id: string;
  name: string;
  description: string | null;
  is_active: boolean;
  sort_order: number;
  context: WorkTaskTypeContext;
  created_at: string;
  updated_at: string;
  // Nuevos campos de validación
  require_mandato: boolean;
  require_lead: boolean;
  require_description: boolean;
}
```

---

### 3. Función Helper para Validación

Crear utilidad reutilizable en `src/lib/taskTypeValidation.ts`:

```typescript
import type { WorkTaskType } from '@/services/workTaskTypes.service';

export interface TaskTypeValidationResult {
  isValid: boolean;
  errors: string[];
}

export function validateByTaskType(
  taskType: WorkTaskType | undefined,
  values: {
    mandatoId: string | null;
    leadId: string | null;
    description: string;
  }
): TaskTypeValidationResult {
  const errors: string[] = [];
  
  if (!taskType) {
    return { isValid: true, errors: [] }; // No task type = no dynamic rules
  }
  
  if (taskType.require_mandato && !values.mandatoId) {
    errors.push('Mandato es obligatorio para este tipo de tarea');
  }
  
  if (taskType.require_lead && !values.leadId) {
    errors.push('Lead es obligatorio para este tipo de tarea');
  }
  
  if (taskType.require_description) {
    const trimmed = values.description.trim();
    if (trimmed.length === 0) {
      errors.push('Descripción es obligatoria para este tipo de tarea');
    } else if (trimmed.length < 10) {
      errors.push('Descripción debe tener al menos 10 caracteres');
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}
```

---

### 4. Actualizar TimeEntryInlineForm

Modificar `src/components/mandatos/TimeEntryInlineForm.tsx`:

**Cambios:**
1. Buscar el tipo de tarea seleccionado en la lista
2. Usar `validateByTaskType` antes de guardar
3. Marcar visualmente campos obligatorios
4. Mostrar errores específicos

```typescript
// Obtener el task type completo
const selectedTaskType = workTaskTypes.find(t => t.id === workTaskTypeId);

// En handleSubmit:
if (selectedTaskType) {
  const validation = validateByTaskType(selectedTaskType, {
    mandatoId,
    leadId,
    description
  });
  
  if (!validation.isValid) {
    toast.error(validation.errors.join('. '));
    return;
  }
}

// UI: Indicar campos dinámicamente obligatorios
<Label className="text-xs text-muted-foreground">
  Descripción {selectedTaskType?.require_description && '*'}
</Label>

<Label className="text-xs text-muted-foreground">
  Lead {selectedTaskType?.require_lead && '(obligatorio)'}
</Label>
```

---

### 5. Actualizar TimeTrackingDialog

Modificar `src/components/mandatos/TimeTrackingDialog.tsx`:

Mismo patrón que TimeEntryInlineForm:

```typescript
const { data: workTaskTypes = [] } = useActiveWorkTaskTypes();
const selectedTaskType = workTaskTypes.find(t => t.id === workTaskTypeId);

// En handleSubmit, después de validaciones básicas:
if (selectedTaskType) {
  const validation = validateByTaskType(selectedTaskType, {
    mandatoId: effectiveMandatoId,
    leadId: selectedLeadId,
    description
  });
  
  if (!validation.isValid) {
    toast({
      title: "Campos requeridos",
      description: validation.errors.join('. '),
      variant: "destructive"
    });
    return;
  }
}
```

---

### 6. Actualizar TimerAssignmentDialog

Modificar `src/components/timer/TimerAssignmentDialog.tsx`:

```typescript
const selectedTaskType = workTaskTypes.find(t => t.id === watch('workTaskTypeId'));

// En onSubmit:
if (selectedTaskType) {
  const validation = validateByTaskType(selectedTaskType, {
    mandatoId: data.mandatoId,
    leadId: data.leadId,
    description: data.description || ''
  });
  
  if (!validation.isValid) {
    toast.error(validation.errors.join('. '));
    return;
  }
}

// UI dinámica
{showLeadSelector && (
  <div className="space-y-1.5">
    <Label className="text-xs font-medium text-muted-foreground">
      Lead {selectedTaskType?.require_lead ? '*' : '(opcional)'}
    </Label>
    <LeadByMandatoSelect ... />
  </div>
)}
```

---

### 7. Actualizar EditableTimeEntryRow

Modificar `src/components/mandatos/EditableTimeEntryRow.tsx`:

```typescript
const selectedTaskType = workTaskTypes.find(t => t.id === workTaskTypeId);

// En doSave:
if (selectedTaskType) {
  const validation = validateByTaskType(selectedTaskType, {
    mandatoId,
    leadId: entry.mandate_lead_id, // Si aplica
    description
  });
  
  if (!validation.isValid) {
    toast.error(validation.errors.join('. '));
    return;
  }
}
```

---

### 8. Actualizar DayInlineAddForm

Modificar `src/components/mandatos/DayInlineAddForm.tsx`:

```typescript
const selectedTaskType = workTaskTypes.find(t => t.id === workTaskTypeId);

// En handleSubmit:
if (selectedTaskType) {
  const validation = validateByTaskType(selectedTaskType, {
    mandatoId,
    leadId: null, // Este form no tiene lead selector
    description
  });
  
  if (!validation.isValid) {
    toast.error(validation.errors.join('. '));
    return;
  }
}
```

---

### 9. Indicadores Visuales

Para todos los formularios, mostrar visualmente qué campos son obligatorios:

```text
┌─────────────────────────────────────────────────────────────┐
│ Tipo de tarea: [Llamada inicial ▼]                          │
│                                                             │
│ Mandato *     Lead *                 Descripción *          │
│ [SELK ▼]      [Juan García ▼]        [Llamada con clien...]  │
│                                                             │
│ ⚠️ Los campos marcados con * son obligatorios para este tipo│
└─────────────────────────────────────────────────────────────┘
```

---

### Flujo de Validación

```text
Usuario selecciona tipo de tarea
         │
         ▼
   Sistema carga require_mandato, require_lead, require_description
         │
         ▼
   UI muestra indicadores dinámicos (* en campos obligatorios)
         │
         ▼
   Usuario llena formulario y hace clic en Guardar
         │
         ▼
   validateByTaskType(selectedTaskType, {mandato, lead, description})
         │
         ├─ isValid = true ──────────────────────> Guardar entrada
         │
         └─ isValid = false ─> Mostrar errores específicos
                               "Lead es obligatorio para este tipo"
                               "Descripción es obligatoria para este tipo"
```

---

### Resumen de Archivos

| Archivo | Cambio |
|---------|--------|
| **Nueva migración SQL** | Añadir columnas require_* + valores iniciales |
| **Nuevo:** `src/lib/taskTypeValidation.ts` | Función helper validateByTaskType |
| `src/services/workTaskTypes.service.ts` | Actualizar interface WorkTaskType |
| `src/components/mandatos/TimeEntryInlineForm.tsx` | Integrar validación dinámica |
| `src/components/mandatos/TimeTrackingDialog.tsx` | Integrar validación dinámica |
| `src/components/timer/TimerAssignmentDialog.tsx` | Integrar validación dinámica |
| `src/components/mandatos/EditableTimeEntryRow.tsx` | Integrar validación dinámica |
| `src/components/mandatos/DayInlineAddForm.tsx` | Integrar validación dinámica |

---

### Sección Técnica

**Estrategia de validación:**
- Validación centralizada en `validateByTaskType()` para consistencia
- Los errores se muestran con `toast.error()` indicando exactamente qué falta
- Los campos muestran `*` dinámicamente según el tipo de tarea seleccionado

**Compatibilidad:**
- Valores por defecto (`require_mandato: true`, resto `false`) no rompen comportamiento existente
- La validación solo aplica si hay un tipo de tarea seleccionado
- Formularios existentes siguen funcionando igual si no cambian los valores

**Configuración futura:**
- Los valores `require_*` pueden configurarse desde la UI de admin (`/configuracion/tareas-tiempo`)
- Permite ajustar reglas sin código
