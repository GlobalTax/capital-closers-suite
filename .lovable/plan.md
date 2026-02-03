
## Plan: Botón "Crear Mandato" en Ficha de Empresa

### Objetivo
Añadir un botón "Crear Mandato" en el panel de acciones de la ficha de empresa que permita iniciar rápidamente un mandato de compra o venta con la empresa pre-seleccionada.

---

### Diseño de UX

```
+------------------------------------------+
|  Acciones                                |
+------------------------------------------+
|  [Contactar]                             |
|  [Llamar]                                |
|  [Visitar Website]                       |
|  ────────────────────                    |
|  [+ Crear Mandato ▾]  <-- NUEVO          |
|     ├─ 🛒 Compra (Buy-Side)              |
|     └─ 📈 Venta (Sell-Side)              |
|  [Agendar Reunión]                       |
|  [Crear Tarea]                           |
|  ...                                     |
+------------------------------------------+
```

Al hacer clic en una opción:
1. Se abre el `NuevoMandatoDrawer`
2. La empresa ya está pre-seleccionada (no hay que buscarla)
3. El tipo (compra/venta) ya está seleccionado
4. El usuario solo completa descripción y campos opcionales

---

### Cambios Necesarios

#### 1. Extender NuevoMandatoDrawer con `defaultEmpresaId`

Añadir nuevo prop que pre-seleccione la empresa:

```typescript
interface NuevoMandatoDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
  defaultTipo?: "compra" | "venta";
  defaultEmpresaId?: string;  // NUEVO
}
```

Comportamiento:
- Si `defaultEmpresaId` está presente, establecer `empresaId` en el form
- Ocultar o deshabilitar el selector de empresa (ya está elegida)
- Mostrar el nombre de la empresa seleccionada como badge informativo

#### 2. Actualizar EmpresaActionsPanel

Añadir props para manejar la creación de mandatos:

```typescript
interface EmpresaActionsPanelProps {
  onEdit: () => void;
  onDelete: () => void;
  onCreateMandato?: (tipo: "compra" | "venta") => void;  // NUEVO
}
```

Añadir botón con dropdown:

```tsx
<DropdownMenu>
  <DropdownMenuTrigger asChild>
    <Button variant="outline" className="w-full justify-start gap-2">
      <Briefcase className="h-4 w-4" />
      Crear Mandato
      <ChevronDown className="h-3 w-3 ml-auto" />
    </Button>
  </DropdownMenuTrigger>
  <DropdownMenuContent align="start" className="w-48">
    <DropdownMenuItem onClick={() => onCreateMandato?.("compra")}>
      <ShoppingCart className="h-4 w-4 mr-2 text-orange-500" />
      Compra (Buy-Side)
    </DropdownMenuItem>
    <DropdownMenuItem onClick={() => onCreateMandato?.("venta")}>
      <TrendingUp className="h-4 w-4 mr-2 text-blue-500" />
      Venta (Sell-Side)
    </DropdownMenuItem>
  </DropdownMenuContent>
</DropdownMenu>
```

#### 3. Conectar en EmpresaDetalle

Añadir estado y handlers:

```tsx
const [mandatoDrawerOpen, setMandatoDrawerOpen] = useState(false);
const [mandatoTipo, setMandatoTipo] = useState<"compra" | "venta">("venta");

const handleCreateMandato = (tipo: "compra" | "venta") => {
  setMandatoTipo(tipo);
  setMandatoDrawerOpen(true);
};

// En el JSX:
<EmpresaActionsPanel
  onEdit={() => setEditDrawerOpen(true)}
  onDelete={() => setDeleteDialogOpen(true)}
  onCreateMandato={handleCreateMandato}
/>

<NuevoMandatoDrawer
  open={mandatoDrawerOpen}
  onOpenChange={setMandatoDrawerOpen}
  defaultTipo={mandatoTipo}
  defaultEmpresaId={empresa.id}
  onSuccess={() => {
    setMandatoDrawerOpen(false);
    // Refrescar mandatos de la empresa
  }}
/>
```

---

### Archivos a Modificar

| Archivo | Cambios |
|---------|---------|
| `src/components/mandatos/NuevoMandatoDrawer.tsx` | Añadir prop `defaultEmpresaId`, pre-seleccionar empresa, mostrar indicador visual |
| `src/components/empresas/EmpresaActionsPanel.tsx` | Añadir botón dropdown "Crear Mandato" con opciones Compra/Venta |
| `src/pages/EmpresaDetalle.tsx` | Conectar el drawer con estado, pasar empresa ID y tipo |

---

### Flujo de Usuario

```
1. Usuario navega a /empresas/:id
   |
   v
2. En el sidebar "Acciones", hace clic en "Crear Mandato"
   |
   v
3. Dropdown muestra:
   - 🛒 Compra (Buy-Side)
   - 📈 Venta (Sell-Side)
   |
   v
4. Usuario selecciona tipo
   |
   v
5. Se abre NuevoMandatoDrawer con:
   - Empresa pre-seleccionada (visible pero no editable)
   - Tipo pre-seleccionado
   - Categoría en "Operación M&A"
   |
   v
6. Usuario completa descripción y guarda
   |
   v
7. Mandato creado, se cierra drawer
   Lista de mandatos de la empresa se actualiza
```

---

### Detalles de Implementación

**En NuevoMandatoDrawer:**

```tsx
// Efecto para establecer empresa por defecto
useEffect(() => {
  if (open && defaultEmpresaId) {
    form.setValue('empresaId', defaultEmpresaId);
  }
}, [open, defaultEmpresaId, form]);

// Mostrar badge informativo si empresa está pre-seleccionada
{defaultEmpresaId && (
  <div className="p-3 bg-muted rounded-lg flex items-center gap-2">
    <Building2 className="h-4 w-4 text-muted-foreground" />
    <span className="text-sm">Empresa seleccionada</span>
    <Badge variant="secondary">{empresaNombre}</Badge>
  </div>
)}
```

**Colores del dropdown:**
- Compra: icono naranja (coherente con el sistema)
- Venta: icono azul (coherente con el sistema)

---

### Beneficios

1. **Rapidez**: Un clic para iniciar mandato desde empresa
2. **Contexto**: No hay que buscar la empresa manualmente
3. **Coherencia**: Usa el mismo drawer y flujo existente
4. **Mínimo impacto**: Solo 3 archivos modificados
5. **UX clara**: El tipo se elige antes de abrir el drawer
