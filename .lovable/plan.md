

## Plan: Añadir Funcionalidad de Archivar Targets

### Objetivo
Implementar la capacidad de archivar targets de manera que:
- Los targets archivados se excluyan del KPI "Targets Activos"
- Los targets archivados puedan visualizarse/recuperarse si es necesario
- El conteo del funnel y pipeline solo muestre targets activos (no archivados)

---

### Cambios en Base de Datos

#### Migración SQL
```sql
-- Añadir columna is_archived a mandato_empresas
ALTER TABLE public.mandato_empresas 
ADD COLUMN IF NOT EXISTS is_archived boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS archived_at timestamptz,
ADD COLUMN IF NOT EXISTS archived_by uuid REFERENCES auth.users(id);

-- Índice para queries eficientes
CREATE INDEX IF NOT EXISTS idx_mandato_empresas_archived 
ON public.mandato_empresas(mandato_id, rol, is_archived) 
WHERE rol = 'target';

-- Comentarios para documentación
COMMENT ON COLUMN public.mandato_empresas.is_archived IS 'Target archivado - excluido de KPIs activos';
COMMENT ON COLUMN public.mandato_empresas.archived_at IS 'Fecha de archivado';
COMMENT ON COLUMN public.mandato_empresas.archived_by IS 'Usuario que archivó el target';
```

---

### Cambios en Tipos TypeScript

#### Actualizar MandatoEmpresaBuySide (src/types/index.ts)
Añadir campos de archivado al tipo:
```typescript
export interface MandatoEmpresaBuySide extends MandatoEmpresa {
  // ... campos existentes ...
  
  // Nuevos campos de archivado
  is_archived?: boolean;
  archived_at?: string;
  archived_by?: string;
}
```

---

### Cambios en Servicios

#### 1. targetScoring.service.ts - Filtrar archivados en stats

**getTargetPipelineStats()** - Excluir archivados del conteo:
```typescript
const { data: targets, error } = await supabase
  .from("mandato_empresas")
  .select(`id, funnel_stage, pipeline_stage_target, match_score, is_archived`)
  .eq("mandato_id", mandatoId)
  .eq("rol", "target")
  .eq("is_archived", false);  // NUEVO: Solo activos
```

**getTargetsWithScoring()** - Añadir campo is_archived:
```typescript
// Ya retorna todos los targets, pero incluir is_archived para filtrado en UI
const { data: targets, error } = await supabase
  .from("mandato_empresas")
  .select(`
    *,
    empresa:empresas(*),
    scoring:mandato_empresa_scoring(*),
    ofertas:target_ofertas(*)
  `)
  .eq("mandato_id", mandatoId)
  .eq("rol", "target")
  .order("is_archived", { ascending: true }) // Activos primero
  .order("created_at", { ascending: false });
```

#### 2. Nuevo servicio de archivado (src/services/targetArchive.service.ts)
```typescript
export async function archiveTarget(mandatoEmpresaId: string): Promise<void> {
  const { data: user } = await supabase.auth.getUser();
  
  const { error } = await supabase
    .from("mandato_empresas")
    .update({ 
      is_archived: true,
      archived_at: new Date().toISOString(),
      archived_by: user?.user?.id
    })
    .eq("id", mandatoEmpresaId);

  if (error) throw error;
}

export async function unarchiveTarget(mandatoEmpresaId: string): Promise<void> {
  const { error } = await supabase
    .from("mandato_empresas")
    .update({ 
      is_archived: false,
      archived_at: null,
      archived_by: null
    })
    .eq("id", mandatoEmpresaId);

  if (error) throw error;
}
```

---

### Cambios en Hook useTargetPipeline

#### Añadir mutation para archivar/desarchivar
```typescript
// Nueva mutation: Archivar target
const archiveMutation = useMutation({
  mutationFn: (targetId: string) => archiveTarget(targetId),
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['target-pipeline', mandatoId] });
    queryClient.invalidateQueries({ queryKey: ['target-pipeline-stats', mandatoId] });
    toast({ title: "Target archivado" });
  },
  onError: (error) => handleError(error, 'Archivar target'),
});

// Nueva mutation: Desarchivar target
const unarchiveMutation = useMutation({
  mutationFn: (targetId: string) => unarchiveTarget(targetId),
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['target-pipeline', mandatoId] });
    queryClient.invalidateQueries({ queryKey: ['target-pipeline-stats', mandatoId] });
    toast({ title: "Target restaurado" });
  },
  onError: (error) => handleError(error, 'Restaurar target'),
});

return {
  // ... existente ...
  archiveTarget: archiveMutation.mutate,
  unarchiveTarget: unarchiveMutation.mutate,
  isArchiving: archiveMutation.isPending || unarchiveMutation.isPending,
};
```

