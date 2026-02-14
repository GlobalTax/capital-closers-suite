

# Corregir errores de build en batch-enrich-companies

## Problema

Hay 3 errores TypeScript en `supabase/functions/batch-enrich-companies/index.ts`. El archivo `src/services/mandatos.ts` ya esta limpio (sin conflictos de merge).

## Errores y correcciones

### Error 1 (linea 112): `Property 'attempts' does not exist`

La query de la linea ~85 solo selecciona `id` y `entity_id` de `enrichment_queue`, pero luego se usa `item.attempts` en la linea 112.

**Solucion**: Anadir `attempts` al select de la query que obtiene los items de la cola.

### Errores 2 y 3 (linea 203): Indexar objeto tipado con string

`currentEmpresa[field]` falla porque TypeScript no permite indexar un objeto con tipo explicito usando un `string` generico.

**Solucion**: Castear `currentEmpresa` como `Record<string, any>` o usar una variable intermedia tipada.

## Cambios

| Archivo | Cambio |
|---|---|
| `supabase/functions/batch-enrich-companies/index.ts` | 1. Anadir `attempts` al `.select()` de enrichment_queue (~linea 85) |
| `supabase/functions/batch-enrich-companies/index.ts` | 2. Castear `currentEmpresa` como `Record<string, any>` en la linea 203 |

## Detalle tecnico

```typescript
// Fix 1: Anadir attempts al select (linea ~85)
.select('id, entity_id, attempts')

// Fix 2: Castear para indexar (linea 203)
const current = currentEmpresa as Record<string, any>;
if (current && current[field] != null && current[field] !== '') continue;
```

No se modifica ninguna logica de negocio. Solo se corrigen tipos.
