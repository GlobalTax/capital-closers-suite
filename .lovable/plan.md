

## Plan: Bloquear registro de horas sin Plan Diario previo

### Problema Identificado

La lógica actual permite registrar horas para **hoy y días pasados** sin verificar si existe un plan diario. El código en `canRegisterHoursForDate` retorna `allowed: true` inmediatamente si la fecha objetivo es hoy o pasada:

```typescript
// Línea 302 en dailyPlans.service.ts
if (targetDate <= today) {
  return { allowed: true };  // ← PROBLEMA: No verifica plan
}
```

### Nuevo Comportamiento Propuesto

| Fecha a registrar | Condición | Resultado |
|-------------------|-----------|-----------|
| **Hoy** | Sin plan para hoy | ❌ Bloqueado - "Crea tu plan para hoy" |
| **Hoy** | Plan en draft | ❌ Bloqueado - "Envía tu plan primero" |
| **Hoy** | Plan submitted/approved | ✅ Permitido |
| **Ayer o antes** | Siempre | ✅ Permitido (días pasados no requieren plan) |
| **Mañana o después** | Sin plan o en draft | ❌ Bloqueado |
| **Mañana o después** | Plan submitted/approved | ✅ Permitido |

### Cambios Necesarios

#### Archivo: `src/services/dailyPlans.service.ts`

Modificar la función `canRegisterHoursForDate` para:

1. **Días pasados**: Permitir siempre (no tiene sentido exigir plan retroactivo)
2. **Hoy**: Requerir plan en estado `submitted` o `approved`
3. **Días futuros**: Requerir plan en estado `submitted` o `approved` (ya funciona así)

```typescript
export async function canRegisterHoursForDate(
  userId: string,
  date: Date
): Promise<{ allowed: boolean; reason?: string; planId?: string }> {
  const targetDate = format(date, 'yyyy-MM-dd');
  const today = format(new Date(), 'yyyy-MM-dd');
  
  // CAMBIO: Solo días PASADOS (anteriores a hoy) son permitidos sin plan
  if (targetDate < today) {
    return { allowed: true };
  }
  
  // Para HOY y días FUTUROS, verificar que exista plan enviado
  const { data: plan, error } = await supabase
    .from('daily_plans')
    .select('id, status')
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
  
  // Plan exists and is submitted/approved
  return { allowed: true, planId: plan.id };
}
```

### Detalle del Cambio

| Línea | Antes | Después |
|-------|-------|---------|
| 302 | `if (targetDate <= today)` | `if (targetDate < today)` |

**Un solo carácter cambia**: `<=` → `<`

Este cambio significa:
- `targetDate < today` → Solo días **estrictamente pasados** pasan sin verificación
- `targetDate === today` → **Hoy** ahora requiere plan enviado

### Flujo Resultante

```text
Usuario intenta registrar horas para HOY
         │
         ▼
  ┌──────────────────────┐
  │ ¿Existe plan para    │
  │ la fecha de hoy?     │
  └──────────┬───────────┘
             │
    ┌────────┴────────┐
    │ No              │ Sí
    ▼                 ▼
┌─────────────┐  ┌───────────────────┐
│ Modal:      │  │ ¿Plan enviado?    │
│ "Crea tu    │  │ (status!=draft)   │
│ plan para   │  └─────────┬─────────┘
│ hoy"        │       ┌────┴────┐
└─────────────┘       │ No      │ Sí
                      ▼         ▼
              ┌─────────────┐ ┌─────────────┐
              │ Modal:      │ │ ✅ Permitir │
              │ "Envía tu   │ │ registrar   │
              │ plan"       │ │ horas       │
              └─────────────┘ └─────────────┘
```

### Consideraciones de UX

El modal `DailyPlanBlocker` ya tiene un botón "Ir a Plan Diario" que redirige a `/plan-diario`. Esto facilita que el usuario cree/envíe su plan y luego vuelva a registrar horas.

### Impacto

- **Usuarios**: Deberán crear su plan antes de registrar horas del día actual
- **Días pasados**: Sin cambios, se permiten siempre (para correcciones retroactivas)
- **Días futuros**: Sin cambios, ya requerían plan

### Resumen

| Archivo | Cambio |
|---------|--------|
| `src/services/dailyPlans.service.ts` | Cambiar `<=` a `<` en línea 302 + actualizar mensaje para "hoy" |

