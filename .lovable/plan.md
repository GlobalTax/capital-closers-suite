
## Plan: Logs de Actividades de Usuarios en Mandatos

### Objetivo

Mostrar un timeline visual de todas las actividades realizadas por los usuarios en cada mandato, aprovechando los datos ya existentes en la tabla `mandato_activity`.

### Estado Actual

| Elemento | Estado |
|----------|--------|
| Tabla `mandato_activity` | Existe y tiene datos (457+ registros) |
| Hook `useMandatoActivity()` | Existe pero NO se usa en MandatoDetalle |
| Service `fetchMandatoActivity()` | Existe pero NO incluye nombre del usuario |
| Componente de visualizacion | NO existe para mandatos |

### Tipos de Actividad Registrados

| Tipo | Cantidad | Descripcion |
|------|----------|-------------|
| `hora` | 283 | Registro de tiempo |
| `interaccion` | 118 | Llamadas, emails, reuniones |
| `documento` | 46 | Subida de archivos |
| `tarea` | 10 | Creacion/completar tareas |

---

### Cambios Propuestos

#### 1. Actualizar el Service para Incluir Usuario

Modificar `fetchMandatoActivity()` para hacer JOIN con `admin_users` y obtener el nombre del creador:

```typescript
// src/services/mandatoActivity.service.ts
export async function fetchMandatoActivity(mandatoId: string): Promise<MandatoActivityWithUser[]> {
  const { data, error } = await supabase
    .from('mandato_activity')
    .select(`
      *,
      created_by_user:admin_users!mandato_activity_created_by_fkey(user_id, full_name)
    `)
    .eq('mandato_id', mandatoId)
    .order('created_at', { ascending: false })
    .limit(50);
  // ...
}
```

#### 2. Extender el Tipo MandatoActivity

```typescript
// src/types/index.ts
export interface MandatoActivityWithUser extends MandatoActivity {
  created_by_user?: {
    user_id: string;
    full_name: string;
  };
}
```

#### 3. Crear Componente de Timeline

Nuevo componente `MandatoActivityTimeline.tsx` que muestre:

```
+------------------------------------------------------------------+
|  [Clock icon] Registro de Actividad                         [50] |
+------------------------------------------------------------------+
|                                                                  |
|  [hora]  Marc - Preparar teaser, pendiente revision              |
|  |       hace 15 dias                                            |
|  |                                                               |
|  [hora]  Lluis Montanya - Revision paquete de info...            |
|  |       hace 16 dias                                            |
|  |                                                               |
|  [doc]   Oriol - Subio documento NDA firmado                     |
|  |       hace 18 dias                                            |
|  |                                                               |
|  [interaccion] Marc - Llamada con cliente                        |
|          hace 20 dias                                            |
|                                                                  |
+------------------------------------------------------------------+
```

**Elementos del timeline:**
- Icono por tipo de actividad (Clock=hora, FileText=documento, MessageSquare=interaccion, CheckSquare=tarea)
- Color por tipo
- Avatar/iniciales del usuario
- Descripcion de la actividad
- Tiempo relativo (hace X dias/horas)
- Posibilidad de ver mas (paginacion o "Ver todos")

#### 4. Integrar en MandatoDetalle

Anadir nueva tab "Actividad" o seccion en "Resumen":

**Opcion A: Nueva Tab "Actividad"**
```tsx
<TabsTrigger value="actividad">
  <History className="w-4 h-4 mr-2" />
  Actividad
</TabsTrigger>

<TabsContent value="actividad">
  <MandatoActivityTimeline mandatoId={id!} />
</TabsContent>
```

**Opcion B: Seccion Colapsable en Resumen** (mas accesible)
```tsx
<ResumenTab mandato={mandato} ... />

<Collapsible defaultOpen={false}>
  <Card>
    <CardHeader>
      <CollapsibleTrigger>
        <CardTitle>Registro de Actividad</CardTitle>
      </CollapsibleTrigger>
    </CardHeader>
    <CollapsibleContent>
      <MandatoActivityTimeline mandatoId={id!} />
    </CollapsibleContent>
  </Card>
</Collapsible>
```

