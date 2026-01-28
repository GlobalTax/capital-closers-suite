

## Plan: Filtrado Automático de Tipos de Tarea por Contexto

### Resumen

Implementar filtrado inteligente de tipos de tarea según el contexto del mandato seleccionado:

| Tipo de Mandato | Contextos Mostrados |
|-----------------|---------------------|
| **Mandato real** (M&A) | `mandate` + `all` |
| **Prospección Comercial** | `prospection` + `all` |
| **Proyectos internos** (BD, Reuniones, Admin) | `internal` + `all` |

---

### 1. Nuevo Contexto: `internal`

Añadir valor `internal` a la tabla `work_task_types`:

```sql
-- Actualizar constraint para incluir 'internal'
ALTER TABLE work_task_types
DROP CONSTRAINT IF EXISTS work_task_types_context_check;

ALTER TABLE work_task_types
ADD CONSTRAINT work_task_types_context_check
CHECK (context IN ('all', 'mandate', 'prospection', 'internal'));
```

**Actualizar interface TypeScript:**

```typescript
// src/services/workTaskTypes.service.ts
export type WorkTaskTypeContext = 'all' | 'mandate' | 'prospection' | 'internal';
```

---

### 2. Tipos de Tarea por Contexto Sugerido

| Tipo | Contexto Actual | Sugerencia |
|------|-----------------|------------|
| Potenciales Compradores/Vendedores | `mandate` | ✓ Mantener |
| IM, Teaser, Datapack | `mandate` | ✓ Mantener |
| Reunión/Puesta en Contacto | `all` | ✓ Mantener |
| Leads, Outbound | `all` | ✓ Mantener |
| Material Interno | `all` | Cambiar a `internal` |
| Estudios Sectoriales | `all` | ✓ Mantener |
| Llamada inicial, Email seguimiento... | `prospection` | ✓ Mantener |

---

### 3. Actualizar Hook useFilteredWorkTaskTypes

Modificar `src/hooks/useWorkTaskTypes.ts`:

```typescript
const PROSPECCION_PROJECT_ID = '00000000-0000-0000-0000-000000000004';

// Proyectos internos (sin Prospección, que tiene su propio contexto)
const INTERNAL_PROJECT_IDS = [
  '00000000-0000-0000-0000-000000000001', // Business Development
  '00000000-0000-0000-0000-000000000002', // Reuniones Internas
  '00000000-0000-0000-0000-000000000003', // Administrativo
];

export function useFilteredWorkTaskTypes(mandatoId: string | null) {
  const { data: workTaskTypes = [], isLoading } = useActiveWorkTaskTypes();
  
  const filteredTypes = useMemo(() => {
    if (!mandatoId) {
      // Sin mandato seleccionado: mostrar solo 'all'
      return workTaskTypes.filter(t => t.context === 'all');
    }
    
    if (mandatoId === PROSPECCION_PROJECT_ID) {
      // Prospección: mostrar 'prospection' + 'all'
      return workTaskTypes.filter(t => 
        t.context === 'prospection' || t.context === 'all'
      );
    }
    
    if (INTERNAL_PROJECT_IDS.includes(mandatoId)) {
      // Proyecto interno: mostrar 'internal' + 'all'
      return workTaskTypes.filter(t => 
        t.context === 'internal' || t.context === 'all'
      );
    }
    
    // Mandato real: mostrar 'mandate' + 'all'
    return workTaskTypes.filter(t => 
      t.context === 'mandate' || t.context === 'all'
    );
  }, [workTaskTypes, mandatoId]);
  
  return { data: filteredTypes, isLoading };
}
```

---

### 4. Corregir TimeTrackingDialog

Actualmente usa `useActiveWorkTaskTypes` (sin filtrar). Cambiar a `useFilteredWorkTaskTypes`:

**Antes:**
```typescript
const { data: workTaskTypes = [], isLoading: loadingWorkTaskTypes } = useActiveWorkTaskTypes();
```

**Después:**
```typescript
const { data: workTaskTypes = [], isLoading: loadingWorkTaskTypes } = useFilteredWorkTaskTypes(selectedMandatoId || mandatoId || null);
```

