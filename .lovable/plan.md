

## Plan: Arreglar Sistema de Interacciones en Targets

### Resumen del Problema

He confirmado el bug analizando los datos:

| Empresa | En Mandatos | Interacciones Totales | Problema |
|---------|-------------|----------------------|----------|
| Vergara Industrial | 2 mandatos diferentes | 4 (3 en uno, 1 en otro) | Se mezclan porque la query solo filtra por empresa_id |

**Causa raiz**: En `TargetsTab.tsx` linea 98 se usa `fetchInteraccionesByEmpresa(empresaId)` que ejecuta:

```sql
SELECT * FROM interacciones WHERE empresa_id = :empresaId
```

Esto ignora `mandato_id` y mezcla interacciones de diferentes mandatos.

---

### Solucion

La buena noticia es que **la tabla ya tiene `mandato_id`** correctamente guardado. Solo hay que:

1. Cambiar la query para filtrar por AMBOS campos
2. Anadir botones de editar/eliminar en el timeline

---

### Cambios Necesarios

#### 1. Nueva Funcion en Service (interacciones.ts)

Crear funcion que filtre por mandato_id + empresa_id:

```typescript
export const fetchInteraccionesByMandatoTarget = async (
  mandatoId: string, 
  empresaId: string
): Promise<Interaccion[]> => {
  const { data, error } = await supabase
    .from('interacciones')
    .select('*')
    .eq('mandato_id', mandatoId)
    .eq('empresa_id', empresaId)
    .order('fecha', { ascending: false });
  
  if (error) throw error;
  return (data || []) as Interaccion[];
};
```

#### 2. Actualizar TargetsTab.tsx

Cambiar de:
```typescript
const interacciones = await fetchInteraccionesByEmpresa(empresaId);
```

A:
```typescript
const interacciones = await fetchInteraccionesByMandatoTarget(mandato.id, empresaId);
```

#### 3. CRUD Completo en InteraccionTimeline.tsx

Anadir a cada item del timeline:

```
+---------------------------------------+
| [Email] Envio Teaser          [···]  |
| 20 enero 2026                 Editar |
|                               Eliminar
+---------------------------------------+
```

**Nuevo estado y handlers:**
- `editingId`: ID de interaccion en edicion
- `deletingId`: ID de interaccion pendiente de confirmar borrado
- Dialog de confirmacion para eliminar
- Modal o inline editor para editar

**Funcionalidad:**
- Editar: abre drawer con datos precargados, al guardar llama `updateInteraccion(id, data)`
- Eliminar: confirm dialog, llama `deleteInteraccion(id)`, elimina de lista sin refresh

---

### Archivos a Modificar

| Archivo | Cambios |
|---------|---------|
| `src/services/interacciones.ts` | Anadir `fetchInteraccionesByMandatoTarget(mandatoId, empresaId)` |
| `src/features/mandatos/tabs/TargetsTab.tsx` | Usar nueva funcion con mandato.id + empresa.id |
| `src/components/targets/InteraccionTimeline.tsx` | Anadir menu editar/eliminar, drawer edicion, dialog confirmacion |
| `src/hooks/queries/useInteracciones.ts` | Anadir hook `useMandatoTargetInteracciones(mandatoId, empresaId)` |

---

### UI del Timeline Mejorado

```
+------------------------------------------------------------------+
| Timeline de Interacciones                    [+ Nueva Interaccion]|
+------------------------------------------------------------------+
|                                                                  |
|  [Email icon]  Envio Datapack Inicial                     [···] |
|      |         13 enero 2026, 16:12                   ├─ Editar  |
|      |                                                └─ Eliminar|
|      |                                                           |
|  [Email icon]  Envio NDA firmado                          [···] |
|      |         19 diciembre 2025, 16:12                         |
|      |                                                           |
|  [Email icon]  Interes inicial i envio NDA                [···] |
|               16 diciembre 2025, 16:12                          |
|                                                                  |
+------------------------------------------------------------------+
```

---

### Drawer de Edicion

Reutilizar el mismo formulario del drawer de crear, pero:
- Titulo: "Editar Interaccion"
- Campos precargados con datos existentes
- Al guardar: `PATCH` con `updateInteraccion(id, data)`

---

### Dialog de Confirmacion Eliminar

```
+------------------------------------------+
|  Eliminar Interaccion                    |
+------------------------------------------+
|  Estas seguro de que quieres eliminar   |
|  esta interaccion? Esta accion no se    |
|  puede deshacer.                         |
|                                          |
|        [Cancelar]    [Eliminar]          |
+------------------------------------------+
```

---

### Flujo de Datos Corregido

```
1. Usuario abre /mandatos/:mandatoId tab Targets
   |
   v
2. Para cada empresa target:
   fetchInteraccionesByMandatoTarget(mandatoId, empresaId)
   |
   v
3. Query ejecuta:
   SELECT * FROM interacciones 
   WHERE mandato_id = :mandatoId 
     AND empresa_id = :empresaId
   ORDER BY fecha DESC
   |
   v
4. Solo se muestran interacciones de ESE mandato
   (no se mezclan con otros mandatos)
```

---

### Casos de Prueba

| Escenario | Resultado Esperado |
|-----------|-------------------|
| Vergara Industrial en Mandato A | Muestra solo 3 interacciones de A |
| Vergara Industrial en Mandato B | Muestra solo 1 interaccion de B |
| Crear interaccion en A | Aparece solo en A, no en B |
| Editar interaccion | Campos actualizados visibles inmediatamente |
| Eliminar interaccion | Desaparece de la lista sin refresh |
| Doble-click en eliminar | Solo ejecuta una vez (bloqueo UI) |

---

### Beneficios

1. **Aislamiento total**: Cada mandato ve SOLO sus interacciones
2. **CRUD completo**: Crear, ver, editar, eliminar
3. **Sin cambios en BD**: Aprovecha columna mandato_id existente
4. **RLS existente funciona**: Las policies ya permiten update/delete por created_by
5. **UX robusta**: Estados de carga, confirmaciones, feedback claro

