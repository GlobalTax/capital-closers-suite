
# Desvincular Targets de Mandatos (Buy-Side)

## Estado actual

- **Sell-Side**: Ya tiene la funcionalidad de "Desvincular" en `EmpresasAsociadasCard.tsx`, usando `removeEmpresaFromMandato()` que hace un `DELETE` de `mandato_empresas`.
- **Buy-Side**: Solo permite "Archivar" y "Restaurar" targets. No existe opcion para desvincular (eliminar permanentemente la relacion).

## Viabilidad tecnica

La desvinculacion es segura. Todas las tablas hijas que referencian `mandato_empresas` tienen `ON DELETE CASCADE` o `ON DELETE SET NULL`:

| Tabla hija | Accion al borrar |
|---|---|
| `mandato_empresa_scoring` | CASCADE (se borra) |
| `target_ofertas` | CASCADE (se borra) |
| `teaser_recipients` | SET NULL |

La empresa en si (`empresas`) NO se elimina, solo la relacion `mandato_empresas`.

## Cambios propuestos

### 1. Nuevo servicio: `unlinkTarget` en `targetArchive.service.ts`

Anadir una funcion `unlinkTarget(mandatoEmpresaId)` que reutilice la logica existente de `removeEmpresaFromMandato` pero con un nombre semantico para Buy-Side.

### 2. Hook `useTargetPipeline.ts`

Anadir una mutation `unlinkTarget` que:
- Llame al servicio de desvinculacion
- Invalide las queries del pipeline
- Muestre un toast de confirmacion

### 3. UI: `TargetDetailDrawer.tsx`

Anadir un boton "Desvincular" (con icono Unlink) junto al boton de archivar, con un dialogo de confirmacion que advierta:
- Se eliminaran el scoring, ofertas y datos asociados
- La empresa seguira existiendo en el sistema

### 4. UI: `TargetListView.tsx` (menu contextual)

Anadir opcion "Desvincular" en el menu desplegable de cada target en la vista de lista.

### 5. `TargetsTabBuySide.tsx`

Conectar la nueva accion `unlinkTarget` del hook a los componentes.

## Seccion tecnica

### Flujo de desvinculacion

1. Usuario hace clic en "Desvincular" en el drawer o lista
2. Se muestra `ConfirmDialog` con advertencia
3. Al confirmar: `DELETE FROM mandato_empresas WHERE id = ?`
4. Cascade automatico borra scoring y ofertas
5. Se invalidan queries y se cierra el drawer
