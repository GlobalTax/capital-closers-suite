
# Plan: Apartado "Modelos" en Gestión

## Resumen Ejecutivo

Crear un nuevo apartado **Gestión → Modelos** que sirva como repositorio central de plantillas Word reutilizables para mandatos y NDAs, **reutilizando al 100%** la infraestructura existente de `document_templates`.

---

## Arquitectura Existente a Reutilizar

| Componente | Estado | Uso |
|------------|--------|-----|
| Tabla `document_templates` | ✅ Ya existe | Almacenar metadatos de modelos |
| Bucket `document-templates` | ✅ Ya existe | Almacenar archivos Word |
| Servicio `documentTemplates.service.ts` | ✅ Ya existe | CRUD de plantillas |
| RLS policies | ✅ Ya existen | Admin puede gestionar, todos pueden ver |
| Edge Function `download-document` | ✅ Ya existe | Descargas firmadas |

---

## Cambios en Base de Datos

### No se crean tablas nuevas

Se reutiliza `document_templates` agregando nuevas categorías:

| Campo | Uso para Modelos |
|-------|------------------|
| `name` | Título descriptivo del modelo (obligatorio) |
| `category` | `'Mandato_Compra'` / `'Mandato_Venta'` / `'NDA_Modelo'` |
| `tipo_operacion` | `'compra'` / `'venta'` / `null` |
| `template_url` | Ruta en Storage del archivo Word |
| `file_name` | Nombre original del archivo |
| `file_size_bytes` | Tamaño en bytes |
| `mime_type` | `application/vnd.openxmlformats-officedocument.wordprocessingml.document` |
| `is_active` | Soft delete |

### Migración SQL

```sql
-- Añadir nuevas categorías al sistema (solo documentación, no hay constraint)
-- Las categorías son strings libres en document_templates

-- Actualizar tipo TemplateCategory en código para incluir:
-- 'Mandato_Compra' | 'Mandato_Venta' | 'NDA_Modelo'
```

---

## Estructura de Archivos a Crear

```text
src/
├── pages/
│   └── admin/
│       └── Modelos.tsx                    # Nueva página principal
├── components/
│   └── modelos/
│       ├── ModelosPage.tsx                # Componente contenedor con tabs
│       ├── ModeloCategorySection.tsx      # Sección por categoría
│       └── ModeloUploadDialog.tsx         # Dialog para subir modelo
├── services/
│   └── modelos.service.ts                 # Reutiliza documentTemplates.service
└── hooks/
    └── queries/
        └── useModelos.ts                  # Hooks React Query
```

---

## Detalle de Implementación

### 1. Página Principal: `src/pages/admin/Modelos.tsx`

Ruta: `/admin/modelos`

Contenido:
- Layout con AppLayout
- Tabs para las 3 secciones:
  - **Mandatos de Compra** (category = 'Mandato_Compra')
  - **Mandatos de Venta** (category = 'Mandato_Venta')
  - **NDA** (category = 'NDA_Modelo')

Permisos:
- Solo accesible para `admin` y `super_admin`
- Usar `ProtectedRoute` con `requiredRole="admin"`

### 2. Componente por Sección: `ModeloCategorySection.tsx`

Similar a `CompanyDocumentCategorySection.tsx` pero para modelos globales:

Funcionalidades:
- Listado de modelos de la categoría
- Botón "Subir modelo" que abre dialog
- Cada modelo muestra:
  - Título descriptivo
  - Nombre del archivo
  - Fecha de subida
  - Botón descargar
  - Botón eliminar (soft delete)
- Estado vacío: "No hay modelos en esta categoría"

### 3. Dialog de Subida: `ModeloUploadDialog.tsx`

Campos:
- **Título** (obligatorio) - Input de texto
- **Archivo Word** (obligatorio) - Solo .doc/.docx
- Botón "Subir"

Validaciones:
- Título no vacío
- Archivo debe ser .doc o .docx
- Tamaño máximo 50MB

### 4. Servicio: `modelos.service.ts`

Funciones:
```typescript
// Obtener modelos por categoría
getModelosByCategory(category: ModeloCategory): Promise<DocumentTemplate[]>

// Subir nuevo modelo
uploadModelo(file: File, title: string, category: ModeloCategory): Promise<DocumentTemplate>

// Eliminar modelo (soft delete)
deleteModelo(id: string): Promise<void>

// Descargar modelo
downloadModelo(templateUrl: string, fileName: string): Promise<void>
```

### 5. Hook: `useModelos.ts`

```typescript
useModelosByCategory(category: ModeloCategory)
useUploadModelo()
useDeleteModelo()
useDownloadModelo()
```

---

## Cambios en Sidebar

Añadir nuevo item en el grupo "Gestión":

```typescript
// En menuGroups, grupo "gestion":
{ id: "modelos", title: "Modelos", url: "/admin/modelos", icon: FileSignature },
```

---

## Cambios en Routing

En `App.tsx`:

```typescript
const Modelos = lazy(() => import("./pages/admin/Modelos"));

// En rutas protegidas:
<Route 
  path="/admin/modelos" 
  element={
    <ProtectedRoute requiredRole="admin">
      <AppLayout><Modelos /></AppLayout>
    </ProtectedRoute>
  } 
/>
```

---

## Tipos TypeScript

Actualizar `src/types/documents.ts`:

```typescript
export type TemplateCategory = 
  | 'NDA' 
  | 'LOI' 
  | 'Teaser' 
  | 'SPA' 
  | 'DD_Checklist' 
  | 'Contrato' 
  | 'Mandato_Compra'    // NUEVO
  | 'Mandato_Venta'     // NUEVO
  | 'NDA_Modelo'        // NUEVO
  | 'Otro';

export type ModeloCategory = 'Mandato_Compra' | 'Mandato_Venta' | 'NDA_Modelo';
```

