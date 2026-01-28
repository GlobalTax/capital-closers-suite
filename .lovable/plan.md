

## Plan: Completar Panel Admin de Planes Diarios

### Resumen de Estado Actual

El panel admin (`/admin/planes-diarios`) ya tiene implementado:
- Tabla con columnas Usuario, Tareas, Horas, Estado
- Navegación por fecha (prev/next)
- Drawer de detalle con lista de tareas
- Añadir nuevas tareas asignadas por admin
- Aprobar/Rechazar planes con comentarios
- Políticas RLS completas para admins

### Cambios Necesarios

---

### 1. Añadir Columna "Última Edición" a la Tabla

**Archivo:** `src/pages/admin/DailyPlansAdmin.tsx`

Añadir columna en el TableHeader y mostrar `updated_at` formateado:

```typescript
// En TableHeader
<TableHead>Última edición</TableHead>

// En TableBody
<TableCell className="text-xs text-muted-foreground">
  {format(new Date(plan.updated_at), "HH:mm", { locale: es })}
</TableCell>
```

---

### 2. Añadir Filtro por Usuario

**Archivo:** `src/pages/admin/DailyPlansAdmin.tsx`

Añadir un Select para filtrar por usuario específico:

```typescript
const [selectedUserId, setSelectedUserId] = useState<string | 'all'>('all');

// En la UI, junto a la navegación de fecha
<Select value={selectedUserId} onValueChange={setSelectedUserId}>
  <SelectTrigger className="w-[200px]">
    <SelectValue placeholder="Todos los usuarios" />
  </SelectTrigger>
  <SelectContent>
    <SelectItem value="all">Todos los usuarios</SelectItem>
    {allUsers.map(user => (
      <SelectItem key={user.user_id} value={user.user_id}>
        {user.full_name}
      </SelectItem>
    ))}
  </SelectContent>
</Select>

// Filtrar planes
const filteredPlans = selectedUserId === 'all' 
  ? plans 
  : plans.filter(p => p.user_id === selectedUserId);
```

---

### 3. Permitir Edición de Estimaciones y Prioridad por Admin

**Archivo:** `src/pages/admin/DailyPlansAdmin.tsx`

Cambiar el drawer para que el admin pueda editar tareas:

```typescript
// Estado para tracking de cambios
const [editedItems, setEditedItems] = useState<Map<string, Partial<DailyPlanItem>>>(new Map());

// En el drawer, cambiar canEdit a true y conectar onUpdate
<DailyPlanItemRow
  key={item.id}
  item={item}
  canEdit={true}  // Permitir edición
  onUpdate={(updates) => handleAdminUpdateItem(item.id, updates)}
  onDelete={() => handleAdminDeleteItem(item.id)}
/>

// Función para actualizar
const handleAdminUpdateItem = async (itemId: string, updates: Partial<DailyPlanItem>) => {
  try {
    await updatePlanItem(itemId, updates);
    loadData();
    toast.success('Tarea actualizada');
  } catch (error) {
    toast.error('Error al actualizar tarea');
  }
};
```

**Archivo:** `src/services/dailyPlans.service.ts`

Crear función específica para actualización admin que incluya auditoría:

```typescript
export async function adminUpdatePlanItem(
  itemId: string,
  updates: Partial<NewDailyPlanItem>,
  adminId: string
): Promise<DailyPlanItem> {
  const { data, error } = await supabase
    .from('daily_plan_items')
    .update({
      ...updates,
      // Opcionalmente: guardar quién modificó
    })
    .eq('id', itemId)
    .select()
    .single();
  
  if (error) throw error;
  return data as DailyPlanItem;
}
```

---

### 4. Implementar Auditoría de Acciones Admin

**Migración SQL** - Crear trigger de auditoría para daily_plans y daily_plan_items:

```sql
-- Añadir trigger de auditoría a daily_plans
CREATE TRIGGER audit_daily_plans
  AFTER INSERT OR UPDATE OR DELETE ON public.daily_plans
  FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

-- Añadir trigger de auditoría a daily_plan_items
CREATE TRIGGER audit_daily_plan_items
  AFTER INSERT OR UPDATE OR DELETE ON public.daily_plan_items
  FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();
```

Esto registrará automáticamente en la tabla `audit_logs`:
- Quién hizo el cambio (`auth.uid()`)
- Qué tabla y registro
- Qué acción (INSERT/UPDATE/DELETE)
- Valores anteriores y nuevos

---

### 5. Actualizar Tipos para incluir updated_at

**Archivo:** `src/types/dailyPlans.ts`

El tipo `DailyPlanWithUser` ya hereda de `DailyPlan` que tiene `updated_at`.

---

### Flujo Resultante

```text
Admin accede a /admin/planes-diarios
            │
            ▼
    ┌───────────────────────────────────┐
    │  [◀] Lun 29 Ene [▶]  [Usuario ▼]  │  ← Filtros
    └───────────────────────────────────┘
            │
            ▼
    ┌───────────────────────────────────────────────────────────┐
    │ Usuario    │ Tareas │ Horas │ Estado   │ Última Ed │ Acc  │
    ├────────────┼────────┼───────┼──────────┼───────────┼──────┤
    │ Juan López │   5    │ 8.5h  │ Enviado  │ 09:45     │ [👁] │
    │ Ana García │   3    │ 6.0h  │ Borrador │ 08:30     │ [👁] │
    └───────────────────────────────────────────────────────────┘
            │
            ▼ (click Ver)
    ┌─────────────────────────────────────┐
    │  Plan de Juan López                 │
    │  ─────────────────────────────────  │
    │  [✓] Tarea 1    2h   [Alta ▼]  [🗑] │  ← Admin puede editar
    │  [✓] Tarea 2    1h   [Media▼]  [🗑] │
    │  [★] Tarea admin 1h  [Urgente]      │  ← No borrable
    │  ─────────────────────────────────  │
    │  [+ Añadir tarea]                   │
    │  ─────────────────────────────────  │
    │  Comentarios: [________________]    │
    │  ─────────────────────────────────  │
    │  [Rechazar]  [Aprobar]              │
    └─────────────────────────────────────┘
```

---

### Resumen de Archivos a Modificar

| Archivo | Cambios |
|---------|---------|
| `src/pages/admin/DailyPlansAdmin.tsx` | Columna "Última edición", filtro usuario, edición inline |
| `src/services/dailyPlans.service.ts` | Función `adminUpdatePlanItem` (opcional) |
| **Nueva migración SQL** | Triggers de auditoría para `daily_plans` y `daily_plan_items` |

---

### Impacto

- Admins podrán filtrar planes por usuario específico
- Verán cuándo fue la última modificación de cada plan
- Podrán editar estimaciones y prioridad de cualquier tarea
- Todas las acciones quedarán registradas en `audit_logs` para trazabilidad

---

### Sección Técnica

**Dependencias:** No se requieren nuevas dependencias.

**RLS:** Las políticas existentes ya permiten a admins hacer UPDATE en `daily_plan_items`, por lo que la edición funcionará sin cambios adicionales.

**Auditoría:** La función `audit_trigger_function` ya existe en el proyecto y se usa en otras tablas (mandatos, contactos, empresas, etc.). Los nuevos triggers seguirán el mismo patrón.

