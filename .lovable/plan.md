
## Plan: Mejoras UX en Formulario Nuevo Mandato

### Resumen de Cambios

Este plan implementa tres mejoras en el formulario "Nuevo Proyecto" para mandatos M&A:

| Mejora | Descripción |
|--------|-------------|
| 1. Eliminar campo "Probabilidad" | No es necesario al crear un mandato, se puede establecer después |
| 2. Formatear "Valor Estimado" | Mostrar separadores de miles (1.000.000 en vez de 1000000) |
| 3. Ancho completo del campo Valor | Al eliminar probabilidad, el valor ocupa todo el ancho |

---

### Cambios en el Formulario

**Archivo:** `src/components/mandatos/NuevoMandatoDrawer.tsx`

#### 1. Eliminar Campo Probabilidad

**Estado Actual (líneas 562-580):**
```tsx
<FormField
  control={form.control}
  name="probabilidad"
  render={({ field }) => (
    <FormItem>
      <FormLabel>Probabilidad (%)</FormLabel>
      <FormControl>
        <Input 
          type="number" 
          min={0} 
          max={100} 
          placeholder="50" 
          {...field} 
        />
      </FormControl>
      <FormMessage />
    </FormItem>
  )}
/>
```

**Cambio:** Eliminar completamente este campo del formulario. El mandato se creará con una probabilidad por defecto (50%), que el usuario puede modificar después si lo necesita.

#### 2. Campo Valor a Ancho Completo

**Estado Actual (líneas 545-581):**
```tsx
{/* Valor y Probabilidad (solo para M&A) */}
{!isServicio && (
  <div className="grid grid-cols-2 gap-4">
    <FormField name="valor" ... />
    <FormField name="probabilidad" ... />
  </div>
)}
```

**Cambio:** Cambiar de `grid-cols-2` a un solo campo sin grid.

#### 3. Formatear Valor con Separadores de Miles

**Estado Actual:**
- Input tipo texto sin formateo
- El usuario escribe "1000000" y ve "1000000"

**Cambio:**
- Implementar formateo en vivo mientras el usuario escribe
- "1000000" se muestra como "1.000.000"
- Al guardar, se limpia el formato y se envía el número puro

**Lógica de formateo:**
```tsx
// Formatear número con separadores de miles (formato español)
const formatValue = (value: string) => {
  const numericValue = value.replace(/[^\d]/g, '');
  if (!numericValue) return '';
  return parseInt(numericValue).toLocaleString('es-ES');
};

// En el onChange del input
onChange={(e) => {
  const formatted = formatValue(e.target.value);
  field.onChange(formatted);
}}
```

---

### Detalle Técnico

**Modificaciones en `NuevoMandatoDrawer.tsx`:**

1. **Línea 55:** Mantener `probabilidad` en el schema pero hacerlo opcional y con valor por defecto (no requiere cambio, ya es opcional)

2. **Líneas 545-581:** Reemplazar el grid de 2 columnas por un solo campo de valor formateado

3. **Nuevo código para el campo Valor:**
```tsx
{/* Valor Estimado (solo para M&A) */}
{!isServicio && (
  <FormField
    control={form.control}
    name="valor"
    render={({ field }) => (
      <FormItem>
        <FormLabel>Valor Estimado (€)</FormLabel>
        <FormControl>
          <Input 
            placeholder="Ej: 2.500.000"
            value={field.value || ''}
            onChange={(e) => {
              // Extraer solo dígitos
              const numericValue = e.target.value.replace(/[^\d]/g, '');
              if (!numericValue) {
                field.onChange('');
                return;
              }
              // Formatear con separadores de miles
              const formatted = parseInt(numericValue).toLocaleString('es-ES');
              field.onChange(formatted);
            }}
          />
        </FormControl>
        <FormMessage />
      </FormItem>
    )}
  />
)}
```

4. **Línea 192:** Ya existe la lógica para limpiar el formato al guardar:
```tsx
valor: data.valor ? Number(data.valor.replace(/[^0-9]/g, '')) : undefined,
```

---

### Resultado Visual

**Antes:**
```
┌─────────────────────────────┬─────────────────────────────┐
│ Valor Estimado (€)          │ Probabilidad (%)            │
│ [1000000                  ] │ [50                       ] │
└─────────────────────────────┴─────────────────────────────┘
```

**Después:**
```
┌─────────────────────────────────────────────────────────────┐
│ Valor Estimado (€)                                          │
│ [1.000.000                                                ] │
└─────────────────────────────────────────────────────────────┘
```

---

### Archivos a Modificar

| Archivo | Cambio |
|---------|--------|
| `src/components/mandatos/NuevoMandatoDrawer.tsx` | Eliminar campo probabilidad, reformatear campo valor |

---

### Verificación Post-Implementación

1. Abrir el formulario "Nuevo Proyecto" → seleccionar "Operación M&A"
2. Verificar que NO aparece el campo "Probabilidad (%)"
3. Escribir "1000000" en el campo Valor → debe mostrarse como "1.000.000"
4. Crear el mandato → debe guardarse correctamente con el valor numérico
5. Verificar que el mandato se crea con probabilidad por defecto (50%)
