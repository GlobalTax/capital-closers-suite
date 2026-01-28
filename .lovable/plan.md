

## Plan: Añadir Validación de 8 Horas Mínimas al Bloqueo

### Problema Actual

La función `canRegisterHoursForDate` en `src/services/dailyPlans.service.ts` verifica que exista un plan enviado, pero **no valida** que el plan tenga al menos 8 horas planificadas.

### Cambio Propuesto

**Archivo: `src/services/dailyPlans.service.ts`**

Modificar la consulta para incluir `total_estimated_minutes` y añadir validación:

```typescript
// Línea 355-360: Añadir total_estimated_minutes al SELECT
const { data: plan, error } = await supabase
  .from('daily_plans')
  .select('id, status, total_estimated_minutes')  // ← CAMBIO
  .eq('user_id', userId)
  .eq('planned_for_date', targetDate)
  .maybeSingle();

// Después de la validación de draft (línea 374-380):
// NUEVO: Verificar mínimo 8 horas
const MIN_MINUTES = 480; // 8 horas
if ((plan.total_estimated_minutes || 0) < MIN_MINUTES) {
  const currentHours = ((plan.total_estimated_minutes || 0) / 60).toFixed(1);
  return {
    allowed: false,
    reason: `Tu plan solo tiene ${currentHours}h. Necesitas mínimo 8h para registrar horas`,
    planId: plan.id
  };
}
```

### Código Final de la Función

```typescript
export async function canRegisterHoursForDate(
  userId: string,
  date: Date
): Promise<{ allowed: boolean; reason?: string; planId?: string }> {
  const targetDate = format(date, 'yyyy-MM-dd');
  const today = format(new Date(), 'yyyy-MM-dd');
  
  // Días pasados permitidos sin plan
  if (targetDate < today) {
    return { allowed: true };
  }
  
  // HOY y FUTURO requieren plan enviado con mínimo 8h
  const { data: plan, error } = await supabase
    .from('daily_plans')
    .select('id, status, total_estimated_minutes')
    .eq('user_id', userId)
    .eq('planned_for_date', targetDate)
    .maybeSingle();
  
  if (error) throw error;
  
  if (!plan) {
    const isToday = targetDate === today;
    return {
      allowed: false,
      reason: isToday 
        ? 'Debes crear y enviar tu plan para hoy antes de registrar horas'
        : 'Debes crear y enviar tu plan diario antes de registrar horas para este día'
    };
  }
  
  if (plan.status === 'draft') {
    return {
      allowed: false,
      reason: 'Debes enviar tu plan diario antes de registrar horas',
      planId: plan.id
    };
  }
  
  // Validar mínimo 8 horas
  const MIN_MINUTES = 480;
  if ((plan.total_estimated_minutes || 0) < MIN_MINUTES) {
    const currentHours = ((plan.total_estimated_minutes || 0) / 60).toFixed(1);
    return {
      allowed: false,
      reason: `Tu plan solo tiene ${currentHours}h planificadas. Añade más tareas hasta completar 8h`,
      planId: plan.id
    };
  }
  
  return { allowed: true, planId: plan.id };
}
```

### Flujo de Validación Completo

```text
Usuario intenta registrar horas
          │
          ▼
   ¿Fecha pasada?  ───Sí───▶ ✅ Permitido
          │
         No
          │
          ▼
   ¿Existe plan?   ───No───▶ ❌ "Crea tu plan"
          │
         Sí
          │
          ▼
   ¿Plan enviado?  ───No───▶ ❌ "Envía tu plan"
   (status≠draft)
          │
         Sí
          │
          ▼
   ¿Plan ≥ 8h?     ───No───▶ ❌ "Añade más tareas"
          │
         Sí
          │
          ▼
      ✅ Permitido
```

### Resumen

| Archivo | Cambio |
|---------|--------|
| `src/services/dailyPlans.service.ts` | Añadir `total_estimated_minutes` al SELECT + nueva validación |

### Impacto

- Usuarios no podrán registrar horas para hoy/mañana si su plan tiene menos de 8 horas
- El mensaje es claro y accionable: indica cuántas horas tienen y qué necesitan
- El `planId` se incluye para que el modal pueda enlazar directamente al plan

