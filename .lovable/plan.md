

# Plan: Módulo de Compradores Corporativos con Etiquetas de Origen

## Resumen Ejecutivo

Implementar el módulo completo de **Compradores Corporativos** (`/admin/corporate-buyers`) que actualmente no existe en el frontend, incluyendo:
1. Página principal con listado y KPIs
2. Botón "Nuevo" funcional para crear compradores manualmente
3. Sistema de etiquetas de origen configurables (dealsuite, arx, research, meta_compras)
4. Gestión de etiquetas desde panel admin

---

## Diagnóstico

### Estado Actual
- **Tabla `corporate_buyers`**: ✅ Existe con 355 registros (233 corporate, 95 holding, 25 family_office, 2 strategic_buyer)
- **Tablas relacionadas**: ✅ `corporate_contacts`, `corporate_favorites`, `corporate_outreach`
- **RLS configurado**: ✅ Políticas correctas para admins (INSERT/UPDATE/DELETE) y usuarios autenticados (SELECT)
- **Página frontend**: ❌ NO EXISTE - La ruta `/admin/corporate-buyers` no está registrada en `App.tsx`
- **Servicio backend**: ❌ NO EXISTE - No hay `corporateBuyers.service.ts`
- **Hooks React Query**: ❌ NO EXISTE - No hay `useCorporateBuyers.ts`

### Causa Raíz del Botón "Nuevo"
El botón "Nuevo" no funciona porque **la página completa no existe en el código**. La captura de pantalla muestra una página que debe crearse desde cero.

---

## Arquitectura de la Solución

### Estructura de Archivos a Crear

```text
src/
├── pages/
│   └── admin/
│       ├── CorporateBuyers.tsx              # Página principal
│       └── BuyerSourceTags.tsx              # Admin de etiquetas
├── components/
│   └── corporate-buyers/
│       ├── CorporateBuyerDrawer.tsx         # Drawer para crear/editar
│       ├── CorporateBuyersTable.tsx         # Tabla con origen visible
│       ├── CorporateBuyersKPIs.tsx          # Cards de KPIs
│       ├── BuyerSourceBadge.tsx             # Badge de origen
│       └── BuyerSourceTagsManager.tsx       # CRUD de etiquetas
├── services/
│   └── corporateBuyers.service.ts           # Servicio CRUD
└── hooks/
    └── queries/
        └── useCorporateBuyers.ts            # Hooks React Query
```

---

## Cambios en Base de Datos

### Nueva Tabla: `buyer_source_tags`
```sql
CREATE TABLE public.buyer_source_tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT UNIQUE NOT NULL,        -- 'dealsuite', 'arx', 'research', 'meta_compras'
  label TEXT NOT NULL,             -- Texto visible al usuario
  color TEXT DEFAULT '#6366f1',    -- Color hex del badge
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Datos iniciales
INSERT INTO buyer_source_tags (key, label, color) VALUES
  ('dealsuite', 'DealSuite', '#3b82f6'),
  ('arx', 'ARX', '#8b5cf6'),
  ('research', 'Research', '#10b981'),
  ('meta_compras', 'Meta Compras', '#f59e0b');
```

### Modificación: `corporate_buyers`
```sql
-- Añadir columna source_tag_id
ALTER TABLE public.corporate_buyers
  ADD COLUMN source_tag_id UUID REFERENCES buyer_source_tags(id);

-- Actualizar registros existentes con 'research' como default
UPDATE corporate_buyers 
SET source_tag_id = (SELECT id FROM buyer_source_tags WHERE key = 'research')
WHERE source_tag_id IS NULL;

-- RLS para nueva tabla
ALTER TABLE buyer_source_tags ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can view source tags"
  ON buyer_source_tags FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins can manage source tags"
  ON buyer_source_tags FOR ALL TO authenticated
  USING (
    EXISTS (SELECT 1 FROM admin_users WHERE user_id = auth.uid() AND role IN ('admin', 'super_admin'))
  );
```

---

## Implementación Frontend

### 1. Página Principal: `CorporateBuyers.tsx`

Componentes:
- **PageHeader**: Título "Compradores Corporativos" + Botón "Nuevo"
- **KPI Cards**: Total, Por tipo (corporativo/holding/family office), Favoritos, Con contactos
- **Filtros**: Búsqueda, Tipo, Origen, País
- **Tabla**: Listado con columnas: Nombre, Tipo, País, Sectores, EBITDA, Deal Size, **Origen**, Geografía, Acciones

