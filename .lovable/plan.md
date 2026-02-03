
## Plan: Mostrar Quién da de Alta en el Registro de Actividad

### Problema Identificado

El timeline de actividad muestra "Usuario" genérico en **10 registros** (todos de tipo `tarea`) porque el trigger `log_checklist_activity` no está guardando quién hizo el cambio:

```sql
-- Trigger ACTUAL (sin created_by)
INSERT INTO mandato_activity (mandato_id, activity_type, activity_description, entity_id)
VALUES (...);

-- Debería ser:
INSERT INTO mandato_activity (mandato_id, activity_type, activity_description, entity_id, created_by)
VALUES (..., auth.uid());
```

| Trigger | ¿Guarda `created_by`? | Origen |
|---------|----------------------|--------|
| `log_time_entry_activity` | Si | `NEW.user_id` |
| `log_interaccion_activity` | Si | `NEW.created_by` |
| `log_documento_activity` | Si | `NEW.uploaded_by` |
| `log_checklist_activity` | **NO** | Falta `auth.uid()` |

---

### Solución

#### 1. Actualizar Trigger de Checklist

Modificar la función `log_checklist_activity` para capturar el usuario que hizo el cambio:

```sql
CREATE OR REPLACE FUNCTION public.log_checklist_activity()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.estado IS DISTINCT FROM OLD.estado THEN
    INSERT INTO public.mandato_activity 
      (mandato_id, activity_type, activity_description, entity_id, created_by)
    VALUES 
      (NEW.mandato_id, 'tarea', NEW.tarea || ' → ' || NEW.estado, NEW.id, auth.uid());
    
    UPDATE public.mandatos SET last_activity_at = now() WHERE id = NEW.mandato_id;
  END IF;
  RETURN NEW;
END;
$$;
```

#### 2. Backfill de Datos Históricos (Opcional)

Para las 10 tareas sin `created_by`, podemos intentar inferirlo desde el audit log:

```sql
-- Ver si hay datos en audit_log que nos ayuden
SELECT DISTINCT al.user_id, au.full_name
FROM audit_log al
JOIN admin_users au ON al.user_id = au.user_id
WHERE al.table_name = 'mandato_checklist_tasks'
LIMIT 10;
```

---

### Cambios a Realizar

| Tipo | Descripción |
|------|-------------|
| SQL Migration | Modificar función `log_checklist_activity` para incluir `auth.uid()` |
| Backfill (opcional) | Actualizar registros históricos sin `created_by` |

### Beneficios

1. **Trazabilidad completa**: Todas las actividades futuras tendrán el nombre del usuario
2. **Consistencia**: Los 4 tipos de actividad (hora, interaccion, documento, tarea) funcionarán igual
3. **Sin cambios en frontend**: El componente `MandatoActivityTimeline` ya maneja correctamente `created_by_user`

---

### Detalles Técnicos

**Migración SQL:**

```sql
-- Actualizar el trigger para capturar el usuario
CREATE OR REPLACE FUNCTION public.log_checklist_activity()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.estado IS DISTINCT FROM OLD.estado THEN
    INSERT INTO public.mandato_activity 
      (mandato_id, activity_type, activity_description, entity_id, created_by)
    VALUES 
      (NEW.mandato_id, 'tarea', NEW.tarea || ' → ' || NEW.estado, NEW.id, auth.uid());
    
    UPDATE public.mandatos 
    SET last_activity_at = now() 
    WHERE id = NEW.mandato_id;
  END IF;
  RETURN NEW;
END;
$$;
```

**A partir de ahora:**
- Cuando un usuario cambie el estado de una tarea del checklist
- El registro de actividad incluirá su ID en `created_by`
- El timeline mostrará su nombre en lugar de "Usuario"