Además, resetear `workTaskTypeId` cuando cambia el mandato (como ya hacen los otros forms).

---

### 5. Verificar Formularios Existentes

Ya usan `useFilteredWorkTaskTypes` correctamente:

| Componente | Estado |
|------------|--------|
| `TimeEntryInlineForm.tsx` | ✓ Ya usa `useFilteredWorkTaskTypes(mandatoId)` |
| `TimerAssignmentDialog.tsx` | ✓ Ya usa `useFilteredWorkTaskTypes(mandatoId)` |
| `EditableTimeEntryRow.tsx` | ✓ Ya usa `useFilteredWorkTaskTypes(mandatoId)` |
| `DayInlineAddForm.tsx` | ✓ Ya usa `useFilteredWorkTaskTypes(mandatoId)` |
| `TimeTrackingDialog.tsx` | ❌ Usa `useActiveWorkTaskTypes` - **Corregir** |

---

### 6. Flujo de Usuario

```text
Usuario selecciona mandato
         │
         ├─ Mandato M&A (ej: SELK) ────────> Muestra: Teaser, IM, Datapack, Reunión...
         │
         ├─ Prospección Comercial ──────────> Muestra: Llamada inicial, Email, Demo...
         │
         ├─ Reuniones Internas ─────────────> Muestra: Material Interno, Reunión...
         │
         └─ Business Development ───────────> Muestra: Material Interno, Outbound...
```

**Ejemplo visual:**

```text
┌─────────────────────────────────────────────────────────────┐
│ Mandato: [Prospección Comercial ▼]                          │
│                                                             │
│ Tipo de tarea: [▼ Seleccionar...]                           │
│  ┌─────────────────────────────────┐                        │
│  │ Llamada inicial        (prosp)  │                        │
│  │ Email de seguimiento   (prosp)  │                        │
│  │ Reunión de captación   (prosp)  │                        │
│  │ Demo / Presentación    (prosp)  │                        │
│  │ Propuesta comercial    (prosp)  │                        │
│  │ Networking             (prosp)  │                        │
│  │─────────────────────────────────│                        │
│  │ Reunión / Contacto       (all)  │                        │
│  │ Leads                    (all)  │                        │
│  │ Outbound                 (all)  │                        │
│  └─────────────────────────────────┘                        │
└─────────────────────────────────────────────────────────────┘
```

---

### 7. UI Admin: Selector de Contexto

Opcional: En `/configuracion/tareas-tiempo`, añadir selector de contexto para cada tipo:

```typescript
<Select
  value={taskType.context}
  onValueChange={(value) => handleUpdateContext(taskType.id, value)}
>
  <SelectTrigger>
    <SelectValue />
  </SelectTrigger>
  <SelectContent>
    <SelectItem value="all">Todos</SelectItem>
    <SelectItem value="mandate">Solo Mandatos</SelectItem>
    <SelectItem value="prospection">Solo Prospección</SelectItem>
    <SelectItem value="internal">Solo Interno</SelectItem>
  </SelectContent>
</Select>
```

---

### Resumen de Archivos

| Archivo | Cambio |
|---------|--------|
| **Nueva migración SQL** | Añadir `internal` al constraint de `context` |
| `src/services/workTaskTypes.service.ts` | Actualizar tipo `WorkTaskTypeContext` |
| `src/hooks/useWorkTaskTypes.ts` | Mejorar lógica de filtrado con 3 contextos |
| `src/components/mandatos/TimeTrackingDialog.tsx` | Cambiar a `useFilteredWorkTaskTypes` |

---

### Sección Técnica

**Lógica de filtrado:**
- El hook determina el contexto basándose en IDs conocidos de proyectos internos
- Los tipos con `context = 'all'` siempre aparecen
- Los tipos específicos (`mandate`, `prospection`, `internal`) solo aparecen en su contexto

**Compatibilidad:**
- Los formularios existentes ya usan el hook, solo necesitan la nueva lógica
- TimeTrackingDialog requiere cambio explícito
- No hay breaking changes en la API

**Escalabilidad:**
- Si se añaden nuevos proyectos internos, solo hay que añadir su UUID a `INTERNAL_PROJECT_IDS`
- Los tipos de tarea pueden configurarse desde el admin

