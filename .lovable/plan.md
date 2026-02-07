
# Gestion de Plantillas de Checklist

## Resumen

Crear una pantalla central en **Gestion > Plantillas Checklists** para editar las plantillas globales de Sell-Side y Buy-Side. Se reutilizan las tablas existentes (`mandato_checklist_templates` y `checklist_fases`) sin crear nuevas tablas ni modificar el comportamiento actual de los mandatos.

## Arquitectura actual (sin cambios)

Las tablas ya existen y tienen RLS configurado:

- **`checklist_fases`** -- Fases/secciones (nombre, orden, color, tipo_operacion, activo)
- **`mandato_checklist_templates`** -- Tareas plantilla (fase, tarea, descripcion, responsable, sistema, orden, tipo_operacion, duracion_estimada_dias, es_critica, activo)
- **`mandato_checklist_tasks`** -- Tareas reales por mandato (copia de templates)

RLS ya permite a admin/super_admin gestionar ambas tablas. No se crean tablas nuevas.

## Cambios a realizar

### 1. Nueva pagina: `src/pages/PlantillasChecklist.tsx`

Pagina con dos tabs: **Sell-Side** (tipo_operacion = 'venta') y **Buy-Side** (tipo_operacion = 'compra').

Cada tab muestra:
- Las fases (secciones) ordenadas, con opcion de crear, editar nombre/color/orden, y eliminar (con confirmacion).
- Dentro de cada fase, las tareas plantilla con CRUD inline (titulo, descripcion, responsable, sistema, duracion, es_critica, orden).
- Reordenacion con botones arriba/abajo (ya hay `@dnd-kit` instalado, pero botones es mas simple y consistente con el patron existente).

### 2. Componentes nuevos

| Componente | Funcion |
|---|---|
| `src/pages/PlantillasChecklist.tsx` | Pagina principal con tabs Sell/Buy |
| `src/components/templates/ChecklistTemplateManager.tsx` | Manager para un tipo (venta o compra): lista fases + tareas |
| `src/components/templates/TemplatePhaseEditor.tsx` | Accordion de una fase con sus tareas y botones CRUD |
| `src/components/templates/TemplateTaskForm.tsx` | Formulario inline/dialog para crear/editar una tarea plantilla |
| `src/components/templates/TemplateSyncDialog.tsx` | Dialog para sincronizar mandatos existentes (accion manual) |

### 3. Servicio: `src/services/checklistTemplates.service.ts`

Funciones CRUD sobre las tablas existentes:
- `fetchFases(tipo)` / `createFase(data)` / `updateFase(id, data)` / `deleteFase(id)`
- `fetchTemplates(tipo)` / `createTemplate(data)` / `updateTemplate(id, data)` / `deleteTemplate(id)`
- `reorderFases(ids[])` / `reorderTemplates(ids[])`
- `syncTemplatesToMandatos(tipo, mode)` -- para el boton de sincronizacion manual

### 4. RPC para sincronizacion manual (migracion SQL)

```sql
-- Modo "solo anadir tareas nuevas que falten"
CREATE OR REPLACE FUNCTION sync_template_additions(p_tipo text)
RETURNS json ...
```

Logica:
- Busca mandatos activos del tipo dado que ya tengan tareas.
- Por cada mandato, inserta solo las tareas de la plantilla que no existan ya (comparacion por fase + tarea texto).
- Retorna `{ mandatos_updated, tasks_added }`.
- NO borra nada.

Para "re-sincronizar completo" (solo super_admin): borra tareas del mandato y re-copia. Requiere confirmacion doble en frontend.

### 5. Ruta y sidebar

**Ruta:** `/plantillas-checklist` con `requiredRole="admin"` en `App.tsx`.

**Sidebar:** Anadir entrada en el grupo "Gestion" (`menuGroups[2].items`):
```
{ id: "plantillas-checklist", title: "Plantillas Checklist", url: "/plantillas-checklist", icon: ClipboardList }
```

### 6. Validaciones

- No permitir fase sin nombre.
- No permitir tarea sin titulo.
- No permitir eliminar una fase que tenga tareas (avisar y ofrecer mover tareas o eliminar todo).
- Confirmacion antes de eliminar.
- Toast de exito/error en cada operacion.

### 7. Sincronizacion a mandatos existentes

Seccion al final de la pagina con:
- Boton "Aplicar a mandatos existentes" (solo visible para admin+).
- Dialog con dos opciones:
  - "Solo anadir tareas nuevas" (default, seguro)
  - "Re-sincronizar completo" (solo super_admin, confirmacion extra con texto "CONFIRMAR")
- Muestra preview de cuantos mandatos se afectaran antes de ejecutar.

### 8. Lo que NO cambia

- El checklist dentro de cada mandato sigue funcionando igual.
- La copia automatica a mandatos nuevos ya funciona via `copy_checklist_template_by_type` (con la idempotencia recien anadida).
- No se modifica el diseno del checklist del mandato.
- No se agregan campos nuevos fuera de lo descrito.

---

## Detalle tecnico - Archivos

| Archivo | Accion |
|---|---|
| `src/pages/PlantillasChecklist.tsx` | NUEVO - Pagina principal |
| `src/components/templates/ChecklistTemplateManager.tsx` | NUEVO - Manager por tipo |
| `src/components/templates/TemplatePhaseEditor.tsx` | NUEVO - Editor de fase |
| `src/components/templates/TemplateTaskForm.tsx` | NUEVO - Form tarea |
| `src/components/templates/TemplateSyncDialog.tsx` | NUEVO - Dialog sincronizacion |
| `src/services/checklistTemplates.service.ts` | NUEVO - CRUD service |
| `src/App.tsx` | EDITAR - Anadir ruta + lazy import |
| `src/components/layout/AppSidebar.tsx` | EDITAR - Anadir item en grupo Gestion |
| Migracion SQL | NUEVA - RPC sync_template_additions + sync_template_full_reset |

## Flujo de usuario

1. Admin abre Gestion > Plantillas Checklist
2. Selecciona tab Sell-Side o Buy-Side
3. Ve las fases con sus tareas actuales
4. Puede anadir/editar/eliminar fases y tareas, reordenar
5. Los cambios se guardan directamente en `checklist_fases` y `mandato_checklist_templates`
6. Mandatos nuevos usaran automaticamente la plantilla actualizada
7. Opcionalmente, puede sincronizar mandatos existentes con el boton manual
