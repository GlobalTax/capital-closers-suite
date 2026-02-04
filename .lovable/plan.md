
# Mejora del Reporte Diario de Horas

## Problemas Identificados en la Captura

1. **Decimales flotantes descontrolados**: Se muestran números como `9.99999999999886m` en lugar de `10m` debido a errores de precisión en JavaScript al dividir minutos entre 60.

2. **Información insuficiente para un supervisor**: El email actual solo muestra totales por usuario y "tipos de trabajo" genéricos (siempre "Otro"), sin contexto de qué proyectos/mandatos se trabajaron ni descripciones.

## Solución Propuesta

### 1. Corrección de Decimales

Cambiar la lógica para trabajar siempre en **minutos enteros** y redondear antes de formatear:

```typescript
// ANTES (problema)
existing.totalHours += minutes / 60; // Genera 9.9999999...

// DESPUÉS (solución)
existing.totalMinutes += Math.round(minutes); // Mantener en minutos enteros
// Formatear al final con Math.floor y Math.round
```

### 2. Contenido Ampliado del Email

**Nuevo diseño del email incluye:**

**Por cada usuario:**
- Nombre
- Horas totales (sin decimales: "9h 40m")
- Horas facturables
- **Desglose por mandato/proyecto** con horas dedicadas
- **Tipos de tarea** realizados (IM, Teaser, Reuniones, etc.)
- Número de entradas registradas

**Nueva sección detallada por usuario:**
```
┌─────────────────────────────────────────────────────────────┐
│ MARC - 9h 40m (6h 15m facturables)                          │
├─────────────────────────────────────────────────────────────┤
│ Proyectos trabajados:                                       │
│   • Laboratorio Protésico Lleida: 3h 30m                    │
│   • Proyecto FB Intec: 2h 15m                               │
│   • Tareas Administrativas: 2h 30m                          │
│   • Prospección Comercial: 1h 25m                           │
│                                                             │
│ Tipos de tarea: Reunión, IM, Material Interno               │
│ Entradas registradas: 8                                     │
└─────────────────────────────────────────────────────────────┘
```

**Sección de resumen mejorada:**
- Total horas equipo
- Horas facturables (con %)
- Usuarios activos
- **Usuarios sin registrar** (si hay)
- **Top 3 proyectos más trabajados**

---

## Cambios Técnicos

### Archivo a Modificar
`supabase/functions/daily-hours-report/index.ts`

### Cambios en Query SQL
Añadir JOINs para obtener:
- `mandatos.descripcion` - nombre del proyecto
- `work_task_types.name` - tipo de tarea

### Nueva Estructura de Datos

```typescript
interface UserDetailedHours {
  userName: string;
  totalMinutes: number;      // En minutos enteros
  billableMinutes: number;   // En minutos enteros
  entryCount: number;
  mandatos: {                // Desglose por proyecto
    name: string;
    minutes: number;
  }[];
  taskTypes: string[];       // Tipos de tarea únicos
}
```

### Función formatHours Mejorada

```typescript
function formatHours(minutes: number): string {
  const totalMins = Math.round(minutes);  // Redondear a entero
  const hours = Math.floor(totalMins / 60);
  const mins = totalMins % 60;
  if (hours === 0) return `${mins}m`;
  if (mins === 0) return `${hours}h`;
  return `${hours}h ${mins}m`;
}
```

### Nuevo Template HTML

El email incluirá:
1. **Cabecera** con fecha y KPIs globales (igual que ahora pero sin decimales)
2. **Tabla resumen** por usuario con columnas: Usuario | Total | Facturable | Proyectos | Tareas
3. **Sección expandida** con detalle por usuario mostrando los proyectos trabajados
4. **Footer** con alertas si hay usuarios sin registrar

---

## Resultado Esperado

**Antes:**
```
| Usuario    | Total                    | Facturable                 | Trabajo Principal |
|------------|--------------------------|----------------------------|-------------------|
| Oriol      | 9h 19.99999999999886m    | 4h 4.999999999999972m      | Otro              |
```

**Después:**
```
| Usuario | Total   | Fact.   | Proyectos trabajados                           |
|---------|---------|---------|------------------------------------------------|
| Oriol   | 9h 20m  | 5h      | Lab. Protésico (4h), Proyecto X (3h), Admin (2h) |

Detalle Oriol:
• Laboratorio Protésico Lleida: 4h (Reuniones, IM)
• Proyecto X Industrial: 3h 20m (Teaser, Potenciales)  
• Tareas Administrativas: 2h (Material Interno)
Total entradas: 12
```

---

## Orden de Implementación

1. Corregir `formatHours()` para redondear a enteros
2. Modificar query para incluir `mandato` y `work_task_type`
3. Reestructurar agregación por usuario + por mandato
4. Actualizar template HTML con diseño expandido
5. Redesplegar Edge Function
6. Enviar email de prueba para verificar
