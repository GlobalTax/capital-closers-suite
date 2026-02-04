
# Reporte Diario de Horas del Personal por Email

## Resumen
Implementar un sistema que envíe un reporte diario con las horas registradas del personal a una lista configurable de destinatarios (inicialmente Lluis@capittal.es y Samuel@capittal.es). Además, crear un panel en Admin para gestionar los destinatarios de este reporte.

---

## Arquitectura Propuesta

```text
┌─────────────────────────────────────────────────────────────────────────────┐
│  Cron Job (pg_cron) - Ejecuta diariamente a las 08:00                       │
│  └─> Llama a Edge Function "daily-hours-report"                             │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│  Edge Function: daily-hours-report                                          │
│  1. Consulta mandato_time_entries del día anterior                          │
│  2. Agrupa por usuario: nombre, horas totales, tipo de trabajo              │
│  3. Lee destinatarios de report_email_recipients (tipo = 'hours_daily')     │
│  4. Genera HTML con tabla resumen                                           │
│  5. Envía email usando send-email existente                                 │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│  Tabla: report_email_recipients (nueva)                                     │
│  ├─ id (uuid)                                                               │
│  ├─ report_type ('hours_daily' | 'hours_weekly' | 'pipeline' | ...)         │
│  ├─ email (text)                                                            │
│  ├─ name (text)                                                             │
│  ├─ is_active (boolean)                                                     │
│  └─ created_at/updated_at                                                   │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│  Página Admin: /admin/reportes-email                                        │
│  ├─ Lista de tipos de reporte disponibles                                   │
│  ├─ Añadir/eliminar destinatarios por tipo                                  │
│  ├─ Toggle activo/inactivo                                                  │
│  └─ Botón "Enviar prueba" para verificar                                    │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Componentes a Crear/Modificar

### 1. Base de Datos - Nueva tabla

**Tabla: `report_email_recipients`**

| Columna | Tipo | Descripción |
|---------|------|-------------|
| id | uuid | PK, auto-generado |
| report_type | text | Tipo de reporte (hours_daily, hours_weekly, etc.) |
| email | text | Email del destinatario |
| name | text | Nombre para mostrar |
| is_active | boolean | Si recibe el reporte |
| created_at | timestamptz | Fecha creación |
| updated_at | timestamptz | Última actualización |

**Datos iniciales:**
- Lluis@capittal.es → hours_daily
- Samuel@capittal.es → hours_daily

---

### 2. Edge Function: `daily-hours-report`

**Funcionalidad:**
1. Obtener todas las time entries del día anterior (00:00 - 23:59)
2. Agrupar por usuario: nombre, total minutos, horas facturables, tipos de trabajo
3. Calcular totales del equipo
4. Consultar destinatarios activos de `report_email_recipients` donde `report_type = 'hours_daily'`
5. Generar HTML con diseño limpio tipo Capittal
6. Enviar usando el servicio `send-email` existente

**Contenido del Email:**

```text
📊 Reporte Diario de Horas - [Fecha]

Resumen del Equipo:
• Total horas registradas: Xh
• Horas facturables: Yh (Z%)
• Usuarios activos: N

Detalle por Usuario:
┌────────────────┬───────────┬────────────┬────────────────────────┐
│ Usuario        │ Total     │ Facturable │ Trabajo Principal      │
├────────────────┼───────────┼────────────┼────────────────────────┤
│ Marc           │ 8.5h      │ 7h         │ Teaser (3h), IM (2h)   │
│ Oriol          │ 7h        │ 6h         │ Due Diligence (4h)     │
│ ...            │           │            │                        │
└────────────────┴───────────┴────────────┴────────────────────────┘

[Ver detalle en CRM]
```

---

### 3. Cron Job (pg_cron)

**Programación:** `0 8 * * 1-5` (Lunes a Viernes a las 08:00)

```sql
SELECT cron.schedule(
  'daily-hours-report',
  '0 8 * * 1-5',
  $$
  SELECT net.http_post(
    url:='https://[PROJECT_REF].supabase.co/functions/v1/daily-hours-report',
    headers:='{"Content-Type": "application/json", "Authorization": "Bearer [ANON_KEY]"}'::jsonb,
    body:='{"scheduled": true}'::jsonb
  ) as request_id;
  $$
);
```

---

### 4. Panel Admin: `/admin/reportes-email`

**Componentes:**

1. **ReportEmailRecipientsPage.tsx** - Página principal
   - Tabs por tipo de reporte (Horas Diario, Horas Semanal, etc.)
   - Tabla de destinatarios con acciones

2. **AddRecipientDialog.tsx** - Modal para añadir destinatario
   - Campos: email, nombre, tipo de reporte
   - Validación de formato email

3. **Funcionalidad:**
   - Ver destinatarios por tipo
   - Añadir nuevo destinatario
   - Activar/desactivar sin eliminar
   - Eliminar destinatario
   - Botón "Enviar reporte de prueba"

---

## Archivos a Crear

| Archivo | Descripción |
|---------|-------------|
| `supabase/migrations/XXX_create_report_email_recipients.sql` | Tabla + datos iniciales |
| `supabase/functions/daily-hours-report/index.ts` | Edge function del reporte |
| `src/pages/admin/ReportesEmail.tsx` | Página de gestión |
| `src/components/admin/AddReportRecipientDialog.tsx` | Dialog para añadir |
| `src/hooks/queries/useReportEmailRecipients.ts` | Hook React Query |

---

## Archivos a Modificar

| Archivo | Cambio |
|---------|--------|
| `src/App.tsx` | Añadir ruta `/admin/reportes-email` |

---

## Flujo de Verificación

1. Crear tabla con migración
2. Desplegar Edge Function
3. Probar manualmente la Edge Function con curl
4. Configurar cron job en Supabase
5. Navegar a /admin/reportes-email
6. Verificar que aparecen los destinatarios iniciales
7. Añadir/quitar destinatarios
8. Usar "Enviar prueba" para verificar recepción

---

## Detalles Técnicos

### Query de Time Entries (día anterior)

```sql
SELECT 
  u.full_name as user_name,
  SUM(te.duration_minutes) as total_minutes,
  SUM(CASE WHEN te.is_billable THEN te.duration_minutes ELSE 0 END) as billable_minutes,
  ARRAY_AGG(DISTINCT te.work_type) as work_types
FROM mandato_time_entries te
JOIN admin_users u ON u.user_id = te.user_id
WHERE te.start_time >= [yesterday_start]
  AND te.start_time < [today_start]
  AND te.is_deleted = false
  AND te.status = 'approved'
GROUP BY u.user_id, u.full_name
ORDER BY total_minutes DESC;
```

### RLS para report_email_recipients

```sql
-- Solo super_admin puede ver/editar
CREATE POLICY "Super admins can manage report recipients"
  ON report_email_recipients FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM admin_users 
      WHERE user_id = auth.uid() 
      AND role = 'super_admin'
    )
  );
```

---

## Consideraciones

- **Zona horaria:** Usar UTC+1 (Madrid) para determinar "día anterior"
- **Días sin registros:** Enviar email indicando que no hubo registros
- **Errores de envío:** Loguear en tabla `email_queue` para reintentos
- **Escalabilidad:** El mismo patrón sirve para reportes semanales, de pipeline, etc.
