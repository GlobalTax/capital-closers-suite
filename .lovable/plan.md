

## Plan: Corregir Error 500 en enrich-company-v2

### Problema Identificado

El edge function `enrich-company-v2` está fallando con error 500 porque usa un modelo de IA obsoleto:

```
invalid model: openai/gpt-4o-mini
allowed models: [openai/gpt-5-mini, openai/gpt-5, ...]
```

### Cambios Necesarios

#### Archivo: `supabase/functions/enrich-company-v2/index.ts`

Actualizar el modelo de IA de `openai/gpt-4o-mini` a `openai/gpt-5-mini` en dos ubicaciones:

| Línea | Valor Actual | Nuevo Valor |
|-------|--------------|-------------|
| 226 | `model: 'openai/gpt-4o-mini'` | `model: 'openai/gpt-5-mini'` |
| 369 | `model: 'openai/gpt-4o-mini'` | `model: 'openai/gpt-5-mini'` |

### Detalle del Cambio

**Línea 226 (Extracción de perfil):**
```typescript
body: JSON.stringify({
  model: 'openai/gpt-5-mini',  // Antes: 'openai/gpt-4o-mini'
  messages: [
    // ...
  ],
```

**Línea 369 (Clasificación de sector):**
```typescript
body: JSON.stringify({
  model: 'openai/gpt-5-mini',  // Antes: 'openai/gpt-4o-mini'
  messages: [
    // ...
  ],
```

### Resumen de Otros Errores (No Requieren Cambios)

| Error | Tipo | Acción |
|-------|------|--------|
| Safety timeout Auth | Advertencia esperada | No requiere cambios - es un mecanismo de seguridad funcionando |
| Missing Description Dialog | Warning A11Y menor | Opcional: añadir DialogDescription a modales |
| Message port closed | Extensión navegador | Ignorar - no es código de la app |

### Resultado Esperado

Después del cambio:
- El enriquecimiento de empresas funcionará correctamente
- No más errores 500 al llamar a `enrich-company-v2`
- Los datos de empresas se extraerán usando el modelo GPT-5-mini

