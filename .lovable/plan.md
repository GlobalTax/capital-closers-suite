

## Plan: Completar Validaciones UI Plan Diario

### Cambios Necesarios

#### 1. Validación de 8 horas mínimas

**Archivo: `src/hooks/useDailyPlan.ts`**

Modificar la función `submitPlan` para validar mínimo 480 minutos (8 horas):

```typescript
const submitPlan = async () => {
  if (!plan) return;
  
  if (plan.items.length === 0) {
    toast.error('Debes añadir al menos una tarea');
    return;
  }
  
  // NUEVO: Validar mínimo 8 horas
  const MIN_HOURS = 8;
  if (totalHours < MIN_HOURS) {
    toast.error(`El plan debe tener al menos ${MIN_HOURS} horas. Actualmente: ${totalHours.toFixed(1)}h`);
    return;
  }
  
  // ... resto del código
};
```

**Archivo: `src/components/plans/DailyPlanForm.tsx`**

Añadir indicador visual cuando faltan horas:

```typescript
const MIN_HOURS = 8;
const hoursRemaining = MIN_HOURS - parseFloat(totalHours);
const canSubmit = plan.items.length > 0 && hoursRemaining <= 0;

// En el UI, mostrar mensaje de advertencia
{hoursRemaining > 0 && (
  <p className="text-sm text-amber-600">
    Faltan {hoursRemaining.toFixed(1)}h para el mínimo de {MIN_HOURS}h
  </p>
)}
```

---

#### 2. Permitir edición después de enviar

**Archivo: `src/hooks/useDailyPlan.ts`**

Cambiar lógica de `canEdit`:

```typescript
// ANTES:
canEdit: plan?.status === 'draft',

// DESPUÉS: Permitir editar en draft, submitted y approved
canEdit: plan?.status !== 'rejected',
```

---

#### 3. Campo "modified_after_submit" en base de datos

**Migración SQL:**

```sql
ALTER TABLE public.daily_plans 
ADD COLUMN IF NOT EXISTS modified_after_submit BOOLEAN DEFAULT FALSE;
```

---

#### 4. Lógica para marcar como modificado

**Archivo: `src/services/dailyPlans.service.ts`**

Modificar `addPlanItem`, `updatePlanItem`, y `deletePlanItem` para detectar si el plan ya fue enviado y marcarlo como modificado:

```typescript
// Función auxiliar
async function markPlanAsModified(planId: string): Promise<void> {
  const { data: plan } = await supabase
    .from('daily_plans')
    .select('status')
    .eq('id', planId)
    .single();
  
  if (plan && plan.status !== 'draft') {
    await supabase
      .from('daily_plans')
      .update({ modified_after_submit: true, updated_at: new Date().toISOString() })
      .eq('id', planId);
  }
}
```

---

#### 5. Mostrar badge "Modificado" en UI

**Archivo: `src/components/plans/DailyPlanForm.tsx`**

Añadir indicador visual cuando el plan fue modificado después de enviar:

```typescript
{plan.modified_after_submit && plan.status !== 'draft' && (
  <Badge variant="outline" className="bg-orange-500/10 text-orange-600 ml-2">
    Modificado
  </Badge>
)}
```

---

### Resumen de Archivos a Modificar

| Archivo | Cambio |
|---------|--------|
| `src/hooks/useDailyPlan.ts` | Validación 8h + cambiar `canEdit` |
| `src/components/plans/DailyPlanForm.tsx` | UI de advertencia horas + badge "Modificado" |
| `src/services/dailyPlans.service.ts` | Lógica `markPlanAsModified` |
| `src/types/dailyPlans.ts` | Añadir `modified_after_submit` al tipo |
| **Nueva migración SQL** | Añadir columna `modified_after_submit` |

---

### Flujo Resultante

```text
Usuario crea plan
       │
       ▼
  Añade tareas
       │
       ▼
  ¿Total >= 8h? ──No──▶ Mensaje: "Faltan Xh"
       │                    (botón deshabilitado)
      Sí
       │
       ▼
  [Enviar Plan] → status = 'submitted'
       │
       ▼
  Usuario edita (opcional)
       │
       ▼
  modified_after_submit = true
       │
       ▼
  Badge "Modificado" visible
```

---

### Nota sobre "Guardar Borrador"

El sistema actual ya guarda automáticamente cada cambio (add/update/delete de tareas). Si se desea un botón explícito "Guardar Borrador", sería redundante pero se puede añadir como confirmación visual. El guardado ya ocurre en tiempo real.

