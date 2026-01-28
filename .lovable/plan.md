

## Plan: Reapertura Automática de Entradas Aprobadas

### Resumen

Permitir que los usuarios editen entradas de tiempo en estado `approved`, con las siguientes condiciones:
1. El estado cambia automáticamente a `submitted` (requiere re-aprobación)
2. Se requiere un `edit_reason` obligatorio
3. Se registra trazabilidad completa (`edited_at`, `edited_by`, `edit_count`)

---

### 1. Nuevas Columnas en Base de Datos

Añadir a `mandato_time_entries`:

| Columna | Tipo | Descripción |
|---------|------|-------------|
| `edited_at` | `timestamptz` | Fecha/hora de la última edición |
| `edited_by` | `uuid` | Usuario que realizó la edición |
| `edit_reason` | `text` | Motivo de la edición (obligatorio para entradas aprobadas) |
| `edit_count` | `integer` | Contador de ediciones (default 0) |

```sql
ALTER TABLE mandato_time_entries
ADD COLUMN IF NOT EXISTS edited_at timestamptz,
ADD COLUMN IF NOT EXISTS edited_by uuid REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS edit_reason text,
ADD COLUMN IF NOT EXISTS edit_count integer DEFAULT 0;
```

---

### 2. Nueva Política RLS

Crear política que permita editar entradas aprobadas:

```sql
-- Usuarios pueden editar sus entradas aprobadas (se cambian a submitted)
CREATE POLICY "Users can edit own approved entries"
ON mandato_time_entries
FOR UPDATE
TO authenticated
USING (
  auth.uid() = user_id 
  AND status = 'approved'
)
WITH CHECK (
  auth.uid() = user_id
  AND status = 'submitted'  -- Debe cambiar a submitted
  AND edit_reason IS NOT NULL  -- Razón obligatoria
  AND length(trim(edit_reason)) >= 5  -- Mínimo 5 caracteres
  AND edited_at IS NOT NULL
  AND edited_by = auth.uid()
);
```

Esta política:
- Permite UPDATE solo si el usuario es el propietario
- Requiere que el nuevo estado sea `submitted`
- Requiere `edit_reason` con mínimo 5 caracteres
- Requiere `edited_at` y `edited_by`

---

### 3. Actualizar Servicio updateTimeEntry

Modificar `src/services/timeTracking.ts`:

```typescript
export const updateTimeEntry = async (
  id: string,
  updates: Partial<TimeEntry>,
  editReason?: string  // Nuevo parámetro opcional
): Promise<TimeEntry> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('No autenticado');

  // Primero, verificar el estado actual de la entrada
  const { data: currentEntry, error: fetchError } = await supabase
    .from('mandato_time_entries')
    .select('status, user_id, edit_count')
    .eq('id', id)
    .single();

  if (fetchError) throw fetchError;

  // Si es entrada aprobada, validar y añadir campos de edición
  if (currentEntry.status === 'approved') {
    if (!editReason || editReason.trim().length < 5) {
      throw new Error('Debes proporcionar un motivo de edición (mínimo 5 caracteres)');
    }

    // Añadir campos de trazabilidad
    updates = {
      ...updates,
      status: 'submitted',  // Cambiar a submitted
      edited_at: new Date().toISOString(),
      edited_by: user.id,
      edit_reason: editReason.trim(),
      edit_count: (currentEntry.edit_count || 0) + 1,
    };
  }

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

### 4. Actualizar UI: EditableTimeEntryRow

Modificar `src/components/mandatos/EditableTimeEntryRow.tsx`:

```typescript
// Nuevo estado para el motivo de edición
const [editReason, setEditReason] = useState('');
const [showEditReasonDialog, setShowEditReasonDialog] = useState(false);

// En handleSave:
const handleSave = async () => {
  try {
    // Si es aprobada, pedir motivo primero
    if (entry.status === 'approved') {
      setShowEditReasonDialog(true);
      return;
    }
    
    await doSave();
  } catch (error) {
    // ...
  }
};

const doSave = async (reason?: string) => {
  // ... validaciones existentes ...
  
  await updateTimeEntry(entry.id, {
    // ... campos actuales ...
  }, reason);  // Pasar reason
  
  // ...
};

// Nuevo diálogo para motivo de edición
<AlertDialog open={showEditReasonDialog} onOpenChange={setShowEditReasonDialog}>
  <AlertDialogContent>
    <AlertDialogHeader>
      <AlertDialogTitle>Motivo de la edición</AlertDialogTitle>
      <AlertDialogDescription>
        Esta entrada ya fue aprobada. Para editarla, debes indicar el motivo.
        La entrada volverá a estado "pendiente de aprobación".
      </AlertDialogDescription>
    </AlertDialogHeader>
    <Input
      value={editReason}
      onChange={(e) => setEditReason(e.target.value)}
      placeholder="Motivo de la corrección..."
    />
    <AlertDialogFooter>
      <AlertDialogCancel>Cancelar</AlertDialogCancel>
      <AlertDialogAction 
        onClick={() => doSave(editReason)}
        disabled={editReason.trim().length < 5}
      >
        Confirmar
      </AlertDialogAction>
    </AlertDialogFooter>
  </AlertDialogContent>
