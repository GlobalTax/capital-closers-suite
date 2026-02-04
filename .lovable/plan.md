
# Notificación por Email cuando Supervisores Modifican Plan Diario

## Resumen
Implementar un sistema de notificación simple y robusto que envíe un email al propietario de un plan diario cuando ciertos supervisores (Lluis, Samuel) modifican sus tareas.

---

## Análisis del Modelo Actual

### Tablas Identificadas
| Tabla | Propósito | Campos Clave |
|-------|-----------|--------------|
| `daily_plans` | Plan por usuario/fecha | `id`, `user_id` (propietario), `planned_for_date` |
| `daily_plan_items` | Tareas del plan | `id`, `plan_id`, `title`, `created_by` (vacío actualmente) |
| `admin_users` | Usuarios del sistema | `user_id`, `email`, `full_name` |

### Emails de Supervisores Autorizados
Basado en los datos reales de la base de datos:
- `lluis@capittal.es` ✓ (confirmado)
- `samuel@capittal.es` → No existe. Alternativas: `s.navarro@nrro.es` o `s.navarro@obn.es`

**Decisión**: Crear tabla configurable para emails autorizados en lugar de hardcodear.

---

## Arquitectura de la Solución

```text
┌─────────────────────────────────────────────────────────────────────────────┐
│  Usuario modifica daily_plan_items (INSERT/UPDATE/DELETE)                   │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│  TRIGGER: notify_plan_modification_trigger                                  │
│  Condiciones:                                                               │
│   - editor_email está en daily_plan_authorized_editors                      │
│   - plan.user_id != auth.uid() (no es el propietario)                       │
│                                                                             │
│  Acción: Insertar registro en daily_plan_notifications (outbox)             │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│  Edge Function: send-plan-modification-email                                │
│  - Lee notificaciones pendientes (processed_at IS NULL)                     │
│  - Resuelve email del propietario desde admin_users                         │
│  - Envía email via send-email existente                                     │
│  - Marca como procesado                                                     │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│  Propietario del plan recibe email:                                         │
│  "Tu plan diario para 2026-02-05 ha sido modificado por Lluis"              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Componentes a Crear

### 1. Tabla: `daily_plan_authorized_editors`
Almacena los emails autorizados para disparar notificaciones.

| Columna | Tipo | Descripción |
|---------|------|-------------|
| id | uuid | PK |
| email | text | Email del editor autorizado |
| name | text | Nombre para mostrar |
| is_active | boolean | Si está activo |
| created_at | timestamptz | Fecha creación |

**Datos iniciales:**
- lluis@capittal.es → "Lluis Montanya"
- s.navarro@nrro.es → "Samuel Navarro" (ajustar si es otro email)

### 2. Tabla: `daily_plan_notifications` (outbox)
Cola de notificaciones pendientes de enviar.

| Columna | Tipo | Descripción |
|---------|------|-------------|
| id | uuid | PK |
| plan_id | uuid | FK a daily_plans |
| plan_owner_id | uuid | Usuario propietario del plan |
| editor_id | uuid | Usuario que hizo el cambio |
| editor_email | text | Email del editor |
| planned_for_date | date | Fecha del plan |
| operation | text | INSERT/UPDATE/DELETE |
| item_title | text | Título de la tarea afectada |
| created_at | timestamptz | Momento del cambio |
| processed_at | timestamptz | Cuándo se envió el email (NULL = pendiente) |
| error | text | Error si falló el envío |

### 3. Trigger Function: `notify_plan_modification()`

Lógica:
1. Obtener `plan_id` del item (NEW o OLD)
2. Obtener `user_id` del plan (propietario)
3. Obtener email del editor actual via `auth.uid()`
4. Verificar si editor está en `daily_plan_authorized_editors`
5. Verificar que `plan.user_id != auth.uid()` (no es auto-modificación)
6. Si cumple condiciones → INSERT en `daily_plan_notifications`

### 4. Edge Function: `send-plan-modification-email`

Proceso:
1. Query notificaciones donde `processed_at IS NULL`
2. Para cada notificación:
   - Resolver email del propietario desde `admin_users`
   - Generar email simple
   - Llamar a `send-email` existente
   - Marcar como `processed_at = now()`
3. Manejo de errores con retry

---

## Archivos a Crear

| Archivo | Descripción |
|---------|-------------|
| Migración SQL | Crear tablas + trigger + función |
| `supabase/functions/send-plan-modification-email/index.ts` | Edge function para enviar emails |

---

## Archivos a Modificar

Ninguno. La implementación es 100% server-side (trigger + edge function).

---

## Detalles Técnicos

### SQL del Trigger Function

```sql
CREATE OR REPLACE FUNCTION public.notify_plan_modification()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_plan_id UUID;
  v_plan_owner_id UUID;
  v_planned_for_date DATE;
  v_editor_id UUID;
  v_editor_email TEXT;
  v_item_title TEXT;
  v_is_authorized BOOLEAN;
