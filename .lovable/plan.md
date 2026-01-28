

## Plan: Permitir Edición Retroactiva sin Tarea Asociada

### Resumen

Modificar el sistema de edición de horas para permitir la edición retroactiva de entradas sin tarea asociada (`task_id = null`), manteniendo trazabilidad completa. Basado en tus respuestas:

- **Sin límite** de días retroactivos
- **Edición directa** (sin re-aprobación)
- **Motivo obligatorio** en toda edición

---

### 1. Cambio Principal: Edición sin Re-aprobación

Actualmente, editar una entrada `approved` la cambia a `submitted`. Con la nueva configuración, mantendrá `approved` pero registrará la edición.

**Nuevo flujo:**

```
Usuario edita entrada (cualquier estado)
         │
         ▼
   ¿Hay cambios?
         │ Sí
         ▼
   Dialog: "Motivo de edición"
   [_________________________]
   [Cancelar]     [Confirmar]
         │
         ▼
   Guardar con:
   - status = (mantiene el original)
   - edit_reason = "..."
   - edited_at = now()
   - edited_by = user_id
   - edit_count += 1
         │
         ▼
   Feedback: "Entrada actualizada"
   (Responsable ve historial en Panel)
```

---

### 2. Actualizar Servicio updateTimeEntry

Modificar `src/services/timeTracking.ts`:

```typescript
export const updateTimeEntry = async (
  id: string,
  updates: Partial<TimeEntry>,
  editReason?: string
): Promise<TimeEntry> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('No autenticado');

  // Fetch current entry
  const { data: currentEntry, error: fetchError } = await supabase
    .from('mandato_time_entries')
    .select('status, user_id, edit_count')
    .eq('id', id)
    .single();

  if (fetchError) throw fetchError;

  // NUEVO: Edit reason siempre obligatorio
  if (!editReason || editReason.trim().length < 5) {
    throw new Error('Debes proporcionar un motivo de edición (mínimo 5 caracteres)');
  }

  // Añadir campos de trazabilidad (SIN cambiar status)
  updates = {
    ...updates,
    // NO cambiamos status - mantiene el original
    edited_at: new Date().toISOString(),
    edited_by: user.id,
    edit_reason: editReason.trim(),
    edit_count: (currentEntry.edit_count || 0) + 1,
  };

  const { data, error } = await supabase
    .from('mandato_time_entries')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data as TimeEntry;
};
```

---

### 3. Actualizar Política RLS

Modificar la política para permitir edición sin requerir cambio de status:

```sql
-- Eliminar política anterior restrictiva
DROP POLICY IF EXISTS "Users can edit own approved entries" 
ON mandato_time_entries;

-- Nueva política: usuarios pueden editar sus propias entradas
-- con trazabilidad obligatoria
CREATE POLICY "Users can edit own entries with tracking"
ON mandato_time_entries
FOR UPDATE
TO authenticated
USING (
  auth.uid() = user_id
)
WITH CHECK (
  auth.uid() = user_id
  AND edit_reason IS NOT NULL
  AND length(trim(edit_reason)) >= 5
  AND edited_at IS NOT NULL
  AND edited_by = auth.uid()
);
```

---

### 4. Actualizar UI: EditableTimeEntryRow

Modificar `src/components/mandatos/EditableTimeEntryRow.tsx`:

**Cambios:**
1. **Siempre pedir motivo** - No solo para entries approved
2. **Mensaje de confirmación directo** - Sin advertencia de "volverá a pending"
3. **Remover lógica condicional de status**

```typescript
// ANTES: Solo pedía motivo si era approved
const handleSaveClick = async () => {
  if (entry.status === 'approved') {
    setShowEditReasonDialog(true);
    return;
  }
  await doSave();
};

// DESPUÉS: Siempre pedir motivo
const handleSaveClick = async () => {
  setShowEditReasonDialog(true);
};

// Actualizar el diálogo - quitar advertencia de re-aprobación
<AlertDialogDescription>
  Para guardar los cambios, indica el motivo de la edición.
</AlertDialogDescription>
```

---

### 5. Actualizar UI: DayInlineAddForm

Para nuevas entradas retroactivas (días pasados sin tarea):

Modificar `src/components/mandatos/DayInlineAddForm.tsx`:

```typescript
// Detectar si es fecha pasada
const isPastDate = date < startOfToday();

// Si es fecha pasada:
// - task_id puede ser null ✓ (ya lo es por defecto)
// - description obligatoria (ya validado)
// - No requiere plan diario (ya implementado en canRegisterHoursForDate)

// Añadir campo de justificación para fechas pasadas
{isPastDate && (
  <div className="min-w-[200px]">
    <label className="text-xs text-muted-foreground">
      Justificación *
    </label>
    <Input
      value={justification}
      onChange={(e) => setJustification(e.target.value)}
      placeholder="Motivo del registro retroactivo..."
      className={cn(
        justification.trim().length > 0 && 
        justification.trim().length < 5 && 
        "border-destructive"
      )}
    />
  </div>
)}
```

---

### 6. Vista del Responsable: Mostrar Ediciones

El Panel Responsable ya muestra el badge "Re-enviada" para ediciones. Ajustar para mostrar ediciones sin cambio de estado:

```typescript
// En DailyTimeEntriesDetail.tsx
{entry.edit_count > 0 && (
  <Badge variant="outline" className="text-xs bg-amber-50 border-amber-200">
    ✏️ Editada ({entry.edit_count}x)
  </Badge>
)}

// Tooltip con historial
<TooltipContent>
  <p className="font-medium">Editada {entry.edit_count} vez(es)</p>
  <p className="text-xs">Última: {format(entry.edited_at, 'dd/MM HH:mm')}</p>
  <p className="text-xs italic mt-1">"{entry.edit_reason}"</p>
</TooltipContent>
```

---

### 7. Validación de Campos

| Campo | Nueva entrada retroactiva | Edición de entrada |
|-------|--------------------------|-------------------|
| `task_id` | Opcional (puede ser null) | Se mantiene |
| `description` | Obligatorio (min 10 chars) | Obligatorio (min 10 chars) |
| `edit_reason` | Se guarda como `notes` | Obligatorio (min 5 chars) |
| `mandato_id` | Obligatorio | Obligatorio |
| `work_task_type_id` | Obligatorio | Obligatorio |

---

### Resumen de Archivos

| Archivo | Cambio |
|---------|--------|
| **Migración SQL** | Actualizar política RLS para edición directa |
| `src/services/timeTracking.ts` | Quitar cambio de status, mantener trazabilidad |
| `src/components/mandatos/EditableTimeEntryRow.tsx` | Siempre pedir motivo, quitar advertencia de re-aprobación |
| `src/components/mandatos/DayInlineAddForm.tsx` | Añadir justificación para fechas pasadas |
| `src/components/mandatos/DailyTimeEntriesDetail.tsx` | Actualizar badge de edición |

---

### Sección Técnica

**Seguridad RLS:**
- La política garantiza que solo el propietario puede editar
- `edit_reason` siempre es obligatorio (5+ chars)
- `edited_at` y `edited_by` proporcionan trazabilidad

**Sin límite temporal:**
- `canRegisterHoursForDate` ya permite fechas pasadas sin restricción
- No se añade validación de días máximos

**Edición directa:**
- El status NO cambia al editar
- `approved` sigue siendo `approved`
- La trazabilidad se registra en campos auxiliares

**Trazabilidad completa:**
- `edit_count` cuenta todas las ediciones
- `edited_at` / `edited_by` muestran última edición
- `edit_reason` documenta el motivo
- El responsable ve todo en el Panel

