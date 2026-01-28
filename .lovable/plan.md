

## Plan: Planificación de Días Futuros (Prompt 6)

### Resumen

Permitir que los usuarios seleccionen cualquier fecha futura para planificar, mientras que el bloqueo de registro de horas solo aplica a "mañana". Los admins pueden crear planes para cualquier fecha sin restricciones.

---

### 1. UI: Añadir DatePicker en PlanDiario

**Archivo:** `src/pages/PlanDiario.tsx`

Reemplazar la navegación actual (prev/next/button) con un componente DatePicker que permita seleccionar directamente cualquier fecha futura:

```typescript
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

// En lugar de solo botones prev/next, añadir un popover con calendario
<Popover>
  <PopoverTrigger asChild>
    <Button variant={isTomorrow ? "default" : "outline"} className="min-w-[180px]">
      <CalendarDays className="h-4 w-4 mr-2" />
      {format(selectedDate, "EEE d MMM", { locale: es })}
    </Button>
  </PopoverTrigger>
  <PopoverContent className="w-auto p-0" align="center">
    <Calendar
      mode="single"
      selected={selectedDate}
      onSelect={(date) => date && setSelectedDate(date)}
      disabled={(date) => date < new Date()} // Solo fechas futuras
      initialFocus
      className="pointer-events-auto"
    />
  </PopoverContent>
</Popover>
```

Mantener los botones prev/next para navegación rápida.

---

### 2. Modificar Lógica de Bloqueo

**Archivo:** `src/services/dailyPlans.service.ts`

Cambiar la función `canRegisterHoursForDate` para que el bloqueo **solo aplique a MAÑANA** (no a hoy ni otros días futuros):

**Antes (actual):**
```typescript
// TODAY and FUTURE dates require a submitted plan
if (targetDate < today) {
  return { allowed: true }; // Past dates allowed
}
// Block for today AND future...
```

**Después (nuevo):**
```typescript
export async function canRegisterHoursForDate(
  userId: string,
  date: Date
): Promise<{ allowed: boolean; reason?: string; planId?: string }> {
  const targetDate = format(date, 'yyyy-MM-dd');
  const today = format(new Date(), 'yyyy-MM-dd');
  const tomorrow = format(addDays(new Date(), 1), 'yyyy-MM-dd');
  
  // Past dates: always allowed (no plan required)
  if (targetDate < today) {
    return { allowed: true };
  }
  
  // Today: allowed without plan (flexible)
  if (targetDate === today) {
    return { allowed: true };
  }
  
  // TOMORROW ONLY: requires submitted plan with 8+ hours
  if (targetDate === tomorrow) {
    // ... existing plan validation logic ...
  }
  
  // FUTURE (beyond tomorrow): allowed without strict requirement
  // But encourage planning
  return { allowed: true };
}
```

---

### 3. Actualizar Textos de UI

**Archivo:** `src/pages/PlanDiario.tsx`

Cambiar el texto descriptivo para reflejar la flexibilidad:

```typescript
<p className="text-sm text-muted-foreground mt-0.5">
  {isTomorrow 
    ? "Planifica tu trabajo para mañana (requerido para registrar horas)"
    : "Planifica tu trabajo con anticipación"
  }
</p>
```

---

### 4. Indicador Visual de Fecha Bloqueada

**Archivo:** `src/components/plans/DailyPlanForm.tsx`

Mostrar un indicador cuando la fecha seleccionada es mañana (la que tiene bloqueo):

```typescript
// Añadir prop para indicar si es fecha con bloqueo
interface DailyPlanFormProps {
  // ... existentes ...
  isBlockingDate?: boolean; // true si es mañana
}

// En el JSX, mostrar advertencia si es fecha de bloqueo
{isBlockingDate && plan.status === 'draft' && (
  <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900 rounded-lg p-3 text-sm">
    <p className="text-amber-700 dark:text-amber-400">
      ⚠️ <strong>Importante:</strong> Debes enviar este plan con mínimo 8h 
      antes de poder registrar horas para mañana.
    </p>
  </div>
)}
```

---

### 5. Bypass para Admins

**Archivo:** `src/services/dailyPlans.service.ts`

Añadir parámetro opcional para bypass de admin:

```typescript
export async function canRegisterHoursForDate(
  userId: string,
  date: Date,
  isAdmin: boolean = false
): Promise<{ allowed: boolean; reason?: string; planId?: string }> {
  // Admin bypass
  if (isAdmin) {
    return { allowed: true };
  }
  
  // ... resto de la lógica ...
}
```

**Archivo:** `src/hooks/useDailyPlanValidation.ts`

Actualizar para pasar el rol:

```typescript
import { useSimpleAuth } from "@/hooks/useSimpleAuth";

export function useDailyPlanValidation() {
  const { user } = useAuth();
  const { isAdmin } = useSimpleAuth();
  
  const checkCanRegisterHours = useCallback(async (date: Date) => {
    if (!user?.id) {
      return { allowed: false, reason: 'Usuario no autenticado' };
    }
    
    return await canRegisterHoursForDate(user.id, date, isAdmin);
  }, [user?.id, isAdmin]);
  
  // ...
}
```

---

### Flujo Resultante

```text
Usuario abre /plan-diario
         │
         ▼
   ┌─────────────────────────────────────────────┐
   │  [◀] [📅 Mié 29 Ene ▼] [▶]                   │  ← Click abre calendario
   │      └──────────────────┘                   │
   │         ┌─────────────────┐                 │
   │         │   Enero 2026    │                 │
   │         │ Lu Ma Mi Ju ... │                 │
   │         │ 27 28 [29] 30   │  ← Seleccionar cualquier fecha
   │         └─────────────────┘                 │
   └─────────────────────────────────────────────┘
         │
         ▼
   ¿Fecha = Mañana?
         │
    ┌────┴────┐
    │         │
   Sí         No
    │         │
    ▼         ▼
 Mostrar    Sin warning
 warning    (planificación
 bloqueo    preventiva)
```

---

### Lógica de Bloqueo Simplificada

| Fecha | Bloqueo para registrar horas |
|-------|------------------------------|
| Pasado | ❌ No |
| Hoy | ❌ No |
| **Mañana** | ✅ **Sí** (requiere plan 8h+) |
| Pasado mañana+ | ❌ No |
| Admin cualquier fecha | ❌ No (bypass) |

---

### Resumen de Archivos a Modificar

| Archivo | Cambio |
|---------|--------|
| `src/pages/PlanDiario.tsx` | Añadir DatePicker, actualizar textos |
| `src/services/dailyPlans.service.ts` | Modificar `canRegisterHoursForDate` para solo bloquear mañana |
| `src/hooks/useDailyPlanValidation.ts` | Pasar isAdmin al servicio |
| `src/components/plans/DailyPlanForm.tsx` | Añadir indicador de fecha bloqueada |

---

### Sección Técnica

**Componentes utilizados:**
- `Calendar` de shadcn/ui (ya instalado)
- `Popover` de shadcn/ui (ya instalado)

**Dependencias:** No se requieren nuevas dependencias.

**RLS:** No hay cambios de base de datos necesarios.

**Consideraciones:**
- El calendario solo permite seleccionar fechas futuras (`disabled={(date) => date < new Date()}`)
- Se mantienen los botones prev/next para navegación rápida
- El botón central muestra la fecha actual y abre el calendario al hacer click
- Los admins tienen bypass completo del bloqueo

