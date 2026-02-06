

# Plan: Pagina Dedicada /alertas

## Resumen

Crear una nueva pagina `/alertas` con vista completa de alertas del sistema, reutilizando la infraestructura existente (hooks, servicios, tipos) y agregando filtros, historial y acciones masivas.

---

## Archivos a Crear

| Archivo | Descripcion |
|---------|-------------|
| `src/pages/Alertas.tsx` | Pagina principal con listado, filtros y acciones |

## Archivos a Modificar

| Archivo | Cambio |
|---------|--------|
| `src/App.tsx` | Agregar lazy import + ruta `/alertas` |
| `src/components/layout/AppSidebar.tsx` | Agregar item "Alertas" en el menu |
| `src/components/alerts/AlertsCenter.tsx` | Cambiar el boton "Ver todas en Pipeline" para navegar a `/alertas` |

---

## Estructura de la Pagina `/alertas`

### Header
- Titulo "Centro de Alertas" con icono Bell
- Boton "Generar Alertas" (ejecuta `generate_mandato_alerts` RPC)
- Botones masivos: "Marcar todas como leidas", "Descartar leidas"

### KPI Cards (fila superior)
Reutiliza `useAlertStats()`:
- Total activas
- Criticas (rojo)
- Advertencias (ambar)
- Informativas (azul)
- Sin leer

### Filtros (Toolbar)
- **Busqueda**: por titulo/descripcion/empresa
- **Severidad**: Select con opciones critical/warning/info/todas
- **Tipo**: Select con los 7 tipos de AlertType (inactive_mandate, overdue_task, etc.)
- **Estado lectura**: Todas / Solo sin leer / Solo leidas

### Tabla de Alertas
Columnas:
| Columna | Contenido |
|---------|-----------|
| Severidad | Icono con color (critical=rojo, warning=ambar, info=azul) |
| Titulo | Texto con indicador de no leida |
| Descripcion | Texto truncado |
| Empresa | empresa_nombre del mandato |
| Tipo | Badge con alert_type legible |
| Fecha | created_at formateado |
| Acciones | Marcar leida, Descartar, Ir al mandato |

- Filas no leidas tendran fondo diferenciado
- Click en fila navega al mandato y marca como leida

### Historial
- Incluir un toggle "Mostrar descartadas" que cambia la query para incluir alertas descartadas (historial)
- Las descartadas se muestran con opacidad reducida

---

## Detalles Tecnicos

### Servicio
Se reutiliza completamente `src/services/alerts.service.ts` existente. Se agrega una funcion para obtener alertas con filtros (incluyendo descartadas):

```typescript
// Nueva funcion en alerts.service.ts
export const fetchAllAlerts = async (filters: AlertFilters): Promise<ActiveAlert[]> => {
  let query = supabase
    .from('v_active_alerts')  // Para activas
    .select('*')
    .order('created_at', { ascending: false });

  // Aplicar filtros de severidad, tipo, etc.
  if (filters.severity) query = query.eq('severity', filters.severity);
  if (filters.alertType) query = query.eq('alert_type', filters.alertType);
  
  return (await query).data || [];
};

// Para historial (descartadas), query directa a mandato_alerts
export const fetchDismissedAlerts = async (): Promise<MandatoAlert[]> => {
  const { data } = await supabase
    .from('mandato_alerts')
    .select('*')
    .eq('is_dismissed', true)
    .order('updated_at', { ascending: false })
    .limit(100);
  return data || [];
};
```

### Hook
Se agrega `useAllAlerts(filters)` en `useAlerts.ts` que acepta filtros opcionales.

### Pagina
La pagina `Alertas.tsx` usa:
- `useActiveAlerts()` o `useAllAlerts(filters)` para el listado
- `useAlertStats()` para los KPIs
- `useGenerateAlerts()` para el boton de regenerar
- `useMarkAlertAsRead()`, `useDismissAlert()` para acciones individuales
- `useMarkAllAlertsAsRead()`, `useDismissAllReadAlerts()` para acciones masivas
- Filtrado client-side para busqueda por texto, severidad, tipo y estado de lectura

### Routing
```tsx
// App.tsx
const Alertas = lazy(() => import("./pages/Alertas"));
// En Routes:
<Route path="/alertas" element={<ProtectedRoute><AppLayout><Alertas /></AppLayout></ProtectedRoute>} />
```

### Sidebar
Agregar item "Alertas" con icono `Bell` en el grupo principal, debajo de "Reportes".

### AlertsCenter Update
Cambiar el boton footer del popover para navegar a `/alertas`:
```tsx
onClick={() => { setOpen(false); navigate('/alertas'); }}
```

---

## Mapeo de Tipos Legibles

```typescript
const alertTypeLabels: Record<AlertType, string> = {
  inactive_mandate: 'Mandato Inactivo',
  overdue_task: 'Tarea Vencida',
  stuck_deal: 'Deal Estancado',
  upcoming_deadline: 'Fecha Limite Proxima',
  missing_document: 'Documento Faltante',
  low_probability: 'Baja Probabilidad',
  critical_task_overdue: 'Tarea Critica Vencida',
};
```

---

## Orden de Implementacion

1. Agregar funcion `fetchAllAlerts` al servicio existente
2. Agregar hook `useAllAlerts` 
3. Crear pagina `Alertas.tsx`
4. Registrar ruta en `App.tsx`
5. Agregar al sidebar en `AppSidebar.tsx`
6. Actualizar link en `AlertsCenter.tsx`

