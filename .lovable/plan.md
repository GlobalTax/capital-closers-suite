

## Plan: Extender work_task_types con Reglas de Validación Adicionales

### Estado Actual (Confirmado)

La tabla `work_task_types` ya tiene estos campos de validación:

| Campo | Tipo | Default | Estado |
|-------|------|---------|--------|
| `require_mandato` | boolean | true | ✅ Existe |
| `require_lead` | boolean | false | ✅ Existe |
| `require_description` | boolean | false | ✅ Existe |
| `context` | text | 'all' | ✅ Existe |
| `default_value_type` | enum | 'core_ma' | ✅ Existe |

Campos solicitados que **NO existen**:

| Campo | Tipo | Default | Estado |
|-------|------|---------|--------|
| `min_description_length` | int | 20 | ❌ No existe |
| `default_billable` | boolean | true | ❌ No existe |

---

### Cambios Requeridos

#### 1. Migración de Base de Datos

```sql
-- Añadir columnas de reglas adicionales a work_task_types
ALTER TABLE public.work_task_types
ADD COLUMN IF NOT EXISTS min_description_length integer NOT NULL DEFAULT 20,
ADD COLUMN IF NOT EXISTS default_billable boolean NOT NULL DEFAULT true;

-- Comentarios descriptivos
COMMENT ON COLUMN public.work_task_types.min_description_length IS 
  'Longitud mínima de descripción requerida cuando require_description es true';
COMMENT ON COLUMN public.work_task_types.default_billable IS 
  'Si las entradas de tiempo de este tipo son facturables por defecto';
```

---

#### 2. Actualizar TypeScript Types

**Archivo: `src/services/workTaskTypes.service.ts`**

```typescript
export interface WorkTaskType {
  id: string;
  name: string;
  description: string | null;
  is_active: boolean;
  sort_order: number;
  context: WorkTaskTypeContext;
  created_at: string;
  updated_at: string;
  // Dynamic validation requirements
  require_mandato: boolean;
  require_lead: boolean;
  require_description: boolean;
  // NEW: Additional validation rules
  min_description_length: number;
  default_billable: boolean;
}

export interface UpdateWorkTaskTypeData {
  name?: string;
  description?: string;
  is_active?: boolean;
  sort_order?: number;
  // NEW: Validation rules editable from admin
  require_mandato?: boolean;
  require_lead?: boolean;
  require_description?: boolean;
  min_description_length?: number;
  default_billable?: boolean;
}
```

---

#### 3. Actualizar UI de Administración

**Archivo: `src/pages/ConfiguracionTareasTiempo.tsx`**

Añadir al formulario de edición (Dialog) controles para:

```text
┌─────────────────────────────────────────────────────────────┐
│ Editar Tipo de Tarea                                   [X]  │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ Nombre *                                                    │
│ [___________________________________________________]       │
│                                                             │
│ Descripción (opcional)                                      │
│ [___________________________________________________]       │
│                                                             │
│ ─────────────── Reglas de Validación ───────────────       │
│                                                             │
│ [✓] Requiere seleccionar Mandato                           │
│ [ ] Requiere seleccionar Lead                              │
│ [✓] Requiere descripción                                   │
│     └─ Longitud mínima: [20___] caracteres                 │
│                                                             │
│ [✓] Facturable por defecto                                 │
│                                                             │
│                              [Cancelar]  [Guardar Cambios]  │
└─────────────────────────────────────────────────────────────┘
```

**Tabla principal** - Añadir columna visual de reglas:

| # | Nombre | Descripción | Reglas | Estado | Acciones |
|---|--------|-------------|--------|--------|----------|
| 1 | IM | ... | 📋 Mandato • 📝 Desc(20) | ✓ Activa | ✏️ 🔘 |
| 2 | Leads | ... | 📋 Mandato • 👤 Lead | ✓ Activa | ✏️ 🔘 |

---

### Archivos a Modificar

| Archivo | Cambio |
|---------|--------|
| Nueva migración SQL | Añadir `min_description_length` y `default_billable` |
| `src/services/workTaskTypes.service.ts` | Actualizar interfaces `WorkTaskType` y `UpdateWorkTaskTypeData` |
| `src/pages/ConfiguracionTareasTiempo.tsx` | Añadir controles de validación al formulario y columna de reglas |

---

### Sección Técnica

**Migración segura:**
- Usa `ADD COLUMN IF NOT EXISTS` para idempotencia
- Valores por defecto sensatos (min_description_length=20, default_billable=true)
- No rompe datos existentes

**Compatibilidad hacia atrás:**
- Los tipos existentes seguirán funcionando con los defaults
- El código de validación existente (validateByTaskType) ya usa `require_*` flags

**Próximos pasos (fuera de este plan):**
- Actualizar `validateByTaskType` para usar `min_description_length` en vez de hardcoded 10
- Usar `default_billable` en formularios de entrada de tiempo

