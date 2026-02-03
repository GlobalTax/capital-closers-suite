
# Plan de Corrección: Archivado de Targets

## Resumen del Problema
Al archivar un target desde el drawer de detalle, se detectaron 3 problemas que impiden que la UI se actualice correctamente:

1. El **Funnel visual** usa `targets.length` en vez de `stats.total`, mostrando el conteo incorrecto
2. El **Drawer no se cierra** automáticamente después de archivar
3. El **target seleccionado** mantiene datos obsoletos hasta que se refrescan las queries

---

## Solución Técnica

### Cambio 1: Corregir el conteo del Funnel
**Archivo:** `src/features/mandatos/tabs/TargetsTabBuySide.tsx`

Cambiar el prop `total` del componente `TargetFunnel` para usar `stats?.total` en lugar de `targets.length`:

```text
Antes (línea ~150):
total={targets.length}

Después:
total={stats?.total || filteredTargets.length}
```

Esto asegura que el Funnel use el conteo calculado desde la base de datos, que excluye targets archivados.

---

### Cambio 2: Cerrar el Drawer después de archivar
**Archivo:** `src/features/mandatos/tabs/TargetsTabBuySide.tsx`

Modificar el callback `onArchiveTarget` para cerrar el drawer automáticamente:

```typescript
onArchiveTarget={(targetId) => {
  archiveTarget(targetId);
  setDetailDrawerOpen(false);  // Cerrar drawer
  setSelectedTarget(null);     // Limpiar selección
}}
```

Lo mismo para `onUnarchiveTarget`:
```typescript
onUnarchiveTarget={(targetId) => {
  unarchiveTarget(targetId);
  setDetailDrawerOpen(false);
  setSelectedTarget(null);
}}
```

---

### Cambio 3: Forzar refetch después de archivar (opcional pero recomendado)
**Archivo:** `src/hooks/useTargetPipeline.ts`

Añadir `await` a las invalidaciones para asegurar que se completen antes de continuar:

```typescript
// Mutation: Archivar target
const archiveMutation = useMutation({
  mutationFn: (targetId: string) => archiveTarget(targetId),
  onSuccess: async () => {
    await queryClient.invalidateQueries({ queryKey: ['target-pipeline', mandatoId] });
    await queryClient.invalidateQueries({ queryKey: ['target-pipeline-stats', mandatoId] });
    toast({ title: "Target archivado", description: "El target ha sido excluido de los KPIs activos" });
  },
  onError: (error) => handleError(error, 'Archivar target'),
});
```

---

## Flujo Esperado Después de la Corrección

```text
Usuario clicks "Archivar"
         ↓
1. archiveMutation ejecuta PATCH (is_archived: true)
         ↓
2. onSuccess invalida queries
         ↓
3. Drawer se cierra automáticamente
         ↓
4. React Query refetches targets y stats
         ↓
5. UI se actualiza:
   - Target desaparece del Kanban
   - KPI "Targets Activos" decrementa en 1
   - Funnel muestra conteo correcto
```

---

## Archivos a Modificar

| Archivo | Cambio |
|---------|--------|
| `src/features/mandatos/tabs/TargetsTabBuySide.tsx` | Corregir `total` en Funnel + cerrar drawer al archivar |
| `src/hooks/useTargetPipeline.ts` | (Opcional) Añadir `await` a invalidaciones |

---

## Verificación Post-Implementación

1. Abrir un mandato Buy-Side con targets
2. Click en un target para abrir el drawer
3. Click en "Archivar"
4. **Verificar:**
   - Toast de confirmación aparece
   - Drawer se cierra automáticamente
   - Target desaparece del Kanban
   - KPI "Targets Activos" baja en 1
   - Funnel muestra conteo correcto
5. Activar toggle "Archivados" y confirmar que el target aparece
