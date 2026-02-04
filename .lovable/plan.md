
# Sistema de Control de Time Reports del Equipo

## Resumen Ejecutivo
Ampliar el sistema actual de gestión de planes diarios para proporcionar a los supervisores herramientas robustas de control, incluyendo aprobación masiva, dashboard de cumplimiento, y funcionalidades de gestión de tareas asignadas.

---

## Arquitectura Actual vs. Propuesta

```text
┌─────────────────────────────────────────────────────────────────────────────┐
│  ACTUAL: /admin/planes-diarios                                              │
│  - Ver planes por fecha                                                     │
│  - Aprobar/rechazar individualmente                                         │
│  - Añadir tareas a planes existentes                                        │
│  - Filtrar por usuario                                                      │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│  PROPUESTO: Sistema Completo de Supervisión                                 │
│                                                                             │
│  1. APROBACION MASIVA                                                       │
│     - Selección múltiple de planes pendientes                               │
│     - Botón "Aprobar seleccionados" con confirmación                        │
│     - Badge contador de pendientes                                          │
│                                                                             │
│  2. DASHBOARD DE CUMPLIMIENTO                                               │
│     - Vista semanal: quién planificó / quién no                             │
│     - Indicadores visuales de cumplimiento por usuario                      │
│     - Exportación de datos de cumplimiento                                  │
│                                                                             │
│  3. ASIGNACION PROACTIVA DE TAREAS                                          │
│     - Crear planes vacíos para usuarios sin plan                            │
│     - Asignar tareas directamente a cualquier usuario                       │
│     - Notificación al usuario de tareas asignadas                           │
│                                                                             │
│  4. HISTORIAL Y TRAZABILIDAD                                                │
│     - Ver historial de planes por usuario                                   │
│     - Comparar planificado vs ejecutado                                     │
│     - Métricas de productividad                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Componentes a Implementar

### 1. Mejoras en DailyPlansAdmin.tsx

**Aprobación Masiva:**
- Añadir checkboxes para seleccionar múltiples planes
- Estado `selectedPlanIds: string[]`
- Barra de acciones flotante cuando hay planes seleccionados
- Función `approveBulkPlans(ids: string[])` en el servicio

**Usuarios Sin Plan:**
- Botón "Crear plan y asignar tarea" junto a cada usuario sin plan
- Permite al supervisor crear un plan vacío y añadir tareas directamente

### 2. Nuevo Componente: ComplianceDashboard.tsx

Dashboard visual mostrando:
- Matriz semanal: filas = usuarios, columnas = días
- Celdas coloreadas según estado: verde (aprobado), azul (enviado), amarillo (borrador), gris (sin plan)
- Click en celda abre el detalle del plan
- KPIs: % cumplimiento global, usuarios con 100% cumplimiento, usuarios sin planificar

### 3. Nueva Pestaña en HorasEquipo.tsx

Añadir una tercera pestaña "Control Planes" que integre:
- Vista de cumplimiento semanal
- Acceso rápido a planes pendientes de aprobar
- Acciones masivas

---

## Cambios en Base de Datos

No se requieren cambios de esquema. Las tablas existentes son suficientes:

| Tabla | Uso |
|-------|-----|
| `daily_plans` | Almacena planes con status, fechas, usuario |
| `daily_plan_items` | Items de cada plan con `assigned_by_admin` flag |
| `admin_users` | Lista de usuarios activos |

---

## Archivos a Crear

| Archivo | Descripcion |
|---------|-------------|
| `src/components/plans/BulkApprovalBar.tsx` | Barra flotante para acciones masivas |
| `src/components/plans/ComplianceDashboard.tsx` | Dashboard de cumplimiento semanal |
| `src/components/plans/WeeklyComplianceGrid.tsx` | Grid visual semana x usuarios |
| `src/hooks/usePlanCompliance.ts` | Hook para calcular metricas de cumplimiento |

---

## Archivos a Modificar

| Archivo | Cambio |
|---------|--------|
| `src/pages/admin/DailyPlansAdmin.tsx` | Añadir seleccion multiple y aprobacion masiva |
| `src/services/dailyPlans.service.ts` | Añadir `approveBulkPlans()`, `createPlanForUser()` |
| `src/pages/HorasEquipo.tsx` | Añadir tercera pestaña "Control Planes" |

---

## Flujo de Usuario: Supervisor

```text
1. Supervisor accede a /horas-equipo
2. Click en tab "Control Planes"
3. Ve dashboard semanal de cumplimiento
   ├─ Usuarios con planes aprobados → verde
   ├─ Usuarios con planes pendientes → azul (clic para aprobar)
   ├─ Usuarios sin plan → gris (clic para crear y asignar)
   └─ Alerta: "3 planes pendientes de revisar"

4. Click en "Ver pendientes" 
   → Lista de planes status='submitted'
   → Checkbox para seleccionar varios
   → Botón "Aprobar X seleccionados"

5. Para usuario sin plan:
   → Click "Asignar tareas"
   → Se crea plan vacío automáticamente
   → Se abre diálogo para añadir tareas
   → Usuario recibe notificación (opcional)
```

---

## Detalles Tecnicos

### Servicio: approveBulkPlans

```typescript
export async function approveBulkPlans(
  planIds: string[]
): Promise<{ approved: number; failed: number }> {
  const { data: { user } } = await supabase.auth.getUser();
  
  const { data, error } = await supabase
    .from('daily_plans')
    .update({
      status: 'approved',
      approved_at: new Date().toISOString(),
      approved_by: user?.id
    })
    .in('id', planIds)
    .eq('status', 'submitted') // Solo planes enviados
    .select();
  
  if (error) throw error;
  
  return {
    approved: data?.length || 0,
    failed: planIds.length - (data?.length || 0)
  };
}
```

### Hook: usePlanCompliance

```typescript
interface ComplianceData {
  userId: string;
  userName: string;
  days: {
    date: string;
    status: 'approved' | 'submitted' | 'draft' | 'none';
    planId?: string;
    totalMinutes: number;
  }[];
  complianceRate: number; // % de días con plan aprobado
}

export function usePlanCompliance(weekStart: Date) {
  // Retorna datos de cumplimiento para la semana
}
```

### Componente: WeeklyComplianceGrid

Muestra una matriz visual:
- Eje Y: usuarios (ordenados por nombre)
- Eje X: días de la semana (Lun-Dom)
- Cada celda es clickeable y muestra el estado

---

## Consideraciones de Permisos

- Solo usuarios con rol `admin` o `super_admin` pueden:
  - Aprobar/rechazar planes
  - Asignar tareas a otros usuarios
  - Ver el dashboard de cumplimiento
- Los usuarios normales solo ven su propio plan en `/plan-diario`

---

## Orden de Implementacion

1. **Fase 1**: Aprobación masiva en DailyPlansAdmin (quick win)
2. **Fase 2**: Dashboard de cumplimiento semanal
3. **Fase 3**: Creación de planes y asignación proactiva
4. **Fase 4**: Integración en HorasEquipo como tercera pestaña

---

## Metricas de Exito

- Reducir tiempo de aprobación de planes de X minutos a <1 minuto
- Visibilidad inmediata de usuarios sin planificar
- Capacidad de asignar trabajo antes de que el día comience
