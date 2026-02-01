

## Plan: Corregir Integración de Listas de Apollo

### Diagnóstico del Problema

Después de analizar los logs y el código, he identificado el problema:

**La API responde correctamente (HTTP 200) pero devuelve 0 labels**

```
2026-02-01T11:12:16Z INFO [Apollo Lists] Found 0 labels
2026-02-01T11:12:16Z INFO [Apollo Lists] Fetching saved labels/lists
```

Esto puede deberse a dos causas:

1. **La cuenta de Apollo no tiene "Labels" creados** - En Apollo, los "Labels" son etiquetas que se asignan manualmente a contactos. Si nunca has creado etiquetas en tu cuenta de Apollo, el endpoint devolverá un array vacío.

2. **Confusión terminológica** - Apollo tiene:
   - **Labels/Tags**: Etiquetas personalizadas para organizar contactos (lo que el endpoint actual busca)
   - **Saved Searches**: Búsquedas guardadas con filtros específicos (diferente)
   - **People Lists**: Listas de la base de datos de Apollo (diferentes de tus contactos)

---

### Verificación Requerida

Antes de hacer cambios, necesito que confirmes en tu cuenta de Apollo:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  Apollo.io > Contacts > Filters (Panel izquierdo)                           │
│                                                                              │
│  ¿Ves una sección de "Labels" o "Tags"?                                     │
│  ¿Tienes etiquetas creadas con contactos asignados?                         │
│                                                                              │
│  Ejemplo:                                                                    │
│    ● Leads Q1 2024 (45 contactos)                                           │
│    ● M&A Targets (120 contactos)                                            │
│    ● Qualified Buyers (30 contactos)                                        │
└─────────────────────────────────────────────────────────────────────────────┘
```

**Si no tienes labels creados en Apollo, necesitas crearlos primero desde la interfaz web de Apollo.io.**

---

### Solución Propuesta: Mejorar Diagnóstico y Feedback

Independientemente de si hay labels o no, mejoraremos la experiencia de usuario con mejor feedback:

#### 1. Mejorar Edge Function con Logging Detallado

Añadir más información de diagnóstico para entender la respuesta de Apollo:

```typescript
// Log the full response for debugging
console.log("[Apollo Lists] Raw response:", JSON.stringify(apolloData));

// Also log if the response has other fields we might be missing
console.log("[Apollo Lists] Response keys:", Object.keys(apolloData));
```

#### 2. Añadir Estado Vacío Informativo en la UI

Cuando no hay labels, mostrar un mensaje explicativo en lugar de una lista vacía:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  📋 No se encontraron listas en Apollo                                      │
│                                                                              │
│  Para usar esta función:                                                    │
│  1. Ve a tu cuenta de Apollo.io                                             │
│  2. Selecciona contactos y asígnales una etiqueta (Label)                   │
│  3. Las etiquetas aparecerán aquí automáticamente                          │
│                                                                              │
│  [Abrir Apollo.io ↗]   [Refrescar listas ↻]                                │
└─────────────────────────────────────────────────────────────────────────────┘
```

#### 3. Verificar API Key con Endpoint de Test

Añadir una verificación rápida de que la API key es válida:

```typescript
// Test API key validity
const testResponse = await fetch("https://api.apollo.io/api/v1/auth/health", {
  headers: { "X-Api-Key": APOLLO_API_KEY }
});
```

---

### Cambios Técnicos

#### Archivo 1: `supabase/functions/get-apollo-lists/index.ts`

Mejorar logging y añadir diagnóstico:

| Cambio | Descripción |
|--------|-------------|
| Añadir log de respuesta completa | Para depuración |
| Log de keys en la respuesta | Identificar campos disponibles |
| Verificación de API key | Confirmar validez |

#### Archivo 2: `src/components/targets/ImportTargetsApolloDrawer.tsx`

Mejorar UI cuando no hay labels:

| Cambio | Descripción |
|--------|-------------|
| Empty state informativo | Explicar cómo crear labels en Apollo |
| Botón de refresh | Permitir recargar labels |
| Link a Apollo.io | Facilitar acceso para crear labels |

---

### Flujo de Verificación

```
┌──────────────────┐     ┌──────────────────┐     ┌──────────────────┐
│   Usuario abre   │     │  Edge Function   │     │   Apollo API     │
│   tab "Lists"    │────▶│  get-apollo-lists│────▶│   /api/v1/labels │
└──────────────────┘     └──────────────────┘     └──────────────────┘
                                  │                        │
                                  │◀───────────────────────┘
                                  │   { labels: [] }
                                  ▼
                         ┌──────────────────┐
                         │ 0 labels = UI    │
                         │ muestra estado   │
                         │ vacío informativo│
                         └──────────────────┘
```

---

### Verificación Alternativa: ¿La API Key tiene acceso correcto?

El endpoint `/api/v1/labels` requiere que la cuenta tenga:
- Plan con acceso API (todos los planes incluyen API)
- Labels creados en la cuenta

**Para verificar que la API key funciona**, podemos hacer una llamada de test al endpoint `/api/v1/auth/health` o intentar buscar contactos con `/api/v1/contacts/search`.

---

### Próximos Pasos

1. **Confirma si tienes Labels en Apollo** - Esto determinará si el problema es de la API o de la cuenta
2. **Si no tienes labels**: Crea algunos en Apollo.io y vuelve a probar
3. **Si tienes labels pero no aparecen**: Implementaremos diagnóstico adicional para identificar el problema

---

### Archivos a Modificar

| Archivo | Cambios |
|---------|---------|
| `supabase/functions/get-apollo-lists/index.ts` | Mejorar logging y diagnóstico |
| `src/components/targets/ImportTargetsApolloDrawer.tsx` | Añadir empty state informativo |

