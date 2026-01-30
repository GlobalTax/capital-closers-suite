
## Plan: Corregir Bug "Enviar" Time Entry

### Diagnóstico Confirmado

**Problema identificado:** La función `submitTimeEntry()` llama a `updateTimeEntry()` sin `editReason`, pero `updateTimeEntry()` exige siempre un motivo de edición de mínimo 5 caracteres para CUALQUIER update.

**Código problemático (líneas 517-520 de timeTracking.ts):**
```typescript
// Edit reason is ALWAYS required for any edit (as per new policy)
if (!editReason || editReason.trim().length < 5) {
  throw new Error('Debes proporcionar un motivo de edición (mínimo 5 caracteres)');
}
```

**Funciones afectadas por este bug:**
| Función | Descripción | ¿Debería pedir motivo? |
|---------|-------------|------------------------|
| `submitTimeEntry` | Cambiar estado a "submitted" | ❌ NO |
| `approveTimeEntry` | Aprobar entrada | ❌ NO |
| `rejectTimeEntry` | Rechazar entrada | ❌ NO |
| `stopTimer` | Detener timer activo | ❌ NO |
| Edición real de campos | Cambiar duración, fechas, descripción | ✅ SÍ |

---

### Solución: Crear Función Separada para Updates de Workflow

En lugar de modificar `updateTimeEntry()` con lógica condicional compleja, voy a crear una función interna específica para operaciones de flujo de trabajo que no requieren auditoría de edición.

#### Cambios en `src/services/timeTracking.ts`:

1. **Nueva función interna** `updateTimeEntryStatus()`:
   - Actualiza SOLO campos de workflow: `status`, `approved_by`, `approved_at`, `rejection_reason`, `end_time`
   - NO requiere `edit_reason`
   - NO incrementa `edit_count`
   - NO modifica campos de auditoría (`edited_at`, `edited_by`, `edit_reason`)

2. **Refactorizar funciones existentes**:
   - `submitTimeEntry()` → usa `updateTimeEntryStatus()`
   - `approveTimeEntry()` → usa `updateTimeEntryStatus()`
   - `rejectTimeEntry()` → usa `updateTimeEntryStatus()`
   - `stopTimer()` → usa `updateTimeEntryStatus()`

3. **Mantener `updateTimeEntry()`**:
   - Solo para ediciones reales de contenido (duración, descripción, fechas, etc.)
   - Sigue exigiendo `editReason` (mínimo 5 caracteres)

---

### Código de la Solución

#### Nueva función `updateTimeEntryStatus`:

```typescript
/**
 * Internal function for workflow status updates ONLY.
 * Does NOT require edit_reason as these are workflow operations, not content edits.
 */
const updateTimeEntryStatus = async (
  id: string,
  workflowUpdates: {
    status?: string;
    approved_by?: string;
    approved_at?: string;
    rejection_reason?: string;
    end_time?: string;
  }
): Promise<TimeEntry> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('No autenticado');

  const { data, error } = await supabase
    .from('mandato_time_entries')
    .update(workflowUpdates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data as TimeEntry;
};
```

#### Funciones refactorizadas:

```typescript
export const submitTimeEntry = async (id: string): Promise<TimeEntry> => {
  return updateTimeEntryStatus(id, { status: 'submitted' });
};

export const approveTimeEntry = async (id: string, userId: string): Promise<TimeEntry> => {
  return updateTimeEntryStatus(id, {
    status: 'approved',
    approved_by: userId,
    approved_at: new Date().toISOString()
  });
};

export const rejectTimeEntry = async (id: string, reason: string): Promise<TimeEntry> => {
  return updateTimeEntryStatus(id, {
    status: 'rejected',
    rejection_reason: reason
  });
};

export const stopTimer = async (id: string): Promise<TimeEntry> => {
  return updateTimeEntryStatus(id, {
    end_time: new Date().toISOString()
  });
};
```

---

### Resultado Esperado

| Acción | Antes | Después |
|--------|-------|---------|
| Enviar entrada (draft → submitted) | ❌ Error: requiere motivo | ✅ Funciona sin motivo |
| Aprobar entrada | ❌ Error: requiere motivo | ✅ Funciona sin motivo |
| Rechazar entrada | ❌ Error: requiere motivo | ✅ Funciona sin motivo |
| Detener timer | ❌ Error: requiere motivo | ✅ Funciona sin motivo |
| Editar duración/descripción | ✅ Requiere motivo (correcto) | ✅ Requiere motivo (sin cambio) |

---

### Archivos a Modificar

| Archivo | Cambio |
|---------|--------|
| `src/services/timeTracking.ts` | Nueva función + refactorizar 4 funciones existentes |

---

### Verificación Post-Implementación

1. Crear un borrador de tiempo → **OK**
2. Click "Enviar" → **Debe cambiar a "Enviado" sin pedir motivo**
3. Aprobar entrada → **Debe funcionar sin pedir motivo**
4. Detener timer activo → **Debe funcionar sin pedir motivo**
5. Editar duración de entrada existente → **Debe pedir motivo (5+ caracteres)**
