
## Plan: Vistas de Tareas "Equipo" y "Mis Tareas"

### Objetivo

Actualizar el módulo de tareas (`/tareas`) para tener dos vistas claras y conmutables:

| Vista | Descripción | Filtro |
|-------|-------------|--------|
| **Equipo** | Todas las tareas de todos los miembros del equipo | Sin filtro por usuario |
| **Mis Tareas** | Solo tareas asignadas a mí | `asignado_a = auth.uid()` |

### Estado Actual Identificado

1. **Esquema de BD**: La tabla `tareas` NO tiene `workspace_id`. El concepto de "equipo" está definido implícitamente por los usuarios en `admin_users` con `is_active = true`.

2. **RLS Actual**: Política `tareas_select_visibility` que permite:
   - Tareas `grupal`: visibles si `current_user_can_read()` (usuario activo en admin_users)
   - Tareas `individual`: solo visibles si eres creador, asignado, compartido, o `es_visible_equipo = true`

3. **UI Actual**: Existe un sistema de 3 tabs ("Mis Tareas", "Equipo", "Compartidas") pero con lógica de filtrado incorrecta basada en `tipo` de tarea.

4. **Datos existentes**: 34 tareas (33 individuales, 1 grupal) - la mayoría son individuales.

### Problema Principal

El modelo actual distingue "privacidad" de la tarea (`tipo: individual/grupal`), pero el usuario quiere que **todas las tareas del equipo sean visibles** para cualquier miembro, simplificando a:

- **Vista Equipo**: VER todas las tareas (independiente del tipo)
- **Vista Mis Tareas**: Solo las asignadas a mí

### Solución Propuesta

---

### Cambio 1: Actualizar RLS Policy

Simplificar la política SELECT para que todos los usuarios activos vean TODAS las tareas del equipo:

```sql
DROP POLICY IF EXISTS "tareas_select_visibility" ON tareas;

CREATE POLICY "Usuarios activos ven todas las tareas"
  ON tareas FOR SELECT
  TO authenticated
  USING (current_user_can_read());
```

Esto permite que cualquier usuario en `admin_users` con rol activo (viewer, admin, super_admin) vea todas las tareas. Las políticas de UPDATE/DELETE existentes ya controlan quién puede modificar.

---

### Cambio 2: Simplificar Tabs en UI

Reducir de 3 tabs a 2 tabs principales:

```
┌────────────────────────────────────────────────────────────────┐
│  [Equipo (34)]    [Mis Tareas (8)]                             │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│  [ ] Solo pendientes    [ ] Vencen hoy                         │
│                                                                │
│  [Filtros: Estado | Prioridad | Responsable]                   │
│                                                                │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ KANBAN / TABLA                                          │   │
│  │ (con columna Responsable visible en vista Equipo)       │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                │
└────────────────────────────────────────────────────────────────┘
```

---

### Cambio 3: Nueva Lógica de Filtrado Frontend

En `Tareas.tsx`, simplificar el filtro `tareasPorVisibilidad`:

```typescript
// ANTES (lógica compleja basada en tipo)
const tareasPorVisibilidad = tareas.filter((tarea) => {
  if (filtroTipo === "mis_tareas") {
    return tarea.creado_por === currentUser.id || tarea.asignado_a === currentUser.id;
  } else if (filtroTipo === "equipo") {
    return tarea.tipo === "grupal"; // ❌ Solo grupales
  } else if (filtroTipo === "compartidas") {
    return tarea.compartido_con?.includes(currentUser.id);
  }
});

// DESPUÉS (lógica simplificada)
const tareasPorVisibilidad = tareas.filter((tarea) => {
  if (vistaActiva === "mine") {
    return tarea.asignado_a === currentUser?.id;
  }
  // vista "team" = todas las tareas (sin filtro adicional)
  return true;
});
```

---

### Cambio 4: Quick-Assign en Vista Equipo

Añadir dropdown para asignar rápidamente desde las tarjetas/filas:

```
┌─────────────────────────────────────────────┐
│ 📋 Preparar teaser Empresa X               │
│ 🔴 Alta  |  📅 15 Feb                       │
│ ┌─────────────────────────────────────────┐│
│ │ Responsable: [Juan García ▾]            ││
│ │              ├─ María López             ││
│ │              ├─ Carlos Ruiz             ││
│ │              └─ Sin asignar             ││
│ └─────────────────────────────────────────┘│
└─────────────────────────────────────────────┘
```

