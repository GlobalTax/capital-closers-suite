
## Plan: Corregir Mandato de Compra y Mejorar UX del Formulario

### Problema Identificado

El mandato que creaste hoy se guardó con `tipo: venta` en lugar de `tipo: compra`. Por eso no aparece cuando filtras por "Compra".

**Datos del mandato creado:**
| Campo | Valor |
|-------|-------|
| ID | 98792af6-7e2c-40a9-b7cf-608c7f77103f |
| Tipo | **venta** (debería ser compra) |
| Categoria | operacion_ma |
| Estado | activo |
| Fecha | 2026-01-31 08:41:04 |

### Solución Inmediata

**Opción 1 - Manual:** Puedo corregir el mandato existente cambiando su tipo a "compra" directamente.

**Opción 2 - Código:** Implementar mejoras para evitar este problema en el futuro.

---

### Mejoras de UX Propuestas

#### 1. Pre-seleccionar tipo según la URL actual

Cuando el usuario está en `/mandatos?tipo=compra` y abre el drawer "Nuevo Mandato", pre-seleccionar automáticamente "Compra (Buy-Side)" en lugar de "Venta".

**Cambios:**

**Archivo:** `src/pages/Mandatos.tsx`
- Pasar el tipo de la URL al drawer

```tsx
<NuevoMandatoDrawer
  open={drawerOpen}
  onOpenChange={setDrawerOpen}
  onSuccess={cargarMandatos}
  defaultTipo={searchParams.get("tipo") === "compra" ? "compra" : undefined}
/>
```

**Archivo:** `src/components/mandatos/NuevoMandatoDrawer.tsx`
- Agregar prop `defaultTipo` y usarla en los valores por defecto del formulario

```tsx
interface NuevoMandatoDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
  defaultTipo?: "compra" | "venta"; // NUEVO
}

// En defaultValues del formulario:
defaultValues: {
  categoria: "operacion_ma",
  tipo: defaultTipo || "venta", // Usar prop si existe
  // ...
}
```

#### 2. Resaltar visualmente el tipo seleccionado

Hacer más prominente la selección del tipo de mandato para evitar errores:

- Agregar iconos distintivos (ShoppingCart para Compra, TrendingUp para Venta)
- Usar colores diferenciados (naranja para Buy-Side, azul para Sell-Side)
- Aumentar el tamaño del radio button

---

### Archivos a Modificar

| Archivo | Cambio |
|---------|--------|
| `src/pages/Mandatos.tsx` | Pasar `defaultTipo` al drawer basado en el parámetro de URL |
| `src/components/mandatos/NuevoMandatoDrawer.tsx` | Recibir y usar `defaultTipo` prop, mejorar diseño del selector de tipo |

---

### Verificación Post-Implementación

1. Ir a `/mandatos?tipo=compra`
2. Click en "Nuevo Mandato"
3. Verificar que "Compra (Buy-Side)" está **pre-seleccionado**
4. Crear el mandato
5. Verificar que aparece en la lista de mandatos de compra

---

### Sección Técnica

**Flujo actual:**
```text
Usuario en /mandatos?tipo=compra
    ↓
Click "Nuevo Mandato"
    ↓
Drawer abre con tipo="venta" (por defecto)
    ↓
Usuario no nota que está en "venta"
    ↓
Crea mandato con tipo="venta"
    ↓
Mandato no aparece en filtro de compra ❌
```

**Flujo corregido:**
```text
Usuario en /mandatos?tipo=compra
    ↓
Click "Nuevo Mandato"
    ↓
Drawer abre con tipo="compra" (heredado de URL) ← NUEVO
    ↓
Usuario ve "Compra" pre-seleccionado
    ↓
Crea mandato con tipo="compra"
    ↓
Mandato aparece en filtro de compra ✓
```

**Cambio en el hook useEffect para resetear el form:**
```tsx
// Cuando cambia defaultTipo, actualizar el form
useEffect(() => {
  if (open && defaultTipo) {
    form.setValue('tipo', defaultTipo);
  }
}, [open, defaultTipo]);
```
