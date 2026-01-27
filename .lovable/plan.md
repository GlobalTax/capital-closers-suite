
## Plan: Sistema de Plan Diario + Control Admin

### Resumen Ejecutivo

Este sistema implementa un flujo de planificacion diaria donde los usuarios deben enviar su plan de trabajo previsto antes de poder registrar horas del dia siguiente. Los administradores tienen un panel para revisar, asignar tareas y aprobar planes.

---

### Arquitectura de la Solucion

```text
┌─────────────────────────────────────────────────────────────────────────────┐
│                           FLUJO DE USUARIO                                  │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  17:00 - Fin del dia                                                        │
│       │                                                                     │
│       ▼                                                                     │
│  ┌─────────────────────┐                                                    │
│  │ Usuario intenta     │                                                    │
│  │ registrar horas     │                                                    │
│  │ del dia siguiente   │                                                    │
│  └─────────┬───────────┘                                                    │
│            │                                                                │
│            ▼                                                                │
│  ┌─────────────────────┐     No      ┌─────────────────────────┐           │
│  │ ¿Existe plan        │ ────────────▶│ Modal: "Crea tu plan   │           │
│  │  enviado para       │             │ para mañana primero"   │           │
│  │  mañana?            │             └───────────┬─────────────┘           │
│  └─────────┬───────────┘                         │                         │
│            │ Si                                  ▼                         │
│            ▼                        ┌─────────────────────────┐            │
│  ┌─────────────────────┐            │ Formulario Plan Diario  │            │
│  │ Permitir registro   │            │ - Agregar tareas        │            │
│  │ de horas            │            │ - Estimar horas         │            │
│  └─────────────────────┘            │ - Mandato (opcional)    │            │
│                                     │ - Prioridad             │            │
│                                     │ - Notas                 │            │
│                                     └───────────┬─────────────┘            │
│                                                 │                          │
│                                                 ▼                          │
│                                     ┌─────────────────────────┐            │
│                                     │ Enviar Plan             │            │
│                                     │ status = 'submitted'    │            │
│                                     └─────────────────────────┘            │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│                           PANEL ADMIN                                        │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  Ruta: /admin/planes-diarios                                                │
│                                                                             │
│  ┌───────────────────────────────────────────────────────────────────────┐  │
│  │  Fecha: [Mañana ▼]   Estado: [Todos ▼]   Usuario: [Todos ▼]          │  │
│  └───────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────────┐│
│  │ Usuario        │ Tareas │ Horas Plan │ Estado      │ Acciones          ││
│  ├─────────────────────────────────────────────────────────────────────────┤│
│  │ Ana García     │ 5      │ 8.0h       │ ✅ Submitted │ [Ver] [Aprobar]  ││
│  │ Pedro López    │ 3      │ 6.5h       │ ⏳ Draft     │ [Ver] [Recordar] ││
│  │ María Sánchez  │ 4      │ 7.0h       │ ✅ Approved  │ [Ver]            ││
│  └─────────────────────────────────────────────────────────────────────────┘│
│                                                                             │
│  [+ Asignar tarea a usuario]                                                │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

### Modelo de Datos

#### Tabla: `daily_plans`

| Columna | Tipo | Descripcion |
|---------|------|-------------|
| id | uuid | PK |
| user_id | uuid | FK → auth.users |
| planned_for_date | date | Fecha objetivo del plan |
| status | text | 'draft' / 'submitted' / 'approved' / 'rejected' |
| submitted_at | timestamptz | Cuando se envio |
| approved_at | timestamptz | Cuando se aprobo |
| approved_by | uuid | Admin que aprobo |
| admin_notes | text | Comentarios del admin |
| user_notes | text | Notas del usuario |
| created_at | timestamptz | |
| updated_at | timestamptz | |

**Constraint unico**: `(user_id, planned_for_date)` - Un plan por usuario por dia

#### Tabla: `daily_plan_items`

| Columna | Tipo | Descripcion |
|---------|------|-------------|
| id | uuid | PK |
| plan_id | uuid | FK → daily_plans |
| title | text | Titulo de la tarea |
| description | text | Descripcion opcional |
| estimated_minutes | integer | Estimacion en minutos |
| priority | text | 'alta' / 'media' / 'baja' / 'urgente' |
| mandato_id | uuid | FK → mandatos (opcional) |
| work_task_type_id | uuid | FK → work_task_types (opcional) |
| assigned_by_admin | boolean | Si fue asignada por admin |
| completed | boolean | Marcado como completado |
| actual_time_entry_id | uuid | FK → mandato_time_entries (opcional) |
| order_index | integer | Orden de visualizacion |
| created_at | timestamptz | |

---

### Archivos a Crear

| Archivo | Descripcion |
|---------|-------------|
| `src/pages/PlanDiario.tsx` | Pagina principal del usuario para crear/ver su plan |
| `src/pages/admin/DailyPlansAdmin.tsx` | Panel admin para revisar planes del equipo |
| `src/components/plans/DailyPlanForm.tsx` | Formulario para crear/editar plan diario |
| `src/components/plans/DailyPlanItemRow.tsx` | Fila de tarea en el plan |
| `src/components/plans/DailyPlanSummary.tsx` | Resumen del plan (horas totales, progreso) |
| `src/components/plans/DailyPlanBlocker.tsx` | Modal que bloquea registro si no hay plan |
| `src/components/plans/AdminPlanReviewPanel.tsx` | Panel de revision para admin |
| `src/components/plans/PlanVsRealChart.tsx` | Comparacion plan vs horas reales |
| `src/hooks/useDailyPlan.ts` | Hook para CRUD de planes |
| `src/hooks/useDailyPlanValidation.ts` | Hook para validar si puede registrar horas |
| `src/services/dailyPlans.service.ts` | Servicio de planes diarios |
| `src/types/dailyPlans.ts` | Tipos TypeScript |

---

### Archivos a Modificar

| Archivo | Cambio |
|---------|--------|
| `src/App.tsx` | Agregar rutas `/plan-diario` y `/admin/planes-diarios` |
| `src/components/layout/AppSidebar.tsx` | Agregar enlace "Plan Diario" en topLevelItems |
| `src/components/mandatos/TimeEntryInlineForm.tsx` | Integrar validacion de plan antes de registrar |
| `src/components/timer/TimerAssignmentDialog.tsx` | Validar plan antes de guardar horas |

---

### Flujo Tecnico Detallado

#### 1. Validacion antes de registrar horas

```typescript
// src/hooks/useDailyPlanValidation.ts
export function useDailyPlanValidation() {
  const checkCanRegisterHours = async (date: Date): Promise<{
    allowed: boolean;
    reason?: string;
    planId?: string;
  }> => {
    const targetDate = format(date, 'yyyy-MM-dd');
    const today = format(new Date(), 'yyyy-MM-dd');
    
    // Si es para hoy o dias pasados, siempre permitir
    if (targetDate <= today) {
      return { allowed: true };
    }
    
    // Para dias futuros, verificar si existe plan enviado
    const { data: plan } = await supabase
      .from('daily_plans')
      .select('id, status')
      .eq('user_id', userId)
      .eq('planned_for_date', targetDate)
      .maybeSingle();
    
    if (!plan || plan.status === 'draft') {
      return { 
        allowed: false, 
        reason: 'Debes enviar tu plan diario antes de registrar horas para mañana' 
      };
    }
    
    return { allowed: true, planId: plan.id };
  };
  
  return { checkCanRegisterHours };
}
```

#### 2. Formulario de Plan Diario

El formulario permite:
- Agregar multiples tareas con estimacion
- Asociar cada tarea a un mandato (opcional)
- Establecer prioridad
- Ver total de horas planificadas
- Guardar como borrador o enviar

#### 3. Panel Admin

Vista con:
- Filtro por fecha (default: mañana)
- Filtro por usuario
- Filtro por estado
- Tabla con resumen de planes
- Acciones: Ver detalle, Aprobar, Rechazar, Agregar tarea

#### 4. Comparacion Plan vs Real

Widget que muestra:
- Horas planificadas vs registradas
- Tareas completadas vs pendientes
- Desviacion porcentual

---

### Migracion SQL

```sql
-- Crear tabla daily_plans
CREATE TABLE public.daily_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  planned_for_date DATE NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft' 
    CHECK (status IN ('draft', 'submitted', 'approved', 'rejected')),
  submitted_at TIMESTAMPTZ,
  approved_at TIMESTAMPTZ,
  approved_by UUID REFERENCES auth.users(id),
  admin_notes TEXT,
  user_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE (user_id, planned_for_date)
);