Acciones del botón "Nuevo":
1. Abre `CorporateBuyerDrawer`
2. Formulario con campos mínimos: nombre*, tipo*, país, sectores, origen*
3. Submit llama a `corporateBuyersService.create()`
4. On success: toast + invalidar queries + cerrar drawer

### 2. Drawer de Creación: `CorporateBuyerDrawer.tsx`

Campos del formulario:
| Campo | Tipo | Obligatorio |
|-------|------|-------------|
| name | text | ✅ |
| buyer_type | select (corporate/holding/family_office/strategic_buyer) | ✅ |
| source_tag_id | select dinámico (de buyer_source_tags) | ✅ |
| country_base | text | ❌ |
| sector_focus | multi-select | ❌ |
| geography_focus | multi-select | ❌ |
| revenue_min/max | number | ❌ |
| ebitda_min/max | number | ❌ |
| deal_size_min/max | number | ❌ |
| website | url | ❌ |
| description | textarea | ❌ |

### 3. Columna "Origen" en Tabla

```tsx
// En la definición de columnas
{
  key: "source_tag",
  label: "Origen",
  render: (_, row) => (
    <BuyerSourceBadge 
      tagId={row.source_tag_id} 
      tags={sourceTags} 
    />
  )
}
```

Componente `BuyerSourceBadge`:
- Muestra badge con color y label de la etiqueta
- Si no tiene etiqueta: muestra "Sin origen" en gris

### 4. Servicio: `corporateBuyers.service.ts`

```typescript
// Funciones principales
getCorporateBuyers(filters?: Filters): Promise<CorporateBuyer[]>
getCorporateBuyerById(id: string): Promise<CorporateBuyer>
createCorporateBuyer(data: CreateCorporateBuyerInput): Promise<CorporateBuyer>
updateCorporateBuyer(id: string, data: UpdateInput): Promise<CorporateBuyer>
deleteCorporateBuyer(id: string): Promise<void>

// Etiquetas
getSourceTags(): Promise<BuyerSourceTag[]>
createSourceTag(data: CreateTagInput): Promise<BuyerSourceTag>
updateSourceTag(id: string, data: UpdateTagInput): Promise<BuyerSourceTag>
```

### 5. Hooks: `useCorporateBuyers.ts`

```typescript
// Hooks principales
useCorporateBuyers(filters?: Filters)
useCorporateBuyer(id: string)
useCreateCorporateBuyer()
useUpdateCorporateBuyer()
useDeleteCorporateBuyer()

// Hooks de etiquetas
useBuyerSourceTags()
useCreateSourceTag()
useUpdateSourceTag()
```

### 6. Admin de Etiquetas: `BuyerSourceTags.tsx`

Ruta: `/admin/buyer-source-tags`

Funcionalidad:
- Tabla con etiquetas existentes (key, label, color, activa)
- Botón crear nueva etiqueta
- Edición inline de label y color
- Toggle para activar/desactivar

---

## Flujo de Creación Manual

```text
┌─────────────────────────────────────────────────────────────────────────────┐
│  Admin hace clic en botón "Nuevo" en /admin/corporate-buyers                │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│  Se abre CorporateBuyerDrawer                                               │
│  - Carga opciones de source_tags desde DB                                   │
│  - Formulario con validación Zod                                            │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│  Admin completa:                                                            │
│  - Nombre: "Acme Holdings"                                                  │
│  - Tipo: "holding"                                                          │
│  - Origen: "research" (selector con tags activos)                           │
│  - País: "España"                                                           │
│  - Sectores: ["Tecnología", "Industrial"]                                   │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│  Submit → corporateBuyersService.create()                                   │
│  - Validación de campos obligatorios                                        │
│  - INSERT en corporate_buyers con source_tag_id                             │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                            ┌───────┴───────┐
                            │               │
                         Error           Success
                            │               │
                            ▼               ▼
┌─────────────────────────┐   ┌─────────────────────────────────────────────┐
│  Toast con error real   │   │  Toast: "Comprador creado correctamente"   │
│  (RLS/NOT NULL/etc.)    │   │  Cerrar drawer                              │
│                         │   │  invalidateQueries(['corporate-buyers'])    │
└─────────────────────────┘   │  Nuevo buyer aparece en tabla               │
                              └─────────────────────────────────────────────┘
```

---

## Cambios en Routing y Navegación

