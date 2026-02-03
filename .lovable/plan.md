
## Plan: Depurar /mis-horas (Sin Añadir Nada)

### Diagnóstico Realizado

He analizado exhaustivamente el código y la base de datos. A continuación presento los bugs reales identificados y sus correcciones exactas.

---

### Bug 1: TimeEntryEditDialog NO envía editReason (CRÍTICO)

**Archivo**: `src/components/mandatos/TimeEntryEditDialog.tsx`

**Problema**: El componente llama a `updateTimeEntry(entry.id, {...})` sin proporcionar el tercer parámetro `editReason`. La función `updateTimeEntry` valida que `editReason` tenga mínimo 5 caracteres (línea 518-519 de timeTracking.ts), causando el error:

```
"Debes proporcionar un motivo de edición (mínimo 5 caracteres)"
```

**Causa Raíz**: Este dialog fue creado antes de implementar la trazabilidad obligatoria de ediciones.

**Corrección**: Añadir un campo de `editReason` al formulario y pasarlo como tercer parámetro a `updateTimeEntry`. Seguir el mismo patrón ya implementado en `EditableTimeEntryRow.tsx`.

---

### Bug 2: QuickTimeEntryModal genera descripciones de menos de 10 caracteres

**Archivo**: `src/components/leads/QuickTimeEntryModal.tsx`

**Problema**: Línea 167 construye la descripción así:
```typescript
description: `${ACTIVITY_TYPES.find(t => t.value === activityType)?.label || 'Actividad'}: ${description}`
```

Si el usuario NO escribe descripción, el resultado es:
- "Llamada: " = 9 caracteres
- "Videollamada: " = 14 caracteres ✓
- "Reunión: " = 9 caracteres

Esto viola el CHECK constraint de la BD:
```sql
CHECK ((length(TRIM(BOTH FROM description)) >= 10))
```

**Corrección**: Garantizar que la descripción final SIEMPRE tenga al menos 10 caracteres. Por ejemplo:
```typescript
const activityLabel = ACTIVITY_TYPES.find(t => t.value === activityType)?.label || 'Actividad';
const baseDesc = description.trim() || `con ${lead.nombre}`;
const finalDescription = `${activityLabel}: ${baseDesc}`;
```

---

### Bug 3: QuickTimeEntryModal NO envía work_type (campo NOT NULL)

**Archivo**: `src/components/leads/QuickTimeEntryModal.tsx`

**Problema**: El payload de `createTimeEntry` (líneas 160-169) NO incluye el campo `work_type`, que es NOT NULL en la BD:

```sql
column_name: work_type, is_nullable: NO
```

**Corrección**: Añadir `work_type: 'Otro'` al payload, igual que hacen los demás formularios.

---

### Bug 4: RLS Policy excesivamente restrictiva para ediciones de workflow

**Tabla**: `mandato_time_entries`  
**Policy**: `Users can edit own entries with tracking`

**Problema**: La política actual requiere `edit_reason IS NOT NULL AND length(edit_reason) >= 5` para CUALQUIER UPDATE, incluyendo operaciones de workflow (stopTimer, approveEntry) que ya usan `updateTimeEntryStatus`.

**Situación actual**: El código ya separa correctamente `updateTimeEntry` (requiere razón) de `updateTimeEntryStatus` (no requiere razón). Pero si un admin intenta usar `updateTimeEntry` para un status change, fallará.

**Verificación**: Este bug NO afecta el flujo normal porque `stopTimer`, `approveTimeEntry`, etc. usan `updateTimeEntryStatus`. Solo afectaría si alguien intenta usar la función incorrecta.

**Acción**: No tocar - el código ya está correctamente separado. Solo documentar.

---

### Archivos a Modificar

| Archivo | Cambio |
|---------|--------|
| `src/components/mandatos/TimeEntryEditDialog.tsx` | Añadir campo editReason y pasarlo a updateTimeEntry |
| `src/components/leads/QuickTimeEntryModal.tsx` | Asegurar descripción ≥10 chars + añadir work_type |

---

### Detalles Técnicos de Correcciones

#### TimeEntryEditDialog.tsx

```typescript
// AÑADIR estado para editReason
const [editReason, setEditReason] = useState('');

// AÑADIR validación antes del submit
if (editReason.trim().length < 5) {
  toast.error("Debes proporcionar un motivo de edición (mínimo 5 caracteres)");
  return;
}

// MODIFICAR llamada a updateTimeEntry
await updateTimeEntry(entry.id, {
  start_time: startDateTime.toISOString(),
  end_time: endDateTime.toISOString(),
  duration_minutes: durationMinutes,
  description: trimmedDescription || 'Trabajo registrado manualmente',
  value_type: valueType,
  work_task_type_id: workTaskTypeId || undefined,
  is_billable: isBillable,
  notes: notes.trim() || undefined,
}, editReason.trim()); // <-- AÑADIR tercer parámetro

// AÑADIR campo UI para editReason (similar a EditableTimeEntryRow)
```

#### QuickTimeEntryModal.tsx

```typescript
// MODIFICAR construcción de descripción (línea ~167)
const activityLabel = ACTIVITY_TYPES.find(t => t.value === activityType)?.label || 'Actividad';
const userDescription = description.trim() || `con ${lead.nombre}`;
const finalDescription = `${activityLabel}: ${userDescription}`.substring(0, 500);

// MODIFICAR payload de createTimeEntry
await createTimeEntry({
  user_id: user.id,
  mandato_id: mandatoId,
  mandate_lead_id: mandateLeadId,
  work_task_type_id: selectedWorkTaskTypeId || undefined,
  start_time: new Date().toISOString(),
  duration_minutes: duration,
  description: finalDescription,
  work_type: 'Otro', // <-- AÑADIR campo obligatorio
  status: 'approved',
} as any);
```

---

### Casos de Prueba Post-Corrección

| Caso | Resultado Esperado |
|------|-------------------|
| Registrar horas desde TimeEntryInlineForm | Funciona sin errores |
| Registrar horas desde QuickTimeEntryModal sin descripción | Funciona (descripción = "Llamada: con NombreLead") |
| Editar entrada desde TimeEntryEditDialog | Muestra campo de motivo, guarda correctamente |
| Editar entrada desde EditableTimeEntryRow | Funciona (ya implementado correctamente) |
| Timer global → asignar tiempo | Funciona sin errores |
| Añadir entrada para fecha pasada (DayInlineAddForm) | Funciona con justificación |

---

### Lo que NO se toca

- ❌ No cambiar UX
- ❌ No añadir features
- ❌ No modificar flujos
- ❌ No tocar componentes que ya funcionan
- ❌ No modificar RLS policies (están correctas)
- ❌ No cambiar schema de BD
