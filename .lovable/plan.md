
## Plan: Importación Masiva de Targets para Mandatos de Compra

### Objetivo
Crear una funcionalidad completa para importar targets en bloque desde:
1. **Archivos Excel/CSV** - Subir listado de empresas target
2. **Apollo** - Búsqueda directa en la base de datos de Apollo (275M+ contactos)

---

### Arquitectura Propuesta

```text
┌─────────────────────────────────────────────────────────────────┐
│                 TargetsTabBuySide.tsx                           │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────┐ │
│  │ + Nuevo     │  │ 📎 Asociar  │  │ 📤 Importar ▼          │ │
│  │   Target    │  │   Existente │  │   • Desde Excel/CSV    │ │
│  └─────────────┘  └─────────────┘  │   • Desde Apollo       │ │
│                                    └─────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
                              │
              ┌───────────────┴───────────────┐
              ▼                               ▼
┌─────────────────────────┐     ┌─────────────────────────────┐
│  ImportTargetsDrawer    │     │  ImportApolloTargetsDrawer  │
│  (Excel/CSV)            │     │  (Búsqueda Apollo)          │
│                         │     │                             │
│  1. Subir archivo       │     │  1. Palabras clave          │
│  2. Mapear columnas     │     │  2. Filtros (sector, país)  │
│  3. Previsualizar       │     │  3. Previsualizar           │
│  4. Importar            │     │  4. Seleccionar e importar  │
└─────────────────────────┘     └─────────────────────────────┘
              │                               │
              └───────────────┬───────────────┘
                              ▼
                  ┌───────────────────────┐
                  │  importTargets.ts     │
                  │  (Servicio común)     │
                  │                       │
                  │  • Crear empresa      │
                  │  • Vincular a mandato │
                  │  • Asignar rol=target │
                  └───────────────────────┘
```

---

### Componentes a Crear

#### 1. Drawer de Importación desde Excel/CSV
**Archivo:** `src/components/targets/ImportTargetsExcelDrawer.tsx`

- Dropzone para arrastrar archivos (CSV, XLSX, XLS)
- Mapeo automático de columnas con alias flexibles
- Vista previa de datos con validación
- Configuración: duplicados, tags automáticos
- Barra de progreso durante importación

#### 2. Drawer de Importación desde Apollo
**Archivo:** `src/components/targets/ImportTargetsApolloDrawer.tsx`

- Campo de palabras clave para búsqueda
- Filtros: sector, país, tamaño de empresa, industria
- Resultados en tabla seleccionable
- Importación de seleccionados directamente como targets

#### 3. Servicio de Importación de Targets
**Archivo:** `src/services/importacion/importTargets.ts`

```typescript
interface TargetImportRow {
  nombre: string;           // Requerido
  sector?: string;
  ubicacion?: string;
  facturacion?: number;
  empleados?: number;
  sitio_web?: string;
  contacto_nombre?: string;
  contacto_email?: string;
  contacto_telefono?: string;
  buyer_type?: BuyerType;
  tags?: string[];
}

export async function importTargetsFromSpreadsheet(
  mandatoId: string,
  rows: TargetImportRow[],
  config: ImportConfig,
  onProgress?: (current: number, total: number) => void
): Promise<ImportResult[]>;

export async function importTargetsFromApollo(
  mandatoId: string,
  prospects: ApolloProspect[],
  onProgress?: (current: number, total: number) => void
): Promise<ImportResult[]>;
```

#### 4. Normalizador de Columnas para Targets
**Archivo:** `src/services/importacion/columnNormalizer.ts` (ampliar)

```typescript
const targetAliases: Record<string, string[]> = {
  nombre: ['nombre', 'empresa', 'company', 'company_name', 'razón social', ...],
  sector: ['sector', 'industry', 'industria', 'actividad', ...],
  ubicacion: ['ubicacion', 'ciudad', 'pais', 'location', 'country', ...],
  facturacion: ['facturacion', 'revenue', 'ventas', 'ingresos', ...],
  empleados: ['empleados', 'employees', 'plantilla', 'headcount', ...],
  sitio_web: ['web', 'website', 'url', 'sitio', 'pagina', ...],
  contacto_nombre: ['contacto', 'contact', 'persona', 'nombre_contacto', ...],
  contacto_email: ['email', 'correo', 'e-mail', 'contact_email', ...],
  buyer_type: ['tipo', 'type', 'buyer_type', 'clasificacion', ...],
  tags: ['tags', 'etiquetas', 'labels', 'categorias', ...],
};
```

---

### Flujo de Importación Excel/CSV