-- Crear tabla daily_plan_items
CREATE TABLE public.daily_plan_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id UUID NOT NULL REFERENCES public.daily_plans(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  estimated_minutes INTEGER NOT NULL DEFAULT 60,
  priority TEXT DEFAULT 'media' 
    CHECK (priority IN ('urgente', 'alta', 'media', 'baja')),
  mandato_id UUID REFERENCES public.mandatos(id) ON DELETE SET NULL,
  work_task_type_id UUID REFERENCES public.work_task_types(id) ON DELETE SET NULL,
  assigned_by_admin BOOLEAN DEFAULT FALSE,
  completed BOOLEAN DEFAULT FALSE,
  actual_time_entry_id UUID REFERENCES public.mandato_time_entries(id) ON DELETE SET NULL,
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indices
CREATE INDEX idx_daily_plans_user_date ON public.daily_plans(user_id, planned_for_date);
CREATE INDEX idx_daily_plans_status ON public.daily_plans(status);
CREATE INDEX idx_daily_plan_items_plan ON public.daily_plan_items(plan_id);

-- RLS
ALTER TABLE public.daily_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_plan_items ENABLE ROW LEVEL SECURITY;

-- Politicas para daily_plans
CREATE POLICY "Users can view own plans" ON public.daily_plans
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can insert own plans" ON public.daily_plans
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own draft plans" ON public.daily_plans
  FOR UPDATE USING (user_id = auth.uid() AND status = 'draft');

CREATE POLICY "Admins can view all plans" ON public.daily_plans
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.admin_users 
      WHERE user_id = auth.uid() 
      AND role IN ('admin', 'super_admin')
      AND is_active = TRUE
    )
  );

