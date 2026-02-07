

# Fix: Boton "Ver y copiar plantilla" en Checklist Buy-Side

## Diagnostico

Tras revisar toda la cadena (componente, hook, servicio, RPC en Postgres, datos, RLS):

**Datos:** Existen 38 templates para `compra` y 32 para `venta`. Las fases existen. La RPC `copy_checklist_template_by_type` es `SECURITY DEFINER` (no hay problema de RLS). Los campos `NOT NULL` de `mandato_checklist_tasks` tienen defaults adecuados.

**Problema principal identificado:** La RPC `copy_checklist_template_by_type` **no tiene proteccion contra duplicados**. Si se ejecuta dos veces, inserta las 38 tareas duplicadas. Ademas, si hay un error durante la ejecucion, el `handleConfirm` en `ChecklistTemplateSelector` no muestra un toast de error al usuario --- el error se propaga pero la UI del dialog no reacciona bien.

**Problema secundario:** El hook `useChecklistDynamic` en `copyTemplate` no valida si ya existen tareas antes de llamar al RPC, y la funcion RPC tampoco lo hace.

## Cambios a realizar

### 1. Modificar la RPC `copy_checklist_template_by_type` (migracion SQL)

Agregar un check de idempotencia al inicio de la funcion:

```sql
-- Al inicio del cuerpo de la funcion, antes del loop:
-- Verificar si ya existen tareas copiadas para este mandato y tipo
IF EXISTS (
  SELECT 1 FROM mandato_checklist_tasks 
  WHERE mandato_id = p_mandato_id 
  AND tipo_operacion = p_tipo_operacion
  LIMIT 1
) THEN
  RETURN 0;  -- Ya copiado, retornar 0 sin insertar
END IF;
```

Esto reemplaza la funcion completa con la misma logica pero incluyendo el guard clause.

### 2. Frontend: Mejorar manejo de errores y feedback en `useChecklistDynamic.ts`

En la funcion `copyTemplate`:
- Si `count === 0`, mostrar toast informativo "La plantilla ya estaba copiada" en lugar del toast de exito.
- Agregar logs de diagnostico en dev.
- Asegurar que `refetch` se llame siempre (incluso si count es 0, para mostrar las tareas existentes).

### 3. Frontend: Mejorar `ChecklistTemplateSelector.tsx`

En `handleConfirm`:
- Envolver en try/catch con toast de error descriptivo.
- Ya tiene `confirming` state para deshabilitar el boton (correcto).

---

## Detalle tecnico

### Migracion SQL

Se ejecutara `CREATE OR REPLACE FUNCTION copy_checklist_template_by_type` con el guard clause de idempotencia. El resto de la logica permanece identica.

### Archivos modificados

| Archivo | Cambio |
|---------|--------|
| SQL migration | Agregar idempotencia a la RPC |
| `src/hooks/useChecklistDynamic.ts` | Toast diferenciado para count=0 vs count>0, logs dev |
| `src/components/mandatos/ChecklistTemplateSelector.tsx` | Toast de error en catch de handleConfirm |

### Sin cambios nuevos

No se agregan features. Solo se corrige:
1. Idempotencia en la RPC
2. Feedback correcto al usuario
3. Manejo de errores visible

