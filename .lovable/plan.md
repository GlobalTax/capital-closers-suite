

## Plan: Conversión Automática de Ítems a Tareas Reales

### Resumen

Implementar la funcionalidad para que al enviar un plan diario, los ítems del plan se conviertan automáticamente en tareas reales en la tabla `tareas`. Incluye un toggle para activar/desactivar esta conversión y evita duplicados si el ítem ya tiene una tarea vinculada.

---

### Cambios en Base de Datos

**Migración SQL - Añadir columna `linked_task_id` a `daily_plan_items`:**

```sql
-- Añadir columna para vincular ítem del plan con tarea generada
ALTER TABLE public.daily_plan_items 
ADD COLUMN IF NOT EXISTS linked_task_id UUID REFERENCES public.tareas(id) ON DELETE SET NULL;

-- Índice para búsquedas rápidas
CREATE INDEX IF NOT EXISTS idx_daily_plan_items_linked_task 
ON public.daily_plan_items(linked_task_id);
```

---

### Lógica de Conversión

**Archivo: `src/services/dailyPlans.service.ts`**

Nueva función `convertPlanItemsToTasks`:

```typescript
export async function convertPlanItemsToTasks(
  planId: string,
  userId: string,
  plannedForDate: string
): Promise<{ created: number; skipped: number }> {
  // 1. Obtener ítems sin tarea vinculada
  const { data: items } = await supabase
    .from('daily_plan_items')
    .select('*')
    .eq('plan_id', planId)
    .is('linked_task_id', null);
  
  if (!items || items.length === 0) {
    return { created: 0, skipped: 0 };
  }
  
  // 2. Mapear prioridad del plan a prioridad de tarea
  const priorityMap = {
    'urgente': 'urgente',
    'alta': 'alta', 
    'media': 'media',
    'baja': 'baja'
  };
  
  let created = 0;
  
  // 3. Crear tareas para cada ítem
  for (const item of items) {
    const { data: tarea, error } = await supabase
      .from('tareas')
      .insert({
        titulo: item.title,
        descripcion: item.description,
        estado: 'pendiente',
        prioridad: priorityMap[item.priority] || 'media',
        asignado_a: userId,
        mandato_id: item.mandato_id,
        fecha_vencimiento: plannedForDate,
        tipo: 'individual',
        creado_por: userId,
        es_visible_equipo: false
      })
      .select()
      .single();
    
    if (!error && tarea) {
      // 4. Vincular tarea al ítem
      await supabase
        .from('daily_plan_items')
        .update({ linked_task_id: tarea.id })
        .eq('id', item.id);
      
      created++;
    }
  }
  
  return { created, skipped: items.length - created };
}
```

---

### Modificación de `submitPlan`

**Archivo: `src/services/dailyPlans.service.ts`**

Actualizar la función para aceptar parámetro de conversión:

```typescript
export async function submitPlan(
  planId: string, 
  createTasks: boolean = false
): Promise<DailyPlan> {
  // Obtener plan para datos adicionales
  const { data: plan } = await supabase
    .from('daily_plans')
    .select('user_id, planned_for_date')
    .eq('id', planId)
    .single();
  
  // Actualizar estado
  const { data, error } = await supabase
    .from('daily_plans')
    .update({
      status: 'submitted',
      submitted_at: new Date().toISOString()
    })
    .eq('id', planId)
    .select()
    .single();
  
  if (error) throw error;
  
  // Crear tareas si está habilitado
  if (createTasks && plan) {
    await convertPlanItemsToTasks(planId, plan.user_id, plan.planned_for_date);
  }
  
  return data as DailyPlan;
}
```

---

### Hook `useDailyPlan`

**Archivo: `src/hooks/useDailyPlan.ts`**

Añadir estado y lógica para el toggle:

```typescript
const [autoCreateTasks, setAutoCreateTasks] = useState(true);

const submitPlan = async () => {
  // ... validaciones existentes ...
  
  try {
    setSaving(true);
    const updated = await dailyPlansService.submitPlan(plan.id, autoCreateTasks);
    setPlan(prev => prev ? { ...prev, ...updated } : null);
    
    if (autoCreateTasks) {
      toast.success('Plan enviado y tareas creadas ✓');
    } else {
      toast.success('Plan enviado ✓');
    }
  } catch (error) {
    // ...
  }
};

return {
  // ... existente ...
  autoCreateTasks,
  setAutoCreateTasks,
};
```

---

### UI - Toggle en `DailyPlanForm`

