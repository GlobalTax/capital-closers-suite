

## Plan: Integración Avanzada con Apollo - Importación Automática de Listas y Contactos

### Contexto

Actualmente el drawer de importación desde Apollo (`ImportTargetsApolloDrawer`) permite **buscar** empresas por keywords y filtros, pero el usuario quiere poder **dar una lista de Apollo** o **contactos específicos** y que se creen automáticamente como targets.

### Capacidades de la API de Apollo

Tras investigar la documentación oficial, Apollo ofrece estos endpoints relevantes:

| Endpoint | Método | Descripción | Créditos |
|----------|--------|-------------|----------|
| `/api/v1/labels` | GET | Obtener todas las listas/tags guardadas | Gratis |
| `/api/v1/contacts/search` | POST | Buscar contactos con filtro `contact_label_ids` | Gratis |
| `/api/v1/mixed_people/api_search` | POST | Búsqueda de personas en la base de datos | Gratis |
| `/api/v1/people/match` | POST | Enriquecer persona (obtener email/teléfono) | 1 crédito |
| `/api/v1/people/bulk_match` | POST | Enriquecer hasta 10 personas a la vez | 1 crédito/persona |
| `/api/v1/people/{id}` | GET | Obtener datos de persona por ID | Gratis |
| `/api/v1/contacts` | POST | Crear contacto en Apollo | Gratis |

### Solución Propuesta

Añadir **3 nuevas formas** de importar desde Apollo al drawer existente:

```text
┌──────────────────────────────────────────────────────────────┐
│         ImportTargetsApolloDrawer (Mejorado)                 │
├──────────────────────────────────────────────────────────────┤
│  Método de importación:                                      │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │ ○ Buscar por keywords (actual)                          │ │
│  │ ○ Importar desde Lista guardada de Apollo    [NUEVO]    │ │
│  │ ○ Pegar URLs/IDs de Apollo                   [NUEVO]    │ │
│  └─────────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────┘
```

---

### Cambios a Realizar

#### 1. Nueva Edge Function: `get-apollo-lists`

Obtiene las listas/tags guardadas en la cuenta de Apollo del usuario.

**Archivo:** `supabase/functions/get-apollo-lists/index.ts`

```typescript
// Llama a GET /api/v1/labels para obtener listas guardadas
// Devuelve: { labels: [{ id, name, count }] }
```

#### 2. Nueva Edge Function: `get-apollo-list-contacts`

Obtiene los contactos de una lista específica de Apollo.

**Archivo:** `supabase/functions/get-apollo-list-contacts/index.ts`

```typescript
// Llama a POST /api/v1/contacts/search con contact_label_ids
// Paginación automática hasta 500 contactos
// Devuelve contactos con datos completos (ya enriquecidos en Apollo)
```

#### 3. Modificar Edge Function: `search-apollo-prospects`

Añadir soporte para buscar por IDs de personas específicas.

**Cambio:** Aceptar parámetro `person_ids` para buscar personas por ID

```typescript
// Si person_ids está presente, llamar a /api/v1/people/{id} para cada uno
// O usar /api/v1/people/bulk_match con los IDs
```

#### 4. Mejorar `ImportTargetsApolloDrawer.tsx`

Añadir selector de método de importación con 3 opciones:

```text
┌─────────────────────────────────────────────────────────────────┐
│ Método: [Buscar por keywords ▼]                                 │
├─────────────────────────────────────────────────────────────────┤
│ Opción 1: Buscar por keywords (ACTUAL)                          │
│   - Keywords, País, Tamaño empresa                              │
│   - Resultados agrupados por organización                       │
├─────────────────────────────────────────────────────────────────┤
│ Opción 2: Importar desde Lista de Apollo (NUEVO)                │
│   - Dropdown con listas guardadas (cargadas de /api/v1/labels)  │
│   - Muestra conteo de contactos por lista                       │
│   - Importa contactos YA ENRIQUECIDOS (sin créditos extra)      │
├─────────────────────────────────────────────────────────────────┤
│ Opción 3: Pegar URLs/IDs de Apollo (NUEVO)                      │
│   - Textarea para pegar múltiples URLs de Apollo                │
│   - Soporta formatos:                                           │
│     - app.apollo.io/#/contacts/CONTACT_ID                       │
│     - app.apollo.io/#/people/PERSON_ID                          │
│     - IDs directos (uno por línea)                              │
│   - Extrae datos de cada contacto vía API                       │
└─────────────────────────────────────────────────────────────────┘
```

---

### Flujo: Importar desde Lista de Apollo

```text
1. Usuario abre drawer → Selecciona "Importar desde Lista"
     ↓
2. Llama a get-apollo-lists → Obtiene listas guardadas
     ↓
3. Usuario selecciona lista → Click "Cargar contactos"
     ↓
4. Llama a get-apollo-list-contacts con label_id
     ↓
5. Muestra contactos en tabla (ya tienen email/teléfono)
     ↓
6. Usuario selecciona contactos → Click "Importar"
     ↓
7. importTargetsFromApollo() crea empresas y contactos
```

