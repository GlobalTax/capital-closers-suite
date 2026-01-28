

## Plan: Gestión de Vacaciones/Bajas + Leads en Planificación Diaria

### Resumen

Este plan implementa dos mejoras solicitadas:

1. **Gestión de Vacaciones y Bajas**: Permitir a los usuarios marcar días como vacaciones, baja médica u otra ausencia, lo que exime del requisito de planificación y registro de horas para esas fechas.

2. **Gestión de Leads en Planificación**: Añadir la posibilidad de asociar un lead específico a cada tarea del plan diario, siguiendo el mismo patrón que ya existe en el registro de horas.

---

### Parte 1: Sistema de Vacaciones y Bajas

#### 1.1 Nueva Tabla de Base de Datos

Crear una tabla `user_absences` para gestionar las ausencias:

```sql
-- Tipos de ausencia
CREATE TYPE public.absence_type AS ENUM ('vacation', 'sick_leave', 'personal', 'other');

-- Tabla de ausencias
CREATE TABLE public.user_absences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  absence_date DATE NOT NULL,
  absence_type absence_type NOT NULL DEFAULT 'vacation',
  notes TEXT,
  approved_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  
  -- Una ausencia por usuario por fecha
  UNIQUE(user_id, absence_date)
);

-- RLS
ALTER TABLE public.user_absences ENABLE ROW LEVEL SECURITY;

-- Usuarios pueden ver y gestionar sus propias ausencias
CREATE POLICY "Users can manage their own absences"
ON public.user_absences
FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Admins pueden ver y gestionar todas
CREATE POLICY "Admins can manage all absences"
ON public.user_absences
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM admin_users 
    WHERE user_id = auth.uid() 
    AND role IN ('admin', 'super_admin')
    AND is_active = true
  )
);
```

#### 1.2 Servicio de Ausencias

Crear `src/services/absences.service.ts`:

```typescript
// Funciones principales:
- getAbsencesForMonth(userId, month, year): Obtener ausencias de un mes
- addAbsence(userId, date, type, notes): Añadir ausencia
- removeAbsence(userId, date): Eliminar ausencia
- isAbsenceDate(userId, date): Verificar si es día de ausencia
```

#### 1.3 Modificar Validación de Plan Diario

Actualizar `canRegisterHoursForDate` en `src/services/dailyPlans.service.ts`:

```typescript
export async function canRegisterHoursForDate(userId, date, isAdmin) {
  // Admin bypass
  if (isAdmin) return { allowed: true };
  
  // NUEVO: Verificar si es día de ausencia
  const { data: absence } = await supabase
    .from('user_absences')
    .select('id, absence_type')
    .eq('user_id', userId)
    .eq('absence_date', format(date, 'yyyy-MM-dd'))
    .maybeSingle();
  
  if (absence) {
    // Día de ausencia: permitir pero sin requisitos de plan
    return { allowed: true, isAbsence: true, absenceType: absence.absence_type };
  }
  
  // ... resto de la lógica de validación existente ...
}
```

#### 1.4 UI: Marcador de Vacaciones en Plan Diario

Añadir en `src/pages/PlanDiario.tsx`:

```typescript
// Añadir botón de "Marcar como Vacaciones/Baja" 
// cuando el usuario no quiere planificar el día

{!plan?.items.length && (
  <div className="border rounded-lg p-4">
    <h3>¿No trabajarás este día?</h3>
    <div className="flex gap-2">
      <Button onClick={() => markAsAbsence('vacation')}>
        🏖️ Vacaciones
      </Button>
      <Button onClick={() => markAsAbsence('sick_leave')}>
        🤒 Baja médica
      </Button>
      <Button onClick={() => markAsAbsence('personal')}>
        👤 Personal
      </Button>
    </div>
  </div>
)}
```

#### 1.5 Indicador Visual de Ausencia

En el calendario de selección de fechas, mostrar días de ausencia con un color distinto:

```typescript
// Modificar Calendar para mostrar días de ausencia
const modifiers = {
  absence: absenceDates, // Array de fechas de ausencia
};

const modifiersStyles = {
  absence: { backgroundColor: '#fef3c7', border: '2px solid #f59e0b' }
};
```

---

### Parte 2: Gestión de Leads en Planificación

#### 2.1 Añadir Columna a daily_plan_items

```sql
-- Añadir referencia a mandate_leads
ALTER TABLE public.daily_plan_items 
ADD COLUMN IF NOT EXISTS mandate_lead_id UUID REFERENCES public.mandate_leads(id) ON DELETE SET NULL;

-- Índice para búsquedas
CREATE INDEX IF NOT EXISTS idx_daily_plan_items_mandate_lead
ON public.daily_plan_items(mandate_lead_id);
```

