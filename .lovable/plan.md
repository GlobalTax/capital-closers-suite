

## Plan: Cambiar desplegables de tabla a cerrados por defecto

### Problema

Actualmente, cuando cargas la tabla de mandatos en la sección "Compra", todas las filas que tienen contenido expandible (targets) aparecen **abiertas por defecto**, lo que resulta visualmente abrumador.

### Solución

Modificar el componente `DataTableEnhanced.tsx` para que las filas expandibles empiecen **cerradas** por defecto en lugar de abiertas.

---

### Cambio a realizar

**Archivo:** `src/components/shared/DataTableEnhanced.tsx`

**Líneas 73-81 - Antes:**
```tsx
// Expandir automáticamente todas las filas expandibles al cargar
useEffect(() => {
  if (expandable && isRowExpandable) {
    const expandableIds = data
      .filter(row => isRowExpandable(row))
      .map(row => row.id);
    setExpandedRows(new Set(expandableIds));
  }
}, [data, expandable, isRowExpandable]);
```

**Después:**
```tsx
// Inicializar filas cerradas por defecto
// El usuario puede expandirlas manualmente haciendo click
```

Simplemente eliminar el `useEffect` que expande automáticamente las filas. El estado inicial `expandedRows` ya es un `Set` vacío (línea 71), por lo que las filas empezarán cerradas.

---

### Resultado esperado

| Antes | Después |
|-------|---------|
| Todas las filas con targets abiertas automáticamente | Todas las filas cerradas por defecto |
| Visualmente abrumador | Tabla más limpia y ordenada |
| Usuario debe cerrar manualmente | Usuario abre solo lo que necesita |

---

### Archivo a modificar

| Archivo | Cambio |
|---------|--------|
| `src/components/shared/DataTableEnhanced.tsx` | Eliminar el `useEffect` que expande filas automáticamente |

