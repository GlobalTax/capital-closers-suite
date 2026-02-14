
# Añadir botón "Desvincular" en las tarjetas de target (Sell-Side)

## Contexto

La imagen muestra un mandato Sell-Side con la pestaña "Targets" donde aparecen las empresas target como tarjetas (TargetCard). Actualmente no hay forma de desvincular un target desde esta vista.

El botón "Desvincular" ya existe en la vista de lista del Buy-Side (TargetListView). Ahora hay que añadirlo también a las tarjetas del Sell-Side.

## Cambios

### 1. TargetCard.tsx - Añadir botón y confirmación

- Nueva prop opcional: `onUnlink?: () => void`
- En la barra de acciones (junto a "Asociar", "+ Contacto", "Link"), añadir un botón rojo "Desvincular" con icono Unlink
- Separador visual antes del botón para diferenciarlo de las acciones positivas
- ConfirmDialog integrado para confirmar antes de ejecutar

### 2. TargetsTab.tsx - Pasar el handler

- Importar `removeEmpresaFromMandato` del servicio de mandatos
- Crear función `handleUnlinkTarget` que elimine la relación `mandato_empresas` usando `me.id` y luego llame a `onRefresh()`
- Pasar `onUnlink` al TargetCard con el `me.id` correspondiente

## Detalle técnico

**TargetCard.tsx:**
- Nueva prop: `onUnlink?: () => void`
- Estado local: `unlinkConfirmOpen` para el ConfirmDialog
- Botón en la barra de acciones con clases `text-destructive hover:text-destructive hover:bg-destructive/10`
- Icono `Unlink` de lucide-react

**TargetsTab.tsx (TargetsTabSellSide):**
- Importar `removeEmpresaFromMandato` desde `@/services/mandatos`
- Handler:
```
const handleUnlinkTarget = async (mandatoEmpresaId: string) => {
  await removeEmpresaFromMandato(mandatoEmpresaId);
  toast.success("Target desvinculado");
  onRefresh();
};
```
- En el render del TargetCard, pasar `onUnlink={() => handleUnlinkTarget(me.id)}`