---

## Flujo de Subida de Modelo

```text
┌─────────────────────────────────────────────────────────────────────────────┐
│  Admin hace clic en "Subir modelo" en sección Mandatos de Venta             │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│  Se abre ModeloUploadDialog                                                 │
│  - Input: Título del modelo (ej: "Mandato Venta Estándar v2")               │
│  - Input: Archivo Word (.docx)                                              │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│  Validación:                                                                │
│  - Título no vacío                                                          │
│  - Archivo es .doc o .docx                                                  │
│  - Tamaño < 50MB                                                            │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│  Storage: Subir a bucket 'document-templates'                               │
│  Ruta: modelos/{category}/{uuid}-{filename}                                 │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│  DB: Insert en document_templates                                           │
│  - name: título descriptivo                                                 │
│  - category: 'Mandato_Venta'                                                │
│  - template_url: ruta en storage                                            │
│  - file_name, file_size_bytes, mime_type                                    │
│  - created_by: auth.uid()                                                   │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│  Refrescar listado - modelo aparece en la sección                           │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Diseño Visual

### Vista General de la Página

```text
┌─────────────────────────────────────────────────────────────────────────────┐
│  [Sidebar]  │  Modelos de Documentos                                        │
│             │                                                               │
│             │  ┌─────────────────────────────────────────────────────────┐  │
│             │  │ [Mandatos de Compra] [Mandatos de Venta] [NDA]          │  │
│             │  └─────────────────────────────────────────────────────────┘  │
│             │                                                               │
│             │  ┌─────────────────────────────────────────────────────────┐  │
│             │  │  📄 Mandatos de Venta (3)            [+ Subir modelo]   │  │
│             │  ├─────────────────────────────────────────────────────────┤  │
│             │  │                                                         │  │
│             │  │  ┌───────────────────────────────────────────────────┐  │  │
│             │  │  │ 📄 Mandato Venta Estándar v2                      │  │  │
│             │  │  │    mandato_venta_estandar.docx • 245 KB           │  │  │
│             │  │  │    Subido 4 feb 2026                [⬇️] [🗑️]      │  │  │
│             │  │  └───────────────────────────────────────────────────┘  │  │
│             │  │                                                         │  │
│             │  │  ┌───────────────────────────────────────────────────┐  │  │
│             │  │  │ 📄 Mandato Venta Industrial                       │  │  │
│             │  │  │    mandato_industrial_2026.docx • 312 KB          │  │  │
│             │  │  │    Subido 1 feb 2026                [⬇️] [🗑️]      │  │  │
│             │  │  └───────────────────────────────────────────────────┘  │  │
│             │  │                                                         │  │
│             │  └─────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Archivos a Crear/Modificar

### Archivos Nuevos

| Archivo | Descripción |
|---------|-------------|
| `src/pages/admin/Modelos.tsx` | Página principal |
| `src/components/modelos/ModeloCategorySection.tsx` | Sección por categoría |
| `src/components/modelos/ModeloUploadDialog.tsx` | Dialog de subida |
| `src/services/modelos.service.ts` | Servicio de modelos |
| `src/hooks/queries/useModelos.ts` | Hooks React Query |

### Archivos a Modificar

| Archivo | Cambio |
|---------|--------|
| `src/App.tsx` | Añadir ruta `/admin/modelos` |
| `src/components/layout/AppSidebar.tsx` | Añadir item "Modelos" en Gestión |
| `src/types/documents.ts` | Añadir nuevas categorías de template |

---

## Validaciones de Archivo

```typescript
const ALLOWED_EXTENSIONS = ['.doc', '.docx'];
const ALLOWED_MIME_TYPES = [
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
];
const MAX_SIZE_BYTES = 50 * 1024 * 1024; // 50MB
```

---

## Casos de Prueba

| Caso | Acción | Resultado Esperado |
|------|--------|-------------------|
| A | Subir modelo Word en "Mandatos de Venta" con título | Aparece en listado, se puede descargar |
| B | Subir 2 modelos distintos en "NDA" | Ambos aparecen correctamente |
| C | Subir archivo no Word (.pdf) | Error: "Solo se permiten archivos .doc/.docx" |
| D | Subir sin título | Error: "El título es obligatorio" |
| E | Refresh de página | Todos los modelos persisten |
| F | Usuario viewer intenta acceder a /admin/modelos | Redirigido a dashboard |
| G | Descargar modelo | Se descarga archivo Word correctamente |
| H | Eliminar modelo | Desaparece del listado (soft delete) |

---

## Orden de Implementación

1. Actualizar tipos en `src/types/documents.ts`
2. Crear servicio `src/services/modelos.service.ts`
3. Crear hooks `src/hooks/queries/useModelos.ts`
4. Crear componentes UI:
   - `ModeloUploadDialog.tsx`
   - `ModeloCategorySection.tsx`
5. Crear página `src/pages/admin/Modelos.tsx`
6. Añadir ruta en `App.tsx`
7. Añadir item en sidebar `AppSidebar.tsx`
8. Probar flujo completo

---

## Resumen para Usuario No Técnico

Se creará un nuevo apartado **"Modelos"** dentro del menú **Gestión** del CRM. Este apartado tendrá 3 secciones:

1. **Mandatos de Compra** - Para plantillas de contratos de compra
2. **Mandatos de Venta** - Para plantillas de contratos de venta  
3. **NDA** - Para plantillas de acuerdos de confidencialidad

En cada sección podrás:
- **Subir** documentos Word (.doc o .docx) con un título descriptivo
- **Descargar** los modelos cuando los necesites
- **Eliminar** modelos que ya no sean necesarios

Solo los usuarios con permisos de administrador podrán ver y gestionar este apartado.
