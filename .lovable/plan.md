
## Plan: Corrección de Errores de Seguridad

### Resumen del Análisis

Se detectaron **129 issues de seguridad** en el proyecto, categorizados por severidad:

| Severidad | Cantidad | Tipo Principal |
|-----------|----------|----------------|
| CRITICAL | 3 | Datos expuestos sin RLS, tabla backup pública |
| ERROR | 10 | Vistas con SECURITY DEFINER |
| WARN | ~116 | Funciones sin search_path, políticas RLS permisivas |

---

### Fase 1: Issues Críticos (Prioridad Inmediata)

#### 1.1 Tabla Backup sin RLS - 147,934 Registros Expuestos

**Problema:** `contactos_backup_20260124` contiene 147,934 contactos con emails, teléfonos y datos personales sin ninguna protección RLS.

**Solución:** Eliminar la tabla backup (los datos ya están en `contactos` original).

```sql
DROP TABLE IF EXISTS public.contactos_backup_20260124;
```

**Alternativa (si necesita mantenerla):**
```sql
ALTER TABLE contactos_backup_20260124 ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Solo super_admin lee backups" ON contactos_backup_20260124
  FOR SELECT USING (public.current_user_role() = 'super_admin');
```

#### 1.2 Datos de Consultas de Adquisición Públicos

**Problema:** `company_acquisition_inquiries` expone nombres, emails, teléfonos de interesados en comprar empresas.

**Solución:** Verificar y reforzar RLS para que solo admins lean estos datos.

```sql
-- Verificar política actual y crear si no existe
CREATE POLICY "Solo admins leen inquiries" ON company_acquisition_inquiries
  FOR SELECT USING (public.current_user_can_read());
```

---

### Fase 2: Vistas con SECURITY DEFINER (10 Errores)

**Problema:** Las vistas con SECURITY DEFINER usan los permisos del creador, no del usuario consultante, bypasseando RLS.

**Vistas afectadas:**
- `mandato_time_summary`
- `task_time_summary`
- `v_active_alerts`
- `v_admin_users_safe`
- `v_api_usage_monthly`
- `v_brevo_sync_status`
- `v_cr_portfolio_con_actividad`
- `v_documentos_con_versiones`
- `v_email_queue_stats`
- `vw_mandate_pipeline`
- (y más...)

**Solución:** Recrear cada vista con `security_invoker = true`:

```sql
-- Ejemplo para v_mandatos_stuck
DROP VIEW IF EXISTS public.v_mandatos_stuck;
CREATE VIEW public.v_mandatos_stuck 
WITH (security_invoker = true)
AS
SELECT m.id, m.tipo, ...
FROM mandatos m
JOIN pipeline_stages ps ON ps.stage_key = m.pipeline_stage
WHERE m.estado NOT IN ('cerrado', 'cancelado') 
  AND m.last_activity_at < now() - interval '30 days'
ORDER BY EXTRACT(day FROM now() - m.last_activity_at) DESC;

-- Repetir para cada vista
```

---

### Fase 3: Funciones sin search_path (23 Warnings)

**Problema:** Funciones sin `search_path` explícito son vulnerables a ataques de schema poisoning.

**Funciones afectadas:**
- `auto_link_valuation_to_crm`
- `create_document_version`
- `create_mandato_folder_structure`
- `get_lead_ai_stats`
- `link_valuation_to_empresa`
- `log_campaign_cost_change`
- `normalize_company_name`
- Y otras...

**Solución:** Agregar `SET search_path = public` a cada función:

```sql
-- Ejemplo para normalize_company_name
CREATE OR REPLACE FUNCTION public.normalize_company_name(name text)
RETURNS text
LANGUAGE sql
IMMUTABLE
SET search_path = public
AS $$
  SELECT ... -- lógica existente
$$;
```

---

### Fase 4: Audit Log con Columnas Incorrectas

**Problema:** El Edge Function `delete-admin-user` usa columnas incorrectas para insertar en `admin_audit_log`:

| Columna usada | Columna correcta |
|---------------|------------------|
| `action` | `action_type` |
| `performed_by_user_id` | `admin_user_id` |
| `details` | `new_values` |

**Archivo:** `supabase/functions/delete-admin-user/index.ts` (líneas 142-154)

**Corrección:**
```typescript
const { error: auditError } = await supabaseClient
  .from('admin_audit_log')
  .insert({
    action_type: 'user_deleted',           // CORREGIDO
    admin_user_id: currentUser.id,         // CORREGIDO
    target_user_id: user_id,
    target_user_email: targetUser.email,   // AÑADIDO
    new_values: {                          // CORREGIDO
      email: targetUser.email,
      full_name: targetUser.full_name,
      role: targetUser.role,
      deleted_at: new Date().toISOString(),
    },
  });
```

---

### Fase 5: Políticas RLS Permisivas (~80 Warnings)

**Problema:** Múltiples políticas usan `WITH CHECK (true)` o `USING (true)` para INSERT/UPDATE/DELETE.

**Tablas afectadas (muestra):**
- `admin_users` (service_role_policy con ALL = true)
- `brevo_sync_log` (update con true)
- `buyer_contacts` (update con true)
- `campaigns` (insert/update/delete con true)
- `email_outbox` (service role ALL con true)

**Solución:** Reemplazar `true` con verificaciones de rol:

```sql
-- Ejemplo para campaigns
DROP POLICY IF EXISTS "Authenticated users can create campaigns" ON campaigns;
CREATE POLICY "Admins can create campaigns" ON campaigns
  FOR INSERT WITH CHECK (public.current_user_can_write());

DROP POLICY IF EXISTS "Authenticated users can update campaigns" ON campaigns;
CREATE POLICY "Admins can update campaigns" ON campaigns
  FOR UPDATE USING (public.current_user_can_write());
```

---

### Fase 6: Endpoint de Invitación sin Rate Limiting

**Problema:** `validate-invitation-token` expone email, nombre y rol sin autenticación, vulnerable a enumeración.

**Mitigación recomendada:**
1. Añadir rate limiting (máx 5 intentos/minuto por IP)
2. No exponer el rol en la respuesta
3. Logging de intentos fallidos

---

### Orden de Implementación Recomendado

```text
Día 1 - Críticos (Alto impacto, bajo esfuerzo)
├── 1. DROP contactos_backup_20260124
├── 2. Fix delete-admin-user audit log
└── 3. RLS en company_acquisition_inquiries

Día 2-3 - Vistas (Medio impacto, medio esfuerzo)
└── 4. Recrear 22 vistas con security_invoker

Día 4-5 - Funciones (Bajo impacto, medio esfuerzo)
└── 5. Añadir search_path a 23 funciones

Día 6+ - Políticas RLS (Variable)
└── 6. Revisar y reforzar ~80 políticas
```

---

### Archivos a Modificar

| Archivo | Cambio |
|---------|--------|
| `supabase/functions/delete-admin-user/index.ts` | Corregir nombres de columnas audit log |
| Nueva migración SQL | DROP backup, recrear vistas, fix funciones |

---

### Notas Técnicas

**Por qué `security_invoker = true` en vistas:**
- Con `security_definer` (default), la vista usa permisos del creador (postgres/service_role)
- Esto bypasea completamente RLS de las tablas subyacentes
- Con `security_invoker`, la vista respeta RLS del usuario que consulta

**Actualización de Postgres recomendada:**
El linter detectó que hay parches de seguridad disponibles para la versión actual de Postgres. Se recomienda actualizar desde el dashboard de Supabase: Settings > Infrastructure > Upgrade Postgres.