### Flujo: Pegar URLs/IDs de Apollo

```text
1. Usuario abre drawer → Selecciona "Pegar URLs/IDs"
     ↓
2. Pega lista de URLs o IDs en textarea
     ↓
3. Click "Extraer contactos" → Parsea URLs/IDs
     ↓
4. Llama a extract-apollo-contact (existente) para cada uno
   O usa /api/v1/people/bulk_match para grupos de 10
     ↓
5. Muestra contactos extraídos en tabla
     ↓
6. Usuario selecciona → Importa como targets
```

---

### Archivos a Crear

| Archivo | Descripción |
|---------|-------------|
| `supabase/functions/get-apollo-lists/index.ts` | Obtiene listas/tags de Apollo |
| `supabase/functions/get-apollo-list-contacts/index.ts` | Obtiene contactos de una lista |

### Archivos a Modificar

| Archivo | Cambio |
|---------|--------|
| `supabase/functions/search-apollo-prospects/index.ts` | Añadir soporte para `person_ids` |
| `src/components/targets/ImportTargetsApolloDrawer.tsx` | Añadir selector de método y nuevas vistas |
| `src/services/importacion/importTargets.ts` | Adaptar para contactos Apollo completos |
| `supabase/config.toml` | Registrar nuevas edge functions |

---

### Tipos de Datos

```typescript
// Lista de Apollo
interface ApolloLabel {
  id: string;
  name: string;
  cached_count?: number;  // Número de contactos en la lista
  created_at?: string;
}

// Contacto de Apollo (ya enriquecido)
interface ApolloContact {
  id: string;
  first_name: string;
  last_name: string;
  name: string;
  email: string;
  phone_numbers?: { raw_number: string; type: string }[];
  organization_name?: string;
  organization?: {
    name: string;
    industry?: string;
    country?: string;
    estimated_num_employees?: number;
    primary_domain?: string;
  };
  title?: string;
  linkedin_url?: string;
}
```

---

### UI del Drawer Mejorado

```text
┌──────────────────────────────────────────────────────────────────┐
│ ← Importar Targets desde Apollo                                  │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Método de importación                                           │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │  🔍 Buscar por keywords                                    │  │
│  │  📋 Importar desde Lista de Apollo     ← Nuevo             │  │
│  │  📎 Pegar URLs o IDs de contactos      ← Nuevo             │  │
│  └────────────────────────────────────────────────────────────┘  │
│                                                                  │
│  ─────────────────────────────────────────────────────────────   │
│                                                                  │
│  [Vista según método seleccionado]                               │
│                                                                  │
│  Si "Lista de Apollo":                                           │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │ Selecciona una lista: [Leads Q4 2024 (152) ▼]              │  │
│  │                       [Targets M&A España (87)]            │  │
│  │                       [Industriales UK (234)]              │  │
│  └────────────────────────────────────────────────────────────┘  │
│                                                                  │
│  Si "Pegar URLs":                                                │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │ https://app.apollo.io/#/contacts/abc123                    │  │
│  │ https://app.apollo.io/#/people/xyz789                      │  │
│  │ 5f8a9b2c1d3e4f5a6b7c8d9e                                   │  │
│  └────────────────────────────────────────────────────────────┘  │
│                                                                  │
├──────────────────────────────────────────────────────────────────┤
│                                    [Cancelar]  [Cargar contactos]│
└──────────────────────────────────────────────────────────────────┘
```

---

### Ventajas de esta Solución

1. **Listas de Apollo** - El usuario crea listas en Apollo con sus filtros avanzados, luego importa directamente
2. **Contactos ya enriquecidos** - Los contactos en listas de Apollo ya tienen email/teléfono (sin créditos extra)
3. **URLs directas** - Copiar/pegar URLs de contactos individuales desde Apollo
4. **Flexibilidad** - Mantiene el método de búsqueda actual + 2 nuevas opciones
5. **Integración profunda** - Aprovecha al máximo las capacidades de la API de Apollo

---

### Notas sobre Créditos Apollo

| Operación | Créditos |
|-----------|----------|
| Obtener listas (GET /labels) | Gratis |
| Buscar contactos de lista | Gratis |
| Buscar personas (mixed_people/api_search) | Gratis |
| Enriquecer persona (people/match) | 1 crédito |
| Enriquecer en bulk (people/bulk_match) | 1 crédito/persona |
| Obtener persona por ID | Gratis si ya es contacto |

La opción de **Importar desde Lista** es la más eficiente porque los contactos ya están enriquecidos en Apollo (el usuario ya pagó esos créditos al añadirlos a la lista).

