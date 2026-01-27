

## Plan: Modulo de Ventas - Clon del Modulo de Compras

### Contexto y Analisis

El sistema actual tiene:
- **Tabla `buyer_contacts`**: Para contactos de campanas de compra (inversores)
- **Pagina `/importar-datos`**: Importa a tabla `contactos` (CRM general), NO a `buyer_contacts`
- **NO existe ruta `/admin/buyer-contacts`** en el enrutador actual

Segun tu descripcion, necesitas un modulo completo para importar contactos de campanas (compra y venta) que use el esquema de `buyer_contacts`.

---

### Arquitectura Propuesta

**Opcion elegida: Tabla unificada con discriminador `campaign_type`**

Esto minimiza cambios y evita duplicar estructura:

```text
┌────────────────────────────────────────────────────────────────┐
│                    buyer_contacts (renombrar a campaign_contacts?)
├────────────────────────────────────────────────────────────────┤
│  + campaign_type: 'buy' | 'sell'   ← NUEVO CAMPO              │
│  + first_name, last_name, email, company ...                  │
│  + investor_type, investment_range, sectors_of_interest ...   │
└────────────────────────────────────────────────────────────────┘
```

---

### Archivos a Crear/Modificar

| Archivo | Accion | Descripcion |
|---------|--------|-------------|
| **Migracion SQL** | Crear | Agregar columna `campaign_type` a `buyer_contacts` |
| `src/pages/admin/CampaignContacts.tsx` | Crear | Pagina unificada para Compras y Ventas |
| `src/App.tsx` | Modificar | Agregar rutas `/admin/buyer-contacts` y `/admin/seller-contacts` |
| `src/services/importacion/importCampaignContacts.ts` | Crear | Servicio de importacion para buyer_contacts |
| `src/services/importacion/columnNormalizer.ts` | Modificar | Agregar `normalizeCampaignContactRow()` |
| `src/services/importacion/validator.ts` | Modificar | Agregar `validateCampaignContactRow()` |
| `src/hooks/useCampaignContacts.ts` | Crear | Hook para fetch y gestion de contactos de campana |
| `src/components/campaigns/CampaignContactsTable.tsx` | Crear | Tabla con filtros para listar contactos |

---

### 1. Migracion SQL

Agregar `campaign_type` a la tabla existente:

```sql
-- Agregar campo campaign_type a buyer_contacts
ALTER TABLE buyer_contacts 
ADD COLUMN IF NOT EXISTS campaign_type TEXT 
DEFAULT 'buy' 
CHECK (campaign_type IN ('buy', 'sell'));

-- Actualizar registros existentes a 'buy'
UPDATE buyer_contacts SET campaign_type = 'buy' WHERE campaign_type IS NULL;

-- Indice para consultas por tipo
CREATE INDEX IF NOT EXISTS idx_buyer_contacts_campaign_type 
ON buyer_contacts(campaign_type);

-- RLS: misma politica que ya existe (autenticados pueden leer/escribir)
```

---

### 2. Nueva Pagina: `src/pages/admin/CampaignContacts.tsx`

Pagina que recibe el tipo via URL y adapta la UI:

```typescript
// Estructura de la pagina
export default function CampaignContacts() {
  const { type } = useParams<{ type: 'buyer' | 'seller' }>();
  const campaignType = type === 'seller' ? 'sell' : 'buy';
  
  // Labels dinamicos
  const labels = {
    buy: { title: 'Contactos de Compra', singular: 'Buyer' },
    sell: { title: 'Contactos de Venta', singular: 'Seller' }
  };
  
  // Estados
  const [activeTab, setActiveTab] = useState<'list' | 'import'>('list');
  
  return (
    <div>
      <PageHeader title={labels[campaignType].title} />
      
      <Tabs value={activeTab}>
        <TabsList>
          <TabsTrigger value="list">Listado</TabsTrigger>
          <TabsTrigger value="import">Importar Excel</TabsTrigger>
        </TabsList>
        
        <TabsContent value="list">
          <CampaignContactsTable campaignType={campaignType} />
        </TabsContent>
        
        <TabsContent value="import">
          <CampaignContactsImport campaignType={campaignType} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
```

---

### 3. Rutas en `src/App.tsx`

```typescript
const CampaignContacts = lazy(() => import("./pages/admin/CampaignContacts"));

// Dentro de Routes:
<Route 
  path="/admin/buyer-contacts" 
  element={
    <ProtectedRoute requiredRole="admin">
      <AppLayout><CampaignContacts /></AppLayout>
    </ProtectedRoute>
  } 
/>
<Route 
  path="/admin/seller-contacts" 
  element={
    <ProtectedRoute requiredRole="admin">
      <AppLayout><CampaignContacts /></AppLayout>
    </ProtectedRoute>
  } 
/>
```

---

### 4. Servicio de Importacion: `src/services/importacion/importCampaignContacts.ts`

Reutiliza el pipeline existente pero escribe en `buyer_contacts`:

