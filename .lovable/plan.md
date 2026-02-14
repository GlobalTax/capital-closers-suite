
# Siguiente ronda de mejoras del Plan Maestro

## Cambios a implementar

### 1. Unificar carpetas `tareas/` y `tasks/` (Fase 1.2)

Mover los 3 archivos de `src/components/tareas/` a `src/components/tasks/`:
- `NuevaTareaDrawer.tsx`
- `EditarTareaDrawer.tsx`
- `QuickAssignDropdown.tsx`

Actualizar los imports en `src/pages/Tareas.tsx` (unico archivo que los usa) de `@/components/tareas/` a `@/components/tasks/`.

Eliminar la carpeta `src/components/tareas/`.

---

### 2. Reemplazar ultimo `window.confirm()` en Presentaciones.tsx (Fase 1.4)

En `src/pages/Presentaciones.tsx` linea 130 queda un `window.confirm()` nativo. Reemplazarlo con el hook `useConfirmAction` y el componente `ConfirmDialog`, igual que se hizo en Outbound, Mandatos y Servicios.

---

### 3. Breadcrumbs en mas paginas de detalle

Actualmente solo `MandatoDetalle` y `ContactoDetalle` tienen breadcrumbs. Extender `PageBreadcrumb` a:
- **Presentaciones** (pagina de listado con titulo)
- **Tareas** (pagina de listado)
- **Documentos** (pagina de listado)

---

### 4. Tests unitarios para servicios criticos (inicio Fase 1.1)

Crear los primeros tests del proyecto en `src/test/`:
- `mandatos.test.ts` - Tests para `fetchMandatos`, `createMandato`, `updateMandato`, `deleteMandato`
- `empresas.test.ts` - Tests para `fetchEmpresas`, `createEmpresa`, `updateEmpresa`, `deleteEmpresa`
- `error-handler.test.ts` - Tests para `handleError` con distintos tipos de error

Cada test mockea el cliente de Supabase y valida que los servicios llaman correctamente a `.from()`, `.select()`, `.insert()`, etc.

---

## Detalle tecnico

**Unificacion de carpetas**: Solo requiere mover archivos y actualizar 3 imports en `Tareas.tsx`.

**ConfirmDialog en Presentaciones**: Importar `useConfirmAction` y `ConfirmDialog`, reemplazar `if (window.confirm(...))` por `requestConfirm(titulo, callback)`, y renderizar el `ConfirmDialog` en el JSX.

**Tests**: Usaran el setup existente en `tests/setup.ts` que ya mockea `supabase.from()`, `toast`, y `handleError`. Se seguira la convencion de Vitest con `describe/it/expect`.