#### 2.2 Actualizar Tipos

En `src/types/dailyPlans.ts`:

```typescript
export interface DailyPlanItem {
  // ... existentes ...
  mandate_lead_id: string | null;  // NUEVO
}

export interface NewDailyPlanItem {
  // ... existentes ...
  mandate_lead_id?: string | null;  // NUEVO
}
```

#### 2.3 Actualizar Servicio

En `src/services/dailyPlans.service.ts`:

```typescript
// En addPlanItem()
.insert({
  // ... existentes ...
  mandate_lead_id: item.mandate_lead_id || null,  // NUEVO
})

// En convertPlanItemsToTasks()
// Transferir mandate_lead_id a la tarea creada
```

#### 2.4 Actualizar UI del Formulario

En `src/components/plans/DailyPlanForm.tsx`:

```typescript
// Añadir estado para lead seleccionado
const [newLeadId, setNewLeadId] = useState<string | null>(null);

// Después del MandatoSelect, mostrar LeadByMandatoSelect
{newMandatoId && (
  <div className="min-w-[200px]">
    <LeadByMandatoSelect
      mandatoId={newMandatoId}
      value={newLeadId}
      onValueChange={(id) => setNewLeadId(id)}
      placeholder="Lead (opcional)"
    />
  </div>
)}

// En handleAddItem():
onAddItem({
  // ... existentes ...
  mandate_lead_id: newLeadId,
});

// Reset:
setNewLeadId(null);
```

#### 2.5 Mostrar Lead en Fila de Item

En `src/components/plans/DailyPlanItemRow.tsx`:

```typescript
// Mostrar badge con nombre del lead si existe
{item.mandate_lead_id && leadName && (
  <Badge variant="outline" className="text-xs">
    👤 {leadName}
  </Badge>
)}
```

---

### Flujo de Vacaciones

```text
Usuario abre /plan-diario
         │
         ▼
   ¿Tiene plan para este día?
         │
    ┌────┴────┐
    │         │
   Sí         No
    │         │
    ▼         ▼
 Mostrar   Mostrar opciones:
 plan      "¿No trabajarás este día?"
           [Vacaciones] [Baja] [Personal]
                    │
                    ▼
            Marcar como ausencia
                    │
                    ▼
       No se requiere plan ni horas
```

---

### Flujo de Leads en Plan

```text
Añadir tarea al plan
         │
         ▼
   [Título] [Duración] [Prioridad]
         │
         ▼
   [Mandato ▼] ─────────────────┐
         │                      │
         ▼                      ▼
   [Lead ▼] (opcional)    Si es proyecto interno
     │                    sin leads → ocultar
     │
     ▼
   [+ Añadir]
         │
         ▼
   Tarea guardada con mandato_id Y mandate_lead_id
```

---

### Resumen de Archivos

| Archivo | Cambio |
|---------|--------|
| **Nueva migración SQL** | Crear tabla `user_absences` + añadir `mandate_lead_id` a `daily_plan_items` |
| **Nuevo:** `src/services/absences.service.ts` | Servicio para gestionar ausencias |
| **Nuevo:** `src/hooks/useAbsences.ts` | Hook para cargar ausencias del usuario |
| `src/services/dailyPlans.service.ts` | Añadir verificación de ausencias en `canRegisterHoursForDate` |
| `src/types/dailyPlans.ts` | Añadir `mandate_lead_id` a tipos |
| `src/pages/PlanDiario.tsx` | Añadir UI de marcado de vacaciones/bajas |
| `src/components/plans/DailyPlanForm.tsx` | Añadir selector de leads |
| `src/components/plans/DailyPlanItemRow.tsx` | Mostrar badge de lead |

---

### Sección Técnica

**Dependencias:** No se requieren nuevas dependencias.

**RLS:** 
- Usuarios pueden gestionar sus propias ausencias
- Admins pueden ver/gestionar todas las ausencias

**Consideraciones:**
- Las ausencias funcionan por día completo (no medio día)
- Al marcar un día como ausencia, no se requiere plan ni registro de horas
- Los leads son opcionales en el plan (igual que en el registro de horas)
- Se reutiliza el componente `LeadByMandatoSelect` existente
- La conversión a tareas también transfiere el `mandate_lead_id`

**Mapeo Lead → Tarea:**

| daily_plan_items | tareas |
|------------------|--------|
| mandate_lead_id | mandate_lead_id (nuevo campo en tareas) |