BEGIN
  -- Get plan_id from the affected row
  v_plan_id := COALESCE(NEW.plan_id, OLD.plan_id);
  v_item_title := COALESCE(NEW.title, OLD.title);
  
  -- Get plan owner and date
  SELECT user_id, planned_for_date 
  INTO v_plan_owner_id, v_planned_for_date
  FROM daily_plans 
  WHERE id = v_plan_id;
  
  -- Get current user (editor)
  v_editor_id := auth.uid();
  
  -- Skip if editor is the plan owner (self-modification)
  IF v_editor_id = v_plan_owner_id THEN
    RETURN COALESCE(NEW, OLD);
  END IF;
  
  -- Get editor email
  SELECT email INTO v_editor_email
  FROM auth.users WHERE id = v_editor_id;
  
  -- Check if editor is authorized to trigger notifications
  SELECT EXISTS(
    SELECT 1 FROM daily_plan_authorized_editors 
    WHERE email = v_editor_email AND is_active = true
  ) INTO v_is_authorized;
  
  -- Only queue notification if editor is authorized
  IF v_is_authorized THEN
    INSERT INTO daily_plan_notifications (
      plan_id, plan_owner_id, editor_id, editor_email,
      planned_for_date, operation, item_title
    ) VALUES (
      v_plan_id, v_plan_owner_id, v_editor_id, v_editor_email,
      v_planned_for_date, TG_OP, v_item_title
    );
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$;
```

### Contenido del Email

**Asunto:** `Aviso: cambio en tu plan diario`

**Cuerpo (HTML simple):**
```html
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
  <h2>Aviso: cambio en tu plan diario</h2>
  <p>Tu plan diario para <strong>{fecha}</strong> ha sido modificado.</p>
  <p>Modificado por: <strong>{nombre_editor}</strong></p>
  <p style="margin-top: 20px;">
    <a href="https://crm-capittal.lovable.app/plan-diario">Ver mi plan</a>
  </p>
</div>
```

### Invocación del Edge Function

Dos opciones (implementaré ambas):

**Opción A - Cron cada 1 minuto (recomendada):**
```sql
SELECT cron.schedule(
  'process-plan-notifications',
  '* * * * *', -- cada minuto
  $$ SELECT net.http_post(...) $$
);
```

**Opción B - Invocación desde el trigger (alternativa):**
Usar `pg_net` directamente desde el trigger para invocar la edge function inmediatamente.

---

## Flujo de Pruebas

| Caso | Acción | Resultado Esperado |
|------|--------|-------------------|
| A | Lluis añade tarea al plan de Oriol | Oriol recibe email |
| B | Samuel elimina tarea del plan de Marc | Marc recibe email |
| C | Oriol modifica su propio plan | NO se envía email |
| D | Marc (no autorizado) modifica plan de otro | NO se envía email |
| E | Múltiples cambios rápidos | Se procesan todos, sin duplicados |

---

## Consideraciones de Seguridad

1. **RLS en tablas nuevas**: Solo super_admin puede gestionar editors autorizados
2. **SECURITY DEFINER**: El trigger accede a auth.users con privilegios elevados
3. **No datos sensibles**: El email solo contiene fecha y nombre del editor
4. **Idempotencia**: `processed_at` previene reenvíos

---

## Orden de Implementación

1. Crear migración con tablas + trigger + función
2. Insertar datos iniciales (editors autorizados)
3. Crear Edge Function send-plan-modification-email
4. Configurar cron job para procesar cola
5. Probar con cambio real de Lluis en plan de otro usuario
