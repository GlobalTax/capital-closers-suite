

# Plan: Fix de Scroll Vertical en /sync-valuations

## Diagnóstico

### Estructura Actual del Layout

```text
<html>
└── <body>
    └── <SidebarProvider>                  ← flex min-h-svh
        └── <div> (AppLayout outer)        ← flex min-h-screen w-full
            ├── <AppSidebar>               ← fixed h-svh (sidebar fijo)
            └── <div>                      ← flex-1 flex flex-col min-w-0
                ├── <Topbar>               ← sticky top-0 h-14
                └── <main>                 ← flex-1 overflow-x-hidden
                    └── <SyncValuations>   ← space-y-6 (contenido largo)
```

### Causa Raíz Identificada

El problema está en la combinación de clases CSS en `AppLayout.tsx`:

**Línea 14-18:**
```jsx
<div className="flex min-h-screen w-full bg-background">
  ...
  <div className="flex-1 flex flex-col min-w-0">
    <Topbar />
    <main className="flex-1 p-3 md:p-6 lg:p-8 overflow-x-hidden">
```

**El bug:** 
- El `main` tiene `flex-1` que lo expande, pero **NO tiene altura máxima definida** ni `overflow-y-auto`
- El contenedor padre tiene `min-h-screen` lo que **NO limita la altura máxima**
- El scroll del body/document funciona normalmente, **PERO** el contenedor `flex-1` puede comportarse de forma inesperada en ciertos navegadores cuando el contenido excede el viewport

**Verificación cruzada:**
- Otras páginas como `/empresas` y `/documentos` usan el mismo layout y deberían tener el mismo comportamiento
- Si el scroll funciona en esas páginas pero no en `/sync-valuations`, el problema puede estar en la interacción específica con los componentes de esa página

### Componentes Sospechosos en SyncValuations

Revisando `SyncValuations.tsx`, encontré:
- **Línea 271:** `<ScrollArea className="h-[300px]">` - Esto está bien contenido
- El resto del contenido no tiene restricciones de overflow

El problema más probable es que en ciertos estados del navegador o resoluciones, la combinación de:
1. `min-h-svh` en SidebarProvider
2. `min-h-screen` en AppLayout
3. `flex-1` sin `overflow-auto` en main

...causa que el documento no scrollee correctamente.

---

## Solución Recomendada

### Opción A: Fix en AppLayout (Recomendada)

Modificar el contenedor principal para asegurar scroll correcto:

**Cambio en `src/components/layout/AppLayout.tsx`:**

```jsx
// ANTES (línea 14-21)
<div className="flex min-h-screen w-full bg-background">
  <AppSidebar />
  <div className="flex-1 flex flex-col min-w-0">
    <Topbar />
    <main className="flex-1 p-3 md:p-6 lg:p-8 overflow-x-hidden">
      {children}
    </main>
  </div>
</div>

// DESPUÉS
<div className="flex min-h-screen w-full bg-background">
  <AppSidebar />
  <div className="flex-1 flex flex-col min-w-0 h-screen">
    <Topbar />
    <main className="flex-1 p-3 md:p-6 lg:p-8 overflow-x-hidden overflow-y-auto">
      {children}
    </main>
  </div>
</div>
```

**Cambios:**
1. Añadir `h-screen` al contenedor del contenido para limitar su altura
2. Añadir `overflow-y-auto` al `main` para permitir scroll interno

**Por qué funciona:**
- `h-screen` fija la altura del contenedor a 100vh
- `overflow-y-auto` permite scroll cuando el contenido excede esa altura
- El `flex-1` ahora trabaja dentro de un contenedor con altura fija

---

## Archivos a Modificar

| Archivo | Cambio |
|---------|--------|
| `src/components/layout/AppLayout.tsx` | Añadir `h-screen` al content wrapper y `overflow-y-auto` al main |

---

## Cambio Específico

**Archivo:** `src/components/layout/AppLayout.tsx`

**Línea 16:** Cambiar de:
```jsx
<div className="flex-1 flex flex-col min-w-0">
```
A:
```jsx
<div className="flex-1 flex flex-col min-w-0 h-screen">
```

**Línea 18:** Cambiar de:
```jsx
<main className="flex-1 p-3 md:p-6 lg:p-8 overflow-x-hidden">
```
A:
```jsx
<main className="flex-1 p-3 md:p-6 lg:p-8 overflow-x-hidden overflow-y-auto">
```

---

## Casos de Prueba

| Caso | Acción | Resultado Esperado |
|------|--------|-------------------|
| A | Abrir /sync-valuations con contenido largo | Scroll vertical funciona hasta el final |
| B | Scroll con ratón, trackpad y teclado | Todos los métodos funcionan |
| C | Reducir altura de ventana | Scroll sigue funcionando |
| D | Probar /empresas (página larga) | Scroll funciona igual que antes |
| E | Probar /documentos | Scroll funciona igual que antes |
| F | Probar /mandatos con muchos registros | Scroll funciona igual que antes |
| G | Probar en móvil (responsive) | Scroll táctil funciona |

---

## Resumen Técnico

| Elemento | Detalle |
|----------|---------|
| **Contenedor que bloqueaba** | `div.flex-1.flex.flex-col.min-w-0` sin altura límite |
| **Clase/regla cambiada** | Añadir `h-screen` al wrapper y `overflow-y-auto` al main |
| **Por qué funciona ahora** | El contenedor tiene altura fija (100vh) y el main permite scroll cuando el contenido excede esa altura |
| **Impacto en otras páginas** | Ninguno negativo - mejora la consistencia del scroll en todo el CRM |

