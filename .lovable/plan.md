

# Filtro "Estado del Mandato" en Vista Kanban

## Situacion actual

La pagina `Mandatos.tsx` ya tiene un sistema de filtros (popover con checkboxes) que incluye "Estado" con los 5 valores posibles: **prospecto, activo, en_negociacion, cerrado, cancelado**. Este filtro ya se aplica tanto a la vista tabla como al kanban (ambas usan `mandatosFiltrados`).

Sin embargo, el filtro esta "escondido" dentro de un popover generico y no es prominente en la vista Kanban. La mejora consiste en anadir un **multi-select inline visible** directamente en la barra del Kanban.

## Nota sobre el ejemplo "Subir oportunidad a Dealsuite y ARX"

Ese texto corresponde a una **tarea del checklist**, no a un estado del mandato. Los estados reales del mandato en la base de datos son: `prospecto`, `activo`, `en_negociacion`, `cerrado`, `cancelado`. El filtro se implementara sobre estos valores reales.

## Cambios a realizar

### 1. Componente nuevo: `KanbanEstadoFilter.tsx`

Multi-select inline con chips/badges que muestra los estados disponibles:

- Boton "Estado" que despliega un dropdown con checkboxes
- Cada opcion muestra el label del estado con su badge de color
- Seleccion multiple (OR)
- Opcion "Todos" para limpiar
- Chips visibles debajo mostrando filtros activos
- Persistencia en localStorage (`kanban-estado-filter`)

### 2. Editar `src/pages/Mandatos.tsx`

- Anadir estado local `kanbanEstadoFilter: string[]` (inicializado desde localStorage)
- Cuando `vistaActual === "kanban"`, mostrar el componente `KanbanEstadoFilter` junto al boton "Configurar"
- En `mandatosFiltrados`, aplicar el filtro adicional de estado del kanban (ademas de los filtros existentes del panel)
- El filtro solo se aplica visualmente cuando estamos en vista kanban

### 3. Sin cambios backend

No se necesita RPC nuevo. Los mandatos ya se cargan con el campo `estado` y el filtrado se hace en frontend (ya funciona asi para todos los filtros existentes). El volumen de mandatos es bajo (decenas/cientos), no miles, asi que el filtrado client-side es eficiente.

## Detalle tecnico

| Archivo | Accion |
|---------|--------|
| `src/components/mandatos/KanbanEstadoFilter.tsx` | NUEVO - Multi-select inline para estados |
| `src/pages/Mandatos.tsx` | EDITAR - Integrar filtro en barra kanban + logica de filtrado |

### Estructura del componente KanbanEstadoFilter

```text
Props:
  - selectedEstados: string[]
  - onChange: (estados: string[]) => void

Render:
  [Popover trigger: "Estado del mandato" + badge count]
  [Popover content:]
    [ ] Todos (limpia seleccion)
    [x] Prospecto
    [x] Activo
    [ ] En negociacion
    [ ] Cerrado
    [ ] Cancelado
```

### Integracion en Mandatos.tsx

- Nuevo estado: `kanbanEstadoFilter` con persistencia en localStorage
- Se muestra junto al boton "Configurar" cuando `vistaActual === "kanban"`
- El filtro se aplica sobre `mandatosFiltrados` como paso adicional (no interfiere con los filtros del panel existente)

### Persistencia

Se usa localStorage con key `kanban-estado-filter` (patron ya usado en el CRM para columnas, densidad, etc.).

## Lo que NO cambia

- La logica del Kanban por fases del checklist / pipeline_stage sigue exactamente igual
- Los filtros existentes del panel popover siguen funcionando
- La vista tabla no se ve afectada
- No se modifican tablas ni RPCs
- No se toca la logica del checklist

