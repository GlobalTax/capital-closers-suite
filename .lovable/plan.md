

# Fix: Errores 409 y 400 al crear empresa target

## Problemas encontrados

**Error 409 (Conflict):** La tabla `empresas` tiene un constraint `UNIQUE (cif)`. Ya existe una fila con `cif = ''` (cadena vacia). Cuando se crea una empresa sin CIF, si el valor llega como string vacio en vez de `null`, choca con esa fila existente.

**Error 400 (Bad Request):** El constraint `enrichment_queue_entity_type_check` en la base de datos **todavia NO incluye 'empresa'**. Solo permite `portfolio`, `fund`, `people`, `lead`. El trigger `trg_auto_queue_enrichment` intenta insertar `'empresa'` y falla.

## Solucion

### 1. Corregir el constraint de enrichment_queue (migracion SQL)

La correccion que se discutio antes no se aplico en la base de datos real. Se creara una migracion SQL:

```sql
ALTER TABLE public.enrichment_queue
  DROP CONSTRAINT IF EXISTS enrichment_queue_entity_type_check;

ALTER TABLE public.enrichment_queue
  ADD CONSTRAINT enrichment_queue_entity_type_check
  CHECK (entity_type IN ('portfolio', 'fund', 'people', 'lead', 'empresa'));
```

### 2. Limpiar dato sucio: CIF vacio a NULL

```sql
UPDATE public.empresas SET cif = NULL WHERE cif = '';
```

### 3. Proteger en el codigo: sanitizar campos vacios antes de insertar

En `NuevoTargetDrawer.tsx`, al construir el objeto para `createEmpresa`, los campos string vacios ya se convierten a `undefined`. Pero la capa `base.service.ts` no limpia strings vacios que puedan llegar de otras fuentes.

Se anadira un metodo `sanitize` en `base.service.ts` que convierta strings vacios a `null` antes de insertar, previniendo futuros conflictos con constraints UNIQUE.

### Archivos a modificar

| Archivo | Cambio |
|---|---|
| Nueva migracion SQL | Corregir constraint de `enrichment_queue` + limpiar CIF vacio |
| `src/services/base.service.ts` | Anadir sanitizacion de strings vacios antes de insert/update |

