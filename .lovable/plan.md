

## Plan: "Abrir día" y Edición de Horas en MisHoras

### Resumen

Transformar la vista de MisHoras para agrupar las entradas por día y permitir "abrir" cualquier día para editar entradas existentes o añadir nuevas, todo de forma inline sin necesidad de modales.

---

### 1. Nueva Estructura Visual

```
┌────────────────────────────────────────────────────────────────────┐
│ 📅 Lunes 27 Enero 2026                        4h 30m    [Abrir]   │
├────────────────────────────────────────────────────────────────────┤
│ 09:15 │ V-478 SELK │ Reunión │ Kick-off con cliente  │ 1h 30m     │
│ 11:00 │ V-382 OTEC │ IM      │ Preparar sección fin. │ 2h 00m     │
│ 14:30 │ Trabajo Gen│ Adminis │ Emails y llamadas     │ 1h 00m     │
└────────────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────────────┐
│ 📅 Domingo 26 Enero 2026                      0h        [Abrir]   │
├────────────────────────────────────────────────────────────────────┤
│ (Sin registros este día)                                           │
└────────────────────────────────────────────────────────────────────┘
```

**Al hacer clic en "Abrir día":**

```
┌────────────────────────────────────────────────────────────────────┐
│ 📅 Lunes 27 Enero 2026 (EDITANDO)             4h 30m    [Cerrar]  │
├────────────────────────────────────────────────────────────────────┤
│ ┌──────────────────────────────────────────────────────────────┐  │
│ │ 09:15 │ [Mandato ▼] │ [Tipo ▼] │ [Descripción____] │ 1h 30m │ ✓ │
│ └──────────────────────────────────────────────────────────────┘  │
│ ┌──────────────────────────────────────────────────────────────┐  │
│ │ 11:00 │ [Mandato ▼] │ [Tipo ▼] │ [Descripción____] │ 2h 00m │ ✓ │
│ └──────────────────────────────────────────────────────────────┘  │
│ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─  │
│ [+ Añadir entrada para este día]                                   │
│                                                                    │
│ [H:M] │ [Mandato ▼] │ [Tipo ▼] │ [Descripción____] │ [+ Añadir]   │
└────────────────────────────────────────────────────────────────────┘
```

---

### 2. Nuevo Componente: DayGroupedTimeEntries

Crear `src/components/mandatos/DayGroupedTimeEntries.tsx`:

**Props:**
```typescript
interface DayGroupedTimeEntriesProps {
  entries: TimeEntry[];
  currentUserId: string;
  isAdmin: boolean;
  onRefresh: () => void;
}
```

**Funcionalidades:**
- Agrupa entradas por fecha (`start_time`)
- Cada grupo muestra header con fecha, total de horas, y botón "Abrir día"
- Estado `openedDay: string | null` para controlar qué día está abierto
- Cuando un día está abierto, muestra filas editables

---

### 3. Componente: EditableTimeEntryRow

Crear `src/components/mandatos/EditableTimeEntryRow.tsx`:

**Props:**
```typescript
interface EditableTimeEntryRowProps {
  entry: TimeEntry;
  onSave: (updatedEntry: Partial<TimeEntry>) => Promise<void>;
  onCancel: () => void;
}
```

**Campos editables inline:**
| Campo | Control | Notas |
|-------|---------|-------|
| Hora inicio | `<Input type="time">` | Solo hora, fecha fija del día |
| Mandato | `<MandatoSelect>` | Reutilizar componente existente |
| Tipo tarea | `<Select>` | Filtrado por mandato seleccionado |
| Descripción | `<Input>` | Min 10 chars (validación existente) |
| Duración | `<Input>` H:M | Inputs separados para horas y minutos |

**Botones por fila:**
- ✓ Guardar (llama `updateTimeEntry`)
- ✕ Cancelar (restaura valores originales)

---

### 4. Componente: DayInlineAddForm

Crear `src/components/mandatos/DayInlineAddForm.tsx`:

**Props:**
```typescript
interface DayInlineAddFormProps {
  date: Date;  // Fecha fija del día abierto
  onSuccess: () => void;
}
```