---

### Cambios en UI

#### 1. TargetsTabBuySide.tsx - Filtro de archivados

Añadir toggle para mostrar/ocultar archivados:
```typescript
const [showArchived, setShowArchived] = useState(false);

// Filtrar archivados en la lista
const filteredTargets = useMemo(() => {
  let result = targets;
  
  // Filtro de archivados (por defecto ocultos)
  if (!showArchived) {
    result = result.filter(t => !t.is_archived);
  }
  
  // ... resto de filtros existentes ...
}, [targets, showArchived, ...]);
```

Añadir UI toggle:
```tsx
<div className="flex items-center gap-2">
  <Switch 
    checked={showArchived} 
    onCheckedChange={setShowArchived}
    id="show-archived"
  />
  <Label htmlFor="show-archived" className="text-xs text-muted-foreground">
    Mostrar archivados
  </Label>
</div>
```

#### 2. TargetDetailDrawer.tsx - Boton de archivar

Cambiar el botón "Descartar" por "Archivar":
```tsx
<Button
  variant="ghost"
  size="sm"
  className={target.is_archived ? "text-green-600" : "text-amber-600"}
  onClick={() => {
    if (target.is_archived) {
      onUnarchiveTarget?.(target.id);
    } else {
      onArchiveTarget?.(target.id);
    }
  }}
>
  {target.is_archived ? (
    <>
      <ArchiveRestore className="h-4 w-4 mr-1" />
      Restaurar
    </>
  ) : (
    <>
      <Archive className="h-4 w-4 mr-1" />
      Archivar
    </>
  )}
</Button>
```

#### 3. TargetPipelineCard.tsx - Indicador visual

Mostrar badge de archivado:
```tsx
{target.is_archived && (
  <Badge variant="outline" className="text-xs opacity-60">
    <Archive className="h-2.5 w-2.5 mr-0.5" />
    Archivado
  </Badge>
)}
```

#### 4. TargetListView.tsx - Fila atenuada

Añadir estilo para targets archivados:
```tsx
<TableRow
  className={cn(
    "cursor-pointer",
    selectedIds.includes(target.id) && "bg-muted/50",
    target.is_archived && "opacity-50 bg-muted/30",  // NUEVO
    target.no_contactar && "opacity-60"
  )}
>
```

---

### Flujo de Datos Actualizado

```text
getTargetPipelineStats()
      |
      v
SELECT ... WHERE is_archived = false
      |
      v
stats.total = solo targets activos (no archivados)
      |
      v
MandatoKPIs: "Targets Activos" = stats.total (correcto)
```

---

### Definición de Estados

| Estado | is_archived | funnel_stage | Visible en KPI | Visible en UI |
|--------|-------------|--------------|----------------|---------------|
| **Activo** | false | cualquiera | Sí | Sí |
| **Descartado** | false | descartado | Sí (es un stage) | Sí |
| **Archivado** | true | cualquiera | No | Solo con toggle |

---

### Archivos a Modificar

| Archivo | Cambio |
|---------|--------|
| **SQL Migration** | Añadir columnas is_archived, archived_at, archived_by |
| `src/types/index.ts` | Añadir campos al tipo MandatoEmpresaBuySide |
| `src/services/targetScoring.service.ts` | Filtrar is_archived=false en stats |
| `src/services/targetArchive.service.ts` | NUEVO: funciones archive/unarchive |
| `src/hooks/useTargetPipeline.ts` | Añadir mutations de archivado |
| `src/features/mandatos/tabs/TargetsTabBuySide.tsx` | Toggle mostrar archivados |
| `src/components/mandatos/buyside/TargetDetailDrawer.tsx` | Boton archivar/restaurar |
| `src/components/mandatos/buyside/TargetPipelineCard.tsx` | Badge archivado |
| `src/components/mandatos/buyside/TargetListView.tsx` | Estilo fila archivada |

---

### Casos de Prueba

| Escenario | Resultado Esperado |
|-----------|-------------------|
| 5 targets, 0 archivados | Targets Activos = 5 |
| 5 targets, 1 archivado | Targets Activos = 4 |
| Archivar target | KPI baja, target desaparece de vista principal |
| Toggle "Mostrar archivados" | Targets archivados visibles con estilo atenuado |
| Restaurar target archivado | KPI sube, target visible normalmente |
| Kanban con archivados ocultos | Solo muestra targets activos en columnas |

