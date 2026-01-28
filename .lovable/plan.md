

## Plan: Completar Visualización de Datos Financieros en Perfil de Empresa

### Diagnóstico Actual

He investigado exhaustivamente el código y la base de datos. Aquí está el estado actual:

#### ✅ Fuentes de Datos CONFIRMADAS

Los datos financieros **YA EXISTEN** en la tabla `empresas`:

| Campo | Tipo | Ejemplo Real |
|-------|------|--------------|
| `facturacion` | number | 4,100,000 |
| `revenue` | number | 568,000 |
| `ebitda` | number | 500,000 |
| `año_datos_financieros` | number | null (vacío en la mayoría) |
| `margen_ebitda` | number | null |
| `deuda` | number | null |
| `capital_circulante` | number | null |

#### ⚠️ Problema Detectado

El servicio `empresas.service.ts` tiene un **transform incompleto** que descarta campos financieros importantes:

```typescript
// Campos incluidos en transform:
facturacion, ebitda, empleados ✅

// Campos NO incluidos en transform:
revenue, año_datos_financieros, margen_ebitda, deuda, capital_circulante ❌
```

#### ✅ Estado Actual de la UI

- **Listado `/empresas`**: Ya muestra columnas de Facturación, EBITDA y Año con edición inline
- **Perfil de empresa**: Ya muestra KPIs financieros, pero algunos datos pueden estar incompletos

---

### Cambios Mínimos Propuestos

Solo 1 archivo necesita modificación para completar la funcionalidad:

#### 1. Corregir `src/services/empresas.ts` - Transform Incompleto

**Problema**: La función `transform` no extrae todos los campos financieros.

**Solución**: Añadir los campos faltantes al transform:

```typescript
protected transform(raw: any): Empresa {
  return {
    id: raw.id,
    nombre: raw.nombre,
    cif: raw.cif,
    sector: raw.sector,
    subsector: raw.subsector,
    sitio_web: raw.sitio_web,
    empleados: raw.empleados ? Number(raw.empleados) : undefined,
    facturacion: raw.facturacion ? Number(raw.facturacion) : undefined,
    ubicacion: raw.ubicacion,
    descripcion: raw.descripcion,
    es_target: raw.es_target || false,
    potencial_search_fund: raw.potencial_search_fund || false,
    
    // ✅ CAMPOS FINANCIEROS COMPLETOS
    revenue: raw.revenue ? Number(raw.revenue) : undefined,
    ebitda: raw.ebitda ? Number(raw.ebitda) : undefined,
    margen_ebitda: raw.margen_ebitda ? Number(raw.margen_ebitda) : undefined,
    deuda: raw.deuda ? Number(raw.deuda) : undefined,
    capital_circulante: raw.capital_circulante ? Number(raw.capital_circulante) : undefined,
    año_datos_financieros: raw.año_datos_financieros ? Number(raw.año_datos_financieros) : undefined,
    
    // Otros campos
    nivel_interes: raw.nivel_interes,
    estado_target: raw.estado_target,
    created_at: raw.created_at,
    updated_at: raw.updated_at,
  } as Empresa;
}
```

---

### Por Qué Esto Es Seguro

| Criterio | Estado |
|----------|--------|
| No modifica modelo de datos | ✅ Solo lee campos existentes |
| No cambia queries | ✅ Ya hace `SELECT *` |
| No afecta permisos | ✅ Respeta RLS existente |
| No rompe UI existente | ✅ Solo añade datos faltantes |
| Valores null/undefined | ✅ Fallback seguro en transform |

---

### Resultado Esperado

Después del cambio, la UI mostrará correctamente:

**Perfil de empresa (KPIs superiores):**
- Facturación: €4.1M (prioriza `revenue` o `facturacion`)
- EBITDA: €0.5M
- Empleados: 45
- Margen EBITDA: 12.2%

**Listado `/empresas`:**
- Columna Facturación: ya funciona ✅
- Columna EBITDA: ya funciona ✅
- Columna Año: ahora mostrará el año correctamente

---

### Archivos a Modificar

| Archivo | Cambio |
|---------|--------|
| `src/services/empresas.ts` | Completar función `transform` con todos los campos financieros |

---

### Validación Post-Cambio

1. Abrir varias empresas → perfil carga igual que antes
2. Empresas con datos financieros → se muestran correctamente
3. Empresas sin datos → se muestra "—" sin errores
4. Navegación → sigue funcionando normal
5. Edición inline en listado → sigue funcionando