</AlertDialog>
```

---

### 5. Indicadores Visuales

Mostrar historial de ediciones en la UI:

```typescript
// En EditableTimeEntryRow - vista readonly
{entry.edit_count > 0 && (
  <Tooltip>
    <TooltipTrigger>
      <Badge variant="outline" className="text-[10px] bg-amber-50">
        <Edit className="h-3 w-3 mr-1" />
        {entry.edit_count}x
      </Badge>
    </TooltipTrigger>
    <TooltipContent>
      <p>Editada {entry.edit_count} {entry.edit_count === 1 ? 'vez' : 'veces'}</p>
      {entry.edited_at && (
        <p className="text-xs text-muted-foreground">
          Última: {format(new Date(entry.edited_at), 'dd/MM HH:mm')}
        </p>
      )}
      {entry.edit_reason && (
        <p className="text-xs italic mt-1">"{entry.edit_reason}"</p>
      )}
    </TooltipContent>
  </Tooltip>
)}
```

---

### 6. Vista del Responsable

En el Panel Responsable (`DailyTimeEntriesDetail.tsx`), mostrar entradas editadas con indicador especial:

```typescript
// Columna adicional o badge
{entry.status === 'submitted' && entry.edit_count > 0 && (
  <Badge variant="warning" className="text-xs">
    ⚠️ Re-enviada ({entry.edit_count}x)
  </Badge>
)}

// Tooltip con el motivo de edición
{entry.edit_reason && (
  <Tooltip>
    <TooltipTrigger>
      <Info className="h-4 w-4 text-muted-foreground" />
    </TooltipTrigger>
    <TooltipContent>
      <p className="font-medium">Motivo de edición:</p>
      <p className="text-sm">{entry.edit_reason}</p>
    </TooltipContent>
  </Tooltip>
)}
```

---

### Flujo de Usuario

```
Usuario abre entrada aprobada
         │
         ▼
   Hace clic en "Editar"
         │
         ▼
   Modifica campos (mandato, tipo, descripción, duración)
         │
         ▼
   Clic en "Guardar"
         │
         ▼
   ┌──────────────────────────────┐
   │ Dialog: "Motivo de edición" │
   │ [________________________]   │
   │ [Cancelar]    [Confirmar]    │
   └──────────────────────────────┘
         │
         ▼
   Se guarda con:
   - status = 'submitted'
   - edit_reason = "..."
   - edited_at = now()
   - edited_by = user_id
   - edit_count += 1
         │
         ▼
   Responsable ve entrada con badge "Re-enviada"
   Puede aprobar o rechazar
```

---

### Actualizar Tipos TypeScript

En `src/types/index.ts`:

```typescript
export interface TimeEntry {
  // ... campos existentes ...
  
  // Campos de edición
  edited_at?: string;
  edited_by?: string;
  edit_reason?: string;
  edit_count?: number;
}
```

---

### Resumen de Archivos

| Archivo | Cambio |
|---------|--------|
| **Nueva migración SQL** | Añadir columnas + nueva política RLS |
| `src/services/timeTracking.ts` | Modificar `updateTimeEntry` para manejar entradas aprobadas |
| `src/types/index.ts` | Añadir nuevos campos a `TimeEntry` |
| `src/components/mandatos/EditableTimeEntryRow.tsx` | Añadir diálogo de motivo + indicador de ediciones |
| `src/components/mandatos/DailyTimeEntriesDetail.tsx` | Mostrar indicadores de re-envío |

---

### Sección Técnica

**Seguridad RLS:**
- La política `WITH CHECK` garantiza que:
  - Solo el propietario puede editar
  - El estado DEBE cambiar a `submitted`
  - El `edit_reason` NO puede ser NULL ni vacío
  - Se registra quién y cuándo editó

**Trazabilidad:**
- `edit_count` permite saber cuántas veces se ha modificado
- `edited_at` + `edited_by` permiten auditar la última edición
- `edit_reason` proporciona contexto para el responsable

**Flujo de aprobación:**
- Una entrada editada vuelve a `submitted`
- El responsable la verá en su panel con indicador especial
- Puede aprobar (vuelve a `approved`) o rechazar con `rejection_reason`

**Compatibilidad:**
- Las políticas existentes para `draft` siguen funcionando igual
- Los admins siguen teniendo acceso completo
- No hay cambios breaking en la API existente