```typescript
import { supabase } from "@/integrations/supabase/client";
import { normalizeCampaignContactRow } from "./columnNormalizer";
import { validateCampaignContactRow } from "./validator";

export const importCampaignContact = async (
  row: Record<string, string>,
  rowIndex: number,
  campaignType: 'buy' | 'sell',
  importBatchId: string,
  importFilename: string,
  userId: string
): Promise<ImportResult> => {
  const normalizedRow = normalizeCampaignContactRow(row);
  const name = `${normalizedRow.first_name} ${normalizedRow.last_name || ''}`.trim();

  // Validar
  const validation = validateCampaignContactRow(normalizedRow);
  if (!validation.isValid) {
    return { name, status: 'error', message: validation.errors[0].message, rowIndex };
  }

  // Verificar duplicado por email + campaign_type
  const { data: existing } = await supabase
    .from('buyer_contacts')
    .select('id')
    .eq('email', normalizedRow.email.toLowerCase())
    .eq('campaign_type', campaignType)
    .maybeSingle();

  if (existing) {
    return { name, status: 'skipped', message: 'Duplicado en sistema', rowIndex };
  }

  // Insertar
  const { error } = await supabase
    .from('buyer_contacts')
    .insert({
      first_name: normalizedRow.first_name,
      last_name: normalizedRow.last_name || null,
      email: normalizedRow.email.toLowerCase(),
      phone: normalizedRow.phone || null,
      company: normalizedRow.company || null,
      position: normalizedRow.position || null,
      investor_type: normalizedRow.investor_type || null,
      investment_range: normalizedRow.investment_range || null,
      sectors_of_interest: normalizedRow.sectors_of_interest || null,
      preferred_location: normalizedRow.preferred_location || null,
      campaign_type: campaignType,
      import_batch_id: importBatchId,
      import_filename: importFilename,
      imported_by: userId,
      imported_at: new Date().toISOString(),
      origin: 'excel_import',
      status: 'new'
    });

  if (error) throw error;

  return { name, status: 'success', message: 'Contacto creado', rowIndex };
};
```

---

### 5. Normalizador: Agregar en `columnNormalizer.ts`

```typescript
const campaignContactAliases: Record<string, string[]> = {
  first_name: ['nombre', 'first_name', 'firstname', 'name'],
  last_name: ['apellidos', 'last_name', 'lastname', 'surname'],
  email: ['email', 'correo', 'mail', 'e-mail'],
  phone: ['telefono', 'phone', 'mobile', 'movil'],
  company: ['empresa', 'company', 'compania'],
  position: ['cargo', 'position', 'puesto', 'title'],
  investor_type: ['tipo_inversor', 'investor_type', 'tipo'],
  investment_range: ['rango_inversion', 'investment_range', 'inversion'],
  sectors_of_interest: ['sectores', 'sectors_of_interest', 'sector'],
  preferred_location: ['ubicacion', 'location', 'preferred_location']
};

export const normalizeCampaignContactRow = (
  row: Record<string, string>
): Record<string, string> => {
  // Misma logica que normalizeContactoRow pero con campaignContactAliases
};
```

---

### 6. Validador: Agregar en `validator.ts`

```typescript
export const validateCampaignContactRow = (
  row: Record<string, string>
): ValidationResult => {
  const errors: ValidationError[] = [];
  
  const firstName = (row.first_name || '').trim();
  const email = (row.email || '').trim().toLowerCase();
  
  // Requerido: first_name
  if (firstName.length < 2) {
    errors.push({
      field: 'first_name',
      message: 'Nombre requerido (min 2 caracteres)',
      severity: 'error'
    });
  }
  
  // Requerido: email valido
  if (!email || !EMAIL_REGEX_TOLERANT.test(email)) {
    errors.push({
      field: 'email',
      message: 'Email valido requerido',
      severity: 'error'
    });
  }
  
  return {
    isValid: errors.filter(e => e.severity === 'error').length === 0,
    errors
  };
};
```

---

### 7. Hook: `src/hooks/useCampaignContacts.ts`

```typescript
export function useCampaignContacts(campaignType: 'buy' | 'sell') {
  return useQuery({
    queryKey: ['campaign-contacts', campaignType],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('buyer_contacts')
        .select('*')
        .eq('campaign_type', campaignType)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    }
  });
}
```

---

### 8. Componente Tabla: `src/components/campaigns/CampaignContactsTable.tsx`

Tabla con:
- Columnas: Nombre, Email, Empresa, Cargo, Tipo Inversor, Estado
- Filtros: Por estado, por fecha importacion
- Acciones: Ver detalle, eliminar

---

### Flujo Final

```text
Usuario navega a /admin/seller-contacts
          │
          ▼
┌─────────────────────────────────────────────────┐
│  CampaignContacts.tsx (type='seller')           │
│  ├─ Tab "Listado" → CampaignContactsTable       │
│  └─ Tab "Importar Excel" → Import component     │
│       ├─ Subir Excel                            │
│       ├─ normalizeCampaignContactRow()          │
│       ├─ validateCampaignContactRow()           │
│       ├─ Preview con contadores                 │
│       └─ importCampaignContacts(type='sell')    │
│            └─ INSERT buyer_contacts             │
│                 campaign_type = 'sell'          │
└─────────────────────────────────────────────────┘
```

---

### Regla de Oro Aplicada

**Compras NO se toca**: El modulo existente de importacion (`ImportarDatos.tsx`) sigue funcionando exactamente igual. Este nuevo modulo es completamente independiente.

---

### Pruebas Obligatorias

1. Navegar a `/admin/buyer-contacts` → Ver listado de compras
2. Navegar a `/admin/seller-contacts` → Ver listado vacio de ventas
3. Importar Excel en `/admin/seller-contacts`:
   - Validacion muestra contadores
   - Contactos se crean con `campaign_type = 'sell'`
4. Verificar que datos de compra y venta NO se mezclan
5. Verificar que `/importar-datos` sigue funcionando igual

