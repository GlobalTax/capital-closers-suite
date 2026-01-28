

## Plan: Panel Responsable - Vista Diaria Detallada por Persona

### Resumen

Crear un nuevo panel "Responsable" dentro de la página "Horas Equipo" que permita a los responsables ver en detalle qué hizo cada operativo cada día. El panel mostrará un timeline diario con todas las entradas de tiempo, incluyendo descripción visible sin necesidad de modales.

---

### 1. Estructura de la Página

Modificar `src/pages/HorasEquipo.tsx` para añadir navegación por pestañas:

- **Tab "Resumen"**: Vista actual con KPIs, gráficos y análisis estratégico
- **Tab "Responsable"**: Nueva vista con detalle diario por persona

```typescript
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// En el return:
<Tabs defaultValue="resumen">
  <TabsList>
    <TabsTrigger value="resumen">Resumen</TabsTrigger>
    <TabsTrigger value="responsable">Panel Responsable</TabsTrigger>
  </TabsList>
  <TabsContent value="resumen">
    {/* Contenido actual */}
  </TabsContent>
  <TabsContent value="responsable">
    <ResponsablePanel entries={timeEntries} users={users} mandatos={mandatos} />
  </TabsContent>
</Tabs>
```

---

### 2. Nuevo Componente: ResponsablePanel

Crear `src/components/mandatos/ResponsablePanel.tsx`:

**Props:**
```typescript
interface ResponsablePanelProps {
  entries: TimeEntry[];
  users: { id: string; name: string }[];
  mandatos: { id: string; name: string }[];
  loading?: boolean;
}
```

**Funcionalidades:**
- Filtro por usuario (obligatorio - selección única)
- Filtro por fecha (DatePicker - día específico)
- Filtro por mandato (opcional)
- Vista agrupada por día con totales

---

### 3. Filtros del Panel Responsable

**UI de Filtros:**
```typescript
<div className="flex items-center gap-4">
  {/* Selector de Usuario (prominente) */}
  <Select value={selectedUserId} onValueChange={setSelectedUserId}>
    <SelectTrigger className="w-[200px]">
      <SelectValue placeholder="Seleccionar operativo" />
    </SelectTrigger>
    <SelectContent>
      {users.map(user => (
        <SelectItem key={user.id} value={user.id}>{user.name}</SelectItem>
      ))}
    </SelectContent>
  </Select>
  
  {/* DatePicker - Día específico */}
  <Popover>
    <PopoverTrigger asChild>
      <Button variant="outline">
        <CalendarIcon className="mr-2 h-4 w-4" />
        {format(selectedDate, 'EEEE d MMM yyyy', { locale: es })}
      </Button>
    </PopoverTrigger>
    <PopoverContent>
      <Calendar
        mode="single"
        selected={selectedDate}
        onSelect={(date) => date && setSelectedDate(date)}
      />
    </PopoverContent>
  </Popover>
  
  {/* Mandato (opcional) */}
  <Select value={selectedMandatoId} onValueChange={setSelectedMandatoId}>
    <SelectTrigger className="w-[200px]">
      <SelectValue placeholder="Todos los mandatos" />
    </SelectTrigger>
    <SelectContent>
      <SelectItem value="all">Todos los mandatos</SelectItem>
      {mandatos.map(m => (
        <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>
      ))}
    </SelectContent>
  </Select>
</div>
```

---

### 4. Vista Diaria con Timeline y Tabla Detallada

**Estructura Visual:**

```
┌─────────────────────────────────────────────────────────────────┐
│ 📅 Miércoles 28 Enero 2026                                      │
│ Usuario: Samuel Navarro                                         │
│ ─────────────────────────────────────────────────────────────── │
│                                                                 │
│ RESUMEN DEL DÍA                                                 │
│ ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐         │
│ │ 7h 30m   │  │ 5h 15m   │  │ 2h 15m   │  │ 6        │         │
│ │ Total    │  │ Core M&A │  │ Soporte  │  │ Entradas │         │
│ └──────────┘  └──────────┘  └──────────┘  └──────────┘         │
│                                                                 │
│ DETALLE DE ENTRADAS                                             │
│ ┌───────┬──────────────┬────────────┬────────────┬──────────┐  │
│ │ Hora  │ Mandato      │ Tipo       │ Descripción│ Duración │  │
│ ├───────┼──────────────┼────────────┼────────────┼──────────┤  │
│ │ 09:15 │ V-478 SELK   │ Reunión    │ Reunión de │ 1h 30m   │  │
│ │       │              │            │ kick-off   │          │  │
│ │       │              │            │ con equipo │          │  │
│ │       │              │            │ del client │          │  │
│ ├───────┼──────────────┼────────────┼────────────┼──────────┤  │
│ │ 11:00 │ V-382 OTEC   │ IM         │ Preparar   │ 2h 00m   │  │
│ │       │              │            │ sección    │          │  │
│ │       │              │            │ financiera │          │  │
│ │       │              │            │ del IM     │          │  │
│ └───────┴──────────────┴────────────┴────────────┴──────────┘  │
│                                                                 │
│ [◀ Día anterior]                        [Día siguiente ▶]       │
└─────────────────────────────────────────────────────────────────┘
```

---

### 5. Componente de Tabla con Descripción Visible

Crear `src/components/mandatos/DailyTimeEntriesDetail.tsx`:

**Características:**
- Descripción siempre visible (no truncada)
- Hora de inicio destacada
- Badge de tipo de valor (Core M&A / Soporte / Bajo Valor)
- Colores por estado (aprobado verde, pendiente ámbar, rechazado rojo)

