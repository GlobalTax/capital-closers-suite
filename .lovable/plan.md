
## Plan: Mostrar Tipos de Tarea 'internal' para Proyectos Internos

### Diagnóstico Actual

| Componente | Estado |
|------------|--------|
| Hook `useFilteredWorkTaskTypes` | Filtra proyectos internos mostrando SOLO `context='all'` |
| Base de datos | No existen tipos con `context='internal'` (solo `all`, `mandate`, `prospection`) |
| UI de configuración | Ya soporta crear tipos con `context='internal'` |

El código actual (líneas 67-69 de `useWorkTaskTypes.ts`):
```typescript
if (INTERNAL_PROJECT_IDS.includes(mandatoId)) {
  // Internal projects: show only 'all' context types (no specific internal types)
  return workTaskTypes.filter(t => t.context === 'all');
}
```

---

### Cambio Propuesto

#### 1. Modificar el hook `useFilteredWorkTaskTypes`

Cambiar la lógica para que proyectos internos (Business Development, Reuniones Internas, Administrativo) muestren tipos de tarea con `context='internal'` además de `context='all'`.

**Archivo:** `src/hooks/useWorkTaskTypes.ts`

**Antes (líneas 67-69):**
```typescript
if (INTERNAL_PROJECT_IDS.includes(mandatoId)) {
  // Internal projects: show only 'all' context types (no specific internal types)
  return workTaskTypes.filter(t => t.context === 'all');
}
```

**Después:**
```typescript
if (INTERNAL_PROJECT_IDS.includes(mandatoId)) {
  // Internal projects: show 'internal' + 'all' context types
  return workTaskTypes.filter(t => 
    t.context === 'internal' || t.context === 'all'
  );
}
```

---

#### 2. (Opcional) Crear tipos de tarea con context='internal'

Para que el cambio sea visible, se pueden crear tipos de tarea específicos para proyectos internos desde la UI de configuración (`/configuracion/tareas-tiempo`).

**Sugerencias de tipos de tarea internos:**

| Nombre | Contexto | Tipo Valor |
|--------|----------|------------|
| Formación Equipo | internal | bajo_valor |
| Reunión 1:1 | internal | bajo_valor |
| Planificación Interna | internal | bajo_valor |
| Soporte IT | internal | bajo_valor |
| Onboarding | internal | bajo_valor |

Esto se puede hacer manualmente desde la UI o mediante una migración SQL.

---

### Flujo Resultante

```text
Usuario selecciona proyecto en registro de horas:

┌─────────────────────────┬────────────────────────────────────┐
│ Proyecto Seleccionado   │ Tipos de Tarea Mostrados           │
├─────────────────────────┼────────────────────────────────────┤
│ Mandato real (M&A)      │ context='mandate' + context='all'  │
│ Prospección Comercial   │ context='prospection' + context='all' │
│ Business Development    │ context='internal' + context='all' │ ← NUEVO
│ Reuniones Internas      │ context='internal' + context='all' │ ← NUEVO
│ Administrativo          │ context='internal' + context='all' │ ← NUEVO
│ Ninguno seleccionado    │ context='all' solo                 │
└─────────────────────────┴────────────────────────────────────┘
```

---

### Archivos a Modificar

| Archivo | Cambio |
|---------|--------|
| `src/hooks/useWorkTaskTypes.ts` | Modificar lógica de filtrado para proyectos internos (2 líneas) |

---

### Verificación Post-Implementación

1. Ir a `/mis-horas` o dentro de un mandato → pestaña Horas
2. Seleccionar "Business Development" o "Reuniones Internas" en el selector de proyecto
3. Verificar que aparecen tipos de tarea con `context='internal'` (si existen) además de los `context='all'`
4. Crear un tipo de tarea con `context='internal'` desde `/configuracion/tareas-tiempo`
5. Verificar que el nuevo tipo aparece al seleccionar proyectos internos pero NO al seleccionar mandatos M&A