### App.tsx - Nuevas rutas
```typescript
const CorporateBuyers = lazy(() => import("./pages/admin/CorporateBuyers"));
const BuyerSourceTags = lazy(() => import("./pages/admin/BuyerSourceTags"));

// En Routes:
<Route path="/admin/corporate-buyers" element={
  <ProtectedRoute requiredRole="admin">
    <AppLayout><CorporateBuyers /></AppLayout>
  </ProtectedRoute>
} />
<Route path="/admin/buyer-source-tags" element={
  <ProtectedRoute requiredRole="super_admin">
    <AppLayout><BuyerSourceTags /></AppLayout>
  </ProtectedRoute>
} />
```

### AppSidebar.tsx - Nuevo item
```typescript
// En superAdminGroup.items o nuevo grupo "Directorios":
{ id: "corporate-buyers", title: "Directorio Corporativo", url: "/admin/corporate-buyers", icon: Building2 },
{ id: "buyer-source-tags", title: "Etiquetas Origen", url: "/admin/buyer-source-tags", icon: Tag },
```

---

## Archivos a Crear

| Archivo | Descripción |
|---------|-------------|
| `supabase/migrations/xxx_buyer_source_tags.sql` | Tabla buyer_source_tags + FK en corporate_buyers |
| `src/pages/admin/CorporateBuyers.tsx` | Página principal del directorio |
| `src/pages/admin/BuyerSourceTags.tsx` | Admin de etiquetas de origen |
| `src/components/corporate-buyers/CorporateBuyerDrawer.tsx` | Formulario crear/editar |
| `src/components/corporate-buyers/CorporateBuyersTable.tsx` | Tabla con columna origen |
| `src/components/corporate-buyers/CorporateBuyersKPIs.tsx` | KPI cards |
| `src/components/corporate-buyers/BuyerSourceBadge.tsx` | Badge de origen |
| `src/services/corporateBuyers.service.ts` | CRUD y etiquetas |
| `src/hooks/queries/useCorporateBuyers.ts` | React Query hooks |
| `src/types/corporateBuyers.ts` | Tipos TypeScript |

## Archivos a Modificar

| Archivo | Cambio |
|---------|--------|
| `src/App.tsx` | Añadir rutas corporate-buyers y buyer-source-tags |
| `src/components/layout/AppSidebar.tsx` | Añadir items en menú |
| `src/integrations/supabase/types.ts` | Se regenera automáticamente |

---

## Casos de Prueba

| Caso | Acción | Resultado Esperado |
|------|--------|-------------------|
| A | Click "Nuevo" abre drawer | Drawer abre con formulario |
| B | Crear buyer con name + tipo + origen | Aparece en listado inmediatamente |
| C | Crear sin nombre | Error: "El nombre es obligatorio" |
| D | Buyer muestra badge de origen | Columna "Origen" visible con color |
| E | Cambiar origen en edición | Se actualiza correctamente |
| F | Crear nueva etiqueta "linkedin" | Aparece en selector de origen |
| G | Import Excel existente | Funciona sin cambios (origin default = 'research') |
| H | Refresh de página | Datos persisten correctamente |
| I | Usuario viewer intenta acceder | Redirigido (falta permisos) |

---

## Orden de Implementación

1. **Migración SQL**: Crear tabla `buyer_source_tags` + añadir FK a `corporate_buyers`
2. **Tipos TypeScript**: Definir interfaces en `types/corporateBuyers.ts`
3. **Servicio**: Crear `corporateBuyers.service.ts` con CRUD completo
4. **Hooks**: Crear `useCorporateBuyers.ts` con React Query
5. **Componentes UI**:
   - `BuyerSourceBadge.tsx`
   - `CorporateBuyersKPIs.tsx`
   - `CorporateBuyerDrawer.tsx`
   - `CorporateBuyersTable.tsx`
6. **Páginas**:
   - `CorporateBuyers.tsx`
   - `BuyerSourceTags.tsx`
7. **Routing**: Actualizar `App.tsx`
8. **Navegación**: Actualizar `AppSidebar.tsx`
9. **Pruebas**: Validar todos los casos

---

## Resumen Técnico

| Elemento | Detalle |
|----------|---------|
| **Tablas afectadas** | `corporate_buyers` (mod), `buyer_source_tags` (nueva) |
| **Causa raíz botón Nuevo** | Página no existía en el código |
| **Cuándo se dispara origen** | Al crear/editar buyer (manual o import) |
| **Cómo probar rápido** | 1) Ir a /admin/corporate-buyers 2) Click Nuevo 3) Llenar form 4) Ver en tabla |

