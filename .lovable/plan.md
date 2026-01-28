

## Plan: Corregir Bloqueo de Horas sin Plan Diario Completado

### Problema Detectado

La función `canRegisterHoursForDate` actualmente **solo bloquea registrar horas para MAÑANA** (si no hay plan enviado con 8h). Pero **permite registrar horas para HOY sin ninguna validación**.

Según el requisito original (Prompt 3):
> "No poder registrar horas de HOY si no existe un plan enviado (8h) de ayer o de hoy mismo."

El comportamiento correcto debería ser:
- Para registrar horas de **HOY** → debe existir un plan enviado (8h+) para **AYER u HOY**
- Para registrar horas de **MAÑANA** → debe existir un plan enviado (8h+) para **MAÑANA**
- Para fechas **pasadas o futuras** → permitido (flexibilidad)

---

### Cambio Requerido

**Archivo:** `src/services/dailyPlans.service.ts`

Modificar la función `canRegisterHoursForDate` para añadir validación de HOY:

```typescript
// Línea 438-441: Cambiar lógica para TODAY
// ANTES:
if (targetDate === today) {
  return { allowed: true };
}

// DESPUÉS:
if (targetDate === today) {
  // Para HOY, verificar que existe plan enviado de AYER o de HOY
  const yesterday = format(addDays(new Date(), -1), 'yyyy-MM-dd');
  
  // Buscar plan de hoy
  const { data: todayPlan } = await supabase
    .from('daily_plans')
    .select('id, status, total_estimated_minutes')
    .eq('user_id', userId)
    .eq('planned_for_date', today)
    .maybeSingle();
  
  // Si hay plan de hoy enviado con 8h+, permitir
  if (todayPlan && 
      todayPlan.status !== 'draft' && 
      (todayPlan.total_estimated_minutes || 0) >= 480) {
    return { allowed: true, planId: todayPlan.id };
  }
  
  // Si no, buscar plan de ayer
  const { data: yesterdayPlan } = await supabase
    .from('daily_plans')
    .select('id, status, total_estimated_minutes')
    .eq('user_id', userId)
    .eq('planned_for_date', yesterday)
    .maybeSingle();
  
  // Si hay plan de ayer enviado con 8h+, permitir
  if (yesterdayPlan && 
      yesterdayPlan.status !== 'draft' && 
      (yesterdayPlan.total_estimated_minutes || 0) >= 480) {
    return { allowed: true, planId: yesterdayPlan.id };
  }
  
  // No hay plan válido
  return {
    allowed: false,
    reason: 'Debes tener un plan diario enviado (mín 8h) de ayer o de hoy para registrar horas',
    planId: todayPlan?.id
  };
}
```

---

### Lógica Actualizada

| Fecha Objetivo | Requisito de Plan |
|----------------|-------------------|
| **Pasado** | Sin restricción |
| **HOY** | Plan de AYER o HOY (enviado, 8h+) |
| **MAÑANA** | Plan de MAÑANA (enviado, 8h+) |
| **Futuro (>mañana)** | Sin restricción |
| **Admin** | Siempre permitido (bypass) |

---

### Archivo a Modificar

| Archivo | Cambio |
|---------|--------|
| `src/services/dailyPlans.service.ts` | Añadir validación para `targetDate === today` |

---

### Sección Técnica

**Justificación:**
- Se mantiene la flexibilidad para fechas pasadas (correcciones retrospectivas)
- Se requiere planificación previa para trabajo del día actual
- El plan puede ser de ayer (planificó mañana) o de hoy (planificó el mismo día temprano)
- Admins tienen bypass completo

**Impacto:**
- Los usuarios verán el `DailyPlanBlocker` si intentan registrar horas para HOY sin plan válido
- El mensaje guiará al usuario a crear/enviar su plan diario

