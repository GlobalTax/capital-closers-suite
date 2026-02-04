
# Añadir Confirmación antes de Archivar un Target

## Resumen
Agregar un diálogo de confirmación cuando el usuario hace click en "Archivar" para prevenir acciones accidentales.

---

## Cambio Propuesto

### Modificar `TargetDetailDrawer.tsx`

**1. Añadir estado para controlar el diálogo:**
```typescript
const [confirmArchiveOpen, setConfirmArchiveOpen] = useState(false);
```

**2. Importar el componente `ConfirmDialog`:**
```typescript
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
```

**3. Modificar el botón "Archivar":**
En lugar de llamar directamente a `onArchiveTarget`, abrir el diálogo de confirmación:

```typescript
onClick={() => {
  if (target.is_archived) {
    // Restaurar no necesita confirmación
    onUnarchiveTarget?.(target.id);
  } else {
    // Archivar requiere confirmación
    setConfirmArchiveOpen(true);
  }
}}
```

**4. Añadir el diálogo de confirmación:**
```typescript
<ConfirmDialog
  open={confirmArchiveOpen}
  onOpenChange={setConfirmArchiveOpen}
  titulo="¿Archivar este target?"
  descripcion={`El target "${empresa.nombre}" será excluido de los KPIs activos y del Kanban. Podrás restaurarlo más tarde desde la vista de archivados.`}
  onConfirmar={() => {
    onArchiveTarget?.(target.id);
    setConfirmArchiveOpen(false);
  }}
  textoConfirmar="Archivar"
  textoCancelar="Cancelar"
/>
```

---

## Flujo de Usuario

```text
1. Usuario click en botón "Archivar"
         ↓
2. Se abre diálogo: "¿Archivar este target?"
   - Descripción explica consecuencias
         ↓
3a. Click "Cancelar" → Diálogo se cierra, sin cambios
3b. Click "Archivar" → Se ejecuta la acción, drawer se cierra
```

---

## Archivo a Modificar

| Archivo | Cambio |
|---------|--------|
| `src/components/mandatos/buyside/TargetDetailDrawer.tsx` | Añadir estado, importar ConfirmDialog, mostrar diálogo antes de archivar |

---

## Verificación

1. Abrir drawer de un target
2. Click en "Archivar"
3. Verificar que aparece el diálogo de confirmación
4. Click "Cancelar" y verificar que no pasa nada
5. Click "Archivar" nuevamente → Confirmar → Verificar que se archiva correctamente
