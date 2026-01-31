
## Plan: Corregir la Pre-selección del Tipo de Mandato

### Problema Identificado

El código actual tiene dos problemas que impiden que el tipo "compra" se pre-seleccione correctamente:

| Problema | Ubicación | Descripción |
|----------|-----------|-------------|
| 1. `defaultValues` hardcodeado | Línea 125 | `tipo: "venta"` está fijo, ignora `defaultTipo` prop |
| 2. `form.reset()` sin parámetros | Línea 210 | Al resetear, vuelve a `tipo: "venta"` |

### Solución

**Archivo:** `src/components/mandatos/NuevoMandatoDrawer.tsx`

#### Cambio 1: Usar `defaultTipo` en los valores iniciales del form

**Antes (líneas 118-137):**
```tsx
const form = useForm<MandatoFormValues>({
  resolver: zodResolver(mandatoSchema),
  defaultValues: {
    categoria: "operacion_ma",
    // ...
    tipo: "venta", // PROBLEMA: hardcodeado
    // ...
  },
});
```

**Después:**
```tsx
const form = useForm<MandatoFormValues>({
  resolver: zodResolver(mandatoSchema),
  defaultValues: {
    categoria: "operacion_ma",
    // ...
    tipo: defaultTipo, // CORREGIDO: usa la prop
    // ...
  },
});
```

#### Cambio 2: Resetear el form con los valores correctos

**Antes (línea 210):**
```tsx
form.reset();
```

**Después:**
```tsx
form.reset({
  categoria: "operacion_ma",
  empresaId: "",
  nuevaEmpresa: "",
  nombre_proyecto: "",
  tipo: defaultTipo, // Mantener el tipo del contexto
  valor: "",
  probabilidad: 50,
  fechaCierreEsperada: "",
  descripcion: "",
  servicio_tipo: undefined,
  cliente_externo: "",
  honorarios_propuestos: undefined,
  estructura_honorarios: undefined,
  parent_mandato_id: "",
  vincular_operacion: false,
});
```

#### Cambio 3: Simplificar el useEffect (opcional pero recomendado)

El `useEffect` actual puede causar renders innecesarios. Vamos a mantenerlo pero asegurarnos de que solo actualice cuando realmente cambie el `defaultTipo`:

**Antes:**
```tsx
useEffect(() => {
  if (open) {
    cargarDatos();
    form.setValue('tipo', defaultTipo);
  }
}, [open, defaultTipo]);
```

**Después:**
```tsx
useEffect(() => {
  if (open) {
    cargarDatos();
    // Solo forzar el tipo si el form tiene un valor diferente
    const currentTipo = form.getValues('tipo');
    if (currentTipo !== defaultTipo) {
      form.setValue('tipo', defaultTipo);
    }
  }
}, [open, defaultTipo]);
```

---

### Corrección de Datos Existentes

También necesitamos corregir el mandato que ya se creó incorrectamente:

**SQL para ejecutar:**
```sql
UPDATE mandatos 
SET tipo = 'compra' 
WHERE id = 'd8e796f1-9a1b-451b-9e47-82c913080377';
```

---

### Flujo Corregido

```text
Usuario en /mandatos?tipo=compra
    ↓
Click "Nuevo Mandato"
    ↓
Drawer abre con defaultTipo="compra"
    ↓
useForm se inicializa con tipo="compra" ← CORREGIDO
    ↓
Usuario ve "Compra" pre-seleccionado ✓
    ↓
Crea mandato con tipo="compra" ✓
    ↓
form.reset() mantiene tipo="compra" ← CORREGIDO
    ↓
Mandato aparece en filtro de compra ✓
```

---

### Archivos a Modificar

| Archivo | Cambio |
|---------|--------|
| `src/components/mandatos/NuevoMandatoDrawer.tsx` | Usar `defaultTipo` en `defaultValues` y en `form.reset()` |

---

### Verificación Post-Implementación

1. Ir a `/mandatos?tipo=compra`
2. Click en "Nuevo Mandato"
3. Verificar que "Compra (Buy-Side)" está **pre-seleccionado visualmente**
4. Crear el mandato
5. Verificar que aparece inmediatamente en la lista de mandatos de compra
6. Abrir drawer de nuevo y verificar que sigue pre-seleccionado "Compra"