---

### Cambio 5: Switches Adicionales

Añadir filtros rápidos opcionales:

| Switch | Descripción |
|--------|-------------|
| Solo pendientes | `estado IN ('pendiente', 'en_progreso')` |
| Vencen hoy | `fecha_vencimiento = today AND estado != 'completada'` |

---

### Archivos a Modificar

| Archivo | Cambios |
|---------|---------|
| `src/pages/Tareas.tsx` | Simplificar tabs (2 en vez de 3), nueva lógica de filtrado, añadir switches |
| `src/components/tareas/TareaCard.tsx` (inline) | Añadir quick-assign dropdown |
| **Migración SQL** | Actualizar RLS policy para SELECT |

### Archivos SIN Modificar

| Archivo | Razón |
|---------|-------|
| `src/services/tareas.service.ts` | No cambia - RLS filtra en BD |
| `src/hooks/queries/useTareas.ts` | No cambia - cache keys pueden mantenerse igual |
| `src/components/tareas/*.tsx` | Drawers de crear/editar no cambian |

---

### Migración SQL

```sql
-- Actualizar política SELECT para que todos los usuarios activos vean todas las tareas
DROP POLICY IF EXISTS "tareas_select_visibility" ON tareas;

CREATE POLICY "Usuarios activos ven todas las tareas del equipo"
  ON tareas FOR SELECT
  TO authenticated
  USING (current_user_can_read());
```

---

### Flujo de Datos

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                           FLUJO DE VISTAS                                    │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  1. Usuario abre /tareas                                                     │
│     └─► useTareas() → SELECT * FROM tareas (RLS: current_user_can_read())   │
│         └─► Devuelve TODAS las tareas del equipo                            │
│                                                                              │
│  2. Usuario selecciona tab                                                   │
│     ├─► "Equipo": muestra todas (sin filtro adicional)                      │
│     └─► "Mis Tareas": filtra en frontend por asignado_a = user.id           │
│                                                                              │
│  3. Usuario edita/completa tarea                                            │
│     └─► useUpdateTarea() → invalidateQueries(['tareas'])                    │
│         └─► Ambas vistas se actualizan automáticamente                      │
│                                                                              │
│  4. Usuario cambia asignación                                                │
│     └─► Si me asigno a mí → aparece en "Mis Tareas"                         │
│     └─► Si asigno a otro → sale de "Mis Tareas" (si estaba ahí)             │
│                                                                              │
└──────────────────────────────────────────────────────────────────────────────┘
```

---

### Casos de Prueba (QA)

| Escenario | Esperado |
|-----------|----------|
| Usuario A crea tarea asignada a Usuario B | Visible en "Equipo" para ambos. Solo en "Mis Tareas" para B |
| Usuario A crea tarea sin asignar | Visible en "Equipo" para todos. No aparece en "Mis Tareas" de nadie |
| Usuario cambia asignación de sí mismo a otro | Sale de su "Mis Tareas", entra en la del otro |
| Usuario de otro workspace (no en admin_users) | No ve ninguna tarea (RLS bloquea) |
| Cambiar estado a completada | Se refleja en ambas vistas inmediatamente |

---

### Contadores en Tabs

```typescript
const equipoCount = tareas.length;
const misTareasCount = tareas.filter(t => t.asignado_a === currentUser?.id).length;

// UI
<TabsTrigger value="team">Equipo ({equipoCount})</TabsTrigger>
<TabsTrigger value="mine">Mis Tareas ({misTareasCount})</TabsTrigger>
```

---

### Beneficios

1. **Simplificación**: 2 vistas claras en vez de 3 confusas
2. **Visibilidad completa**: Todo el equipo ve todas las tareas (transparencia)
3. **Quick-assign**: Asignación rápida sin abrir drawer
4. **RLS seguro**: Solo usuarios activos en admin_users ven tareas
5. **Sin duplicación**: Una sola query, filtro en frontend
6. **Consistencia**: Ediciones se reflejan en ambas vistas automáticamente