```text
1. Usuario abre ImportTargetsExcelDrawer
   ↓
2. Arrastra/selecciona archivo
   ↓
3. parseSpreadsheet() extrae headers y filas
   ↓
4. normalizeTargetRow() mapea a campos estándar
   ↓
5. Vista previa muestra:
   • N registros detectados
   • Campos mapeados vs no mapeados
   • Validación (nombre requerido)
   ↓
6. Usuario configura:
   • Estrategia duplicados (omitir/crear)
   • Tags por defecto
   • Buyer Type por defecto
   ↓
7. Importar → importTargetsFromSpreadsheet()
   ↓
8. Por cada fila:
   • Buscar empresa existente por nombre
   • Si existe y config=omitir → skip
   • Si no existe → createEmpresa()
   • addEmpresaToMandato(mandatoId, empresaId, 'target')
   • Si hay contacto → createContacto + asociar
   ↓
9. Mostrar resultados: N exitosos, N omitidos, N errores
```

---

### Flujo de Importación Apollo

```text
1. Usuario abre ImportApolloTargetsDrawer
   ↓
2. Introduce keywords: "industrial automatización"
   ↓
3. Aplica filtros: España, 10-50 empleados, etc.
   ↓
4. Llama a search-apollo-prospects (edge function existente)
   ↓
5. Muestra resultados en tabla seleccionable
   ↓
6. Usuario selecciona prospects a importar
   ↓
7. importTargetsFromApollo() → convierte a empresas
   ↓
8. Por cada prospect:
   • Crear empresa con datos de Apollo
   • Vincular al mandato como target
   • Opcionalmente crear contacto
   ↓
9. Mostrar resultados
```

---

### Modificaciones a Componentes Existentes

#### TargetsTabBuySide.tsx
Añadir menú dropdown "Importar" con dos opciones:

```tsx
<DropdownMenu>
  <DropdownMenuTrigger asChild>
    <Button variant="outline">
      <Upload className="h-4 w-4 mr-2" />
      Importar
      <ChevronDown className="h-4 w-4 ml-2" />
    </Button>
  </DropdownMenuTrigger>
  <DropdownMenuContent>
    <DropdownMenuItem onClick={() => setExcelImportOpen(true)}>
      <FileSpreadsheet className="h-4 w-4 mr-2" />
      Desde Excel/CSV
    </DropdownMenuItem>
    <DropdownMenuItem onClick={() => setApolloImportOpen(true)}>
      <Search className="h-4 w-4 mr-2" />
      Desde Apollo
    </DropdownMenuItem>
  </DropdownMenuContent>
</DropdownMenu>
```

---

### Campos Mínimos para Target

| Campo | Requerido | Desde Excel | Desde Apollo |
|-------|-----------|-------------|--------------|
| nombre (empresa) | ✅ | ✅ | ✅ (organization.name) |
| sector | ❌ | ✅ | ✅ (organization.industry) |
| ubicacion | ❌ | ✅ | ✅ (organization.country) |
| facturacion | ❌ | ✅ | ❌ |
| empleados | ❌ | ✅ | ✅ (estimated_num_employees) |
| sitio_web | ❌ | ✅ | ✅ (primary_domain) |
| contacto_nombre | ❌ | ✅ | ✅ (first_name + last_name) |
| contacto_email | ❌ | ✅ | Requiere enriquecimiento |
| buyer_type | ❌ | ✅ | ❌ (user selecciona) |
| tags | ❌ | ✅ | ❌ (user define) |

---

### Archivos a Crear

| Archivo | Descripción |
|---------|-------------|
| `src/components/targets/ImportTargetsExcelDrawer.tsx` | Drawer para importar desde Excel/CSV |
| `src/components/targets/ImportTargetsApolloDrawer.tsx` | Drawer para importar desde Apollo |
| `src/services/importacion/importTargets.ts` | Lógica de importación de targets |

### Archivos a Modificar

| Archivo | Cambio |
|---------|--------|
| `src/services/importacion/columnNormalizer.ts` | Añadir aliases para targets |
| `src/features/mandatos/tabs/TargetsTabBuySide.tsx` | Añadir menú de importación y drawers |

---

### Validaciones

1. **Nombre de empresa** - Obligatorio, mínimo 2 caracteres
2. **Duplicados** - Detectar por nombre normalizado
3. **Límite** - Máximo 500 targets por importación
4. **Permisos** - Usuario autenticado y con acceso al mandato

---

### UX Highlights

- **Mapeo inteligente** de columnas con preview
- **Barra de progreso** en tiempo real
- **Resumen final** con estadísticas claras
- **Opción de rollback** si hay errores masivos
- **Tags automáticos** basados en origen (excel_import, apollo_import)