Recomiendo **Opcion A (nueva tab)** para mantener el detalle del mandato organizado.

---

### Archivos a Crear

| Archivo | Descripcion |
|---------|-------------|
| `src/components/mandatos/MandatoActivityTimeline.tsx` | Componente visual del timeline |

### Archivos a Modificar

| Archivo | Cambios |
|---------|---------|
| `src/services/mandatoActivity.service.ts` | Anadir JOIN con admin_users para nombre |
| `src/types/index.ts` | Anadir tipo `MandatoActivityWithUser` |
| `src/pages/MandatoDetalle.tsx` | Anadir nueva tab "Actividad" |

---

### Diseno Visual del Componente

```
+------------------------------------------------------------------+
|  TIMELINE DE ACTIVIDAD                                           |
+------------------------------------------------------------------+
|                                                                  |
|   [Clock]  Marc registro 1 hora                                  |
|      |     "Preparar teaser, pendiente revision"                 |
|      |     hace 15 dias                                          |
|      |                                                           |
|   [Clock]  Lluis Montanya registro 2.5 horas                     |
|      |     "Revision paquete de info recibido..."                |
|      |     hace 16 dias                                          |
|      |                                                           |
|   [File]   Oriol subio documento                                 |
|      |     "NDA firmado"                                         |
|      |     hace 18 dias                                          |
|      |                                                           |
|   [Message] Marc registro interaccion                            |
|            "Llamada con cliente - revision del deal"             |
|            hace 20 dias                                          |
|                                                                  |
+------------------------------------------------------------------+
```

### Iconos y Colores por Tipo

| Tipo | Icono | Color |
|------|-------|-------|
| `hora` | Clock | blue-500 |
| `interaccion` | MessageSquare | green-500 |
| `documento` | FileText | purple-500 |
| `tarea` | CheckSquare | orange-500 |
| `nota` | StickyNote | gray-500 |
| `estado_cambio` | RefreshCw | red-500 |

---

### Flujo de Datos

```
1. Usuario abre /mandatos/:id
   |
   v
2. MandatoDetalle carga con tabs existentes
   |
   v
3. Usuario hace clic en tab "Actividad"
   |
   v
4. useMandatoActivity(id) ejecuta query
   |
   v
5. fetchMandatoActivity() hace:
   SELECT *, admin_users.full_name
   FROM mandato_activity
   JOIN admin_users ON created_by = user_id
   WHERE mandato_id = :id
   ORDER BY created_at DESC
   LIMIT 50
   |
   v
6. MandatoActivityTimeline renderiza el timeline
```

---

### Beneficios

1. **Visibilidad completa**: Todo el equipo ve quien hizo que en cada mandato
2. **Accountability**: Queda registro de quien trabajo en que
3. **Contexto rapido**: Al abrir un mandato, puedes ver la actividad reciente
4. **Sin cambios en DB**: Usa datos que ya existen y se generan automaticamente
5. **Performance**: Lazy loading (solo carga cuando se abre la tab)

---

### Detalles Tecnicos

**Query optimizada:**
```sql
SELECT 
  ma.id,
  ma.activity_type,
  ma.activity_description,
  ma.entity_id,
  ma.created_at,
  au.full_name as created_by_name
FROM mandato_activity ma
LEFT JOIN admin_users au ON ma.created_by = au.user_id
WHERE ma.mandato_id = $1
ORDER BY ma.created_at DESC
LIMIT 50;
```

**Tiempo relativo con date-fns:**
```typescript
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';

formatDistanceToNow(new Date(activity.created_at), { 
  addSuffix: true, 
  locale: es 
})
// "hace 15 dias", "hace 2 horas"
```