CREATE POLICY "Admins can update any plan" ON public.daily_plans
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.admin_users 
      WHERE user_id = auth.uid() 
      AND role IN ('admin', 'super_admin')
      AND is_active = TRUE
    )
  );

-- Politicas para daily_plan_items
CREATE POLICY "Users can manage own plan items" ON public.daily_plan_items
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.daily_plans 
      WHERE id = daily_plan_items.plan_id 
      AND user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can manage all plan items" ON public.daily_plan_items
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.admin_users 
      WHERE user_id = auth.uid() 
      AND role IN ('admin', 'super_admin')
      AND is_active = TRUE
    )
  );
```

---

### Componentes de UI

#### DailyPlanForm

```text
┌────────────────────────────────────────────────────────────────┐
│  Plan para: Martes 28 de Enero                                 │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│  ┌────────────────────────────────────────────────────────────┐│
│  │ + Agregar tarea                                            ││
│  └────────────────────────────────────────────────────────────┘│
│                                                                │
│  ┌────────────────────────────────────────────────────────────┐│
│  │ ☐ Preparar teaser Mandato X           │ 2h │ Alta │ [🗑]  ││
│  ├────────────────────────────────────────────────────────────┤│
│  │ ☐ Reunión con inversores             │ 1.5h│ Alta │ [🗑]  ││
│  ├────────────────────────────────────────────────────────────┤│
│  │ ☐ Due Diligence financiero Acme      │ 3h │ Media│ [🗑]  ││
│  ├────────────────────────────────────────────────────────────┤│
│  │ ⭐ Llamada CEO Target (admin)         │ 1h │ Urgente│      ││
│  └────────────────────────────────────────────────────────────┘│
│                                                                │
│  Total planificado: 7.5h                                       │
│                                                                │
│  Notas: [                                           ]          │
│                                                                │
│  [Guardar Borrador]              [Enviar Plan ✓]               │
│                                                                │
└────────────────────────────────────────────────────────────────┘
```

#### AdminPlanReviewPanel

```text
┌────────────────────────────────────────────────────────────────┐
│  Planes del Equipo - Martes 28 Enero 2025                      │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│  [📅 Fecha ▼] [👤 Usuario ▼] [📊 Estado ▼]                     │
│                                                                │
│  ┌────────────────────────────────────────────────────────────┐│
│  │ Ana García          │ 5 tareas │ 8.0h │ ✅ Enviado │ [Ver] ││
│  ├────────────────────────────────────────────────────────────┤│
│  │ Pedro López         │ 2 tareas │ 4.0h │ ⏳ Borrador│ [📧]  ││
│  ├────────────────────────────────────────────────────────────┤│
│  │ Carlos Ruiz         │ -        │ -    │ ❌ Sin plan│ [📧]  ││
│  └────────────────────────────────────────────────────────────┘│
│                                                                │
│  [+ Asignar tarea a usuario]                                   │
│                                                                │
└────────────────────────────────────────────────────────────────┘
```

---

### Navegacion

Agregar en `AppSidebar.tsx`:

```typescript
// En topLevelItems (siempre visible)
{ id: "plan-diario", title: "Plan Diario", url: "/plan-diario", icon: ClipboardList },

// En superAdminGroup
{ id: "planes-equipo", title: "Planes Equipo", url: "/admin/planes-diarios", icon: Users },
```

---

### Integracion con Time Tracking

Modificar `TimeEntryInlineForm.tsx` para:

1. Detectar si la fecha seleccionada es futura (mañana o mas)
2. Llamar a `useDailyPlanValidation().checkCanRegisterHours(date)`
3. Si no esta permitido, mostrar `DailyPlanBlocker` modal
4. Permitir crear plan desde el modal

---

### Mejoras Opcionales (Fase 2)

| Mejora | Descripcion |
|--------|-------------|
| Notificacion 17:00 | Edge function con cron que envia recordatorio |
| KPI Plan vs Real | Dashboard con metricas de adherencia |
| Alertas admin | Notificacion si usuario no envia plan |
| Convertir a Tarea | Boton para crear tarea real desde plan item |
| Arrastrar y soltar | Reordenar tareas del plan con drag-and-drop |

---

### Resumen de Entregables

1. **Migracion SQL**: Tablas `daily_plans` y `daily_plan_items` con RLS
2. **Pagina Usuario**: `/plan-diario` con formulario de planificacion
3. **Panel Admin**: `/admin/planes-diarios` con vista de equipo
4. **Validacion**: Bloqueo de registro de horas futuras sin plan
5. **Navegacion**: Enlaces en sidebar para ambas vistas
6. **Comparacion**: Widget Plan vs Real en ambas vistas
