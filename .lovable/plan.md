

## Plan: Habilitar edición de Detalles del Mandato de Compra en Resumen

### Problema Identificado

La tarjeta "Detalles del Mandato de Compra" en la pestaña **Resumen** está vacía y no tiene forma de añadir o editar los criterios de inversión.

| Componente | Ubicación | Estado |
|------------|-----------|--------|
| `CriteriosInversionCard` | Pestaña Targets | Tiene botón "Editar" + estado vacío + conectado al drawer |
| `MandatoTipoEspecifico` | Pestaña Resumen | **NO tiene botón "Editar"** ni estado vacío |

### Solución

Añadir un botón "Editar" a la tarjeta `MandatoTipoEspecifico` y mostrar un estado vacío cuando no hay datos, similar a como funciona la `CriteriosInversionCard`.

---

### Cambios a Realizar

#### 1. Modificar `MandatoTipoEspecifico.tsx`

Añadir prop `onEdit` y mostrar botón de edición + estado vacío:

**Antes:**
```tsx
interface MandatoTipoEspecificoProps {
  mandato: Mandato;
}

export function MandatoTipoEspecifico({ mandato }: MandatoTipoEspecificoProps) {
```

**Después:**
```tsx
interface MandatoTipoEspecificoProps {
  mandato: Mandato;
  onEdit?: () => void;  // NUEVO
}

export function MandatoTipoEspecifico({ mandato, onEdit }: MandatoTipoEspecificoProps) {
```

**Añadir en el header de la tarjeta de Compra:**
```tsx
<CardHeader>
  <div className="flex items-center justify-between">
    <CardTitle className="flex items-center gap-2">
      <ShoppingCart className="h-5 w-5" />
      Detalles del Mandato de Compra
    </CardTitle>
    {onEdit && (
      <Button variant="ghost" size="sm" onClick={onEdit}>
        <Edit className="h-4 w-4 mr-1" />
        Editar
      </Button>
    )}
  </div>
</CardHeader>
```

**Añadir estado vacío al final del CardContent:**
```tsx
{/* Estado vacío si no hay datos */}
{!mandato.perfil_empresa_buscada && 
 !mandato.rango_inversion_min && 
 !mandato.rango_inversion_max && 
 (!mandato.sectores_interes || mandato.sectores_interes.length === 0) && 
 !mandato.timeline_objetivo && (
  <div className="text-center py-4">
    <p className="text-sm text-muted-foreground mb-2">
      No hay criterios de inversión definidos
    </p>
    {onEdit && (
      <Button variant="outline" size="sm" onClick={onEdit}>
        <Edit className="h-4 w-4 mr-1" />
        Definir criterios
      </Button>
    )}
  </div>
)}
```

#### 2. Modificar `ResumenTab.tsx`

Añadir prop para editar el mandato y pasarla al componente:

**Antes:**
```tsx
interface ResumenTabProps {
  mandato: Mandato;
  onAddContacto: () => void;
  onAsociarContacto: () => void;
  onUpdateEmpresa?: (...) => Promise<void>;
  onUpdateEmpresaText?: (...) => Promise<void>;
  onVincularEmpresa: () => void;
}
```

**Después:**
```tsx
interface ResumenTabProps {
  mandato: Mandato;
  onAddContacto: () => void;
  onAsociarContacto: () => void;
  onUpdateEmpresa?: (...) => Promise<void>;
  onUpdateEmpresaText?: (...) => Promise<void>;
  onVincularEmpresa: () => void;
  onEditMandato?: () => void;  // NUEVO
}
```

**Pasar la prop al componente:**
```tsx
{!isServicio && <MandatoTipoEspecifico mandato={mandato} onEdit={onEditMandato} />}
```

#### 3. Modificar `MandatoDetalle.tsx`

Pasar la función que abre el drawer de edición:

**Antes:**
```tsx
<ResumenTab
  mandato={mandato}
  onAddContacto={() => setOpenContactoDrawer(true)}
  onAsociarContacto={() => setOpenAsociarDialog(true)}
  onUpdateEmpresa={...}
  onUpdateEmpresaText={...}
  onVincularEmpresa={() => setVincularEmpresaOpen(true)}
/>
```

**Después:**
```tsx
<ResumenTab
  mandato={mandato}
  onAddContacto={() => setOpenContactoDrawer(true)}
  onAsociarContacto={() => setOpenAsociarDialog(true)}
  onUpdateEmpresa={...}
  onUpdateEmpresaText={...}
  onVincularEmpresa={() => setVincularEmpresaOpen(true)}
  onEditMandato={() => setEditarMandatoOpen(true)}  // NUEVO
/>
```

---

### Flujo Resultante

```text
Usuario en pestaña "Resumen" de mandato de Compra
    ↓
Ve tarjeta "Detalles del Mandato de Compra"
    ↓
Si está vacía: botón "Definir criterios"
Si tiene datos: botón "Editar" en el header
    ↓
Click → Se abre EditarMandatoDrawer
    ↓
Usuario rellena criterios de inversión
    ↓
Guarda → Los datos aparecen en la tarjeta
```

---

### Archivos a Modificar

| Archivo | Cambio |
|---------|--------|
| `src/components/mandatos/MandatoTipoEspecifico.tsx` | Añadir prop `onEdit`, botón de edición y estado vacío |
| `src/features/mandatos/tabs/ResumenTab.tsx` | Añadir prop `onEditMandato` y pasarla al componente |
| `src/pages/MandatoDetalle.tsx` | Pasar función para abrir el drawer de edición |

---

### Resultado Esperado

Después de implementar:
1. Ir a un mandato de **Compra**
2. En la pestaña **Resumen** ver "Detalles del Mandato de Compra"
3. Si está vacío: botón **"Definir criterios"** visible
4. Si tiene datos: botón **"Editar"** en el header
5. Click abre el drawer para editar los criterios de inversión

