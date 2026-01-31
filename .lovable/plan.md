

## Plan: Conectar edición de Criterios de Inversión

### Problema Identificado

Los criterios de inversión (rango, perfil buscado, sectores, timeline) **no se pueden editar** desde la tarjeta de "Criterios de Inversión" en la pestaña Targets porque el botón "Editar" no está conectado.

| Componente | Estado |
|------------|--------|
| `EditarMandatoDrawer.tsx` | ✅ Tiene los campos de inversión (líneas 390-472) |
| `CriteriosInversionCard.tsx` | ✅ Tiene botón "Editar" pero necesita `onEdit` prop |
| `TargetsTabBuySide.tsx` | ❌ No pasa `onEdit` al componente |
| `MandatoDetalle.tsx` | ⚠️ Solo permite editar desde el header general |

### Solución

Conectar el botón "Editar" de la tarjeta de Criterios de Inversión para abrir el drawer de edición del mandato.

---

### Cambios a Realizar

#### 1. Modificar `TargetsTabBuySide.tsx`

Añadir prop para manejar la edición del mandato:

**Antes:**
```tsx
interface TargetsTabBuySideProps {
  mandato: Mandato;
  onRefresh: () => void;
}
```

**Después:**
```tsx
interface TargetsTabBuySideProps {
  mandato: Mandato;
  onRefresh: () => void;
  onEditMandato?: () => void;  // NUEVO
}
```

**Línea 121 - Antes:**
```tsx
<CriteriosInversionCard mandato={mandato} />
```

**Después:**
```tsx
<CriteriosInversionCard 
  mandato={mandato} 
  onEdit={onEditMandato}  // NUEVO
/>
```

#### 2. Modificar `TargetsTab.tsx` (wrapper)

Pasar la prop `onEditMandato` al componente Buy-Side.

#### 3. Modificar `MandatoDetalle.tsx`

Pasar la función que abre el drawer de edición a la pestaña Targets:

**Línea 200 - Antes:**
```tsx
<TargetsTab mandato={mandato} onRefresh={refetch} />
```

**Después:**
```tsx
<TargetsTab 
  mandato={mandato} 
  onRefresh={refetch} 
  onEditMandato={() => setEditarMandatoOpen(true)}  // NUEVO
/>
```

---

### Flujo Resultante

```text
Usuario en pestaña "Targets" de mandato de Compra
    ↓
Ve tarjeta "Criterios de Inversión" (vacía o con datos)
    ↓
Click en "Editar" o "Definir criterios"
    ↓
Se abre EditarMandatoDrawer con sección "Criterios de Búsqueda"
    ↓
Usuario rellena: Inversión mín/máx, Perfil buscado, Timeline
    ↓
Guarda → Los criterios aparecen en la tarjeta ✓
```

---

### Archivos a Modificar

| Archivo | Cambio |
|---------|--------|
| `src/features/mandatos/tabs/TargetsTabBuySide.tsx` | Añadir prop `onEditMandato` y pasarla a `CriteriosInversionCard` |
| `src/features/mandatos/tabs/TargetsTab.tsx` | Pasar prop `onEditMandato` al componente Buy-Side |
| `src/pages/MandatoDetalle.tsx` | Pasar función para abrir el drawer de edición |

---

### Resultado Esperado

Después de implementar:
1. Ir a un mandato de **Compra**
2. Ir a la pestaña **Targets**
3. Ver la tarjeta "Criterios de Inversión"
4. Click en **"Editar"** o **"Definir criterios"**
5. Se abre el drawer con la sección "Criterios de Búsqueda"
6. Rellenar los campos y guardar
7. Los datos aparecen en la tarjeta