```typescript
interface DailyTimeEntriesDetailProps {
  entries: TimeEntry[];
  date: Date;
  userName: string;
}

// Tabla con descripción expandida
<Table>
  <TableHeader>
    <TableRow>
      <TableHead className="w-[80px]">Hora</TableHead>
      <TableHead className="w-[150px]">Mandato</TableHead>
      <TableHead className="w-[120px]">Tipo Tarea</TableHead>
      <TableHead className="min-w-[300px]">Descripción</TableHead>
      <TableHead className="w-[90px] text-right">Duración</TableHead>
      <TableHead className="w-[80px]">Estado</TableHead>
    </TableRow>
  </TableHeader>
  <TableBody>
    {entries.map(entry => (
      <TableRow key={entry.id}>
        <TableCell className="font-mono text-sm">
          {format(new Date(entry.start_time), 'HH:mm')}
        </TableCell>
        <TableCell>
          <Link to={`/mandatos/${entry.mandato?.id}`}>
            <span className="font-mono text-primary">{entry.mandato?.codigo}</span>
            <br />
            <span className="text-xs text-muted-foreground">
              {entry.mandato?.empresa_principal?.nombre}
            </span>
          </Link>
        </TableCell>
        <TableCell>
          <Badge variant="secondary">{entry.work_task_type?.name}</Badge>
        </TableCell>
        <TableCell>
          {/* DESCRIPCIÓN VISIBLE SIN TRUNCAR */}
          <div className="text-sm whitespace-pre-wrap">
            {entry.description}
          </div>
          {entry.notes && (
            <div className="text-xs text-muted-foreground mt-1 italic">
              Notas: {entry.notes}
            </div>
          )}
        </TableCell>
        <TableCell className="text-right font-mono font-medium">
          {formatDuration(entry.duration_minutes)}
        </TableCell>
        <TableCell>
          <StatusBadge status={entry.status} />
        </TableCell>
      </TableRow>
    ))}
  </TableBody>
</Table>
```

---

### 6. Resumen KPIs del Día

Crear `src/components/mandatos/DaySummaryKPIs.tsx`:

```typescript
interface DaySummaryKPIsProps {
  entries: TimeEntry[];
  date: Date;
  userName: string;
}

// Métricas calculadas:
const totalMinutes = entries.reduce((sum, e) => sum + (e.duration_minutes || 0), 0);
const coreMAMinutes = entries.filter(e => e.value_type === 'core_ma')
  .reduce((sum, e) => sum + (e.duration_minutes || 0), 0);
const soporteMinutes = entries.filter(e => e.value_type === 'soporte')
  .reduce((sum, e) => sum + (e.duration_minutes || 0), 0);
const mandatosCount = new Set(entries.map(e => e.mandato_id).filter(Boolean)).size;

// UI: 4 cards compactas
```

---

### 7. Navegación entre Días

Añadir navegación rápida para moverse entre días:

```typescript
<div className="flex items-center justify-between">
  <Button 
    variant="outline" 
    onClick={() => setSelectedDate(subDays(selectedDate, 1))}
  >
    <ChevronLeft className="h-4 w-4 mr-2" />
    {format(subDays(selectedDate, 1), 'EEE d', { locale: es })}
  </Button>
  
  <span className="font-medium">
    {format(selectedDate, 'EEEE d MMMM yyyy', { locale: es })}
  </span>
  
  <Button 
    variant="outline"
    onClick={() => setSelectedDate(addDays(selectedDate, 1))}
    disabled={isToday(selectedDate)}
  >
    {format(addDays(selectedDate, 1), 'EEE d', { locale: es })}
    <ChevronRight className="h-4 w-4 ml-2" />
  </Button>
</div>
```

---

### 8. Datos Requeridos

Los datos ya están disponibles en `mandato_time_entries`:

| Campo | Uso en Panel |
|-------|--------------|
| `mandato_id` | Link y badge de mandato |
| `contacto_id` | Info del lead si aplica |
| `work_task_type_id` | Badge de tipo de tarea |
| `description` | Texto visible principal |
| `duration_minutes` | Duración formateada |
| `start_time` | Hora del día |
| `value_type` | Badge Core/Soporte/Bajo Valor |
| `status` | Indicador de estado |
| `user_id` | Filtro por operativo |

---

### Resumen de Archivos

| Archivo | Cambio |
|---------|--------|
| `src/pages/HorasEquipo.tsx` | Añadir Tabs con "Resumen" y "Panel Responsable" |
| **Nuevo:** `src/components/mandatos/ResponsablePanel.tsx` | Panel principal con filtros |
| **Nuevo:** `src/components/mandatos/DailyTimeEntriesDetail.tsx` | Tabla con descripción visible |
| **Nuevo:** `src/components/mandatos/DaySummaryKPIs.tsx` | Métricas del día |

---

### Sección Técnica

**Dependencias:** Ninguna nueva (usa componentes shadcn existentes)

**Base de datos:** No requiere cambios (usa `mandato_time_entries` existente)

**Filtrado:** Se realiza en frontend sobre los datos ya cargados por `fetchAllTimeEntries`

**Performance:**
- Los datos ya están cargados para la página actual
- El filtrado por usuario/fecha se hace en memoria
- Solo se renderizan las entradas del día seleccionado

**Flujo de datos:**
1. `HorasEquipo` carga todos los `timeEntries` con el rango de fechas actual
2. `ResponsablePanel` recibe las entradas y aplica filtros locales
3. `DailyTimeEntriesDetail` renderiza solo las entradas del día/usuario seleccionado