**Comportamiento:**
- Similar a `TimeEntryInlineForm` pero con **fecha bloqueada**
- Solo permite modificar hora de inicio (dentro del mismo día)
- Hereda la fecha del día "abierto"
- Al crear, la entrada aparece inmediatamente en el día

---

### 5. Lógica de Agrupación

```typescript
// Agrupar por fecha
const groupedByDay = useMemo(() => {
  const groups: Record<string, TimeEntry[]> = {};
  
  entries.forEach(entry => {
    const dateKey = format(new Date(entry.start_time), 'yyyy-MM-dd');
    if (!groups[dateKey]) groups[dateKey] = [];
    groups[dateKey].push(entry);
  });
  
  // Ordenar días (más reciente primero)
  return Object.entries(groups)
    .sort(([a], [b]) => b.localeCompare(a))
    .map(([date, entries]) => ({
      date,
      entries: entries.sort((a, b) => 
        new Date(a.start_time).getTime() - new Date(b.start_time).getTime()
      ),
      totalMinutes: entries.reduce((sum, e) => sum + (e.duration_minutes || 0), 0)
    }));
}, [entries]);
```

---

### 6. Flujo de Usuario

```
Usuario abre MisHoras
         │
         ▼
   Vista agrupada por días
   (cada día colapsado con resumen)
         │
         ▼
   Clic en "Abrir día" del 27 Enero
         │
         ▼
   ┌─────────────────────────────────┐
   │ Entradas del día en modo edición│
   │ - Campos inline editables       │
   │ - Botón Guardar por fila        │
   │ - Formulario para añadir nuevas │
   └─────────────────────────────────┘
         │
         ▼
   Usuario modifica descripción de una entrada
         │
         ▼
   Clic en ✓ Guardar
         │
         ▼
   Se actualiza la entrada
   (feedback inmediato, sin cerrar día)
         │
         ▼
   Usuario añade nueva entrada
   (fecha heredada del día abierto)
```

---

### 7. Cambios en MisHoras.tsx

Reemplazar `CompactTimeEntriesTable` con `DayGroupedTimeEntries`:

```typescript
// ANTES:
<CompactTimeEntriesTable 
  entries={timeEntries} 
  currentUserId={currentUserId} 
  isAdmin={isAdmin} 
  onRefresh={loadMyTimeData}
  onEditEntry={(entry) => setEditingEntry(entry)}
/>

// DESPUÉS:
<DayGroupedTimeEntries
  entries={timeEntries}
  currentUserId={currentUserId}
  isAdmin={isAdmin}
  onRefresh={loadMyTimeData}
/>
```

Eliminar `TimeEntryEditDialog` (ya no necesario, edición es inline).

---

### 8. Validaciones

| Validación | Comportamiento |
|------------|----------------|
| Descripción < 10 chars | Mostrar contador, deshabilitar Guardar |
| Duración = 0 | Deshabilitar Guardar |
| Mandato vacío | Deshabilitar Guardar |
| Tipo tarea vacío | Deshabilitar Guardar |

---

### Resumen de Archivos

| Archivo | Cambio |
|---------|--------|
| **Nuevo:** `src/components/mandatos/DayGroupedTimeEntries.tsx` | Vista agrupada con "Abrir día" |
| **Nuevo:** `src/components/mandatos/EditableTimeEntryRow.tsx` | Fila editable inline |
| **Nuevo:** `src/components/mandatos/DayInlineAddForm.tsx` | Formulario para añadir en día abierto |
| `src/pages/MisHoras.tsx` | Usar nuevo componente, eliminar modal de edición |

---

### Sección Técnica

**Base de datos:** Sin cambios (usa `updateTimeEntry` existente)

**Componentes reutilizados:**
- `MandatoSelect` - selector de mandatos
- `useFilteredWorkTaskTypes` - tipos de tarea filtrados por mandato
- `updateTimeEntry` / `createTimeEntry` - servicios existentes

**Performance:**
- La agrupación se calcula con `useMemo` para evitar recálculos innecesarios
- Solo un día puede estar abierto a la vez (evita sobrecarga de formularios)
- Las actualizaciones son atómicas por fila

**UX:**
- Feedback inmediato tras guardar (toast + actualización visual)
- Campos con valores previos para edición rápida
- "Abrir día" funciona para cualquier día en el rango de filtros