**Archivo: `src/components/plans/DailyPlanForm.tsx`**

Añadir toggle antes del botón de envío:

```typescript
// Props adicionales
interface DailyPlanFormProps {
  // ... existentes ...
  autoCreateTasks: boolean;
  onAutoCreateTasksChange: (value: boolean) => void;
}

// En el JSX, antes del botón Enviar
<div className="flex items-center justify-between pt-4 border-t">
  <div className="flex items-center gap-3">
    <Switch
      id="auto-create-tasks"
      checked={autoCreateTasks}
      onCheckedChange={onAutoCreateTasksChange}
    />
    <Label htmlFor="auto-create-tasks" className="text-sm">
      Crear tareas automáticamente
    </Label>
  </div>
  
  <Button onClick={onSubmit} disabled={...}>
    <Send className="h-4 w-4 mr-2" />
    {plan.status === 'draft' ? 'Enviar Plan' : 'Re-enviar Plan'}
  </Button>
</div>
```

---

### Admin: Convertir Tareas Asignadas

**Archivo: `src/pages/admin/DailyPlansAdmin.tsx`**

Añadir botón en el drawer para convertir ítems asignados por admin:

```typescript
// En el drawer de detalle, después de añadir tarea admin
<Button 
  variant="outline" 
  size="sm"
  onClick={() => handleConvertAdminTasks(selectedPlan.id)}
>
  Convertir a tareas reales
</Button>

// Función
const handleConvertAdminTasks = async (planId: string) => {
  const plan = plans.find(p => p.id === planId);
  if (!plan) return;
  
  const result = await convertPlanItemsToTasks(
    planId, 
    plan.user_id, 
    plan.planned_for_date
  );
  
  toast.success(`${result.created} tareas creadas`);
  loadData();
};
```

---

### Tipos Actualizados

**Archivo: `src/types/dailyPlans.ts`**

Añadir campo al tipo `DailyPlanItem`:

```typescript
export interface DailyPlanItem {
  // ... existentes ...
  linked_task_id: string | null;
}
```

---

### Flujo Resultante

```text
Usuario crea plan
       │
       ▼
  Añade tareas (ítems)
       │
       ▼
  [✓] Crear tareas automáticamente  ← Toggle (ON por defecto)
       │
       ▼
  [Enviar Plan]
       │
       ├──────────────────────────────────────┐
       │                                      │
   Toggle ON                             Toggle OFF
       │                                      │
       ▼                                      ▼
  Para cada ítem sin linked_task_id:    Solo envía plan
       │
       ▼
  INSERT INTO tareas (...)
       │
       ▼
  UPDATE daily_plan_items 
    SET linked_task_id = tarea.id
       │
       ▼
  Toast: "Plan enviado y X tareas creadas ✓"
```

---

### Evitar Duplicados

La lógica solo crea tareas para ítems donde `linked_task_id IS NULL`. Si el usuario re-envía el plan:
- Los ítems ya vinculados se ignoran
- Solo los nuevos ítems (sin vínculo) generan tareas

---

### Resumen de Archivos a Modificar

| Archivo | Cambio |
|---------|--------|
| **Nueva migración SQL** | Añadir columna `linked_task_id` |
| `src/services/dailyPlans.service.ts` | Función `convertPlanItemsToTasks` + modificar `submitPlan` |
| `src/hooks/useDailyPlan.ts` | Estado `autoCreateTasks` + pasar a `submitPlan` |
| `src/components/plans/DailyPlanForm.tsx` | Toggle UI + props |
| `src/types/dailyPlans.ts` | Añadir `linked_task_id` al tipo |
| `src/pages/admin/DailyPlansAdmin.tsx` | Botón para convertir tareas admin |

---

### Sección Técnica

**Dependencias:** No se requieren nuevas dependencias.

**RLS:** Las políticas existentes permiten a usuarios crear tareas (`tareas_insert_policy`) y actualizar sus propios `daily_plan_items`.

**Mapeo de Campos:**

| daily_plan_items | tareas |
|------------------|--------|
| title | titulo |
| description | descripcion |
| priority → | prioridad (mismo enum) |
| mandato_id | mandato_id |
| plan.user_id | asignado_a, creado_por |
| plan.planned_for_date | fecha_vencimiento |
| - | estado = 'pendiente' |
| - | tipo = 'individual' |

**Auditoría:** Los triggers de auditoría existentes registrarán automáticamente la creación de tareas y la actualización de `linked_task_id`.

