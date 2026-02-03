
# Implementación: Vista de Targets Archivados

## Resumen
Crear una vista dedicada para visualizar y gestionar targets archivados, accesible desde el tab de Targets en mandatos Buy-Side, con opciones de restauración y gestión.

---

## Diseño de la Solución

### Comportamiento Actual
- El toggle "Archivados" en `TargetsTabBuySide.tsx` activa `showArchived` que incluye targets archivados en la lista general
- Los targets archivados se muestran mezclados con los activos cuando el toggle está activo
- No hay una vista dedicada ni forma fácil de ver solo los archivados

### Comportamiento Propuesto
- Al activar el toggle "Archivados", mostrar **únicamente** los targets archivados en una vista especializada
- Incluir información de cuándo y por quién fue archivado
- Añadir acciones masivas de restauración
- Mantener la posibilidad de ver el detalle del target para restaurar individualmente

---

## Cambios Técnicos

### 1. Nuevo Componente: `ArchivedTargetsView`
**Archivo:** `src/components/mandatos/buyside/ArchivedTargetsView.tsx`

Vista de tabla para targets archivados con:
- Columnas: Empresa, Sector, Fecha Archivado, Archivado Por, Acciones
- Botón de restauración por fila
- Empty state cuando no hay archivados
- Badge con conteo de archivados en el toggle

```text
┌──────────────────────────────────────────────────────────────────────────┐
│ ☐ │ Empresa          │ Sector    │ Archivado     │ Por      │ Acciones  │
├──────────────────────────────────────────────────────────────────────────┤
│ ☐ │ Target Corp      │ Tech      │ Hace 3 días   │ A.García │ Restaurar │
│ ☐ │ Another Inc      │ Finanzas  │ Hace 1 semana │ M.López  │ Restaurar │
└──────────────────────────────────────────────────────────────────────────┘
```

### 2. Modificar `TargetsTabBuySide.tsx`
**Cambios:**
- Importar nuevo componente `ArchivedTargetsView`
- Mejorar el toggle para mostrar conteo de archivados
- Cuando `showArchived === true`, mostrar solo `ArchivedTargetsView` en lugar del Kanban/Lista
- Ocultar el Funnel cuando se ven archivados (no aplica)
- Añadir lógica para filtrar solo archivados

```typescript
// Conteo de archivados
const archivedCount = useMemo(() => 
  targets.filter(t => t.is_archived).length, 
[targets]);

// Cuando showArchived está activo, filtrar SOLO archivados
const filteredTargets = useMemo(() => {
  if (showArchived) {
    return targets.filter(t => t.is_archived);
  }
  // ... resto de filtros existentes
}, [targets, showArchived, ...]);
```

### 3. Actualizar Toggle UI
Mostrar badge con conteo en el toggle de archivados:

```text
┌─────────────────────────┐
│ [🔘] Archivados (3)     │
└─────────────────────────┘
```

### 4. Servicio: Obtener Usuario que Archivó
**Archivo:** `src/services/targetArchive.service.ts`

Añadir función para obtener información del usuario que archivó (para mostrar nombre en la tabla).

---

## Estructura de Archivos

| Archivo | Acción | Descripción |
|---------|--------|-------------|
| `src/components/mandatos/buyside/ArchivedTargetsView.tsx` | Crear | Nuevo componente de vista de archivados |
| `src/features/mandatos/tabs/TargetsTabBuySide.tsx` | Modificar | Integrar vista de archivados y mejorar toggle |
| `src/types/index.ts` | Verificar | Asegurar que `MandatoEmpresaBuySide` incluye `archived_at` y `archived_by` |

---

## Flujo de Usuario

```text
1. Usuario navega a Targets de un mandato Buy-Side
2. Ve el toggle "Archivados" en la barra de herramientas
3. Activa el toggle:
   - Funnel se oculta (no aplica a archivados)
   - Kanban/Lista se reemplaza por ArchivedTargetsView
   - Ve tabla con todos los targets archivados
4. Click en "Restaurar" en una fila:
   - Target vuelve al pipeline activo
   - Desaparece de la vista de archivados
   - KPI "Targets Activos" incrementa en 1
5. Desactiva toggle para volver a vista normal
```

---

## Consideraciones

- **Performance**: La query actual ya trae todos los targets (archivados y no archivados), solo se filtra en frontend
- **Permisos**: Mantener consistencia con permisos existentes de archivado
- **UX**: Hacer clara la distinción visual entre vista de activos y vista de archivados
- **Información de auditoría**: Mostrar `archived_at` formateado y nombre del usuario `archived_by`

---

## Verificación Post-Implementación

1. Activar toggle "Archivados"
2. Verificar que solo se muestran targets archivados
3. Verificar que el Funnel se oculta
4. Click en "Restaurar" en un target
5. Confirmar que desaparece de la vista de archivados
6. Desactivar toggle y verificar que el target aparece en Kanban
7. Confirmar que KPI "Targets Activos" se incrementó
