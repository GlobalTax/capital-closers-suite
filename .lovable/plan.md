

## Plan: Mover Deal Sheet al Dashboard del Deal

### Situacion Actual

El Deal Sheet esta ubicado en:
```
Mandato → Pestana "Marketing" → Sub-tab "Deal Sheet"
```

Esto requiere dos clics para acceder y esta escondido dentro de Marketing.

### Nueva Ubicacion Propuesta

Mover el Deal Sheet directamente a la pestana **Resumen** del mandato, visible inmediatamente al abrir el deal:

```
┌──────────────────────────────────────────────────────────────────────────────┐
│ [Header: Empresa + Estado + Badges]                                          │
├──────────────────────────────────────────────────────────────────────────────┤
│ [KPIs del Mandato]                                                           │
├──────────────────────────────────────────────────────────────────────────────┤
│  [Resumen] [Finanzas] [Targets] [Checklist] [Docs] [Marketing] [Horas]       │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌─ Timeline ──────────────────────────────────────────────────────────────┐ │
│  │ Fecha inicio / cierre / estado                                          │ │
│  └─────────────────────────────────────────────────────────────────────────┘ │
│                                                                              │
│  ┌─ Deal Sheet ────────────────────────────────────── [Editar] [Preview] ──┐ │
│  │ Resumen ejecutivo, highlights, configuracion financiera                 │ │
│  │ (Colapsado por defecto, expandible)                                     │ │
│  └─────────────────────────────────────────────────────────────────────────┘ │
│                                                                              │
│  ┌─ Informacion Especifica del Mandato ────────────────────────────────────┐ │
│  │ Tipo Buy/Sell, parametros de busqueda, etc.                             │ │
│  └─────────────────────────────────────────────────────────────────────────┘ │
│                                                                              │
│  ┌─ Empresa ───────────────────────────────────────────────────────────────┐ │
│  │ CIF, sector, ubicacion                                                  │ │
│  └─────────────────────────────────────────────────────────────────────────┘ │
│                                                                              │
│  ┌─ Financieros ───────────────────────────────────────────────────────────┐ │
│  │ Facturacion, EBITDA, empleados                                          │ │
│  └─────────────────────────────────────────────────────────────────────────┘ │
│                                                                              │
│  ┌─ Contactos Clave ───────────────────────────────────────────────────────┐ │
│  │ CEO, CFO, etc.                                                          │ │
│  └─────────────────────────────────────────────────────────────────────────┘ │
│                                                                              │
└──────────────────────────────────────────────────────────────────────────────┘
```

---

### Nuevo Componente: Deal Sheet Summary Card

Crear una version compacta del Deal Sheet para el dashboard que muestre:

1. **Estado**: Draft / Publicado
2. **Resumen rapido**: Primeras lineas del executive summary
3. **Highlights count**: "5 highlights definidos"
4. **Acciones**: Boton para editar (abre drawer/modal) y previsualizar

```
┌─ Deal Sheet ────────────────────────────────── [Borrador] ─┐
│                                                            │
│  Empresa lider regional en el sector de tecnologia...      │
│  (ver mas)                                                 │
│                                                            │
│  5 highlights de inversion  •  Financieros configurados    │
│                                                            │
│  [Editar Deal Sheet]              [Previsualizar]          │
└────────────────────────────────────────────────────────────┘
```

---

### Cambios Tecnicos

#### 1. Nuevo Componente: `DealSheetCard.tsx`

Version compacta para el dashboard:

| Elemento | Descripcion |
|----------|-------------|
| Badge de estado | Draft/Publicado |
| Preview del resumen | Primeros 200 caracteres del executive summary |
| Contadores | Numero de highlights, si hay financieros configurados |
| Boton "Editar" | Abre drawer con el editor completo |
| Boton "Preview" | Abre dialog de previsualizacion |

#### 2. Nuevo Componente: `DealSheetDrawer.tsx`

Drawer lateral que contiene el `DealSheetEditor` completo:
- Se abre al hacer clic en "Editar Deal Sheet"
- Mismo contenido que el editor actual
- Permite editar sin salir del dashboard

#### 3. Modificar `ResumenTab.tsx`

Integrar el nuevo `DealSheetCard` despues del `MandatoTimeline`:

```tsx
<MandatoTimeline ... />

{/* Deal Sheet - solo para operaciones M&A */}
{!isServicio && (
  <DealSheetCard mandatoId={mandato.id} />
)}

<MandatoTipoEspecifico ... />
```

#### 4. Simplificar `MarketingSubTabs.tsx`

Eliminar el Deal Sheet de Marketing (ya esta en Resumen):
- Solo queda el Teaser Manager
- Opcionalmente mantener link/referencia al Deal Sheet

---

### Archivos a Crear

| Archivo | Descripcion |
|---------|-------------|
| `src/features/mandatos/components/DealSheetCard.tsx` | Card compacta para dashboard |
| `src/features/mandatos/components/DealSheetDrawer.tsx` | Drawer con editor completo |

### Archivos a Modificar

| Archivo | Cambio |
|---------|--------|
| `src/features/mandatos/tabs/ResumenTab.tsx` | Integrar DealSheetCard |
| `src/features/mandatos/components/MarketingSubTabs.tsx` | Remover Deal Sheet (opcional: mantener solo Teaser) |

---

### Comportamiento

1. **Dashboard (Resumen)**: El Deal Sheet Card muestra estado y resumen rapido
2. **Clic en "Editar"**: Abre drawer lateral con editor completo
3. **Clic en "Preview"**: Abre dialog de previsualizacion (igual que antes)
4. **Auto-guardado**: Los cambios se guardan al cerrar el drawer

### Beneficios

1. **Acceso directo**: Deal Sheet visible inmediatamente al abrir el mandato
2. **Contexto**: Esta junto al resto de la informacion del deal
3. **Menos clics**: No hay que navegar a Marketing > Deal Sheet
4. **Coherencia**: La informacion del deal esta centralizada en un solo lugar

