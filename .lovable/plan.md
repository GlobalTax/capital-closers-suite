
# Anadir boton "Desvincular" en la lista de targets

## Objetivo

Anadir un boton rojo "Desvincular" directamente visible en cada fila de la tabla de targets (TargetListView), sin necesidad de abrir el drawer de detalle.

## Cambios

### 1. TargetListView.tsx - Anadir prop y boton

- Anadir nueva prop `onUnlinkTarget: (targetId: string) => void` a la interfaz
- En la celda vacia de acciones (linea 346), anadir un boton con icono Unlink en rojo
- Incluir un ConfirmDialog para confirmar la desvinculacion (mismo texto que el drawer)
- Estado local para trackear que target se esta desvinculando

### 2. TargetsTabBuySide.tsx - Pasar la prop

- Pasar `onUnlinkTarget={unlinkTarget}` al componente TargetListView (linea 324-333)

## Detalle tecnico

**TargetListView.tsx:**
- Nueva prop: `onUnlinkTarget: (targetId: string) => void`
- Estado: `const [unlinkTargetId, setUnlinkTargetId] = useState<string | null>(null)`
- Celda de acciones (linea 346): boton ghost con Unlink icon, clase `text-destructive hover:text-destructive hover:bg-destructive/10`
- ConfirmDialog al final del componente, controlado por `unlinkTargetId !== null`

**TargetsTabBuySide.tsx:**
- Linea ~332: anadir `onUnlinkTarget={(targetId) => unlinkTarget(targetId)}`

No se modifica el drawer ni ninguna otra funcionalidad existente.
